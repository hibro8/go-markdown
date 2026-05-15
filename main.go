package main

import (
	"embed"
	"log"
	"path/filepath"
	"strings"

	"go-markdown/services"

	"github.com/wailsapp/wails/v3/pkg/application"
	"github.com/wailsapp/wails/v3/pkg/events"
	"github.com/wailsapp/wails/v3/pkg/icons"
)

//go:embed frontend/dist
var assets embed.FS

func main() {
	settingsService := services.NewSettingsService()
	fileService := services.NewFileService()
	markdownService := services.NewMarkdownService()
	dbService := services.NewDBService()

	app := application.New(application.Options{
		Name:        "Go Markdown",
		Description: "A cross-platform Markdown reader",
		Icon:        icons.ApplicationLightMode256,
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
		Name:    "main",
		Title:   "Go Markdown",
		Width:   1280,
		Height:  800,
		MinWidth:  800,
		MinHeight: 600,
		URL: "/",
		BackgroundType: application.BackgroundTypeSolid,
		EnableFileDrop: true,
		Frameless: true,
	})

	// Create system tray
	createTray(app, win)

	// Window close → hide to tray if tray setting is enabled
	win.RegisterHook(events.Common.WindowClosing, func(e *application.WindowEvent) {
		settings, err := settingsService.Load()
		if err == nil && settings.TrayEnabled {
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

	err := app.Run()
	if err != nil {
		log.Fatal(err)
	}
}

func createTray(app *application.App, win application.Window) {
	tray := app.SystemTray.New()

	tray.SetIcon(icons.SystrayLight)
	tray.SetDarkModeIcon(icons.SystrayDark)
	tray.SetTooltip("Go Markdown")

	menu := app.Menu.New()
	menu.Add("Show Window").OnClick(func(ctx *application.Context) {
		win.Show()
		win.Focus()
	})
	menu.AddSeparator()
	menu.Add("Quit").OnClick(func(ctx *application.Context) {
		app.Quit()
	})
	tray.SetMenu(menu)

	tray.OnClick(func() {
		win.Show()
		win.Focus()
	})

	tray.AttachWindow(win).WindowOffset(5)
}
