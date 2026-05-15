import { useTabStore } from '../../stores/tabStore';
import { useI18n } from '../../i18n';
import { EditOutlined } from '@ant-design/icons';
import MarkdownPreview from '../preview/MarkdownPreview';

export default function ReaderView() {
  const { t } = useI18n();
  const tabs = useTabStore((s) => s.tabs);
  const activeTabId = useTabStore((s) => s.activeTabId);
  const setTabMode = useTabStore((s) => s.setTabMode);

  const tab = tabs.find((t) => t.id === activeTabId);
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
          onClick={() => setTabMode(tab.id, 'editing')}
          title={t('reader.edit')}
        />
      </div>
      <MarkdownPreview html={tab.html} />
    </div>
  );
}
