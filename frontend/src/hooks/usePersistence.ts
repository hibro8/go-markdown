import { useEffect, useRef } from 'react';
import { useTabStore } from '../stores/tabStore';
import { useFileStore } from '../stores/fileStore';
import { useSettingsStore } from '../stores/settingsStore';
import { DBService, FileService, MarkdownService, SettingsService } from '../services/api';
import type { TabRecord } from '@/types';

const DB_DEBOUNCE = 500;

export function usePersistence() {
  const restoring = useRef(false);
  const saveTimer = useRef<ReturnType<typeof setTimeout>>();

  const persistAll = async () => {
    const { tabs, activeTabId } = useTabStore.getState();
    const { fileList, folderPath, folderTree } = useFileStore.getState();
    const { theme, language } = useSettingsStore.getState();

    const records: TabRecord[] = tabs.map((t, i) => ({
      filePath: t.filePath,
      fileName: t.fileName,
      mode: t.mode,
      isDirty: t.isDirty,
      pinned: t.pinned,
      tabOrder: i,
    }));

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
      ]);
    } catch (e) {
      console.error('persistAll failed:', e);
    }
  };

  const schedulePersist = () => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      if (restoring.current) return;
      persistAll();
    }, DB_DEBOUNCE);
  };

  // --- LOAD state from DB on mount ---
  useEffect(() => {
    (async () => {
      restoring.current = true;
      try {
        const state = await DBService.LoadAppState();
        if (!state) {
          // DB empty — try loading settings from SettingsService as fallback
          try {
            const settings = await SettingsService.Load();
            if (settings) {
              useSettingsStore.getState().setSettings(settings);
            }
          } catch { /* */ }
          return;
        }

        // Restore theme & language (DB takes priority)
        if (state.theme) {
          useSettingsStore.getState().setTheme(state.theme as 'light' | 'dark');
        }
        if (state.language) {
          useSettingsStore.getState().setLanguage(state.language as 'en' | 'zh');
        }

        // If DB had no theme/lang, fall back to SettingsService
        if (!state.theme || !state.language) {
          try {
            const settings = await SettingsService.Load();
            if (settings) {
              if (!state.theme && settings.theme) {
                useSettingsStore.getState().setTheme(settings.theme);
              }
              if (!state.language && settings.language) {
                useSettingsStore.getState().setLanguage(settings.language);
              }
            }
          } catch { /* */ }
        }

        // Restore file list
        if (state.fileList?.length) {
          useFileStore.getState().setFileList(state.fileList);
        }

        // Restore folder
        if (state.folderPath) {
          try {
            const tree = JSON.parse(state.folderTree || '[]');
            useFileStore.getState().setFolder(state.folderPath, tree);
          } catch { /* ignore corrupt tree */ }
        }

        // Restore tabs — re-read file content and re-parse
        if (state.tabs?.length) {
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
              });
            } catch {
              // File gone or unreadable — skip
            }
          }
        }

        // Restore active tab
        if (state.activeTabID) {
          useTabStore.getState().setActiveTab(state.activeTabID);
        }
      } catch (e) {
        console.error('Failed to load app state:', e);
      } finally {
        restoring.current = false;
      }
    })();

    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, []);

  // --- PERSIST: subscribe to all stores, save everything on any change ---
  useEffect(() => {
    const unsubTab = useTabStore.subscribe(() => {
      if (restoring.current) return;
      schedulePersist();
    });
    const unsubFile = useFileStore.subscribe(() => {
      if (restoring.current) return;
      schedulePersist();
    });
    const unsubSettings = useSettingsStore.subscribe(() => {
      if (restoring.current) return;
      schedulePersist();
    });

    return () => {
      unsubTab();
      unsubFile();
      unsubSettings();
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, []);
}

export async function clearAllCache() {
  try {
    await DBService.ClearAll();
  } catch (e) {
    console.error('clearAllCache failed:', e);
  }
  useTabStore.getState().closeAllTabs();
  useFileStore.getState().clearFolder();
  useFileStore.getState().setFileList([]);
  window.location.reload();
}
