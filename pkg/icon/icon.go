package icon

import (
	"bytes"
	_ "embed"
	"image"
	"image/png"

	"golang.org/x/image/draw"
)

//go:embed markdown.png
var appIconPNG []byte

// AppIcon returns the 256x256 application icon PNG.
func AppIcon() []byte {
	return appIconPNG
}

// TrayIcon returns a 32x32 tray icon PNG for light themes.
func TrayIcon() []byte {
	return resizePNG(32)
}

// TrayIconDark returns a 32x32 tray icon PNG for dark themes.
func TrayIconDark() []byte {
	return resizePNG(32)
}

func resizePNG(size int) []byte {
	img, _, err := image.Decode(bytes.NewReader(appIconPNG))
	if err != nil {
		return appIconPNG
	}
	dst := image.NewRGBA(image.Rect(0, 0, size, size))
	draw.BiLinear.Scale(dst, dst.Bounds(), img, img.Bounds(), draw.Over, nil)

	var buf bytes.Buffer
	if err := png.Encode(&buf, dst); err != nil {
		return appIconPNG
	}
	return buf.Bytes()
}
