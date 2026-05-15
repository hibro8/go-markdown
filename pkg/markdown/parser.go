package markdown

import (
	"bytes"

	"github.com/yuin/goldmark"
	emoji "github.com/yuin/goldmark-emoji"
	highlighting "github.com/yuin/goldmark-highlighting/v2"
	meta "github.com/yuin/goldmark-meta"
	"github.com/yuin/goldmark/extension"
	"github.com/yuin/goldmark/parser"
	"github.com/yuin/goldmark/renderer/html"
)

type Parser struct {
	md goldmark.Markdown
}

type Result struct {
	HTML     string
	Metadata map[string]any
}

func New() *Parser {
	md := goldmark.New(
		goldmark.WithExtensions(
			extension.GFM,
			extension.Footnote,
			extension.DefinitionList,
			extension.Typographer,
			highlighting.NewHighlighting(
				highlighting.WithStyle("github"),
			),
			emoji.Emoji,
			meta.Meta,
		),
		goldmark.WithParserOptions(
			parser.WithAttribute(),
		),
		goldmark.WithRendererOptions(
			html.WithUnsafe(),
		),
	)
	return &Parser{md: md}
}

func (p *Parser) Parse(markdown []byte) (*Result, error) {
	var buf bytes.Buffer
	ctx := parser.NewContext()
	if err := p.md.Convert(markdown, &buf, parser.WithContext(ctx)); err != nil {
		return nil, err
	}
	return &Result{
		HTML:     buf.String(),
		Metadata: meta.Get(ctx),
	}, nil
}

func (p *Parser) ExtractMeta(markdown []byte) (map[string]any, error) {
	ctx := parser.NewContext()
	var buf bytes.Buffer
	if err := p.md.Convert(markdown, &buf, parser.WithContext(ctx)); err != nil {
		return nil, err
	}
	return meta.Get(ctx), nil
}
