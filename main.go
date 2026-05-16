package main

import (
	"bufio"
	"embed"
	"encoding/json"
	"flag"
	"fmt"
	"log"
	"os"
	"path/filepath"
	"strings"
	"time"

	"go-markdown/pkg/icon"
	"go-markdown/pkg/settings"
	"go-markdown/pkg/single"
	"go-markdown/services"

	"github.com/wailsapp/wails/v3/pkg/application"
	"github.com/wailsapp/wails/v3/pkg/events"
)

//go:embed frontend/dist
var assets embed.FS

func main() {
	installFlag := flag.Bool("install", false, "Register .md file associations")
	uninstallFlag := flag.Bool("uninstall", false, "Remove .md file associations")
	flag.Parse()

	if *installFlag {
		fmt.Println("Go Markdown — Registering file associations...")
		fmt.Println()
		if err := services.InstallFileAssociations(); err != nil {
			fmt.Fprintf(os.Stderr, "Error: %v\n", err)
			os.Exit(1)
		}
		fmt.Println()
		fmt.Println("Done. Double-click any .md file to open with Go Markdown.")
		return
	}

	if *uninstallFlag {
		fmt.Println("Go Markdown — Removing file associations...")
		fmt.Println()
		if err := services.UninstallFileAssociations(); err != nil {
			fmt.Fprintf(os.Stderr, "Error: %v\n", err)
			os.Exit(1)
		}
		fmt.Println()
		fmt.Println("Done. File associations removed.")
		return
	}

	// Single-instance: if another instance is already running, forward
	// CLI file args to it and exit.
	ln, isFirst, forwarded := single.TryAcquire(flag.Args())
	if !isFirst {
		if len(forwarded) > 0 {
			fmt.Printf("Forwarded %d file(s) to running instance.\n", len(forwarded))
		}
		return
	}

	settingsService := services.NewSettingsService()
	fileService := services.NewFileService()
	markdownService := services.NewMarkdownService()
	dbService := services.NewDBService()

	app := application.New(application.Options{
		Name:        "Go Markdown",
		Description: "A cross-platform Markdown reader",
		Icon:        icon.AppIcon(),
		Assets: application.AssetOptions{
			Handler: application.BundledAssetFileServer(assets),
		},
		Services: []application.Service{
			application.NewService(settingsService),
			application.NewService(fileService),
			application.NewService(markdownService),
			application.NewService(dbService),
		},
		Mac: application.MacOptions{
			ApplicationShouldTerminateAfterLastWindowClosed: false,
		},
	})

	win := app.Window.NewWithOptions(application.WebviewWindowOptions{
		Name:          "main",
		Title:         "Go Markdown",
		Width:         1280,
		Height:        800,
		MinWidth:      800,
		MinHeight:     600,
		URL:           "/",
		BackgroundType: application.BackgroundTypeSolid,
		EnableFileDrop: true,
		Frameless:     true,
	})

	// Load saved settings to decide whether to create the tray.
	// We can't wait for ServiceStartup (runs during app.Run), so
	// we read the config file directly here.
	trayEnabled := false
	if configPath, err := settings.ConfigPath(); err == nil {
		if data, err := os.ReadFile(configPath); err == nil {
			var saved settings.Settings
			if json.Unmarshal(data, &saved) == nil {
				trayEnabled = saved.TrayEnabled
			}
		}
	}

	var tray *application.SystemTray
	if trayEnabled {
		tray = createTray(app, win)
	}

	// Allow dynamic tray creation / removal when the user toggles
	// the setting from the frontend at runtime.
	settingsService.OnTrayToggle(func(enabled bool) {
		if enabled && tray == nil {
			tray = createTray(app, win)
		} else if !enabled && tray != nil {
			tray.Destroy()
			tray = nil
		}
	})

	// Window close → hide to tray if tray is present, otherwise quit.
	// When there's no tray, Wails will PostQuitMessage automatically
	// after the last window is destroyed.
	win.RegisterHook(events.Common.WindowClosing, func(e *application.WindowEvent) {
		if tray != nil {
			win.Hide()
			e.Cancel()
		}
	})

	// File drop handler — filter to .md files only
	win.OnWindowEvent(events.Common.WindowFilesDropped, func(event *application.WindowEvent) {
		files := event.Context().DroppedFiles()
		if len(files) > 0 {
			var mdFiles []string
			for _, f := range files {
				ext := strings.ToLower(strings.TrimPrefix(filepath.Ext(f), "."))
				if ext == "md" || ext == "markdown" || ext == "mdown" || ext == "mkd" {
					mdFiles = append(mdFiles, f)
				}
			}
			if len(mdFiles) > 0 {
				app.Event.Emit("files-dropped", mdFiles)
			}
		}
	})

	// Accept connections from secondary instances (single-instance IPC).
	// Each connection carries a JSON line with file paths to open.
	go func() {
		for {
			conn, err := ln.Accept()
			if err != nil {
				return
			}
			line, err := bufio.NewReader(conn).ReadString('\n')
			if err != nil {
				conn.Close()
				continue
			}
			var msg struct {
				Files []string `json:"files"`
			}
			if json.Unmarshal([]byte(line), &msg) == nil && len(msg.Files) > 0 {
				// Wait for frontend to be ready, then emit
				time.Sleep(200 * time.Millisecond)
				app.Event.Emit("files-dropped", msg.Files)
			}
			conn.Close()
		}
	}()

	// Open initial file arguments (passed via double-click to first instance)
	if cliArgs := flag.Args(); len(cliArgs) > 0 {
		var mdFiles []string
		for _, arg := range cliArgs {
			ext := strings.ToLower(strings.TrimPrefix(filepath.Ext(arg), "."))
			if ext == "md" || ext == "markdown" || ext == "mdown" || ext == "mkd" {
				mdFiles = append(mdFiles, arg)
			}
		}
		if len(mdFiles) > 0 {
			go func() {
				time.Sleep(500 * time.Millisecond)
				app.Event.Emit("files-dropped", mdFiles)
			}()
		}
	}

	err := app.Run()
	if err != nil {
		log.Fatal(err)
	}
}

func createTray(app *application.App, win application.Window) *application.SystemTray {
	tray := app.SystemTray.New()

	tray.SetIcon(icon.TrayIcon())
	tray.SetDarkModeIcon(icon.TrayIconDark())
	tray.SetTooltip("Go Markdown")

	menu := app.Menu.New()
	menu.Add("Show Window").OnClick(func(ctx *application.Context) {
		win.Show()
		win.Focus()
	})
	menu.AddSeparator()
	menu.Add("Quit").OnClick(func(ctx *application.Context) {
		tray.Destroy()
		app.Quit()
	})
	tray.SetMenu(menu)

	tray.OnClick(func() {
		win.Show()
		win.Focus()
	})

	tray.AttachWindow(win).WindowOffset(5)
	return tray
}
