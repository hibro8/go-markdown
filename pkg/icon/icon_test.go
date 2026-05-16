package icon

import (
	"bytes"
	"image"
	"image/png"
	"os"
	"testing"
)

func TestAppIcon(t *testing.T) {
	data := AppIcon()
	if len(data) == 0 {
		t.Fatal("AppIcon returned empty data")
	}

	img, _, err := image.Decode(bytes.NewReader(data))
	if err != nil {
		t.Fatalf("PNG decode failed: %v", err)
	}
	bounds := img.Bounds()
	t.Logf("AppIcon: %dx%d, %d bytes", bounds.Dx(), bounds.Dy(), len(data))

	if bounds.Dx() == 0 || bounds.Dy() == 0 {
		t.Error("AppIcon has zero dimension")
	}
}

func TestTrayIcon(t *testing.T) {
	data := TrayIcon()
	img, _, err := image.Decode(bytes.NewReader(data))
	if err != nil {
		t.Fatalf("PNG decode failed: %v", err)
	}
	bounds := img.Bounds()
	t.Logf("TrayIcon: %dx%d, %d bytes", bounds.Dx(), bounds.Dy(), len(data))

	if bounds.Dx() != 32 || bounds.Dy() != 32 {
		t.Errorf("TrayIcon size = %dx%d, want 32x32", bounds.Dx(), bounds.Dy())
	}
}

func TestTrayIconDark(t *testing.T) {
	data := TrayIconDark()
	img, _, err := image.Decode(bytes.NewReader(data))
	if err != nil {
		t.Fatalf("PNG decode failed: %v", err)
	}
	bounds := img.Bounds()
	t.Logf("TrayIconDark: %dx%d, %d bytes", bounds.Dx(), bounds.Dy(), len(data))

	if bounds.Dx() != 32 || bounds.Dy() != 32 {
		t.Errorf("TrayIconDark size = %dx%d, want 32x32", bounds.Dx(), bounds.Dy())
	}
}

func TestSaveAppIcon(t *testing.T) {
	data := AppIcon()
	// Decode and re-encode for clean output
	img, _, err := image.Decode(bytes.NewReader(data))
	if err != nil {
		t.Fatal(err)
	}

	var buf bytes.Buffer
	if err := png.Encode(&buf, img); err != nil {
		t.Fatal(err)
	}

	// Check the icon has non-transparent content
	nonZero := 0
	total := 0
	for y := img.Bounds().Min.Y; y < img.Bounds().Max.Y; y++ {
		for x := img.Bounds().Min.X; x < img.Bounds().Max.X; x++ {
			total++
			_, _, _, a := img.At(x, y).RGBA()
			if a > 0 {
				nonZero++
			}
		}
	}
	t.Logf("Non-transparent: %d/%d", nonZero, total)
	if nonZero == 0 {
		t.Error("Image is fully transparent")
	}
}

func TestGenerateICOPNG(t *testing.T) {
	// Save app icon PNG for ICO generation
	if err := os.WriteFile("appicon_source.png", AppIcon(), 0o644); err != nil {
		t.Fatal(err)
	}
	t.Log("Saved appicon_source.png")
}
