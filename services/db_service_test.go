package services

import (
	"database/sql"
	"os"
	"path/filepath"
	"testing"
)

func TestDBServiceFullCycle(t *testing.T) {
	// Use a temp dir to isolate test
	tmpDir := t.TempDir()
	svc := &DBService{}

	// Override UserConfigDir by directly setting dbPath
	svc.dbPath = filepath.Join(tmpDir, "test_state.db")
	var err error
	svc.db, err = svc.openDB()
	if err != nil {
		t.Fatalf("openDB: %v", err)
	}
	defer svc.db.Close()

	if err := svc.migrate(); err != nil {
		t.Fatalf("migrate: %v", err)
	}

	// Test SaveState / GetState
	if err := svc.SaveState("theme", "dark"); err != nil {
		t.Fatalf("SaveState: %v", err)
	}
	val, err := svc.GetState("theme")
	if err != nil {
		t.Fatalf("GetState: %v", err)
	}
	if val != "dark" {
		t.Fatalf("expected 'dark', got '%s'", val)
	}
	t.Log("SaveState/GetState: OK")

	// Test SaveFileList / GetFileList
	files := []string{"/a/b.md", "/c/d.md"}
	if err := svc.SaveFileList(files); err != nil {
		t.Fatalf("SaveFileList: %v", err)
	}
	gotFiles, err := svc.GetFileList()
	if err != nil {
		t.Fatalf("GetFileList: %v", err)
	}
	if len(gotFiles) != 2 || gotFiles[0] != "/a/b.md" || gotFiles[1] != "/c/d.md" {
		t.Fatalf("file list mismatch: %v", gotFiles)
	}
	t.Log("SaveFileList/GetFileList: OK")

	// Test SaveTabs / GetTabs
	tabs := []TabRecord{
		{FilePath: "/a/b.md", FileName: "b.md", Mode: "reading", IsDirty: false, Pinned: true, TabOrder: 0},
		{FilePath: "/c/d.md", FileName: "d.md", Mode: "editing", IsDirty: true, Pinned: false, TabOrder: 1},
	}
	if err := svc.SaveTabs(tabs); err != nil {
		t.Fatalf("SaveTabs: %v", err)
	}
	gotTabs, err := svc.GetTabs()
	if err != nil {
		t.Fatalf("GetTabs: %v", err)
	}
	if len(gotTabs) != 2 {
		t.Fatalf("expected 2 tabs, got %d", len(gotTabs))
	}
	if gotTabs[0].FilePath != "/a/b.md" || !gotTabs[0].Pinned {
		t.Fatalf("tab 0 mismatch: %+v", gotTabs[0])
	}
	if gotTabs[1].FilePath != "/c/d.md" || !gotTabs[1].IsDirty {
		t.Fatalf("tab 1 mismatch: %+v", gotTabs[1])
	}
	t.Log("SaveTabs/GetTabs: OK")

	// Test SaveState / GetState
	if err := svc.SaveState("active_tab_id", "/a/b.md"); err != nil {
		t.Fatalf("SaveState: %v", err)
	}
	stateVal, err := svc.GetState("active_tab_id")
	if err != nil {
		t.Fatalf("GetState: %v", err)
	}
	if stateVal != "/a/b.md" {
		t.Fatalf("expected '/a/b.md', got '%s'", stateVal)
	}
	t.Log("SaveState/GetState: OK")

	// Test SaveFolderState / GetFolderState
	if err := svc.SaveFolderState("/test/folder", `[{"name":"test.md"}]`); err != nil {
		t.Fatalf("SaveFolderState: %v", err)
	}
	fp, tree, err := svc.GetFolderState()
	if err != nil {
		t.Fatalf("GetFolderState: %v", err)
	}
	if fp != "/test/folder" || tree != `[{"name":"test.md"}]` {
		t.Fatalf("folder state mismatch: %q, %q", fp, tree)
	}
	t.Log("SaveFolderState/GetFolderState: OK")

	// Test LoadAppState
	state, err := svc.LoadAppState()
	if err != nil {
		t.Fatalf("LoadAppState: %v", err)
	}
	if state.Theme != "dark" {
		t.Fatalf("theme mismatch: %s", state.Theme)
	}
	if len(state.FileList) != 2 {
		t.Fatalf("fileList length mismatch: %d", len(state.FileList))
	}
	if len(state.Tabs) != 2 {
		t.Fatalf("tabs length mismatch: %d", len(state.Tabs))
	}
	if state.ActiveTabID != "/a/b.md" {
		t.Fatalf("activeTabId mismatch: %s", state.ActiveTabID)
	}
	if state.FolderPath != "/test/folder" {
		t.Fatalf("folderPath mismatch: %s", state.FolderPath)
	}
	t.Log("LoadAppState: OK")

	// Test SaveJSON / GetJSON
	type testObj struct {
		Name string `json:"name"`
		Age  int    `json:"age"`
	}
	obj := testObj{Name: "test", Age: 42}
	if err := svc.SaveJSON("test_obj", obj); err != nil {
		t.Fatalf("SaveJSON: %v", err)
	}
	var gotObj testObj
	if err := svc.GetJSON("test_obj", &gotObj); err != nil {
		t.Fatalf("GetJSON: %v", err)
	}
	if gotObj.Name != "test" || gotObj.Age != 42 {
		t.Fatalf("JSON mismatch: %+v", gotObj)
	}
	t.Log("SaveJSON/GetJSON: OK")

	// Test ClearAll
	if err := svc.ClearAll(); err != nil {
		t.Fatalf("ClearAll: %v", err)
	}
	afterClear, err := svc.LoadAppState()
	if err != nil {
		t.Fatalf("LoadAppState after clear: %v", err)
	}
	if len(afterClear.FileList) != 0 {
		t.Fatalf("fileList not cleared: %v", afterClear.FileList)
	}
	if len(afterClear.Tabs) != 0 {
		t.Fatalf("tabs not cleared: %v", afterClear.Tabs)
	}
	t.Log("ClearAll: OK")

	// Verify DB file still exists (not deleted)
	if _, err := os.Stat(svc.dbPath); os.IsNotExist(err) {
		t.Fatal("DB file was deleted — should still exist after ClearAll")
	}
	t.Log("DB file preserved after ClearAll: OK")

	t.Log("=== All tests passed ===")
}

func (d *DBService) openDB() (*sql.DB, error) {
	return sql.Open("sqlite", d.dbPath+"?_journal_mode=WAL&_busy_timeout=5000")
}
