package services

import (
	"context"
	"encoding/json"
	"fmt"
	"os"
	"os/exec"
	"runtime"

	"github.com/wailsapp/wails/v3/pkg/application"
	"go-markdown/pkg/settings"
)

type SettingsService struct {
	settings     *settings.Settings
	configPath   string
	onTrayToggle func(enabled bool)
}

func NewSettingsService() *SettingsService {
	// Initialize with defaults immediately to prevent nil pointer on early calls
	configPath, _ := settings.ConfigPath()
	return &SettingsService{
		settings:   settings.Default(),
		configPath: configPath,
	}
}

func (s *SettingsService) ServiceName() string {
	return "SettingsService"
}

func (s *SettingsService) ServiceStartup(ctx context.Context, options application.ServiceOptions) error {
	path, err := settings.ConfigPath()
	if err != nil {
		return err
	}
	s.configPath = path

	data, err := os.ReadFile(path)
	if err != nil {
		if os.IsNotExist(err) {
			return s.save()
		}
		return err
	}
	return json.Unmarshal(data, s.settings)
}

func (s *SettingsService) Load() (*settings.Settings, error) {
	return s.settings, nil
}

func (s *SettingsService) Save(updated *settings.Settings) error {
	s.settings = updated
	return s.save()
}

func (s *SettingsService) UpdateTheme(theme string) error {
	s.settings.Theme = theme
	return s.save()
}

func (s *SettingsService) OnTrayToggle(fn func(enabled bool)) {
	s.onTrayToggle = fn
}

func (s *SettingsService) UpdateTrayEnabled(enabled bool) error {
	s.settings.TrayEnabled = enabled
	if err := s.save(); err != nil {
		return err
	}
	if s.onTrayToggle != nil {
		s.onTrayToggle(enabled)
	}
	return nil
}

func (s *SettingsService) UpdateAutoStart(enabled bool) error {
	s.settings.AutoStart = enabled
	if err := s.save(); err != nil {
		return err
	}
	return s.applyAutoStart(enabled)
}

func (s *SettingsService) applyAutoStart(enabled bool) error {
	if runtime.GOOS != "windows" {
		return nil
	}
	exePath, err := os.Executable()
	if err != nil {
		return fmt.Errorf("get executable path: %w", err)
	}
	key := `HKCU\Software\Microsoft\Windows\CurrentVersion\Run`
	valName := "GoMarkdown"
	if enabled {
		cmd := exec.Command("reg", "add", key, "/v", valName, "/t", "REG_SZ", "/d", exePath, "/f")
		return cmd.Run()
	} else {
		cmd := exec.Command("reg", "delete", key, "/v", valName, "/f")
		return cmd.Run()
	}
}

func (s *SettingsService) UpdateLanguage(lang string) error {
	s.settings.Language = lang
	return s.save()
}

func (s *SettingsService) SaveWindowState(width, height, x, y int) error {
	s.settings.WindowWidth = width
	s.settings.WindowHeight = height
	s.settings.WindowX = x
	s.settings.WindowY = y
	return s.save()
}

func (s *SettingsService) GetConfigPath() string {
	return s.configPath
}

func (s *SettingsService) save() error {
	data, err := json.MarshalIndent(s.settings, "", "  ")
	if err != nil {
		return err
	}
	return os.WriteFile(s.configPath, data, 0644)
}
