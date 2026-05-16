import { useRef, useEffect, useCallback } from 'react';
import { useTabStore } from '../../stores/tabStore';
import { useI18n } from '../../i18n';
import { EditOutlined } from '@ant-design/icons';
import MarkdownPreview from '../preview/MarkdownPreview';

export default function ReaderView() {
  const { t } = useI18n();
  const tabs = useTabStore((s) => s.tabs);
  const activeTabId = useTabStore((s) => s.activeTabId);
  const setTabMode = useTabStore((s) => s.setTabMode);
  const updateTabContent = useTabStore((s) => s.updateTabContent);

  const tab = tabs.find((t) => t.id === activeTabId);
  const previewRef = useRef<HTMLDivElement | null>(null);

  // Restore saved scroll position when entering reading mode
  useEffect(() => {
    if (!tab?.scrollPosition) return;
    const frame = requestAnimationFrame(() => {
      if (previewRef.current) {
        previewRef.current.scrollTop = tab.scrollPosition!;
      }
    });
    return () => cancelAnimationFrame(frame);
  }, [tab?.id, tab?.scrollPosition]);

  const handleEdit = useCallback(() => {
    // Save current scroll position before switching to edit mode
    if (previewRef.current) {
      updateTabContent(tab!.id, { scrollPosition: previewRef.current.scrollTop });
    }
    setTabMode(tab!.id, 'editing');
  }, [tab, updateTabContent, setTabMode]);

  if (!tab) return null;

  return (
    <div style={{ position: 'relative', height: '100%' }}>
      <div
        style={{
          position: 'absolute',
          top: 12,
          right: 16,
          zIndex: 10,
        }}
      >
        <EditOutlined
          style={{
            fontSize: 20,
            cursor: 'pointer',
            color: 'var(--md-text)',
            opacity: 0.6,
            padding: 6,
            borderRadius: 6,
            background: 'var(--md-code-bg)',
          }}
          onClick={handleEdit}
          title={t('reader.edit')}
        />
      </div>
      <MarkdownPreview ref={previewRef} html={tab.html} />
    </div>
  );
}
