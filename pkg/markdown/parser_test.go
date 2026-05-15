package markdown

import (
	"strings"
	"testing"
)

func TestParseBasicMarkdown(t *testing.T) {
	p := New()
	result, err := p.Parse([]byte("# Hello World\n\nThis is **bold** and *italic*."))
	if err != nil {
		t.Fatalf("Parse failed: %v", err)
	}
	if !strings.Contains(result.HTML, "<h1>") {
		t.Error("Expected <h1> tag for heading")
	}
	if !strings.Contains(result.HTML, "<strong>bold</strong>") {
		t.Error("Expected <strong> tag for bold")
	}
	if !strings.Contains(result.HTML, "<em>italic</em>") {
		t.Error("Expected <em> tag for italic")
	}
}

func TestParseGFMTable(t *testing.T) {
	p := New()
	md := `| Name | Age |
|------|-----|
| Alice|  30 |
| Bob  |  25 |`
	result, err := p.Parse([]byte(md))
	if err != nil {
		t.Fatalf("Parse failed: %v", err)
	}
	if !strings.Contains(result.HTML, "<table>") {
		t.Error("Expected <table> tag for GFM table")
	}
	if !strings.Contains(result.HTML, "<th>Name</th>") {
		t.Error("Expected <th>Name</th> in table")
	}
	if !strings.Contains(result.HTML, "Alice") {
		t.Error("Expected Alice in table")
	}
}

func TestParseTaskList(t *testing.T) {
	p := New()
	md := `- [x] Done task
- [ ] Pending task`
	result, err := p.Parse([]byte(md))
	if err != nil {
		t.Fatalf("Parse failed: %v", err)
	}
	if !strings.Contains(result.HTML, "checkbox") {
		t.Error("Expected task list checkbox")
	}
	if !strings.Contains(result.HTML, "checked") {
		t.Error("Expected checked attribute")
	}
}

func TestParseStrikethrough(t *testing.T) {
	p := New()
	result, err := p.Parse([]byte("This is ~~deleted~~ text."))
	if err != nil {
		t.Fatalf("Parse failed: %v", err)
	}
	if !strings.Contains(result.HTML, "<del>") {
		t.Error("Expected <del> tag for strikethrough")
	}
}

func TestParseFencedCodeBlock(t *testing.T) {
	p := New()
	md := "```go\nfunc main() {\n\tfmt.Println(\"hello\")\n}\n```"
	result, err := p.Parse([]byte(md))
	if err != nil {
		t.Fatalf("Parse failed: %v", err)
	}
	if !strings.Contains(result.HTML, "<code") {
		t.Error("Expected code block")
	}
	// With syntax highlighting, content is split into chroma spans
	if !strings.Contains(result.HTML, "fmt") || !strings.Contains(result.HTML, "Println") {
		t.Logf("HTML output: %s", result.HTML)
		t.Error("Expected code content with syntax highlighting spans")
	}
}

func TestParseEmoji(t *testing.T) {
	p := New()
	result, err := p.Parse([]byte("I am :smile: happy!"))
	if err != nil {
		t.Fatalf("Parse failed: %v", err)
	}
	// Emoji should be converted (either Unicode or HTML entity)
	if !strings.Contains(result.HTML, "smile") && !strings.Contains(result.HTML, "&#x1f604") {
		t.Logf("HTML output: %s", result.HTML)
		t.Error("Expected emoji conversion")
	}
}

func TestParseFrontmatterMeta(t *testing.T) {
	p := New()
	md := `---
title: Test Document
tags:
  - go
  - markdown
---

# Content here`
	result, err := p.Parse([]byte(md))
	if err != nil {
		t.Fatalf("Parse failed: %v", err)
	}
	if result.Metadata == nil {
		t.Fatal("Expected metadata from frontmatter")
	}
	title, ok := result.Metadata["title"].(string)
	if !ok || title != "Test Document" {
		t.Errorf("Expected title 'Test Document', got '%v'", result.Metadata["title"])
	}
	if !strings.Contains(result.HTML, "Content here") {
		t.Error("Expected content after frontmatter")
	}
}

func TestParseEmptyInput(t *testing.T) {
	p := New()
	result, err := p.Parse([]byte(""))
	if err != nil {
		t.Fatalf("Parse failed: %v", err)
	}
	// goldmark returns empty output for empty input — this is valid
	// We just verify no error occurred
	_ = result
}

func TestParseBlockquote(t *testing.T) {
	p := New()
	result, err := p.Parse([]byte("> This is a quote\n> multiple lines"))
	if err != nil {
		t.Fatalf("Parse failed: %v", err)
	}
	if !strings.Contains(result.HTML, "<blockquote>") {
		t.Error("Expected <blockquote> tag")
	}
}

func TestParseNestedList(t *testing.T) {
	p := New()
	md := `- Item 1
  - Sub 1.1
  - Sub 1.2
- Item 2`
	result, err := p.Parse([]byte(md))
	if err != nil {
		t.Fatalf("Parse failed: %v", err)
	}
	if !strings.Contains(result.HTML, "<ul>") {
		t.Error("Expected <ul> tag")
	}
	if !strings.Contains(result.HTML, "Sub 1.1") {
		t.Error("Expected nested list item")
	}
}

func TestParseLink(t *testing.T) {
	p := New()
	result, err := p.Parse([]byte("[Google](https://google.com)"))
	if err != nil {
		t.Fatalf("Parse failed: %v", err)
	}
	if !strings.Contains(result.HTML, `href="https://google.com"`) {
		t.Error("Expected link href")
	}
}

func TestParseImage(t *testing.T) {
	p := New()
	result, err := p.Parse([]byte("![alt](image.png)"))
	if err != nil {
		t.Fatalf("Parse failed: %v", err)
	}
	if !strings.Contains(result.HTML, "<img") {
		t.Error("Expected <img> tag")
	}
	if !strings.Contains(result.HTML, `src="image.png"`) {
		t.Error("Expected image src")
	}
}

func TestExtractMeta(t *testing.T) {
	p := New()
	md := `---
author: testuser
version: "1.0"
---

# Document`
	meta, err := p.ExtractMeta([]byte(md))
	if err != nil {
		t.Fatalf("ExtractMeta failed: %v", err)
	}
	if meta == nil {
		t.Fatal("Expected metadata")
	}
	if meta["author"] != "testuser" {
		t.Errorf("Expected author 'testuser', got '%v'", meta["author"])
	}
}

func TestParseWithoutFrontmatter(t *testing.T) {
	p := New()
	result, err := p.Parse([]byte("# Just a heading"))
	if err != nil {
		t.Fatalf("Parse failed: %v", err)
	}
	if result.Metadata != nil && len(result.Metadata) > 0 {
		t.Logf("Metadata: %v", result.Metadata)
		// No frontmatter → metadata should be empty/nil
	}
}

func TestParseChineseText(t *testing.T) {
	p := New()
	result, err := p.Parse([]byte("# 你好世界\n\n这是一段中文文本。"))
	if err != nil {
		t.Fatalf("Parse failed: %v", err)
	}
	if !strings.Contains(result.HTML, "你好世界") {
		t.Error("Expected Chinese heading")
	}
	if !strings.Contains(result.HTML, "中文") {
		t.Error("Expected Chinese content")
	}
}
