package services

import (
	"fmt"
	"os"
	"os/exec"
	"path/filepath"
	"runtime"
	"strings"
	"syscall"

	"golang.org/x/sys/windows/registry"
)

const progID = "GoMarkdown.md"

var mdFileExtensions = []string{".md", ".markdown", ".mdown", ".mkd"}

func InstallFileAssociations() error {
	if runtime.GOOS != "windows" {
		return fmt.Errorf("file association is only supported on Windows")
	}

	exePath, err := os.Executable()
	if err != nil {
		return fmt.Errorf("get executable path: %w", err)
	}
	exePath, err = filepath.Abs(exePath)
	if err != nil {
		return fmt.Errorf("resolve executable path: %w", err)
	}

	// Create ProgID entry
	progKey, _, err := registry.CreateKey(registry.CURRENT_USER,
		`Software\Classes\`+progID, registry.SET_VALUE)
	if err != nil {
		return fmt.Errorf("create ProgID: %w", err)
	}
	defer progKey.Close()

	if err := progKey.SetStringValue("", "Markdown Document"); err != nil {
		return fmt.Errorf("set ProgID name: %w", err)
	}

	// Default icon
	iconKey, _, err := registry.CreateKey(registry.CURRENT_USER,
		`Software\Classes\`+progID+`\DefaultIcon`, registry.SET_VALUE)
	if err != nil {
		return fmt.Errorf("create icon key: %w", err)
	}
	defer iconKey.Close()

	if err := iconKey.SetStringValue("", fmt.Sprintf(`"%s",0`, exePath)); err != nil {
		return fmt.Errorf("set icon: %w", err)
	}

	// Open command
	cmdKey, _, err := registry.CreateKey(registry.CURRENT_USER,
		`Software\Classes\`+progID+`\shell\open\command`, registry.SET_VALUE)
	if err != nil {
		return fmt.Errorf("create command key: %w", err)
	}
	defer cmdKey.Close()

	if err := cmdKey.SetStringValue("", fmt.Sprintf(`"%s" "%%1"`, exePath)); err != nil {
		return fmt.Errorf("set command: %w", err)
	}

	fmt.Printf("  ProgID: %s\n", progID)

	// Associate each extension
	for _, ext := range mdFileExtensions {
		extKey, _, err := registry.CreateKey(registry.CURRENT_USER,
			`Software\Classes\`+ext, registry.SET_VALUE)
		if err != nil {
			return fmt.Errorf("create extension %s: %w", ext, err)
		}
		defer extKey.Close()

		if err := extKey.SetStringValue("", progID); err != nil {
			return fmt.Errorf("associate %s: %w", ext, err)
		}
		fmt.Printf("  %s  ->  %s\n", ext, progID)
	}

	// Notify system of association change
	notifyShell()
	refreshIconCache()

	return nil
}

func UninstallFileAssociations() error {
	if runtime.GOOS != "windows" {
		return fmt.Errorf("file association uninstall is only supported on Windows")
	}

	// Remove extension associations
	for _, ext := range mdFileExtensions {
		if err := registry.DeleteKey(registry.CURRENT_USER,
			`Software\Classes\`+ext); err != nil && !isNotExist(err) {
			fmt.Printf("  %s  -  warn: %v\n", ext, err)
		} else {
			fmt.Printf("  %s  -  removed\n", ext)
		}
	}

	// Remove ProgID
	if err := registry.DeleteKey(registry.CURRENT_USER,
		`Software\Classes\`+progID+`\shell\open\command`); err != nil && !isNotExist(err) {
		fmt.Printf("  command key  -  warn: %v\n", err)
	}
	if err := registry.DeleteKey(registry.CURRENT_USER,
		`Software\Classes\`+progID+`\shell\open`); err != nil && !isNotExist(err) {
		fmt.Printf("  shell open  -  warn: %v\n", err)
	}
	if err := registry.DeleteKey(registry.CURRENT_USER,
		`Software\Classes\`+progID+`\shell`); err != nil && !isNotExist(err) {
		fmt.Printf("  shell  -  warn: %v\n", err)
	}
	if err := registry.DeleteKey(registry.CURRENT_USER,
		`Software\Classes\`+progID+`\DefaultIcon`); err != nil && !isNotExist(err) {
		fmt.Printf("  icon key  -  warn: %v\n", err)
	}
	if err := registry.DeleteKey(registry.CURRENT_USER,
		`Software\Classes\`+progID); err != nil && !isNotExist(err) {
		fmt.Printf("  ProgID  -  warn: %v\n", err)
	} else {
		fmt.Printf("  %s  -  removed\n", progID)
	}

	notifyShell()
	refreshIconCache()

	return nil
}

func isNotExist(err error) bool {
	return strings.Contains(err.Error(), "The system cannot find the file") ||
		strings.Contains(err.Error(), "reg: key does not exist")
}

func notifyShell() {
	const SHCNE_ASSOCCHANGED = 0x08000000
	const SHCNF_IDLIST = 0x0000
	const SHCNF_FLUSH = 0x1000
	shell32 := syscall.NewLazyDLL("shell32.dll")
	proc := shell32.NewProc("SHChangeNotify")
	proc.Call(uintptr(SHCNE_ASSOCCHANGED), uintptr(SHCNF_IDLIST|SHCNF_FLUSH), 0, 0)
}

func refreshIconCache() {
	_ = exec.Command("ie4uinit.exe", "-ClearIconCache").Run()
}
