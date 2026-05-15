package services

import (
	"os"
	"path/filepath"
	"sort"
	"strings"
	"time"

	"github.com/wailsapp/wails/v3/pkg/application"
)

type FileNode struct {
	Name     string     `json:"name"`
	Path     string     `json:"path"`
	IsDir    bool       `json:"isDir"`
	Size     int64      `json:"size"`
	ModTime  time.Time  `json:"modTime"`
	Children []FileNode `json:"children,omitempty"`
}

type FileInfo struct {
	Name    string    `json:"name"`
	Path    string    `json:"path"`
	Size    int64     `json:"size"`
	ModTime time.Time `json:"modTime"`
	IsDir   bool      `json:"isDir"`
	Exists  bool      `json:"exists"`
}

type FileService struct{}

func NewFileService() *FileService {
	return &FileService{}
}

// OpenFile opens a native file picker dialog for .md files and returns the selected path.
func (f *FileService) OpenFile() (string, error) {
	return application.Get().Dialog.OpenFile().
		CanChooseDirectories(false).
		CanChooseFiles(true).
		AddFilter("Markdown Files", "*.md;*.markdown;*.mdown;*.mkd").
		SetTitle("Open Markdown File").
		PromptForSingleSelection()
}

// OpenFolder opens a native directory picker dialog and returns the selected path.
func (f *FileService) OpenFolder() (string, error) {
	return application.Get().Dialog.OpenFile().
		CanChooseDirectories(true).
		CanChooseFiles(false).
		SetTitle("Open Folder").
		PromptForSingleSelection()
}

// OpenMultipleFiles opens a native file picker for .md files, allowing multiple selection.
func (f *FileService) OpenMultipleFiles() ([]string, error) {
	return application.Get().Dialog.OpenFile().
		CanChooseDirectories(false).
		CanChooseFiles(true).
		AddFilter("Markdown Files", "*.md;*.markdown;*.mdown;*.mkd").
		SetTitle("Open Markdown Files").
		PromptForMultipleSelection()
}

func (f *FileService) ServiceName() string {
	return "FileService"
}

// ListFiles returns all .md files recursively as a tree.
func (f *FileService) ListFiles(rootPath string) ([]FileNode, error) {
	return buildTree(rootPath, rootPath)
}

// ReadFile reads a file's content as string.
func (f *FileService) ReadFile(path string) (string, error) {
	data, err := os.ReadFile(path)
	if err != nil {
		return "", err
	}
	return string(data), nil
}

// SaveFile writes content to a file.
func (f *FileService) SaveFile(path string, content string) error {
	return os.WriteFile(path, []byte(content), 0644)
}

// GetFileInfo returns file metadata.
func (f *FileService) GetFileInfo(path string) (*FileInfo, error) {
	info, err := os.Stat(path)
	if err != nil {
		if os.IsNotExist(err) {
			return &FileInfo{Path: path, Exists: false}, nil
		}
		return nil, err
	}
	return &FileInfo{
		Name:    info.Name(),
		Path:    path,
		Size:    info.Size(),
		ModTime: info.ModTime(),
		IsDir:   info.IsDir(),
		Exists:  true,
	}, nil
}

// CreateFolder creates a new directory and returns its path.
func (f *FileService) CreateFolder(parentPath string, name string) (string, error) {
	fullPath := filepath.Join(parentPath, name)
	if err := os.Mkdir(fullPath, 0755); err != nil {
		return "", err
	}
	return fullPath, nil
}

// CreateFile creates a new markdown file and returns its path.
func (f *FileService) CreateFile(dirPath string, name string) (string, error) {
	if !strings.HasSuffix(strings.ToLower(name), ".md") {
		name += ".md"
	}
	fullPath := filepath.Join(dirPath, name)
	file, err := os.Create(fullPath)
	if err != nil {
		return "", err
	}
	file.Close()
	return fullPath, nil
}

// DeleteFile deletes a file or directory (recursively for directories).
func (f *FileService) DeleteFile(path string) error {
	info, err := os.Stat(path)
	if err != nil {
		return err
	}
	if info.IsDir() {
		return os.RemoveAll(path)
	}
	return os.Remove(path)
}

var mdExtensions = []string{".md", ".markdown", ".mdown", ".mkd"}

func isMarkdownFile(name string) bool {
	lower := strings.ToLower(name)
	for _, ext := range mdExtensions {
		if strings.HasSuffix(lower, ext) {
			return true
		}
	}
	return false
}

// GetFilesInDir returns .md files directly in a directory (non-recursive).
func (f *FileService) GetFilesInDir(dirPath string) ([]FileNode, error) {
	entries, err := os.ReadDir(dirPath)
	if err != nil {
		return nil, err
	}
	var nodes []FileNode
	for _, entry := range entries {
		if entry.IsDir() {
			continue
		}
		if !isMarkdownFile(entry.Name()) {
			continue
		}
		info, err := entry.Info()
		if err != nil {
			continue
		}
		nodes = append(nodes, FileNode{
			Name:    entry.Name(),
			Path:    filepath.Join(dirPath, entry.Name()),
			IsDir:   false,
			Size:    info.Size(),
			ModTime: info.ModTime(),
		})
	}
	sort.Slice(nodes, func(i, j int) bool {
		return strings.ToLower(nodes[i].Name) < strings.ToLower(nodes[j].Name)
	})
	return nodes, nil
}

func buildTree(rootPath, currentPath string) ([]FileNode, error) {
	entries, err := os.ReadDir(currentPath)
	if err != nil {
		return nil, err
	}

	var nodes []FileNode

	for _, entry := range entries {
		fullPath := filepath.Join(currentPath, entry.Name())

		if entry.IsDir() {
			children, err := buildTree(rootPath, fullPath)
			if err != nil {
				continue
			}
			info, _ := entry.Info()
			nodes = append(nodes, FileNode{
				Name:     entry.Name(),
				Path:     fullPath,
				IsDir:    true,
				Children: children,
				ModTime:  info.ModTime(),
			})
		} else {
			if !isMarkdownFile(entry.Name()) {
				continue
			}
			info, err := entry.Info()
			if err != nil {
				continue
			}
			nodes = append(nodes, FileNode{
				Name:    entry.Name(),
				Path:    fullPath,
				IsDir:   false,
				Size:    info.Size(),
				ModTime: info.ModTime(),
			})
		}
	}

	sort.Slice(nodes, func(i, j int) bool {
		if nodes[i].IsDir != nodes[j].IsDir {
			return nodes[i].IsDir
		}
		return strings.ToLower(nodes[i].Name) < strings.ToLower(nodes[j].Name)
	})

	return nodes, nil
}
