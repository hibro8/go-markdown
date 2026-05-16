import { useEffect, useRef, useCallback } from 'react';
import { useTabStore } from '../stores/tabStore';
import { useFileStore } from '../stores/fileStore';
import { useSettingsStore } from '../stores/settingsStore';
import { DBService, FileService, MarkdownService, SettingsService } from '../services/api';
import type { TabRecord } from '@/types';

const DB_DEBOUNCE = 300;

export function usePersistence() {
  const restoring = useRef(false);
  const saveTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

  const persistAll = useCallback(async () => {
    const { tabs, activeTabId } = useTabStore.getState();
    const { fileList, folderPath, folderTree } = useFileStore.getState();
    const { theme, language, sidebarSplitRatio } = useSettingsStore.getState();

    const records: TabRecord[] = tabs.map((t, i) => ({
      filePath: t.filePath,
      fileName: t.fileName,
      mode: t.mode,
      isDirty: t.isDirty,
      pinned: t.pinned,
      tabOrder: i,
    }));

    console.log('[persist] saving:', {
      tabCount: records.length,
      activeTabId,
      fileListLen: fileList.length,
      folderPath,
      theme,
      language,
    });

    try {
      await Promise.all([
        DBService.SaveTabs(records),
        activeTabId
          ? DBService.SaveState('active_tab_id', activeTabId)
          : Promise.resolve(),
        DBService.SaveFileList(fileList),
        folderPath
          ? DBService.SaveFolderState(folderPath, JSON.stringify(folderTree))
          : Promise.resolve(),
        DBService.SaveState('theme', theme),
        DBService.SaveState('language', language),
        DBService.SaveState('sidebar_split_ratio', String(sidebarSplitRatio)),
      ]);
      console.log('[persist] save complete');
    } catch (e) {
      console.error('[persist] save failed:', e);
    }
  }, []);

  const schedulePersist = useCallback(() => {
    if (restoring.current) return;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      persistAll();
    }, DB_DEBOUNCE);
  }, [persistAll]);

  // Force-sync persist on unload (no debounce)
  useEffect(() => {
    const onUnload = () => persistAll();
    window.addEventListener('beforeunload', onUnload);
    return () => window.removeEventListener('beforeunload', onUnload);
  }, [persistAll]);

  // --- LOAD state from DB on mount ---
  useEffect(() => {
    (async () => {
      restoring.current = true;
      try {
        console.log('[persist] loading app state...');
        const state = await DBService.LoadAppState();
        console.log('[persist] loaded:', state);
        if (!state) {
          console.log('[persist] DB empty, trying SettingsService...');
          try {
            const settings = await SettingsService.Load();
            if (settings) {
              useSettingsStore.getState().setSettings(settings);
            }
          } catch { /* */ }
          return;
        }

        if (state.theme) {
          useSettingsStore.getState().setTheme(state.theme as 'light' | 'dark');
        }
        if (state.language) {
          useSettingsStore.getState().setLanguage(state.language as 'en' | 'zh');
        }

        // Restore sidebar split ratio
        try {
          const ratioStr = await DBService.GetState('sidebar_split_ratio');
          if (ratioStr) {
            const ratio = parseFloat(ratioStr);
            if (ratio >= 0.15 && ratio <= 0.85) {
              useSettingsStore.getState().setSidebarSplitRatio(ratio);
            }
          }
        } catch { /* ignore */ }

        // trayEnabled / autoStart are only stored in the Go settings file,
        // not in SQLite — always sync them from SettingsService.
        {
          try {
            const settings = await SettingsService.Load();
            if (settings) {
              if (!state.theme && settings.theme) {
                useSettingsStore.getState().setTheme(settings.theme);
              }
              if (!state.language && settings.language) {
                useSettingsStore.getState().setLanguage(settings.language);
              }
              if (settings.trayEnabled !== undefined) {
                useSettingsStore.getState().setTrayEnabled(settings.trayEnabled);
              }
              if (settings.autoStart !== undefined) {
                useSettingsStore.getState().setAutoStart(settings.autoStart);
              }
            }
          } catch { /* */ }
        }

        if (state.fileList?.length) {
          useFileStore.getState().setFileList(state.fileList);
        }

        if (state.folderPath) {
          try {
            const tree = JSON.parse(state.folderTree || '[]');
            useFileStore.getState().setFolder(state.folderPath, tree);
          } catch { /* ignore corrupt tree */ }
        }

        if (state.tabs?.length) {
          console.log('[persist] restoring tabs:', state.tabs.length);
          for (const tr of state.tabs) {
            try {
              const info = await FileService.GetFileInfo(tr.filePath);
              if (!info?.exists) continue;
              const markdown = await FileService.ReadFile(tr.filePath);
              const result = await MarkdownService.Parse(markdown);
              useTabStore.getState().openTab({
                id: tr.filePath,
                filePath: tr.filePath,
                fileName: tr.fileName,
                markdown,
                html: result?.html ?? '',
                mode: (tr.mode as 'reading' | 'editing') || 'reading',
                isDirty: false,
                metadata: result?.metadata ?? {},
                pinned: tr.pinned,
                scrollPosition: 0,
              });
            } catch {
              // File gone or unreadable — skip
            }
          }
        }

        if (state.activeTabId) {
          useTabStore.getState().setActiveTab(state.activeTabId);
        }
        console.log('[persist] restore complete');
      } catch (e) {
        console.error('[persist] load failed:', e);
      } finally {
        restoring.current = false;
      }
    })();

    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, []);

  // --- PERSIST: subscribe to all stores ---
  useEffect(() => {
    console.log('[persist] setting up subscriptions');

    const unsubTab = useTabStore.subscribe(() => {
      console.log('[persist] tabStore changed');
      schedulePersist();
    });
    const unsubFile = useFileStore.subscribe(() => {
      console.log('[persist] fileStore changed');
      schedulePersist();
    });
    const unsubSettings = useSettingsStore.subscribe(() => {
      console.log('[persist] settingsStore changed');
      schedulePersist();
    });

    return () => {
      unsubTab();
      unsubFile();
      unsubSettings();
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, [schedulePersist]);
}

export async function clearAllCache() {
  try {
    await DBService.ClearAll();
  } catch (e) {
    console.error('[persist] clearAllCache failed:', e);
  }
  useTabStore.getState().closeAllTabs();
  useFileStore.getState().clearFolder();
  useFileStore.getState().setFileList([]);
  window.location.reload();
}
