import { useState, useEffect, useCallback } from 'react';
import { FileOutlined, CloseOutlined, ExclamationCircleOutlined } from '@ant-design/icons';
import { useFileStore } from '../../stores/fileStore';
import { useTabStore } from '../../stores/tabStore';
import { useI18n } from '../../i18n';
import { FileService, MarkdownService } from '../../services/api';

export default function FileList() {
  const { t } = useI18n();
  const fileList = useFileStore((s) => s.fileList);
  const removeFile = useFileStore((s) => s.removeFile);
  const openTab = useTabStore((s) => s.openTab);
  const closeTab = useTabStore((s) => s.closeTab);
  const activeTabId = useTabStore((s) => s.activeTabId);
  const [missingFiles, setMissingFiles] = useState<Set<string>>(new Set());

  useEffect(() => {
    // Check all files exist, silently remove missing ones
    const checkFiles = async () => {
      const missing: string[] = [];
      for (const path of fileList) {
        try {
          const info = await FileService.GetFileInfo(path);
          if (!info.exists) missing.push(path);
        } catch {
          missing.push(path);
        }
      }
      if (missing.length > 0) {
        setMissingFiles((prev) => {
          const next = new Set(prev);
          missing.forEach((p) => next.add(p));
          return next;
        });
      }
    };
    if (fileList.length > 0) checkFiles();
  }, [fileList]);

  const handleClick = useCallback(
    async (filePath: string) => {
      if (missingFiles.has(filePath)) {
        removeFile(filePath);
        closeTab(filePath);
        return;
      }
      try {
        const info = await FileService.GetFileInfo(filePath);
        if (!info.exists) {
          setMissingFiles((prev) => new Set(prev).add(filePath));
          removeFile(filePath);
          closeTab(filePath);
          return;
        }
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
        setMissingFiles((prev) => new Set(prev).add(filePath));
        removeFile(filePath);
        closeTab(filePath);
      }
    },
    [missingFiles, removeFile, closeTab, openTab]
  );

  const handleRemove = useCallback(
    (e: React.MouseEvent, filePath: string) => {
      e.stopPropagation();
      removeFile(filePath);
      closeTab(filePath);
    },
    [removeFile, closeTab]
  );

  // Auto-clean: if a file is in tabs but not in fileList, it wasn't added by us
  // When file is removed from list, close its tab (handled above)

  if (fileList.length === 0) {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100%',
          minHeight: 60,
          color: 'var(--md-text)',
          opacity: 0.35,
          fontSize: 12,
        }}
      >
        {t('sidebar.noFiles')}
      </div>
    );
  }

  return (
    <div style={{ padding: '4px 6px' }}>
      {fileList.map((filePath) => {
        const name = filePath.split(/[/\\]/).pop() || filePath;
        const isMissing = missingFiles.has(filePath);
        const isActive = activeTabId === filePath;

        return (
          <div
            key={filePath}
            onClick={() => handleClick(filePath)}
            style={{
              display: 'flex',
              alignItems: 'center',
              padding: '7px 10px',
              marginBottom: 2,
              borderRadius: 6,
              cursor: isMissing ? 'default' : 'pointer',
              background: isActive ? 'rgba(9,105,218,0.12)' : 'transparent',
              color: isActive ? '#0969da' : 'var(--md-text)',
              opacity: isMissing ? 0.4 : 1,
              fontSize: 13,
              userSelect: 'none',
              transition: 'background 0.12s',
            }}
            onMouseEnter={(e) => {
              if (!isActive) e.currentTarget.style.background = 'rgba(128,128,128,0.08)';
            }}
            onMouseLeave={(e) => {
              if (!isActive) e.currentTarget.style.background = 'transparent';
            }}
            title={filePath}
          >
            {isMissing ? (
              <ExclamationCircleOutlined style={{ marginRight: 8, fontSize: 14, color: '#faad14', flexShrink: 0 }} />
            ) : (
              <FileOutlined style={{ marginRight: 8, fontSize: 14, opacity: isActive ? 1 : 0.55, color: isActive ? '#0969da' : undefined, flexShrink: 0 }} />
            )}
            <span
              style={{
                flex: 1,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {name}
            </span>
            <CloseOutlined
              style={{
                fontSize: 10,
                cursor: 'pointer',
                opacity: isActive ? 0.45 : 0.2,
                padding: 4,
                flexShrink: 0,
                borderRadius: 4,
                transition: 'opacity 0.15s, background 0.15s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.opacity = '0.7';
                e.currentTarget.style.background = 'rgba(128,128,128,0.15)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.opacity = '0.25';
                e.currentTarget.style.background = 'transparent';
              }}
              onClick={(e) => handleRemove(e, filePath)}
              title={t('sidebar.removeFile')}
            />
          </div>
        );
      })}
    </div>
  );
}
