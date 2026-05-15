import { useCallback, useState, useRef } from 'react';
import { Tree, Dropdown, App } from 'antd';
import type { DataNode } from 'antd/es/tree';
import type { MenuProps } from 'antd';
import {
  FolderOpenOutlined,
  FolderAddOutlined,
  FolderOutlined,
  FileOutlined,
  CloseOutlined,
  FileAddOutlined,
  DeleteOutlined,
} from '@ant-design/icons';
import { useFileStore } from '../../stores/fileStore';
import { useTabStore } from '../../stores/tabStore';
import { useI18n } from '../../i18n';
import { FileService, MarkdownService } from '../../services/api';
import type { FileNode } from '../../types';

function convertToTreeData(nodes: FileNode[]): DataNode[] {
  return nodes.map((node) => ({
    key: node.path,
    title: node.name,
    icon: node.isDir
      ? ({ expanded }: { expanded: boolean | undefined }) =>
          expanded ? <FolderOpenOutlined /> : <FolderOutlined />
      : () => <FileOutlined />,
    children: node.children ? convertToTreeData(node.children) : undefined,
    isLeaf: !node.isDir,
  })) as DataNode[];
}

export default function FolderSection() {
  const { t } = useI18n();
  const { message } = App.useApp();
  const folderPath = useFileStore((s) => s.folderPath);
  const folderTree = useFileStore((s) => s.folderTree);
  const setFolder = useFileStore((s) => s.setFolder);
  const clearFolder = useFileStore((s) => s.clearFolder);
  const refreshTree = useFileStore((s) => s.refreshTree);
  const openTab = useTabStore((s) => s.openTab);

  const [ctxMenu, setCtxMenu] = useState<{ x: number; y: number; node: FileNode } | null>(null);
  const ctxMenuRef = useRef<HTMLDivElement>(null);

  const mdExtensions = ['.md', '.markdown', '.mdown', '.mkd'];
  const findFirstMd = useCallback((nodes: FileNode[]): FileNode | null => {
    for (const n of nodes) {
      if (!n.isDir && mdExtensions.some((ext) => n.name.endsWith(ext))) return n;
      if (n.children) {
        const found = findFirstMd(n.children);
        if (found) return found;
      }
    }
    return null;
  }, []);

  const findNode = useCallback((nodes: FileNode[], path: string): FileNode | null => {
    for (const n of nodes) {
      if (n.path === path) return n;
      if (n.children) {
        const found = findNode(n.children, path);
        if (found) return found;
      }
    }
    return null;
  }, []);

  const handleOpenFolder = useCallback(async () => {
    try {
      const path = await FileService.OpenFolder();
      if (!path) return;
      const tree = await FileService.ListFiles(path);
      setFolder(path, tree || []);
      const firstMd = findFirstMd(tree || []);
      if (firstMd) {
        const markdown = await FileService.ReadFile(firstMd.path);
        const result = await MarkdownService.Parse(markdown);
        openTab({
          id: firstMd.path,
          filePath: firstMd.path,
          fileName: firstMd.name,
          markdown,
          html: result?.html ?? '',
          mode: 'reading',
          isDirty: false,
          metadata: result?.metadata ?? {},
          pinned: false,
        });
      }
    } catch {
      console.warn('Failed to open folder');
    }
  }, [setFolder, findFirstMd, openTab]);

  const handleSelect = useCallback(
    async (keys: React.Key[]) => {
      if (keys.length === 0) return;
      const key = keys[0] as string;
      const node = findNode(folderTree, key);
      if (!node || node.isDir) return;

      try {
        const markdown = await FileService.ReadFile(node.path);
        const result = await MarkdownService.Parse(markdown);
        openTab({
          id: node.path,
          filePath: node.path,
          fileName: node.name,
          markdown,
          html: result?.html ?? '',
          mode: 'reading',
          isDirty: false,
          metadata: result?.metadata ?? {},
          pinned: false,
        });
      } catch {
        console.warn('Failed to open file from folder');
      }
    },
    [folderTree, openTab, findNode]
  );

  const handleNewFile = useCallback(
    async (parentDir: string) => {
      const name = prompt(t('tree.newFile'));
      if (!name) return;
      try {
        await FileService.CreateFile(parentDir, name);
        await refreshTree();
      } catch {
        message.error('Failed to create file');
      }
    },
    [refreshTree, message, t]
  );

  const handleNewFolder = useCallback(
    async (parentDir: string) => {
      const name = prompt(t('tree.newFolder'));
      if (!name) return;
      try {
        await FileService.CreateFolder(parentDir, name);
        await refreshTree();
      } catch {
        message.error('Failed to create folder');
      }
    },
    [refreshTree, message, t]
  );

  const handleDelete = useCallback(
    async (targetPath: string, isDir: boolean) => {
      const label = isDir
        ? `Delete folder and all contents?`
        : `Delete "${targetPath.split(/[/\\]/).pop()}"?`;
      if (!confirm(label)) return;
      try {
        await FileService.DeleteFile(targetPath);
        await refreshTree();
        message.success('Deleted');
      } catch {
        message.error('Failed to delete');
      }
    },
    [refreshTree, message]
  );

  const handleRightClick = useCallback(
    (info: { event: React.MouseEvent; node: DataNode }) => {
      info.event.preventDefault();
      const node = findNode(folderTree, info.node.key as string);
      if (!node) return;
      setCtxMenu({ x: info.event.clientX, y: info.event.clientY, node });
    },
    [folderTree, findNode]
  );

  const closeCtxMenu = useCallback(() => setCtxMenu(null), []);

  const ctxMenuItems: MenuProps['items'] = ctxMenu
    ? [
        ...(ctxMenu.node.isDir
          ? [
              {
                key: 'newFile',
                icon: <FileAddOutlined />,
                label: t('tree.newFile'),
                onClick: () => handleNewFile(ctxMenu.node.path),
              },
              {
                key: 'newFolder',
                icon: <FolderAddOutlined />,
                label: t('tree.newFolder'),
                onClick: () => handleNewFolder(ctxMenu.node.path),
              },
            ]
          : []),
        { type: 'divider' as const },
        {
          key: 'delete',
          icon: <DeleteOutlined />,
          label: t('tree.delete'),
          danger: true,
          onClick: () => handleDelete(ctxMenu.node.path, ctxMenu.node.isDir),
        },
      ]
    : [];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '10px 14px',
          borderBottom: '1px solid var(--md-border)',
          background: 'rgba(128,128,128,0.04)',
          borderRadius: '8px 8px 0 0',
        }}
      >
        <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--md-text)', letterSpacing: '0.3px' }}>
          {folderPath
            ? folderPath.split(/[/\\]/).pop() || folderPath
            : t('sidebar.folderSection')}
        </span>
        <div style={{ display: 'flex', gap: 6 }}>
          {folderPath ? (
            <>
              <FileAddOutlined
                style={{ fontSize: 14, cursor: 'pointer', color: 'var(--md-text)', opacity: 0.7, transition: 'opacity 0.15s' }}
                onMouseEnter={(e) => { e.currentTarget.style.opacity = '1'; }}
                onMouseLeave={(e) => { e.currentTarget.style.opacity = '0.7'; }}
                onClick={() => handleNewFile(folderPath)}
                title={t('tree.newFile')}
              />
              <FolderAddOutlined
                style={{ fontSize: 14, cursor: 'pointer', color: 'var(--md-text)', opacity: 0.7, transition: 'opacity 0.15s' }}
                onMouseEnter={(e) => { e.currentTarget.style.opacity = '1'; }}
                onMouseLeave={(e) => { e.currentTarget.style.opacity = '0.7'; }}
                onClick={() => handleNewFolder(folderPath)}
                title={t('tree.newFolder')}
              />
              <CloseOutlined
                style={{ fontSize: 13, cursor: 'pointer', color: 'var(--md-text)', opacity: 0.5, transition: 'opacity 0.15s' }}
                onMouseEnter={(e) => { e.currentTarget.style.opacity = '1'; }}
                onMouseLeave={(e) => { e.currentTarget.style.opacity = '0.5'; }}
                onClick={clearFolder}
                title={t('sidebar.closeFolder')}
              />
            </>
          ) : (
            <FolderAddOutlined
              style={{ fontSize: 15, cursor: 'pointer', color: 'var(--md-text)', opacity: 0.7, transition: 'opacity 0.15s' }}
              onMouseEnter={(e) => { e.currentTarget.style.opacity = '1'; }}
              onMouseLeave={(e) => { e.currentTarget.style.opacity = '0.7'; }}
              onClick={handleOpenFolder}
              title={t('sidebar.openFolder')}
            />
          )}
        </div>
      </div>
      <div style={{ flex: 1, overflow: 'auto' }}>
        {folderPath ? (
          <div ref={ctxMenuRef}>
            <Dropdown
              menu={{ items: ctxMenuItems }}
              trigger={['contextMenu']}
              open={!!ctxMenu}
              onOpenChange={(open) => { if (!open) closeCtxMenu(); }}
            >
              <Tree
                showIcon
                treeData={convertToTreeData(folderTree)}
                defaultExpandAll
                onSelect={handleSelect}
                onRightClick={handleRightClick}
                style={{ background: 'transparent', color: 'var(--md-text)', fontSize: 13, padding: '4px 4px' }}
              />
            </Dropdown>
          </div>
        ) : (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              height: '100%',
              minHeight: 80,
              color: 'var(--md-text)',
              opacity: 0.35,
              fontSize: 12,
              cursor: 'pointer',
              transition: 'opacity 0.15s',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.opacity = '0.6'; }}
            onMouseLeave={(e) => { e.currentTarget.style.opacity = '0.35'; }}
            onClick={handleOpenFolder}
          >
            <FolderOpenOutlined style={{ fontSize: 28, marginBottom: 8 }} />
            <span>{t('sidebar.openFolderHint')}</span>
          </div>
        )}
      </div>
    </div>
  );
}
