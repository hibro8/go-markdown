import { create } from 'zustand';
import type { TabData } from '@/types';

interface TabState {
  tabs: TabData[];
  activeTabId: string | null;
  openTab: (tab: TabData) => void;
  closeTab: (tabId: string) => void;
  closeAllTabs: () => void;
  closeTabsToLeft: (tabId: string) => void;
  closeTabsToRight: (tabId: string) => void;
  closeOtherTabs: (tabId: string) => void;
  setActiveTab: (tabId: string) => void;
  updateTabContent: (tabId: string, updates: Partial<TabData>) => void;
  setTabMode: (tabId: string, mode: 'reading' | 'editing') => void;
  pinTab: (tabId: string) => void;
  reorderTabs: (fromIndex: number, toIndex: number) => void;
}

export const useTabStore = create<TabState>((set) => ({
  tabs: [],
  activeTabId: null,

  openTab: (tab) =>
    set((state) => {
      const existing = state.tabs.find((t) => t.id === tab.id);
      if (existing) {
        return { activeTabId: tab.id };
      }
      const newTab = { ...tab, pinned: tab.pinned ?? false };
      // Insert after last pinned tab
      const lastPinnedIdx = state.tabs.reduce(
        (last, t, i) => (t.pinned ? i : last),
        -1
      );
      const newTabs = [...state.tabs];
      newTabs.splice(lastPinnedIdx + 1, 0, newTab);
      return { tabs: newTabs, activeTabId: newTab.id };
    }),

  closeTab: (tabId) =>
    set((state) => {
      const tab = state.tabs.find((t) => t.id === tabId);
      if (tab?.pinned) return state;
      const idx = state.tabs.findIndex((t) => t.id === tabId);
      const newTabs = state.tabs.filter((t) => t.id !== tabId);
      let newActiveId = state.activeTabId;
      if (state.activeTabId === tabId) {
        if (newTabs.length > 0) {
          newActiveId = newTabs[Math.min(idx, newTabs.length - 1)].id;
        } else {
          newActiveId = null;
        }
      }
      return { tabs: newTabs, activeTabId: newActiveId };
    }),

  closeAllTabs: () =>
    set((state) => {
      const pinned = state.tabs.filter((t) => t.pinned);
      const activePinned = state.activeTabId
        ? pinned.find((t) => t.id === state.activeTabId)
        : null;
      return {
        tabs: pinned,
        activeTabId: activePinned ? activePinned.id : pinned[0]?.id ?? null,
      };
    }),

  closeTabsToLeft: (tabId) =>
    set((state) => {
      const idx = state.tabs.findIndex((t) => t.id === tabId);
      if (idx === -1) return state;
      const toKeep = state.tabs.filter((t, i) => {
        if (i >= idx) return true; // right of or at target
        if (t.pinned) return true; // pinned always keep
        return false;
      });
      return { tabs: toKeep };
    }),

  closeTabsToRight: (tabId) =>
    set((state) => {
      const idx = state.tabs.findIndex((t) => t.id === tabId);
      if (idx === -1) return state;
      const toKeep = state.tabs.filter((t, i) => {
        if (i <= idx) return true; // left of or at target
        if (t.pinned) return true; // pinned always keep
        return false;
      });
      // If active tab is being closed, switch to the reference tab
      const activeStillExists = toKeep.some((t) => t.id === state.activeTabId);
      return {
        tabs: toKeep,
        activeTabId: activeStillExists ? state.activeTabId : tabId,
      };
    }),

  closeOtherTabs: (tabId) =>
    set((state) => {
      const tab = state.tabs.find((t) => t.id === tabId);
      if (!tab) return state;
      return {
        tabs: state.tabs.filter(
          (t) => t.id === tabId || t.pinned
        ),
        activeTabId: tabId,
      };
    }),

  setActiveTab: (tabId) => set({ activeTabId: tabId }),

  updateTabContent: (tabId, updates) =>
    set((state) => ({
      tabs: state.tabs.map((t) =>
        t.id === tabId ? { ...t, ...updates } : t
      ),
    })),

  setTabMode: (tabId, mode) =>
    set((state) => ({
      tabs: state.tabs.map((t) =>
        t.id === tabId ? { ...t, mode } : t
      ),
    })),

  pinTab: (tabId) =>
    set((state) => {
      const idx = state.tabs.findIndex((t) => t.id === tabId);
      if (idx === -1) return state;
      const tab = state.tabs[idx];
      const newTabs = state.tabs.filter((t) => t.id !== tabId);
      // Find insertion point: after last pinned
      const lastPinnedIdx = newTabs.reduce(
        (last, t, i) => (t.pinned ? i : last),
        -1
      );
      newTabs.splice(lastPinnedIdx + 1, 0, { ...tab, pinned: true });
      return { tabs: newTabs };
    }),

  reorderTabs: (fromIndex, toIndex) =>
    set((state) => {
      const newTabs = [...state.tabs];
      const [moved] = newTabs.splice(fromIndex, 1);
      newTabs.splice(toIndex, 0, moved);
      return { tabs: newTabs };
    }),
}));
