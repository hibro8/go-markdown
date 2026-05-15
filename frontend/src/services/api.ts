import { ListFiles, ReadFile, SaveFile, GetFileInfo, GetFilesInDir, OpenFile, OpenFolder, CreateFolder, CreateFile, DeleteFile } from '@/bindings/go-markdown/services/fileservice';
import { Parse, ParseFile } from '@/bindings/go-markdown/services/markdownservice';
import { Load, Save, UpdateTheme, UpdateTrayEnabled, UpdateAutoStart, UpdateLanguage } from '@/bindings/go-markdown/services/settingsservice';
import { LoadAppState, SaveFileList, GetFileList, SaveTabs, GetTabs, SaveState, GetState, SaveSetting, GetSetting, SaveJSON, GetJSON, SaveFolderState, GetFolderState, ClearAll, Shutdown } from '@/bindings/go-markdown/services/dbservice';
import type { FileNode, FileInfo, ParseResult, AppSettings, AppState, TabRecord } from '@/types';

function unwrap<T>(p: Promise<T | null>): Promise<T> {
  return p.then((r) => {
    if (r === null || r === undefined) throw new Error('Service returned null');
    return r as T;
  });
}

export const FileService = {
  ListFiles: (rootPath: string) => unwrap<FileNode[]>(ListFiles(rootPath) as Promise<FileNode[] | null>),
  ReadFile: (path: string) => unwrap<string>(ReadFile(path) as Promise<string | null>),
  SaveFile: (path: string, content: string) => SaveFile(path, content),
  GetFileInfo: (path: string) => unwrap<FileInfo>(GetFileInfo(path) as Promise<FileInfo | null>),
  GetFilesInDir: (dirPath: string) => unwrap<FileNode[]>(GetFilesInDir(dirPath) as Promise<FileNode[] | null>),
  OpenFile: () => unwrap<string>(OpenFile() as Promise<string | null>),
  OpenFolder: () => unwrap<string>(OpenFolder() as Promise<string | null>),
  CreateFolder: (parentPath: string, name: string) => unwrap<string>(CreateFolder(parentPath, name) as Promise<string>),
  CreateFile: (dirPath: string, name: string) => unwrap<string>(CreateFile(dirPath, name) as Promise<string>),
  DeleteFile: (path: string) => DeleteFile(path),
};

export const MarkdownService = {
  Parse: (raw: string) => unwrap<ParseResult>(Parse(raw) as Promise<ParseResult | null>),
  ParseFile: (filePath: string) => unwrap<ParseResult>(ParseFile(filePath) as Promise<ParseResult | null>),
};

export const SettingsService = {
  Load: () => unwrap<AppSettings>(Load() as Promise<AppSettings | null>),
  Save: (settings: AppSettings) => Save(settings),
  UpdateTheme: (theme: string) => UpdateTheme(theme),
  UpdateTrayEnabled: (enabled: boolean) => UpdateTrayEnabled(enabled),
  UpdateAutoStart: (enabled: boolean) => UpdateAutoStart(enabled),
  UpdateLanguage: (lang: string) => UpdateLanguage(lang),
};

export const DBService = {
  LoadAppState: () => unwrap<AppState>(LoadAppState() as Promise<AppState | null>),
  SaveFileList: (paths: string[]) => SaveFileList(paths),
  GetFileList: () => unwrap<string[]>(GetFileList() as Promise<string[]>),
  SaveTabs: (tabs: TabRecord[]) => SaveTabs(tabs),
  GetTabs: () => unwrap<TabRecord[]>(GetTabs() as Promise<TabRecord[]>),
  SaveState: (key: string, value: string) => SaveState(key, value),
  GetState: (key: string) => unwrap<string>(GetState(key) as Promise<string>),
  SaveSetting: (key: string, value: string) => SaveSetting(key, value),
  GetSetting: (key: string) => unwrap<string>(GetSetting(key) as Promise<string>),
  SaveJSON: (key: string, v: any) => SaveJSON(key, v),
  GetJSON: (key: string, v: any) => GetJSON(key, v),
  SaveFolderState: (folderPath: string, treeJSON: string) => SaveFolderState(folderPath, treeJSON),
  GetFolderState: () => GetFolderState() as Promise<[string, string]>,
  ClearAll: () => ClearAll(),
  Shutdown: () => Shutdown(),
};
