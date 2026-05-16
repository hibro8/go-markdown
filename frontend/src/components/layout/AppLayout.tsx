import { useCallback, useEffect } from 'react';
import { Layout } from 'antd';
import TitleBar from './TitleBar';
import FolderSection from '../sidebar/FolderSection';
import FileList from '../sidebar/FileList';
import TabBar from '../tabs/TabBar';
import ReaderView from '../reader/ReaderView';
import EditView from '../reader/EditView';
import SettingsDrawer from '../settings/SettingsDrawer';
import { useTabStore } from '../../stores/tabStore';
import { useFileStore } from '../../stores/fileStore';
import { useI18n } from '../../i18n';
import { FileService, MarkdownService } from '../../services/api';
import { Events } from '@wailsio/runtime';
import { FileAddOutlined } from '@ant-design/icons';

const { Sider, Content } = Layout;

export default function AppLayout() {
  const { t } = useI18n();
  const tabs = useTabStore((s) => s.tabs);
  const activeTabId = useTabStore((s) => s.activeTabId);
  const openTab = useTabStore((s) => s.openTab);
  const addFile = useFileStore((s) => s.addFile);

  const activeTab = tabs.find((t) => t.id === activeTabId);

  const openFileInTab = useCallback(async (filePath: string) => {
    try {
      const info = await FileService.GetFileInfo(filePath);
      if (!info?.exists) return;
      addFile(filePath);
      const markdown = await FileService.ReadFile(filePath);
      const result = await MarkdownService.Parse(markdown);
      openTab({
        id: filePath,
        filePath,
        fileName: info.name,
        markdown,
        html: result?.html ?? '',
        mode: 'reading',
        isDirty: false,
        metadata: result?.metadata ?? {},
        pinned: false,
        scrollPosition: 0,
      });
    } catch {
      console.warn('Failed to open file:', filePath);
    }
  }, [addFile, openTab]);

  const handleOpenFile = useCallback(async () => {
    try {
      const filePath = await FileService.OpenFile();
      if (!filePath) return;
      await openFileInTab(filePath);
    } catch {
      console.warn('Failed to open file');
    }
  }, [openFileInTab]);

  // Listen for file drops from the native window
  useEffect(() => {
    const unsub = Events.On('files-dropped', (ev) => {
      const files = ev.data as string[];
      if (!files || files.length === 0) return;
      // Defer to next tick — event dispatch runs inside Go's blocking ExecJS,
      // and calling Go services synchronously would deadlock.
      for (const f of files) {
        setTimeout(() => openFileInTab(f), 0);
      }
    });
    return () => unsub();
  }, [openFileInTab]);

  return (
    <div data-file-drop-target style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      <TitleBar />
      <Layout style={{ flex: 1, overflow: 'hidden' }}>
        <Sider
          width={260}
          style={{
            background: 'var(--md-code-bg)',
            borderRight: '1px solid var(--md-border)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
          }}
        >
          {/* Top: Folder section */}
          <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column', margin: '8px 8px 4px 8px', borderRadius: 8, border: '1px solid var(--md-border)' }}>
            <FolderSection />
          </div>

          {/* Middle: File list section */}
          <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column', margin: '4px 8px 8px 8px', borderRadius: 8, border: '1px solid var(--md-border)' }}>
            <div
              style={{
                padding: '10px 14px',
                borderBottom: '1px solid var(--md-border)',
                background: 'rgba(128,128,128,0.04)',
                borderRadius: '8px 8px 0 0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--md-text)', letterSpacing: '0.3px' }}>{t('sidebar.files')}</span>
              <FileAddOutlined
                style={{ fontSize: 15, cursor: 'pointer', color: 'var(--md-text)', opacity: 0.7, transition: 'opacity 0.15s' }}
                onMouseEnter={(e) => { e.currentTarget.style.opacity = '1'; }}
                onMouseLeave={(e) => { e.currentTarget.style.opacity = '0.7'; }}
                onClick={handleOpenFile}
                title={t('sidebar.openFile')}
              />
            </div>
            <div style={{ flex: 1, overflow: 'auto' }}>
              <FileList />
            </div>
          </div>

        </Sider>
        <Content
          style={{
            display: 'flex',
            flexDirection: 'column',
            background: 'var(--md-bg)',
          }}
        >
          <TabBar />
          <div style={{ flex: 1, overflow: 'auto', position: 'relative' }}>
            {activeTab ? (
              activeTab.mode === 'editing' ? (
                <EditView />
              ) : (
                <ReaderView />
              )
            ) : (
              <div
                onDoubleClick={handleOpenFile}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  height: '100%',
                  color: 'var(--md-text)',
                  opacity: 0.5,
                  fontSize: 16,
                  userSelect: 'none',
                }}
              >
                {t('app.empty')}
              </div>
            )}
          </div>
        </Content>
        <SettingsDrawer />
      </Layout>
    </div>
  );
}
