import { useCallback, useMemo } from 'react';
import type { editor } from 'monaco-editor';

interface IRange {
  startLineNumber: number;
  startColumn: number;
  endLineNumber: number;
  endColumn: number;
}
import {
  BoldOutlined,
  ItalicOutlined,
  StrikethroughOutlined,
  UnderlineOutlined,
  HighlightOutlined,
  LinkOutlined,
  PictureOutlined,
  OrderedListOutlined,
  UnorderedListOutlined,
  LineOutlined,
  CodeOutlined,
  BlockOutlined,
  TableOutlined,
  CheckSquareOutlined,
  FontSizeOutlined,
  VerticalAlignTopOutlined,
  VerticalAlignBottomOutlined,
  SmileOutlined,
  CommentOutlined,
} from '@ant-design/icons';
import { useI18n } from '../../i18n';

interface ToolbarProps {
  editorRef: React.RefObject<editor.IStandaloneCodeEditor | null>;
}

interface BtnDef {
  key: string;
  icon: React.ReactNode;
  title: string;
  prefix: string;
  suffix: string;
  placeholder: string;
  multiLine?: boolean;
}

function getEditorModel(editor: editor.IStandaloneCodeEditor) {
  const sel = editor.getSelection();
  if (!sel) return null;
  const model = editor.getModel();
  if (!model) return null;
  return { sel, model };
}

function insertFormatting(
  editor: editor.IStandaloneCodeEditor,
  prefix: string,
  suffix: string,
  placeholder: string,
  multiLine?: boolean,
) {
  const ctx = getEditorModel(editor);
  if (!ctx) return;
  const { sel, model } = ctx;

  const hasSelection = !sel.isEmpty();
  let range: IRange = {
    startLineNumber: sel.startLineNumber,
    startColumn: sel.startColumn,
    endLineNumber: sel.endLineNumber,
    endColumn: sel.endColumn,
  };
  let text: string;
  let afterRange: IRange | undefined;

  if (hasSelection) {
    const selectedText = model.getValueInRange(sel);
    text = prefix + selectedText + suffix;
  } else if (multiLine) {
    const lineNumber = sel.startLineNumber;
    const endCol = model.getLineMaxColumn(lineNumber);
    text = '\n' + prefix + placeholder + suffix + '\n';
    range = {
      startLineNumber: lineNumber,
      startColumn: endCol,
      endLineNumber: lineNumber,
      endColumn: endCol,
    };
    afterRange = {
      startLineNumber: lineNumber + 2,
      startColumn: 1,
      endLineNumber: lineNumber + 2,
      endColumn: 1,
    };
  } else {
    text = prefix + placeholder + suffix;
    afterRange = {
      startLineNumber: range.startLineNumber,
      startColumn: range.startColumn + prefix.length,
      endLineNumber: range.endLineNumber,
      endColumn: range.startColumn + prefix.length + placeholder.length,
    };
  }

  editor.executeEdits('toolbar', [
    {
      range,
      text,
      forceMoveMarkers: true,
    },
  ]);

  if (afterRange) {
    editor.setSelection(afterRange);
  }
  editor.focus();
}

function insertFootnote(editor: editor.IStandaloneCodeEditor) {
  const ctx = getEditorModel(editor);
  if (!ctx) return;
  const { sel, model } = ctx;

  const hasSelection = !sel.isEmpty();
  let fnId = '';
  if (hasSelection) {
    const selectedText = model.getValueInRange(sel);
    fnId = selectedText.replace(/[^\w]/g, '_').substring(0, 20);
  } else {
    fnId = '1';
  }

  const lastLine = model.getLineCount();
  const lastLineLength = model.getLineMaxColumn(lastLine);

  editor.executeEdits('toolbar', [
    {
      range: {
        startLineNumber: sel.startLineNumber,
        startColumn: sel.startColumn,
        endLineNumber: sel.endLineNumber,
        endColumn: sel.endColumn,
      },
      text: '[^' + fnId + ']',
      forceMoveMarkers: true,
    },
    {
      range: {
        startLineNumber: lastLine,
        startColumn: lastLineLength,
        endLineNumber: lastLine,
        endColumn: lastLineLength,
      },
      text: '\n\n[^' + fnId + ']: ',
      forceMoveMarkers: true,
    },
  ]);

  editor.setSelection({
    startLineNumber: lastLine + 2,
    startColumn: fnId.length + 5,
    endLineNumber: lastLine + 2,
    endColumn: fnId.length + 5,
  });
  editor.focus();
}

const Separator = () => (
  <span style={{ width: 1, height: 18, background: 'var(--md-border)', margin: '0 4px', flexShrink: 0 }} />
);

