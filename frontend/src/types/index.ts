export interface FileNode {
  name: string;
  path: string;
  isDir: boolean;
  size: number;
  modTime: string;
  children?: FileNode[];
}

export interface FileInfo {
  name: string;
  path: string;
  size: number;
  modTime: string;
  isDir: boolean;
  exists: boolean;
}

export interface TabData {
  id: string;
  filePath: string;
  fileName: string;
  markdown: string;
  html: string;
  mode: 'reading' | 'editing';
  isDirty: boolean;
  metadata: Record<string, unknown>;
  pinned: boolean;
  scrollPosition: number;
}

export interface ParseResult {
  html: string;
  metadata: Record<string, unknown>;
}

export interface AppSettings {
  theme: 'light' | 'dark';
  language: 'en' | 'zh';
  trayEnabled: boolean;
  autoStart: boolean;
  windowWidth: number;
  windowHeight: number;
  windowX: number;
  windowY: number;
  openTabs: TabSnapshot[];
  lastOpenFolder: string;
}

export interface TabSnapshot {
  filePath: string;
  scrollPosition: number;
}

export interface TabRecord {
  filePath: string;
  fileName: string;
  mode: string;
  isDirty: boolean;
  pinned: boolean;
  tabOrder: number;
}

export interface AppState {
  fileList: string[];
  tabs: TabRecord[];
  activeTabId: string;
  folderPath: string;
  folderTree: string;
  theme: string;
  language: string;
}
