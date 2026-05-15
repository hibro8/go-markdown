package services

import (
	"os"
	"path/filepath"
	"testing"
)

func TestSettingsServiceDefaults(t *testing.T) {
	svc := NewSettingsService()
	// Clean up any persisted settings so we test true defaults
	os.Remove(svc.GetConfigPath())
	err := svc.ServiceStartup()
	if err != nil {
		t.Fatalf("ServiceStartup failed: %v", err)
	}

	settings, err := svc.Load()
	if err != nil {
		t.Fatalf("Load failed: %v", err)
	}
	if settings.Theme != "light" {
		t.Errorf("Expected default theme 'light', got '%s'", settings.Theme)
	}
	if settings.TrayEnabled != false {
		t.Errorf("Expected TrayEnabled=false, got %v", settings.TrayEnabled)
	}
	if settings.AutoStart != false {
		t.Errorf("Expected AutoStart=false, got %v", settings.AutoStart)
	}
	if settings.WindowWidth != 1280 {
		t.Errorf("Expected WindowWidth=1280, got %d", settings.WindowWidth)
	}
}

func TestSettingsServiceSaveLoad(t *testing.T) {
	svc := NewSettingsService()
	os.Remove(svc.GetConfigPath())
	err := svc.ServiceStartup()
	if err != nil {
		t.Fatalf("ServiceStartup failed: %v", err)
	}
	defer os.Remove(svc.GetConfigPath())

	err = svc.UpdateTheme("dark")
	if err != nil {
		t.Fatalf("UpdateTheme failed: %v", err)
	}
	err = svc.UpdateTrayEnabled(true)
	if err != nil {
		t.Fatalf("UpdateTrayEnabled failed: %v", err)
	}

	// Reload
	settings, err := svc.Load()
	if err != nil {
		t.Fatalf("Load failed: %v", err)
	}
	if settings.Theme != "dark" {
		t.Errorf("Expected theme 'dark', got '%s'", settings.Theme)
	}
	if settings.TrayEnabled != true {
		t.Errorf("Expected TrayEnabled=true, got %v", settings.TrayEnabled)
	}
}

func TestSettingsServiceGetConfigPath(t *testing.T) {
	svc := NewSettingsService()
	_ = svc.ServiceStartup()
	path := svc.GetConfigPath()
	if path == "" {
		t.Error("Expected non-empty config path")
	}
	t.Logf("Config path: %s", path)
}

func TestFileServiceListFiles(t *testing.T) {
	// Create a temp directory with .md files
	tmpDir, err := os.MkdirTemp("", "gomd-test")
	if err != nil {
		t.Fatalf("MkdirTemp failed: %v", err)
	}
	defer os.RemoveAll(tmpDir)

	// Create test files
	os.WriteFile(filepath.Join(tmpDir, "test1.md"), []byte("# Test 1"), 0644)
	os.WriteFile(filepath.Join(tmpDir, "test2.md"), []byte("# Test 2"), 0644)
	os.WriteFile(filepath.Join(tmpDir, "README.md"), []byte("# Readme"), 0644)
	os.WriteFile(filepath.Join(tmpDir, "not-md.txt"), []byte("text"), 0644)

	subDir := filepath.Join(tmpDir, "subdir")
	os.MkdirAll(subDir, 0755)
	os.WriteFile(filepath.Join(subDir, "sub.md"), []byte("# Sub"), 0644)
	os.WriteFile(filepath.Join(subDir, "ignore.txt"), []byte("nope"), 0644)

	// Empty subdir (should be skipped)
	emptyDir := filepath.Join(tmpDir, "empty")
	os.MkdirAll(emptyDir, 0755)

	fs := NewFileService()
	files, err := fs.ListFiles(tmpDir)
	if err != nil {
		t.Fatalf("ListFiles failed: %v", err)
	}

	if len(files) == 0 {
		t.Fatal("Expected files in listing")
	}

	// Count .md files
	var countFiles func(nodes []FileNode) int
	countFiles = func(nodes []FileNode) int {
		count := 0
		for _, n := range nodes {
			if !n.IsDir {
				count++
			}
			if n.Children != nil {
				count += countFiles(n.Children)
			}
		}
		return count
	}
	total := countFiles(files)
	if total != 4 {
		t.Errorf("Expected 4 .md files, got %d", total)
	}
}

