import { useState, useCallback, useRef } from 'react';
import { Dropdown } from 'antd';
import type { MenuProps } from 'antd';
import { CloseOutlined, PushpinFilled } from '@ant-design/icons';
import { useTabStore } from '../../stores/tabStore';
import { useI18n } from '../../i18n';

export default function TabBar() {
  const { t } = useI18n();
  const tabs = useTabStore((s) => s.tabs);
  const activeTabId = useTabStore((s) => s.activeTabId);
  const setActiveTab = useTabStore((s) => s.setActiveTab);
  const closeTab = useTabStore((s) => s.closeTab);
  const closeAllTabs = useTabStore((s) => s.closeAllTabs);
  const closeTabsToLeft = useTabStore((s) => s.closeTabsToLeft);
  const closeTabsToRight = useTabStore((s) => s.closeTabsToRight);
  const closeOtherTabs = useTabStore((s) => s.closeOtherTabs);
  const pinTab = useTabStore((s) => s.pinTab);
  const reorderTabs = useTabStore((s) => s.reorderTabs);

  const [contextTabId, setContextTabId] = useState<string | null>(null);
  const dragIdRef = useRef<string | null>(null);
  const dragOverIdxRef = useRef<number | null>(null);

  const contextTab = contextTabId ? tabs.find((t) => t.id === contextTabId) : null;

  const buildContextMenu = useCallback((): MenuProps['items'] => {
    if (!contextTab) return [];
    const isPinned = contextTab.pinned;
    const unpinnedCount = tabs.filter((t) => !t.pinned).length;
    const idx = tabs.findIndex((t) => t.id === contextTab.id);
    const hasLeftUnpinned = tabs.slice(0, idx).some((t) => !t.pinned);
    const hasRightUnpinned = tabs.slice(idx + 1).some((t) => !t.pinned);

    return [
      {
        key: 'pin',
        label: isPinned ? t('tab.unpin') : t('tab.pin'),
        onClick: () => {
          if (isPinned) {
            // Unpin: set pinned=false
            useTabStore.getState().updateTabContent(contextTab.id, { pinned: false });
          } else {
            pinTab(contextTab.id);
          }
        },
      },
      { type: 'divider' as const },
      {
        key: 'close',
        label: t('tab.close'),
        disabled: isPinned,
        onClick: () => closeTab(contextTab.id),
      },
      {
        key: 'closeLeft',
        label: t('tab.closeLeft'),
        disabled: !hasLeftUnpinned,
        onClick: () => closeTabsToLeft(contextTab.id),
      },
      {
        key: 'closeRight',
        label: t('tab.closeRight'),
        disabled: !hasRightUnpinned,
        onClick: () => closeTabsToRight(contextTab.id),
      },
      {
        key: 'closeOthers',
        label: t('tab.closeOthers'),
        disabled: unpinnedCount <= 1,
        onClick: () => closeOtherTabs(contextTab.id),
      },
      { type: 'divider' as const },
      {
        key: 'closeAll',
        label: t('tab.closeAll'),
        disabled: unpinnedCount === 0,
        onClick: () => closeAllTabs(),
      },
    ];
  }, [contextTab, tabs, t, closeTab, closeTabsToLeft, closeTabsToRight, closeOtherTabs, closeAllTabs, pinTab]);

  // Drag and drop
  const handleDragStart = useCallback((tabId: string) => {
    dragIdRef.current = tabId;
  }, []);

  const handleDragOver = useCallback(
    (e: React.DragEvent, idx: number) => {
      e.preventDefault();
      dragOverIdxRef.current = idx;
    },
    []
  );

  const handleDrop = useCallback(() => {
    const fromId = dragIdRef.current;
    const toIdx = dragOverIdxRef.current;
    if (fromId && toIdx !== null) {
      const fromIdx = tabs.findIndex((t) => t.id === fromId);
      if (fromIdx !== -1 && fromIdx !== toIdx) {
        reorderTabs(fromIdx, toIdx);
      }
    }
    dragIdRef.current = null;
    dragOverIdxRef.current = null;
  }, [tabs, reorderTabs]);

  if (tabs.length === 0) return null;

  return (
    <div
      style={{
        display: 'flex',
        background: 'var(--md-code-bg)',
        borderBottom: '1px solid var(--md-border)',
        overflowX: 'auto',
        overflowY: 'hidden',
        flexShrink: 0,
        height: 36,
        scrollbarWidth: 'thin',
      }}
    >
      {tabs.map((tab, idx) => {
        const isActive = tab.id === activeTabId;
        const isPinned = tab.pinned;
        return (
          <Dropdown
            key={tab.id}
            menu={{ items: buildContextMenu() }}
            trigger={['contextMenu']}
            onOpenChange={(open) => {
              if (open) setContextTabId(tab.id);
              else setContextTabId(null);
            }}
          >
            <div
              draggable
              onDragStart={() => handleDragStart(tab.id)}
              onDragOver={(e) => handleDragOver(e, idx)}
              onDrop={handleDrop}
              onClick={() => setActiveTab(tab.id)}
              title={tab.filePath}
              style={{
                display: 'flex',
                alignItems: 'center',
                padding: isPinned ? '0 10px' : '0 12px',
                height: '100%',
                minWidth: isPinned ? 40 : 100,
                maxWidth: isPinned ? 40 : 200,
                cursor: 'pointer',
                fontSize: 13,
                color: isActive ? 'var(--md-link)' : 'var(--md-text)',
                background: isActive ? 'var(--md-bg)' : 'transparent',
                borderRight: '1px solid var(--md-border)',
                borderBottom: isActive ? '2px solid var(--md-link)' : 'none',
                userSelect: 'none',
                gap: 6,
                flexShrink: 0,
                transition: 'background 0.1s',
              }}
            >
              {isPinned ? (
                <PushpinFilled
                  style={{ fontSize: 13, color: 'var(--md-link)', flexShrink: 0 }}
                />
              ) : (
                <>
                  <span
                    style={{
                      flex: 1,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {tab.isDirty ? '• ' : ''}
                    {tab.fileName}
                  </span>
                  <CloseOutlined
                    style={{
                      fontSize: 11,
                      opacity: 0.5,
                      flexShrink: 0,
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      closeTab(tab.id);
                    }}
                  />
                </>
              )}
            </div>
          </Dropdown>
        );
      })}
    </div>
  );
}
