# Go Markdown

跨平台桌面 Markdown 阅读器和编辑器，基于 Wails v3 + Go + React 19 + Ant Design 6。

A cross-platform desktop Markdown reader and editor built with Wails v3, Go, React 19, and Ant Design 6.

---

## 功能

- **Chrome 风格多标签页** — 拖拽排序、固定标签、右键菜单（关闭左侧/右侧/其他/全部）
- **阅读 + 编辑双模式** — 纯净阅读视图 + Monaco Editor 分屏编辑实时预览
- **Markdown 编辑工具栏** — 编辑模式下 16 个快捷按钮（粗体、斜体、标题、列表、链接、表格等），选中文本自动包裹
- **可拖拽分割线** — 侧边栏文件夹/文件列表上下分割 + 编辑模式左右面板分割，比例自动记忆
- **滚动位置保持** — 切换阅读/编辑模式时自动保存并恢复滚动位置
- **左侧文件树** — 打开文件夹递归展示所有 .md 文件，支持新建/删除/重命名
- **明暗主题** — 手动切换或跟随系统
- **中英双语** — 完整 i18n 支持
- **系统托盘** — 关闭窗口隐藏到托盘，可设置是否启用
- **单实例** — 双击 .md 文件自动复用已有窗口
- **文件关联** — `--install` / `--uninstall` 注册/取消 .md 文件类型关联
- **NSIS 安装包** — 标准 Windows 安装向导，支持自定义目录、快捷方式、文件关联
- **状态持久化** — JSON 文件自动保存标签页、文件夹、主题、窗口位置等状态

## 技术栈

| 层 | 技术 |
|---|---|
| 桌面框架 | Wails v3 (WebView2/Cocoa/GTK) |
| 后端 | Go 1.26 |
| Markdown 引擎 | goldmark (GFM + highlight + emoji + meta) |
| 前端 | React 19 + TypeScript |
| UI 组件 | Ant Design 6 |
| 编辑器 | Monaco Editor |
| 状态管理 | Zustand |
| 持久化 | JSON File (pure Go) |
| 构建 | Vite + wails3 build |

## 项目结构

```
.
├── main.go                    # 应用入口，窗口/托盘管理
├── installer/
│   ├── go-markdown.nsi         # NSIS 安装脚本
│   ├── build.ps1               # 一键构建脚本
│   └── LICENSE.txt             # MIT 许可
├── services/
│   ├── file_service.go        # 文件 CRUD、目录遍历、监听
│   ├── markdown_service.go    # goldmark 解析
│   ├── settings_service.go    # 持久化设置读写
│   ├── db_service.go          # JSON File 状态存储
│   └── install_service.go     # 文件关联注册（Windows）
├── pkg/
│   ├── icon/                  # 应用图标（embed markdown.png）
│   ├── single/                # 单实例 TCP IPC
│   └── settings/              # 设置数据结构
└── frontend/
    └── src/
        ├── components/        # React 组件
        │   ├── layout/        # AppLayout
        │   ├── reader/        # ReaderView, EditView
        │   ├── preview/       # MarkdownPreview
        │   ├── sidebar/       # FileList, FolderSection
        │   ├── tabs/          # TabBar
        │   └── settings/      # SettingsDrawer
        ├── stores/            # Zustand stores
        ├── hooks/             # usePersistence
        ├── i18n/              # 中英文翻译
        ├── styles/            # 全局样式
        └── types/             # TypeScript 类型定义
```

## 截图

| | | |
|---|---|---|
| ![demo1](demo/demo1.png) | ![demo2](demo/demo2.png) | ![demo3](demo/demo3.png) |

## 快速开始

**前置要求**: Go 1.23+, Node.js 20+, wails3 CLI

```bash
# 安装 Wails CLI
go install github.com/wailsapp/wails/v3/cmd/wails3@latest

# 克隆项目
git clone <repo-url>
cd go-markdown

# 开发模式（热重载）
wails3 dev

# 构建
wails3 build
# 输出: bin/go-markdown.exe (Windows)
```

## 构建 Windows 安装包

**前置要求**: Go 1.23+, Node.js 20+, [NSIS 3.x](https://nsis.sourceforge.io/Download)

```powershell
# 一键构建（前端 + Go 二进制 + NSIS 安装包）
.\installer\build.ps1

# 或分步执行：
cd frontend && npm run build && cd ..          # 1. 构建前端
go build -ldflags="-H windowsgui -s -w" -o bin/go-markdown.exe  # 2. 构建 Go
cd installer && makensis go-markdown.nsi && cd ..  # 3. 构建安装包

# 输出: bin/GoMarkdown-Setup.exe
```

安装包特点：
- MUI2 现代安装向导（中英双语自适应）
- 自定义安装目录（默认 `C:\Program Files\GoMarkdown`）
- 可选组件：开始菜单快捷方式 / 桌面快捷方式 / .md 文件关联
- 自动注册到 Windows 添加/删除程序，支持标准卸载
- 文件关联自动备份恢复

## 许可

MIT License
