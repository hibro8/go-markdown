import { create } from 'zustand';
import type { AppSettings } from '@/types';

interface SettingsState {
  theme: 'light' | 'dark';
  language: 'en' | 'zh';
  trayEnabled: boolean;
  autoStart: boolean;
  windowWidth: number;
  windowHeight: number;
  windowX: number;
  windowY: number;
  openTabs: AppSettings['openTabs'];
  lastOpenFolder: string;
  settingsOpen: boolean;
  loading: boolean;
  setTheme: (theme: 'light' | 'dark') => void;
  setLanguage: (lang: 'en' | 'zh') => void;
  setTrayEnabled: (enabled: boolean) => void;
  setAutoStart: (enabled: boolean) => void;
  toggleSettingsPanel: () => void;
  setSettings: (settings: AppSettings) => void;
}

export const useSettingsStore = create<SettingsState>((set) => ({
  theme: 'light',
  language: 'zh',
  trayEnabled: false,
  autoStart: false,
  windowWidth: 1280,
  windowHeight: 800,
  windowX: 0,
  windowY: 0,
  openTabs: [],
  lastOpenFolder: '',
  settingsOpen: false,
  loading: false,

  setTheme: (theme: 'light' | 'dark') => set({ theme }),
  setLanguage: (language: 'en' | 'zh') => set({ language }),
  setTrayEnabled: (trayEnabled: boolean) => set({ trayEnabled }),
  setAutoStart: (autoStart: boolean) => set({ autoStart }),
  toggleSettingsPanel: () => set((s) => ({ settingsOpen: !s.settingsOpen })),
  setSettings: (settings: AppSettings) => set({ ...settings, loading: false }),
}));
