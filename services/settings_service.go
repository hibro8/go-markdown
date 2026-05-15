package services

import (
	"encoding/json"
	"os"

	"go-markdown/pkg/settings"
)

type SettingsService struct {
	settings   *settings.Settings
	configPath string
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

func (s *SettingsService) ServiceStartup() error {
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

func (s *SettingsService) UpdateTrayEnabled(enabled bool) error {
	s.settings.TrayEnabled = enabled
	return s.save()
}

func (s *SettingsService) UpdateAutoStart(enabled bool) error {
	s.settings.AutoStart = enabled
	return s.save()
}

func (s *SettingsService) UpdateLanguage(lang string) error {
	s.settings.Language = lang
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
