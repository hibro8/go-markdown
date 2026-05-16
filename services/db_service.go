package services

import (
	"context"
	"database/sql"
	"encoding/json"
	"os"
	"path/filepath"
	"sync"

	"github.com/wailsapp/wails/v3/pkg/application"
	_ "modernc.org/sqlite"
)

type TabRecord struct {
	FilePath string `json:"filePath"`
	FileName string `json:"fileName"`
	Mode     string `json:"mode"`
	IsDirty  bool   `json:"isDirty"`
	Pinned   bool   `json:"pinned"`
	TabOrder int    `json:"tabOrder"`
}

type DBService struct {
	mu     sync.Mutex
	db     *sql.DB
	dbPath string
}

func NewDBService() *DBService {
	return &DBService{}
}

func (d *DBService) ServiceName() string {
	return "DBService"
}

func (d *DBService) dbDir() (string, error) {
	dir, err := os.UserConfigDir()
	if err != nil {
		return "", err
	}
	configDir := filepath.Join(dir, "go-markdown")
	if err := os.MkdirAll(configDir, 0755); err != nil {
		return "", err
	}
	return configDir, nil
}

func (d *DBService) ServiceStartup(ctx context.Context, options application.ServiceOptions) error {
	dir, err := d.dbDir()
	if err != nil {
		return err
	}
	d.dbPath = filepath.Join(dir, "state.db")
	d.db, err = sql.Open("sqlite", d.dbPath+"?_journal_mode=WAL&_busy_timeout=5000")
	if err != nil {
		return err
	}
	d.db.SetMaxOpenConns(1) // SQLite works best with single writer
	return d.migrate()
}

func (d *DBService) ServiceShutdown() error {
	d.mu.Lock()
	defer d.mu.Unlock()
	if d.db != nil {
		return d.db.Close()
	}
	return nil
}

func (d *DBService) migrate() error {
	queries := []string{
		`CREATE TABLE IF NOT EXISTS settings (
			key TEXT PRIMARY KEY,
			value TEXT NOT NULL
		)`,
		`CREATE TABLE IF NOT EXISTS file_list (
			path TEXT PRIMARY KEY,
			added_at INTEGER NOT NULL DEFAULT (unixepoch())
		)`,
		`CREATE TABLE IF NOT EXISTS open_tabs (
			file_path TEXT PRIMARY KEY,
			file_name TEXT NOT NULL,
			mode TEXT NOT NULL DEFAULT 'reading',
			is_dirty INTEGER NOT NULL DEFAULT 0,
			pinned INTEGER NOT NULL DEFAULT 0,
			tab_order INTEGER NOT NULL DEFAULT 0
		)`,
		`CREATE TABLE IF NOT EXISTS state (
			key TEXT PRIMARY KEY,
			value TEXT NOT NULL
		)`,
	}
	for _, q := range queries {
		if _, err := d.db.Exec(q); err != nil {
			return err
		}
	}
	return nil
}

func (d *DBService) Shutdown() error {
	d.mu.Lock()
	defer d.mu.Unlock()
	if d.db != nil {
		return d.db.Close()
	}
	return nil
}

// --- Settings ---

func (d *DBService) SaveSetting(key, value string) error {
	d.mu.Lock()
	defer d.mu.Unlock()
	_, err := d.db.Exec(
		"INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)",
		key, value,
	)
	return err
}

func (d *DBService) GetSetting(key string) (string, error) {
	d.mu.Lock()
	defer d.mu.Unlock()
	var value string
	err := d.db.QueryRow("SELECT value FROM settings WHERE key = ?", key).Scan(&value)
	if err == sql.ErrNoRows {
		return "", nil
	}
	return value, err
}

// --- File List ---

func (d *DBService) SaveFileList(paths []string) error {
	d.mu.Lock()
	defer d.mu.Unlock()
	tx, err := d.db.Begin()
	if err != nil {
		return err
	}
	defer tx.Rollback()

	if _, err := tx.Exec("DELETE FROM file_list"); err != nil {
		return err
	}
	for i, p := range paths {
		if _, err := tx.Exec(
			"INSERT INTO file_list (path, added_at) VALUES (?, ?)",
			p, i,
		); err != nil {
			return err
		}
	}
	return tx.Commit()
}

func (d *DBService) GetFileList() ([]string, error) {
	d.mu.Lock()
	defer d.mu.Unlock()
	rows, err := d.db.Query("SELECT path FROM file_list ORDER BY added_at")
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var paths []string
	for rows.Next() {
		var p string
		if err := rows.Scan(&p); err != nil {
			return nil, err
		}
		paths = append(paths, p)
	}
	return paths, rows.Err()
}

// --- Open Tabs ---

