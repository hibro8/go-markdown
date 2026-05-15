import { create } from 'zustand';

export type Locale = 'en' | 'zh';

type Messages = Record<string, string>;

const en: Messages = {
  'app.title': 'Go Markdown',
  'app.empty': 'Open a Markdown file to get started',
  'sidebar.files': 'Files',
  'sidebar.noFiles': 'No files opened',
  'sidebar.settings': 'Settings',
  'sidebar.openFile': 'Open File',
  'sidebar.removeFile': 'Remove from list',
  'sidebar.folderSection': 'Folder',
  'sidebar.openFolder': 'Open Folder',
  'sidebar.openFolderHint': 'Open a folder',
  'sidebar.closeFolder': 'Close folder',
  'sidebar.recentFiles': 'Recent Files',
  'tray.showWindow': 'Show Window',
  'tray.quit': 'Quit',
  'tray.tooltip': 'Go Markdown',
  'settings.title': 'Settings',
  'settings.darkMode': 'Dark Mode',
  'settings.language': 'Language',
  'settings.language.zh': '中文',
  'settings.language.en': 'English',
  'settings.tray': 'System Tray',
  'settings.autoStart': 'Launch at Startup',
  'settings.autoStart.desc': 'Automatically start when you log in',
  'settings.version': 'Go Markdown v0.1.0',
  'reader.edit': 'Edit',
  'reader.editing': 'Editing',
  'reader.unsaved': 'Unsaved changes',
  'reader.save': 'Save (Ctrl+S)',
  'reader.closeEditor': 'Close editor',
  'reader.saveSuccess': 'File saved successfully',
  'reader.saveFailed': 'Failed to save file',
  'reader.saveAndClose': 'Save and Close',
  'tab.pin': 'Pin',
  'tab.unpin': 'Unpin',
  'tab.close': 'Close',
  'tab.closeLeft': 'Close tabs to the left',
  'tab.closeRight': 'Close tabs to the right',
  'tab.closeOthers': 'Close other tabs',
  'tab.closeAll': 'Close all tabs',
  'tree.newFile': 'New File',
  'tree.newFolder': 'New Folder',
  'tree.delete': 'Delete',
  'settings.clearCache': 'Clear Cache',
  'settings.clearCache.desc': 'Delete all stored data and restart',
  'settings.clearCache.confirm': 'This will delete all data and restart the app. Continue?',
  'settings.clearCache.success': 'Cache cleared. Restarting...',
};

const zh: Messages = {
  'app.title': 'Go Markdown',
  'app.empty': '打开一个 Markdown 文件开始阅读',
  'sidebar.files': '文件',
  'sidebar.noFiles': '未打开文件',
  'sidebar.settings': '设置',
  'sidebar.openFile': '打开文件',
  'sidebar.removeFile': '从列表移除',
  'sidebar.folderSection': '文件夹',
  'sidebar.openFolder': '打开文件夹',
  'sidebar.openFolderHint': '打开一个文件夹',
  'sidebar.closeFolder': '关闭文件夹',
  'sidebar.recentFiles': '最近文件',
  'tray.showWindow': '显示窗口',
  'tray.quit': '退出',
  'tray.tooltip': 'Go Markdown',
  'settings.title': '设置',
  'settings.darkMode': '暗黑模式',
  'settings.language': '语言',
  'settings.language.zh': '中文',
  'settings.language.en': 'English',
  'settings.tray': '系统托盘',
  'settings.autoStart': '开机启动',
  'settings.autoStart.desc': '登录时自动启动',
  'settings.version': 'Go Markdown v0.1.0',
  'reader.edit': '编辑',
  'reader.editing': '编辑中',
  'reader.unsaved': '未保存',
  'reader.save': '保存 (Ctrl+S)',
  'reader.closeEditor': '关闭编辑器',
  'reader.saveSuccess': '保存成功',
  'reader.saveFailed': '保存失败',
  'reader.saveAndClose': '保存并关闭',
  'tab.pin': '固定',
  'tab.unpin': '取消固定',
  'tab.close': '关闭',
  'tab.closeLeft': '关闭左侧标签页',
  'tab.closeRight': '关闭右侧标签页',
  'tab.closeOthers': '关闭其它标签页',
  'tab.closeAll': '关闭所有标签页',
  'tree.newFile': '新建文件',
  'tree.newFolder': '新建文件夹',
  'tree.delete': '删除',
  'settings.clearCache': '清除缓存',
  'settings.clearCache.desc': '删除所有存储数据并重启',
  'settings.clearCache.confirm': '将删除所有数据并重启应用，确定继续？',
  'settings.clearCache.success': '缓存已清除，正在重启...',
};

const messages: Record<Locale, Messages> = { en, zh };

interface I18nState {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: string) => string;
}

export const useI18n = create<I18nState>((set, get) => ({
  locale: 'zh',
  setLocale: (locale: Locale) => set({ locale }),
  t: (key: string) => messages[get().locale]?.[key] ?? key,
}));

// Standalone t function for use outside React
export function tStatic(locale: Locale, key: string): string {
  return messages[locale]?.[key] ?? key;
}
