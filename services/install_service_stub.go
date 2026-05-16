//go:build !windows

package services

import "fmt"

func InstallFileAssociations() error {
	return fmt.Errorf("file association is only supported on Windows")
}

func UninstallFileAssociations() error {
	return fmt.Errorf("file association uninstall is only supported on Windows")
}
