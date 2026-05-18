package settings

import (
	"os"
	"path/filepath"
)

type Settings struct {
	Theme          string        `json:"theme"`          // theme key, e.g. "light", "dark", "dracula", "nord", etc.
	Language       string        `json:"language"`       // "en" | "zh"
	TrayEnabled    bool          `json:"trayEnabled"`    // minimize to tray on close
	AutoStart      bool          `json:"autoStart"`      // launch on system startup
	WindowWidth    int           `json:"windowWidth"`    // last window width
	WindowHeight   int           `json:"windowHeight"`   // last window height
	WindowX        int           `json:"windowX"`        // last window X
	WindowY        int           `json:"windowY"`        // last window Y
	OpenTabs       []TabSnapshot `json:"openTabs"`       // session restore
	LastOpenFolder string        `json:"lastOpenFolder"` // restore file tree
}

type TabSnapshot struct {
	FilePath       string `json:"filePath"`
	ScrollPosition int    `json:"scrollPosition"`
}

func Default() *Settings {
	return &Settings{
		Theme:       "light",
		Language:    "zh",
		TrayEnabled: false,
		AutoStart:   false,
		WindowWidth: 1280,
		WindowHeight: 800,
	}
}

func ConfigDir() (string, error) {
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

func ConfigPath() (string, error) {
	dir, err := ConfigDir()
	if err != nil {
		return "", err
	}
	return filepath.Join(dir, "settings.json"), nil
}
