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

function insertFormatting(
  editor: editor.IStandaloneCodeEditor,
  prefix: string,
  suffix: string,
  placeholder: string,
  multiLine?: boolean,
) {
  const sel = editor.getSelection();
  if (!sel) return;
  const model = editor.getModel();
  if (!model) return;

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

export default function MarkdownToolbar({ editorRef }: ToolbarProps) {
  const { t } = useI18n();

  const buttons: BtnDef[] = useMemo(() => [
    { key: 'bold', icon: <BoldOutlined />, title: t('toolbar.bold'), prefix: '**', suffix: '**', placeholder: 'bold' },
    { key: 'italic', icon: <ItalicOutlined />, title: t('toolbar.italic'), prefix: '*', suffix: '*', placeholder: 'italic' },
    { key: 'strikethrough', icon: <StrikethroughOutlined />, title: t('toolbar.strikethrough'), prefix: '~~', suffix: '~~', placeholder: 'text' },
    { key: 'code', icon: <CodeOutlined />, title: t('toolbar.code'), prefix: '`', suffix: '`', placeholder: 'code' },
    { key: 'h1', icon: <span style={{ fontWeight: 700, fontSize: 13 }}>H1</span>, title: t('toolbar.h1'), prefix: '# ', suffix: '', placeholder: 'Heading 1' },
    { key: 'h2', icon: <span style={{ fontWeight: 700, fontSize: 12 }}>H2</span>, title: t('toolbar.h2'), prefix: '## ', suffix: '', placeholder: 'Heading 2' },
    { key: 'h3', icon: <span style={{ fontWeight: 700, fontSize: 11 }}>H3</span>, title: t('toolbar.h3'), prefix: '### ', suffix: '', placeholder: 'Heading 3' },
    { key: 'quote', icon: <BlockOutlined />, title: t('toolbar.quote'), prefix: '> ', suffix: '', placeholder: 'quote' },
    { key: 'ul', icon: <UnorderedListOutlined />, title: t('toolbar.ul'), prefix: '- ', suffix: '', placeholder: 'item' },
    { key: 'ol', icon: <OrderedListOutlined />, title: t('toolbar.ol'), prefix: '1. ', suffix: '', placeholder: 'item' },
    { key: 'task', icon: <CheckSquareOutlined />, title: t('toolbar.task'), prefix: '- [ ] ', suffix: '', placeholder: 'task' },
    { key: 'hr', icon: <LineOutlined />, title: t('toolbar.hr'), prefix: '---', suffix: '', placeholder: '', multiLine: true },
    { key: 'link', icon: <LinkOutlined />, title: t('toolbar.link'), prefix: '[', suffix: '](url)', placeholder: 'link text' },
    { key: 'image', icon: <PictureOutlined />, title: t('toolbar.image'), prefix: '![', suffix: '](url)', placeholder: 'alt text' },
    { key: 'codeblock', icon: <FontSizeOutlined />, title: t('toolbar.codeblock'), prefix: '```\n', suffix: '\n```', placeholder: 'code', multiLine: true },
    { key: 'table', icon: <TableOutlined />, title: t('toolbar.table'),
      prefix: '| Header | Header |\n| ------ | ------ |\n| ', suffix: ' | ', placeholder: 'cell', multiLine: true },
  ], [t]);

  const handleClick = useCallback((btn: BtnDef) => {
    const editor = editorRef.current;
    if (!editor) return;
    insertFormatting(editor, btn.prefix, btn.suffix, btn.placeholder, btn.multiLine);
  }, [editorRef]);

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
      {buttons.map((btn) => (
        <button
          key={btn.key}
          title={btn.title}
          onClick={() => handleClick(btn)}
          style={{
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
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(128,128,128,0.15)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
        >
          {btn.icon}
        </button>
      ))}
    </div>
  );
}
