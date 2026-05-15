declare module '@/bindings/go-markdown/services/fileservice' {
  import type { FileNode, FileInfo } from '@/types';
  import type { CancellablePromise } from '@wailsio/runtime';
  export function ListFiles(rootPath: string): CancellablePromise<FileNode[] | null>;
  export function ReadFile(path: string): CancellablePromise<string | null>;
  export function SaveFile(path: string, content: string): CancellablePromise<void>;
  export function GetFileInfo(path: string): CancellablePromise<FileInfo | null>;
  export function GetFilesInDir(dirPath: string): CancellablePromise<FileNode[] | null>;
  export function OpenFile(): CancellablePromise<string | null>;
  export function OpenMultipleFiles(): CancellablePromise<string[] | null>;
  export function OpenFolder(): CancellablePromise<string | null>;
  export function CreateFolder(parentPath: string, name: string): CancellablePromise<string>;
  export function CreateFile(dirPath: string, name: string): CancellablePromise<string>;
  export function DeleteFile(path: string): CancellablePromise<void>;
}

declare module '@/bindings/go-markdown/services/markdownservice' {
  import type { ParseResult } from '@/types';
  import type { CancellablePromise } from '@wailsio/runtime';
  export function Parse(raw: string): CancellablePromise<ParseResult | null>;
  export function ParseFile(filePath: string): CancellablePromise<ParseResult | null>;
}

declare module '@/bindings/go-markdown/services/dbservice' {
  import type { AppState, TabRecord } from '@/types';
  import type { CancellablePromise } from '@wailsio/runtime';
  export function LoadAppState(): CancellablePromise<AppState | null>;
  export function SaveFileList(paths: string[]): CancellablePromise<void>;
  export function GetFileList(): CancellablePromise<string[]>;
  export function SaveTabs(tabs: TabRecord[]): CancellablePromise<void>;
  export function GetTabs(): CancellablePromise<TabRecord[]>;
  export function SaveState(key: string, value: string): CancellablePromise<void>;
  export function GetState(key: string): CancellablePromise<string>;
  export function SaveSetting(key: string, value: string): CancellablePromise<void>;
  export function GetSetting(key: string): CancellablePromise<string>;
  export function SaveJSON(key: string, v: any): CancellablePromise<void>;
  export function GetJSON(key: string, v: any): CancellablePromise<void>;
  export function SaveFolderState(folderPath: string, treeJSON: string): CancellablePromise<void>;
  export function GetFolderState(): CancellablePromise<[string, string]>;
  export function ClearAll(): CancellablePromise<void>;
  export function Shutdown(): CancellablePromise<void>;
}

declare module '@/bindings/go-markdown/services/settingsservice' {
  import type { AppSettings } from '@/types';
  import type { CancellablePromise } from '@wailsio/runtime';
  export function Load(): CancellablePromise<AppSettings | null>;
  export function Save(settings: AppSettings): CancellablePromise<void>;
  export function UpdateTheme(theme: string): CancellablePromise<void>;
  export function UpdateTrayEnabled(enabled: boolean): CancellablePromise<void>;
  export function UpdateAutoStart(enabled: boolean): CancellablePromise<void>;
  export function UpdateLanguage(lang: string): CancellablePromise<void>;
}
