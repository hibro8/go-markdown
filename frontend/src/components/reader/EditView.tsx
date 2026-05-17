import { useState, useCallback, useRef, useEffect, lazy, Suspense } from 'react';
import { App } from 'antd';
import { useTabStore } from '../../stores/tabStore';
import { useSettingsStore } from '../../stores/settingsStore';
import { useI18n } from '../../i18n';
import { CloseOutlined, SaveOutlined, CheckCircleOutlined, LoadingOutlined } from '@ant-design/icons';
import MarkdownPreview from '../preview/MarkdownPreview';
import MarkdownToolbar from './MarkdownToolbar';
import { MarkdownService, FileService, DBService } from '../../services/api';
import type { editor } from 'monaco-editor';

const MonacoEditor = lazy(() => import('@monaco-editor/react'));
const MIN_PANEL_WIDTH = 300;
const SPLIT_STATE_KEY = 'edit_split_ratio';

export default function EditView() {
  const { t } = useI18n();
  const { message } = App.useApp();
  const tabs = useTabStore((s) => s.tabs);
  const activeTabId = useTabStore((s) => s.activeTabId);
  const setTabMode = useTabStore((s) => s.setTabMode);
  const updateTabContent = useTabStore((s) => s.updateTabContent);
  const appTheme = useSettingsStore((s) => s.theme);

  const tab = tabs.find((t) => t.id === activeTabId);
  const [content, setContent] = useState(tab?.markdown || '');
  const [previewHtml, setPreviewHtml] = useState(tab?.html || '');
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  // Scroll sync
  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);
  const previewRef = useRef<HTMLDivElement | null>(null);
  const syncingRef = useRef(false);

  // Resizable split — ratio-based so panels scale with window resize
  const splitContainerRef = useRef<HTMLDivElement | null>(null);
  const draggingRef = useRef(false);
  const [splitRatio, setSplitRatio] = useState(0.5);
  const splitRatioRef = useRef(splitRatio);
  splitRatioRef.current = splitRatio;
  const [containerWidth, setContainerWidth] = useState(0);

  // Track container size for ratio → px conversion
  useEffect(() => {
    const el = splitContainerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => {
      setContainerWidth(entry.contentRect.width);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const minRatio = containerWidth > 0 ? MIN_PANEL_WIDTH / containerWidth : 0;
  const maxRatio = containerWidth > 0 ? 1 - MIN_PANEL_WIDTH / containerWidth : 1;
  const clampedRatio = Math.max(minRatio, Math.min(maxRatio, splitRatio));
  const leftPx = containerWidth > 0 ? Math.round(clampedRatio * containerWidth) : 0;

  // Restore saved split ratio
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const saved = await DBService.GetState(SPLIT_STATE_KEY);
        if (!cancelled && saved) {
          const ratio = Number(saved);
          if (!isNaN(ratio) && ratio > 0 && ratio < 1) {
            setSplitRatio(ratio);
          }
        }
      } catch { /* */ }
    })();
    return () => { cancelled = true; };
  }, []);

  const persistSplit = useCallback(() => {
    DBService.SaveState(SPLIT_STATE_KEY, String(splitRatioRef.current)).catch(() => {});
  }, []);

  const handleSplitMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    draggingRef.current = true;
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
  }, []);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!draggingRef.current || !splitContainerRef.current) return;
      const rect = splitContainerRef.current.getBoundingClientRect();
      const ratio = (e.clientX - rect.left) / rect.width;
      setSplitRatio(ratio);
    };
    const handleMouseUp = () => {
      if (!draggingRef.current) return;
      draggingRef.current = false;
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
      persistSplit();
    };
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [persistSplit]);

  useEffect(() => {
    if (tab) {
      setContent(tab.markdown);
      setPreviewHtml(tab.html);
    }
  }, [tab?.id]);

  // Restore preview scroll position when entering edit mode
  useEffect(() => {
    if (!tab?.scrollPosition) return;
    const frame = requestAnimationFrame(() => {
      if (previewRef.current) {
        previewRef.current.scrollTop = tab.scrollPosition!;
      }
    });
    return () => cancelAnimationFrame(frame);
  }, [tab?.id]);

  const handleEditorMount = useCallback((editor: editor.IStandaloneCodeEditor) => {
    editorRef.current = editor;
    editor.onDidScrollChange((e) => {
      if (syncingRef.current) return;
      const preview = previewRef.current;
      if (!preview) return;
      syncingRef.current = true;
      const editorScrollable = editor.getScrollHeight() - editor.getLayoutInfo().height;
      const ratio = editorScrollable > 0 ? e.scrollTop / editorScrollable : 0;
      preview.scrollTop = ratio * (preview.scrollHeight - preview.clientHeight);
      requestAnimationFrame(() => { syncingRef.current = false; });
    });
  }, []);

  const handlePreviewScroll = useCallback(() => {
    if (syncingRef.current) return;
    const editor = editorRef.current;
    const preview = previewRef.current;
    if (!editor || !preview) return;
    syncingRef.current = true;
    const previewScrollable = preview.scrollHeight - preview.clientHeight;
    const ratio = previewScrollable > 0 ? preview.scrollTop / previewScrollable : 0;
    const editorScrollable = editor.getScrollHeight() - editor.getLayoutInfo().height;
    editor.setScrollTop(ratio * editorScrollable);
    requestAnimationFrame(() => { syncingRef.current = false; });
  }, []);

  const handleChange = useCallback(
    (value: string | undefined) => {
      const newContent = value || '';
      setContent(newContent);
      updateTabContent(tab!.id, { markdown: newContent, isDirty: true });

      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(async () => {
        try {
          const result = await MarkdownService.Parse(newContent);
          if (result) {
            setPreviewHtml(result.html);
            updateTabContent(tab!.id, { html: result.html });
          }
        } catch {
          // parse error, keep old preview
        }
      }, 300);
    },
    [tab, updateTabContent]
  );

  // Save preview scroll position and switch to reading mode
  const closeEditor = useCallback(() => {
    if (previewRef.current) {
      updateTabContent(tab!.id, { scrollPosition: previewRef.current.scrollTop });
    }
    setTabMode(tab!.id, 'reading');
  }, [tab, updateTabContent, setTabMode]);

  const handleSave = useCallback(async () => {
    if (!tab) return;
    try {
      await FileService.SaveFile(tab.filePath, content);
      updateTabContent(tab.id, { isDirty: false, markdown: content });
      message.success(t('reader.saveSuccess'));
    } catch {
      message.error(t('reader.saveFailed'));
    }
  }, [tab, content, updateTabContent, message, t]);

  const handleSaveAndClose = useCallback(async () => {
    if (!tab) return;
    try {
      await FileService.SaveFile(tab.filePath, content);
      updateTabContent(tab.id, { isDirty: false, markdown: content, html: previewHtml });
      message.success(t('reader.saveSuccess'));
      closeEditor();
    } catch {
      message.error(t('reader.saveFailed'));
    }
  }, [tab, content, previewHtml, updateTabContent, closeEditor, message, t]);

  if (!tab) return null;

  const monacoOptions = {
    wordWrap: 'on' as const,
    minimap: { enabled: false },
    lineNumbers: 'on' as const,
    automaticLayout: true,
    fontSize: 14,
    fontFamily:
      "'Cascadia Code', 'Fira Code', 'JetBrains Mono', Consolas, monospace",
    scrollBeyondLastLine: false,
    padding: { top: 16 },
  };

  return (
    <div style={{ display: 'flex', height: '100%', flexDirection: 'column' }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '4px 12px',
          borderBottom: '1px solid var(--md-border)',
          background: 'var(--md-code-bg)',
          height: 32,
        }}
      >
        <span style={{ fontSize: 12, color: 'var(--md-text)', opacity: 0.7 }}>
          {tab.isDirty ? t('reader.unsaved') : t('reader.editing')} — {tab.fileName}
        </span>
        <div style={{ display: 'flex', gap: 12 }}>
          <SaveOutlined
            style={{ fontSize: 16, cursor: 'pointer', color: 'var(--md-text)' }}
            onClick={handleSave}
            title={t('reader.save')}
          />
          <CheckCircleOutlined
            style={{ fontSize: 16, cursor: 'pointer', color: 'var(--md-link)' }}
            onClick={handleSaveAndClose}
            title={t('reader.saveAndClose')}
          />
          <CloseOutlined
            style={{ fontSize: 16, cursor: 'pointer', color: 'var(--md-text)' }}
            onClick={closeEditor}
            title={t('reader.closeEditor')}
          />
        </div>
      </div>
      <MarkdownToolbar editorRef={editorRef} />
      <div ref={splitContainerRef} style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        <div style={{ width: leftPx, minWidth: 0, flexShrink: 0 }}>
          <Suspense
            fallback={
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  height: '100%',
                }}
              >
                <LoadingOutlined style={{ fontSize: 24 }} />
              </div>
            }
          >
            <MonacoEditor
              height="100%"
              language="markdown"
              theme={appTheme === 'dark' ? 'vs-dark' : 'vs'}
              value={content}
              onChange={handleChange}
              onMount={handleEditorMount}
              options={monacoOptions}
            />
          </Suspense>
        </div>
        <div
          onMouseDown={handleSplitMouseDown}
          style={{
            width: 4,
            cursor: 'col-resize',
            background: 'var(--md-border)',
            flexShrink: 0,
            transition: draggingRef.current ? 'none' : 'background 0.15s',
          }}
          onMouseEnter={(e) => {
            if (!draggingRef.current) {
              e.currentTarget.style.background = 'var(--md-link)';
            }
          }}
          onMouseLeave={(e) => {
            if (!draggingRef.current) {
              e.currentTarget.style.background = 'var(--md-border)';
            }
          }}
        />
        <div style={{ flex: 1, minWidth: 0 }}>
          <MarkdownPreview ref={previewRef} html={previewHtml} onScroll={handlePreviewScroll} />
        </div>
      </div>
    </div>
  );
}