export default function MarkdownToolbar({ editorRef }: ToolbarProps) {
  const { t } = useI18n();

  const buttonGroups: BtnDef[][] = useMemo(() => {
    const textBtn = (_key: string, icon: string) => (
      <span style={{ fontWeight: 600, fontSize: 12, fontFamily: 'monospace' }}>{icon}</span>
    );

    return [
      // Text formatting
      [
        { key: 'bold', icon: <BoldOutlined />, title: t('toolbar.bold'), prefix: '**', suffix: '**', placeholder: 'bold' },
        { key: 'italic', icon: <ItalicOutlined />, title: t('toolbar.italic'), prefix: '*', suffix: '*', placeholder: 'italic' },
        { key: 'strikethrough', icon: <StrikethroughOutlined />, title: t('toolbar.strikethrough'), prefix: '~~', suffix: '~~', placeholder: 'text' },
        { key: 'underline', icon: <UnderlineOutlined />, title: t('toolbar.underline'), prefix: '<u>', suffix: '</u>', placeholder: 'text' },
        { key: 'mark', icon: <HighlightOutlined />, title: t('toolbar.mark'), prefix: '==', suffix: '==', placeholder: 'text' },
        { key: 'code', icon: <CodeOutlined />, title: t('toolbar.code'), prefix: '`', suffix: '`', placeholder: 'code' },
        { key: 'sup', icon: <VerticalAlignTopOutlined />, title: t('toolbar.sup'), prefix: '^', suffix: '', placeholder: 'sup' },
        { key: 'sub', icon: <VerticalAlignBottomOutlined />, title: t('toolbar.sub'), prefix: '~', suffix: '', placeholder: 'sub' },
      ],
      // Headings
      [
        { key: 'h1', icon: textBtn('h1', 'H1'), title: t('toolbar.h1'), prefix: '# ', suffix: '', placeholder: 'Heading 1' },
        { key: 'h2', icon: textBtn('h2', 'H2'), title: t('toolbar.h2'), prefix: '## ', suffix: '', placeholder: 'Heading 2' },
        { key: 'h3', icon: textBtn('h3', 'H3'), title: t('toolbar.h3'), prefix: '### ', suffix: '', placeholder: 'Heading 3' },
        { key: 'h4', icon: textBtn('h4', 'H4'), title: t('toolbar.h4'), prefix: '#### ', suffix: '', placeholder: 'Heading 4' },
        { key: 'h5', icon: textBtn('h5', 'H5'), title: t('toolbar.h5'), prefix: '##### ', suffix: '', placeholder: 'Heading 5' },
        { key: 'h6', icon: textBtn('h6', 'H6'), title: t('toolbar.h6'), prefix: '###### ', suffix: '', placeholder: 'Heading 6' },
      ],
      // Lists
      [
        { key: 'ul', icon: <UnorderedListOutlined />, title: t('toolbar.ul'), prefix: '- ', suffix: '', placeholder: 'item' },
        { key: 'ol', icon: <OrderedListOutlined />, title: t('toolbar.ol'), prefix: '1. ', suffix: '', placeholder: 'item' },
        { key: 'task', icon: <CheckSquareOutlined />, title: t('toolbar.task'), prefix: '- [ ] ', suffix: '', placeholder: 'task' },
      ],
      // Blocks
      [
        { key: 'quote', icon: <BlockOutlined />, title: t('toolbar.quote'), prefix: '> ', suffix: '', placeholder: 'quote' },
        { key: 'codeblock', icon: <FontSizeOutlined />, title: t('toolbar.codeblock'), prefix: '```\n', suffix: '\n```', placeholder: 'code', multiLine: true },
        { key: 'table', icon: <TableOutlined />, title: t('toolbar.table'), prefix: '| Header | Header |\n| ------ | ------ |\n| ', suffix: ' | ', placeholder: 'cell', multiLine: true },
        { key: 'hr', icon: <LineOutlined />, title: t('toolbar.hr'), prefix: '---', suffix: '', placeholder: '', multiLine: true },
      ],
      // Insert
      [
        { key: 'link', icon: <LinkOutlined />, title: t('toolbar.link'), prefix: '[', suffix: '](url)', placeholder: 'link text' },
        { key: 'image', icon: <PictureOutlined />, title: t('toolbar.image'), prefix: '![', suffix: '](url)', placeholder: 'alt text' },
        { key: 'emoji', icon: <SmileOutlined />, title: t('toolbar.emoji'), prefix: ':', suffix: ':', placeholder: 'smile' },
      ],
      // Special
      [
        { key: 'comment', icon: <CommentOutlined />, title: t('toolbar.comment'), prefix: '<!-- ', suffix: ' -->', placeholder: 'comment' },
        { key: 'toc', icon: textBtn('toc', 'TOC'), title: t('toolbar.toc'), prefix: '[TOC]\n\n', suffix: '', placeholder: '', multiLine: true },
      ],
    ];
  }, [t]);

  const handleClick = useCallback((btn: BtnDef) => {
    const editor = editorRef.current;
    if (!editor) return;
    insertFormatting(editor, btn.prefix, btn.suffix, btn.placeholder, btn.multiLine);
  }, [editorRef]);

  const handleFootnote = useCallback(() => {
    const editor = editorRef.current;
    if (!editor) return;
    insertFootnote(editor);
  }, [editorRef]);

  const btnStyle: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 28,
    height: 28,
    padding: '0 5px',
    border: 'none',
    borderRadius: 4,
    background: 'transparent',
    color: 'var(--md-text)',
    fontSize: 14,
    cursor: 'pointer',
    transition: 'background 0.12s',
  };

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: 2,
        padding: '4px 10px',
        borderBottom: '1px solid var(--md-border)',
        background: 'var(--md-code-bg)',
        userSelect: 'none',
      }}
    >
      {buttonGroups.map((group, gi) => (
        <div key={gi} style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          {gi > 0 && <Separator />}
          {group.map((btn) => (
            <button
              key={btn.key}
              title={btn.title}
              onClick={() => handleClick(btn)}
              style={btnStyle}
              onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(128,128,128,0.15)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
            >
              {btn.icon}
            </button>
          ))}
        </div>
      ))}
      {/* Footnote has different insertion logic */}
      <Separator />
      <button
        title={t('toolbar.footnote')}
        onClick={handleFootnote}
        style={btnStyle}
        onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(128,128,128,0.15)'; }}
        onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
      >
        <span style={{ fontWeight: 700, fontSize: 11, fontFamily: 'monospace' }}>fn</span>
      </button>
    </div>
  );
}