func (d *DBService) SaveTabs(tabs []TabRecord) error {
	d.mu.Lock()
	defer d.mu.Unlock()
	tx, err := d.db.Begin()
	if err != nil {
		return err
	}
	defer tx.Rollback()

	if _, err := tx.Exec("DELETE FROM open_tabs"); err != nil {
		return err
	}
	for _, t := range tabs {
		isDirty := 0
		if t.IsDirty {
			isDirty = 1
		}
		pinned := 0
		if t.Pinned {
			pinned = 1
		}
		if _, err := tx.Exec(
			"INSERT INTO open_tabs (file_path, file_name, mode, is_dirty, pinned, tab_order) VALUES (?, ?, ?, ?, ?, ?)",
			t.FilePath, t.FileName, t.Mode, isDirty, pinned, t.TabOrder,
		); err != nil {
			return err
		}
	}
	return tx.Commit()
}

func (d *DBService) GetTabs() ([]TabRecord, error) {
	d.mu.Lock()
	defer d.mu.Unlock()
	rows, err := d.db.Query("SELECT file_path, file_name, mode, is_dirty, pinned, tab_order FROM open_tabs ORDER BY tab_order")
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var tabs []TabRecord
	for rows.Next() {
		var t TabRecord
		var isDirty, pinned int
		if err := rows.Scan(&t.FilePath, &t.FileName, &t.Mode, &isDirty, &pinned, &t.TabOrder); err != nil {
			return nil, err
		}
		t.IsDirty = isDirty == 1
		t.Pinned = pinned == 1
		tabs = append(tabs, t)
	}
	return tabs, rows.Err()
}

// --- State (key-value) ---

func (d *DBService) SaveState(key, value string) error {
	d.mu.Lock()
	defer d.mu.Unlock()
	_, err := d.db.Exec(
		"INSERT OR REPLACE INTO state (key, value) VALUES (?, ?)",
		key, value,
	)
	return err
}

func (d *DBService) GetState(key string) (string, error) {
	d.mu.Lock()
	defer d.mu.Unlock()
	var value string
	err := d.db.QueryRow("SELECT value FROM state WHERE key = ?", key).Scan(&value)
	if err == sql.ErrNoRows {
		return "", nil
	}
	return value, err
}

// --- Folder tree (stored as JSON in state) ---

func (d *DBService) SaveFolderState(folderPath string, treeJSON string) error {
	if err := d.SaveState("last_folder_path", folderPath); err != nil {
		return err
	}
	return d.SaveState("last_folder_tree", treeJSON)
}

func (d *DBService) GetFolderState() (folderPath string, treeJSON string, err error) {
	folderPath, err = d.GetState("last_folder_path")
	if err != nil {
		return "", "", err
	}
	treeJSON, err = d.GetState("last_folder_tree")
	if err != nil {
		return "", "", err
	}
	return folderPath, treeJSON, nil
}

// --- Serialized state for complex objects ---

func (d *DBService) SaveJSON(key string, v any) error {
	data, err := json.Marshal(v)
	if err != nil {
		return err
	}
	return d.SaveState(key, string(data))
}

func (d *DBService) GetJSON(key string, v any) error {
	data, err := d.GetState(key)
	if err != nil {
		return err
	}
	if data == "" {
		return nil
	}
	return json.Unmarshal([]byte(data), v)
}

// --- Bulk restore (returns all state for frontend) ---

type AppState struct {
	FileList   []string    `json:"fileList"`
	Tabs       []TabRecord `json:"tabs"`
	ActiveTabID string     `json:"activeTabId"`
	FolderPath string      `json:"folderPath"`
	FolderTree string      `json:"folderTree"` // JSON string of FileNode[]
	Theme      string      `json:"theme"`
	Language   string      `json:"language"`
}

func (d *DBService) LoadAppState() (*AppState, error) {
	state := &AppState{}

	var err error
	state.FileList, err = d.GetFileList()
	if err != nil {
		return nil, err
	}
	state.Tabs, err = d.GetTabs()
	if err != nil {
		return nil, err
	}
	state.ActiveTabID, err = d.GetState("active_tab_id")
	if err != nil {
		return nil, err
	}
	state.FolderPath, state.FolderTree, err = d.GetFolderState()
	if err != nil {
		return nil, err
	}
	state.Theme, err = d.GetState("theme")
	if err != nil {
		return nil, err
	}
	state.Language, err = d.GetState("language")
	if err != nil {
		return nil, err
	}
	return state, nil
}

// --- Clear all data ---

func (d *DBService) ClearAll() error {
	d.mu.Lock()
	defer d.mu.Unlock()

	tables := []string{"settings", "file_list", "open_tabs", "state"}
	for _, t := range tables {
		if _, err := d.db.Exec("DELETE FROM " + t); err != nil {
			return err
		}
	}
	return nil
}