func TestFileServiceReadFile(t *testing.T) {
	tmpDir, err := os.MkdirTemp("", "gomd-test")
	if err != nil {
		t.Fatalf("MkdirTemp failed: %v", err)
	}
	defer os.RemoveAll(tmpDir)

	path := filepath.Join(tmpDir, "test.md")
	content := "# Hello\n\nWorld"
	os.WriteFile(path, []byte(content), 0644)

	fs := NewFileService()
	read, err := fs.ReadFile(path)
	if err != nil {
		t.Fatalf("ReadFile failed: %v", err)
	}
	if read != content {
		t.Errorf("Expected '%s', got '%s'", content, read)
	}
}

func TestFileServiceSaveFile(t *testing.T) {
	tmpDir, err := os.MkdirTemp("", "gomd-test")
	if err != nil {
		t.Fatalf("MkdirTemp failed: %v", err)
	}
	defer os.RemoveAll(tmpDir)

	path := filepath.Join(tmpDir, "save.md")
	content := "# Saved content"

	fs := NewFileService()
	err = fs.SaveFile(path, content)
	if err != nil {
		t.Fatalf("SaveFile failed: %v", err)
	}

	read, _ := os.ReadFile(path)
	if string(read) != content {
		t.Errorf("Expected '%s', got '%s'", content, string(read))
	}
}

func TestFileServiceGetFileInfo(t *testing.T) {
	tmpDir, err := os.MkdirTemp("", "gomd-test")
	if err != nil {
		t.Fatalf("MkdirTemp failed: %v", err)
	}
	defer os.RemoveAll(tmpDir)

	path := filepath.Join(tmpDir, "info.md")
	os.WriteFile(path, []byte("info"), 0644)

	fs := NewFileService()
	info, err := fs.GetFileInfo(path)
	if err != nil {
		t.Fatalf("GetFileInfo failed: %v", err)
	}
	if !info.Exists {
		t.Error("Expected file to exist")
	}
	if info.IsDir {
		t.Error("Expected file, not directory")
	}
	if info.Size != 4 {
		t.Errorf("Expected size 4, got %d", info.Size)
	}
}

func TestFileServiceGetFileInfoNonExistent(t *testing.T) {
	fs := NewFileService()
	info, err := fs.GetFileInfo("/nonexistent/path/file.md")
	if err != nil {
		t.Fatalf("GetFileInfo failed: %v", err)
	}
	if info.Exists {
		t.Error("Expected non-existent file")
	}
}

func TestMarkdownServiceParse(t *testing.T) {
	svc := NewMarkdownService()
	result, err := svc.Parse("# Hello\n\n**World**")
	if err != nil {
		t.Fatalf("Parse failed: %v", err)
	}
	if result == nil {
		t.Fatal("Expected non-nil result")
	}
	if result.HTML == "" {
		t.Error("Expected non-empty HTML")
	}
}

func TestMarkdownServiceParseTable(t *testing.T) {
	svc := NewMarkdownService()
	md := `| A | B |
|---|---|
| 1 | 2 |`
	result, err := svc.Parse(md)
	if err != nil {
		t.Fatalf("Parse failed: %v", err)
	}
	if !containsStr(result.HTML, "<table>") {
		t.Error("Expected table in output")
	}
}

func TestMarkdownServiceServiceName(t *testing.T) {
	svc := NewMarkdownService()
	if svc.ServiceName() != "MarkdownService" {
		t.Errorf("Expected 'MarkdownService', got '%s'", svc.ServiceName())
	}
}

func containsStr(s, substr string) bool {
	for i := 0; i <= len(s)-len(substr); i++ {
		if s[i:i+len(substr)] == substr {
			return true
		}
	}
	return false
}
