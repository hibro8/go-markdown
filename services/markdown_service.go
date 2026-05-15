package services

import (
	"go-markdown/pkg/markdown"
)

type ParseResult struct {
	HTML     string         `json:"html"`
	Metadata map[string]any `json:"metadata"`
}

type MarkdownService struct {
	parser *markdown.Parser
}

func NewMarkdownService() *MarkdownService {
	return &MarkdownService{
		parser: markdown.New(),
	}
}

func (m *MarkdownService) ServiceName() string {
	return "MarkdownService"
}

// Parse converts raw markdown string to HTML with metadata.
func (m *MarkdownService) Parse(raw string) (*ParseResult, error) {
	result, err := m.parser.Parse([]byte(raw))
	if err != nil {
		return nil, err
	}
	return &ParseResult{
		HTML:     result.HTML,
		Metadata: result.Metadata,
	}, nil
}

// ParseFile reads a file and parses it.
func (m *MarkdownService) ParseFile(filePath string) (*ParseResult, error) {
	content, err := (&FileService{}).ReadFile(filePath)
	if err != nil {
		return nil, err
	}
	return m.Parse(content)
}
