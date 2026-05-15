import { create } from 'zustand';
import type { FileNode } from '@/types';
import { FileService } from '../services/api';

interface FileState {
  // Folder section (top)
  folderPath: string | null;
  folderTree: FileNode[];
  setFolder: (path: string, tree: FileNode[]) => void;
  clearFolder: () => void;
  refreshTree: () => Promise<void>;

  // File list section (middle)
  fileList: string[];
  addFile: (path: string) => void;
  removeFile: (path: string) => void;
  setFileList: (paths: string[]) => void;
}

export const useFileStore = create<FileState>((set, get) => ({
  folderPath: null,
  folderTree: [],

  setFolder: (path, tree) => set({ folderPath: path, folderTree: tree }),
  clearFolder: () => set({ folderPath: null, folderTree: [] }),
  refreshTree: async () => {
    const { folderPath } = get();
    if (!folderPath) return;
    const tree = await FileService.ListFiles(folderPath);
    set({ folderTree: tree || [] });
  },

  fileList: [],

  addFile: (path) =>
    set((state) => {
      if (state.fileList.includes(path)) return state;
      return { fileList: [...state.fileList, path] };
    }),

  removeFile: (path) =>
    set((state) => ({
      fileList: state.fileList.filter((f) => f !== path),
    })),

  setFileList: (paths) => set({ fileList: paths }),
}));
