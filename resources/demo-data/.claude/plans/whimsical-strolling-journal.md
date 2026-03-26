# ReadCode - 产品规划文档

> AI 驱动的交互式代码学习桌面工具，用结构化路径引导开发者从零理解任意代码库。

---

## 一、产品定位与差异化

### 1.1 一句话定位

**ReadCode** 是一款独立桌面应用，通过 AI 自动生成结构化学习路径，以"阶段→文件→步骤"的层级引导开发者沉浸式理解任意代码库。

### 1.2 竞品差异

| 工具 | 定位 | 与 ReadCode 的本质差异 |
|------|------|----------------------|
| Cursor / Windsurf | AI 辅助**写**代码 | 目标是写代码，不是理解代码，没有结构化学习路径 |
| GitHub Copilot | 行级补全 + Chat | 被动响应，没有主动引导式教学 |
| Sourcegraph | 代码搜索与导航 | 纯静态分析，没有 AI 解释能力 |
| CodeTour (VSCode) | 手动录制代码 Tour | 需人工录制，不是 AI 自动生成 |

**ReadCode 的三大核心差异化：**

1. **结构化学习路径自动生成** — AI 主动规划"阶段→文件→步骤"的教学大纲，而不只是回答问题
2. **代码定位驱动的解释** — 每一步解释精确绑定到代码行号，配合编辑器高亮和跳转，"看着代码学"
3. **学习进度系统** — 阶段完成度追踪、可随时继续的持久化会话，将一次性 AI 对话变成可追踪的学习过程

### 1.3 目标用户

| 优先级 | 用户 | 场景 | 价值 |
|-------|------|------|-----|
| P0 | 个人开发者 | 接手新项目、学习开源代码 | 把 3 天代码通读缩短到 3 小时 |
| P1 | 团队 Tech Lead | 新人 onboarding | 自动生成代码库导览，替代手动 Code Tour |
| P1 | 编程教师/学习者 | 交互式教学 | 比文档更有沉浸感的学习体验 |
| P2 | 技术文档工程师 | 代码库知识沉淀 | AI 生成 + 人工标注的活文档 |

---

## 二、核心功能设计

### 2.1 功能蓝图

```
ReadCode
├── 核心功能层（从 CodeGuide 插件继承并增强）
│   ├── AI 学习路径生成
│   ├── 步骤式代码解释（行号绑定 + 高亮）
│   ├── 上下文感知 Chat（流式输出）
│   └── 函数/类即时解释
│
├── UI/UX 增强（脱离 VSCode 后的释放）
│   ├── 三栏布局：导航 + 代码 + 解释
│   ├── 全宽解释面板（不再受侧边栏 300px 限制）
│   ├── 代码关系可视化（依赖图、调用图）
│   └── 学习进度可视化时间线
│
├── 高级功能
│   ├── 笔记/标注系统
│   ├── 学习进度持久化 + 多项目管理
│   ├── 导出学习笔记（Markdown/PDF）
│   └── 详细度级别 UI 控制（Level 1-4）
│
└── 团队功能（远期）
    ├── 共享学习路径
    ├── 团队标注与讨论
    └── Onboarding 模板
```

### 2.2 主界面布局

```
+--------------------------------------------------------------+
| Toolbar: [Open Project] [Settings] [API Config]    [Export]  |
+------+----------------------------+--------------------------+
|      |                            |                          |
| Nav  |     Code Editor            |   Explanation Panel      |
| Tree |     (Monaco Editor)        |   (Rich Markdown)        |
|      |                            |                          |
| Phase|   代码高亮 + 行号跳转       |   步骤标题 + 步骤编号     |
| 1    |   minimap                  |   格式化内容              |
|  F1  |                            |   代码片段可点击跳转      |
|  F2  |                            |   推荐提问                |
| Phase|                            |                          |
| 2    |                            |   ---- Chat Area ----    |
|  F3  |                            |   流式输出 AI 回答        |
|  F4  |                            |   [输入框...]             |
|      +----------------------------+--------------------------+
| Prog |  Step 3/8  [< Prev] [Next >] [Skip File] [Stop]      |
+------+----------------------------+--------------------------+
| Workflow Log (可折叠)                                         |
+--------------------------------------------------------------+
```

**关键 UI 增强点：**

1. **解释面板全宽** — 从 300px 侧边栏扩展到 400-600px，可容纳代码片段、图表、Mermaid 图
2. **编辑器-解释联动** — 点击解释中的代码片段，左侧编辑器自动跳转高亮
3. **导航树增强** — 进度环、展开动画、完成状态图标（不再受 VSCode TreeView 限制）
4. **浮动解释卡片** — 悬停函数/变量名弹出即时解释（替代 CodeLens）
5. **全屏可视化模式** — 切换查看代码依赖关系图

### 2.3 可视化能力

**文件依赖关系图：**
- 数据源：复用 FileAnalyzer 已有的 imports/exports 提取能力
- 渲染：`@xyflow/react`（React Flow），支持拖拽、缩放、自定义节点
- 交互：点击节点跳转文件，当前学习文件高亮

**学习路径时间线：**
- 横向时间线，阶段为节点，内含文件卡片
- 已完成部分颜色填充，当前位置动画指示

### 2.4 笔记/标注系统

```typescript
interface CodeAnnotation {
  id: string;
  projectPath: string;
  filePath: string;
  startLine: number;
  endLine: number;
  content: string;           // Markdown
  type: 'note' | 'question' | 'insight' | 'todo';
  tags: string[];
  linkedStepId?: string;     // 关联学习步骤
  createdAt: string;
}
```

- 选中代码范围 → 右键 "Add Note"
- 代码左侧 gutter 显示标注图标
- 解释面板可查看当前文件所有笔记
- 可导出为 Markdown

### 2.5 项目管理

- 启动页：最近项目卡片列表（进度百分比、上次打开时间）
- 拖拽或文件夹选择器打开新项目
- 学习进度自动保存，关闭后可继续
- 学习路径缓存（避免重复 AI 调用）

---

## 三、技术架构

### 3.1 技术栈

```
Frontend (渲染进程):
  React 18 + TypeScript
  Zustand (状态管理)
  Tailwind CSS + shadcn/ui (UI)
  Monaco Editor (代码编辑)
  @xyflow/react (可视化)
  react-markdown + rehype/remark (Markdown 渲染)
  framer-motion (动画)

Backend (主进程):
  Electron 33+
  Node.js 20+
  better-sqlite3 (本地数据库)

Build:
  electron-vite (Vite 集成)
  electron-builder (打包分发)
  electron-updater (自动更新)
```

### 3.2 主进程/渲染进程职责

```
                        IPC Bridge (contextBridge)
                               |
  +----- Main Process ------+  |  +------ Renderer Process ------+
  |                         |  |  |                               |
  | - File System 操作       |  |  | - React UI 渲染               |
  |   (ProjectScanner)      |<-+->| - Monaco Editor               |
  |   (FileAnalyzer)        |  |  | - 状态管理 (Zustand)          |
  |   (fileUtils)           |  |  | - Markdown 渲染               |
  |                         |  |  | - 可视化图表                   |
  | - AI API 调用            |  |  | - 用户交互                    |
  |   (ClaudeClient)        |  |  |                               |
  |   (含流式输出)           |  |  +-------------------------------+
  |                         |  |
  | - 数据库 (SQLite)        |  |
  | - 窗口/菜单/快捷键      |  |
  | - 自动更新               |  |
  +-------------------------+  |
```

### 3.3 IPC 通道设计

```typescript
interface ElectronAPI {
  project: {
    openFolder(): Promise<string | null>;
    scan(projectPath: string): Promise<ProjectMetadata>;
    analyzeFile(filePath: string): Promise<FileAnalysis>;
    readFile(filePath: string): Promise<string>;
    getRecentProjects(): Promise<ProjectRecord[]>;
  };
  ai: {
    complete(systemPrompt: string, userPrompt: string): Promise<string>;
    stream(systemPrompt: string, userPrompt: string): AsyncIterable<string>;
    getConfig(): Promise<AIClientConfig>;
    updateConfig(config: Partial<AIClientConfig>): Promise<void>;
  };
  store: {
    saveSession(projectId: string, state: GuideSessionState): Promise<void>;
    loadSession(projectId: string): Promise<GuideSessionState | null>;
    saveAnnotations(projectId: string, annotations: CodeAnnotation[]): Promise<void>;
    loadAnnotations(projectId: string): Promise<CodeAnnotation[]>;
  };
  system: {
    getAppVersion(): string;
    openExternal(url: string): Promise<void>;
  };
}
```

### 3.4 数据持久化

```
~/.readcode/
  ├── config.json           # 全局配置（API key, model, UI 偏好）
  └── readcode.db           # SQLite
      ├── projects (id, name, path, type, stack, created_at, last_opened_at)
      ├── learning_paths (id, project_id, phases_json, generated_at)
      ├── sessions (id, project_id, state_json, updated_at)
      ├── annotations (id, project_id, file_path, start_line, end_line, content, type, tags_json)
      └── chat_history (id, project_id, role, content, timestamp)
```

### 3.5 项目目录结构

```
readcode/
├── electron/
│   ├── main.ts                  # Electron 主进程入口
│   ├── preload.ts               # contextBridge
│   └── ipc/
│       ├── project.ts           # 项目管理 IPC handlers
│       ├── ai.ts                # AI 服务 IPC handlers（含流式）
│       ├── store.ts             # 数据存储 IPC handlers
│       └── system.ts            # 系统功能
│
├── src/                         # 渲染进程 (React)
│   ├── App.tsx
│   ├── main.tsx
│   ├── components/
│   │   ├── layout/
│   │   │   ├── AppLayout.tsx    # 三栏布局
│   │   │   ├── Toolbar.tsx
│   │   │   └── StatusBar.tsx
│   │   ├── editor/
│   │   │   ├── CodeEditor.tsx   # Monaco Editor 封装
│   │   │   ├── EditorHighlighter.ts
│   │   │   └── EditorNavigator.ts
│   │   ├── learning/
│   │   │   ├── LearningPathTree.tsx
│   │   │   ├── PhaseCard.tsx
│   │   │   └── ProgressBar.tsx
│   │   ├── explanation/
│   │   │   ├── ExplanationPanel.tsx
│   │   │   ├── StepView.tsx
│   │   │   └── MarkdownRenderer.tsx
│   │   ├── chat/
│   │   │   ├── ChatPanel.tsx
│   │   │   └── ChatMessage.tsx
│   │   ├── visualization/
│   │   │   ├── DependencyGraph.tsx
│   │   │   └── LearningTimeline.tsx
│   │   ├── project/
│   │   │   ├── ProjectSelector.tsx
│   │   │   └── RecentProjects.tsx
│   │   ├── settings/
│   │   │   └── SettingsDialog.tsx
│   │   └── notes/
│   │       ├── NoteEditor.tsx
│   │       └── NoteList.tsx
│   ├── stores/
│   │   ├── guideStore.ts        # 核心学习状态
│   │   ├── projectStore.ts
│   │   ├── editorStore.ts
│   │   └── chatStore.ts
│   └── hooks/
│       ├── useGuideSession.ts
│       ├── useAI.ts
│       └── useAnnotations.ts
│
├── core/                        # 共享核心模块（从 CodeGuide 迁移）
│   ├── ai/
│   │   ├── ClaudeClient.ts      # 直接复用 + 新增 stream()
│   │   └── prompts/
│   │       ├── system.ts        # 直接复用
│   │       ├── explain.ts       # 直接复用
│   │       ├── learn.ts         # 直接复用
│   │       └── chat.ts          # 直接复用
│   ├── scanner/
│   │   ├── ProjectScanner.ts    # 直接复用
│   │   └── FileAnalyzer.ts      # 直接复用
│   ├── session/
│   │   ├── GuideSessionCore.ts  # 从 GuideSession.ts 提取纯业务逻辑
│   │   └── JsonParser.ts        # 从 GuideSession.ts 提取 JSON 解析
│   ├── types/
│   │   ├── index.ts             # 清理后的核心类型
│   │   ├── ipc.ts               # IPC 类型
│   │   └── annotations.ts       # 笔记类型
│   └── utils/
│       ├── fileUtils.ts         # 直接复用
│       └── configReader.ts      # 直接复用
│
├── package.json
├── electron.vite.config.ts
├── tsconfig.json
└── tailwind.config.ts
```

---

## 四、现有代码迁移策略

### 4.1 直接复用（零修改或极少修改）— 约 1342 行

| 原文件 | 行数 | 说明 |
|--------|-----|------|
| `src/ai/ClaudeClient.ts` | 176 | 纯 fetch，无 VSCode 依赖。需新增 stream() |
| `src/core/scanner/ProjectScanner.ts` | 173 | 纯 Node.js fs + globby |
| `src/core/scanner/FileAnalyzer.ts` | 207 | 纯 Node.js fs + 正则 |
| `src/ai/prompts/system.ts` | 60 | 纯字符串模板 |
| `src/ai/prompts/explain.ts` | 216 | 纯函数 |
| `src/ai/prompts/learn.ts` | 74 | 纯函数 |
| `src/ai/prompts/chat.ts` | 61 | 纯函数 |
| `src/utils/fileUtils.ts` | 158 | 纯 Node.js |
| `src/utils/configReader.ts` | 65 | 纯 Node.js |
| `src/types/index.ts` | 152 | 删除 WebviewMessage/ExtensionMessage，新增 IPC 类型 |

### 4.2 拆分重构 — GuideSession.ts（718 行）

这是迁移的核心难点。需拆为两层：

**GuideSessionCore（纯业务逻辑，约 400 行可提取）：**
- `resolveFilePath()` — 纯工具函数
- `parseJsonResponse()` + `fixIncompleteJson()` — 纯数据处理
- `formatJsonResponse()` — 纯数据处理
- `startGuide()` 核心流程（scan → analyze → AI call → parse path）
- `nextStep/previousStep/nextFile/previousFile/nextPhase/previousPhase` — 纯状态操作
- `askQuestion()` 核心逻辑
- `explainFile()` / `explainSelection()` 核心逻辑

**需要剥离的 VSCode 依赖：**
- `vscode.window.withProgress` → React 加载状态
- `vscode.workspace.getConfiguration` → Electron 配置读取
- `vscode.workspace.fs` → Node.js fs
- `vscode.EventEmitter` → Zustand 状态更新
- `_webviewView.webview.postMessage` → React 状态 + IPC

### 4.3 完全重写（用 React 组件替代）

| 原文件 | 行数 | 新实现 |
|--------|-----|--------|
| `SidebarProvider.ts` | 1131 | React 组件体系（ExplanationPanel, StepView, ChatPanel 等） |
| `LearningPathView.ts` | 151 | React 树形组件 + shadcn/ui |
| `CodeHighlighter.ts` | 100 | Monaco `deltaDecorations` API 映射（API 几乎 1:1） |
| `CodeNavigator.ts` | 95 | Monaco `revealRangeInCenter` + `setPosition` |
| `CodeLensProvider.ts` | 126 | Monaco CodeLens provider 或 hover widget |
| `WorkflowLogger.ts` | 112 | console.log + Zustand 状态 |
| `extension.ts` | 121 | Electron main.ts + React App.tsx |

### 4.4 Monaco Editor API 映射

```
VSCode API                          → Monaco Editor API
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
createTextEditorDecorationType      → editor.deltaDecorations
editor.revealRange(range, InCenter) → editor.revealRangeInCenter(range)
editor.selection = new Selection    → editor.setPosition(pos)
vscode.Position                     → monaco.Position
vscode.Range                        → monaco.Range
CodeLensProvider                    → monaco.languages.registerCodeLensProvider
```

高亮样式直接迁移：`backgroundColor: 'rgba(255, 213, 79, 0.15)'` + 左侧 3px 金色边框。

---

## 五、分阶段实施路线

### Phase 1: MVP — 核心功能迁移

**目标**：Electron + React 重现 CodeGuide 插件的全部核心功能，加上流式输出。

**Step 1: 项目脚手架 + 核心模块迁移**
- `electron-vite` 创建项目（Electron + React + TypeScript）
- 配置 Tailwind CSS + shadcn/ui
- 复制 `core/` 可复用模块（约 1342 行，零修改）
- 从 GuideSession.ts 提取 GuideSessionCore
- 搭建 IPC 通道（preload.ts + handlers）
- 设置 Zustand stores

**Step 2: Monaco Editor 集成 + 代码导航**
- `@monaco-editor/react` 集成
- EditorHighlighter（从 CodeHighlighter 映射）
- EditorNavigator（从 CodeNavigator 映射）
- 文件打开和切换

**Step 3: UI 组件开发**
- AppLayout（三栏可调整布局）
- LearningPathTree（学习路径导航）
- ExplanationPanel + StepView + MarkdownRenderer
- ChatPanel（含流式输出显示）
- ProgressBar + WorkflowLog
- Toolbar 和导航按钮

**Step 4: 集成联调**
- SettingsDialog（API 配置）
- ProjectSelector（项目选择启动页）
- ClaudeClient.stream() 实现
- useGuideSession hook
- 端到端测试：打开项目 → 生成路径 → 步骤导航 → 聊天

**MVP 验收标准：**
- [x] 打开任意项目文件夹
- [x] AI 自动生成学习路径（流式反馈进度）
- [x] 按步骤浏览，Monaco Editor 自动跳转高亮
- [x] 解释面板正确渲染 Markdown
- [x] AI 聊天流式输出
- [x] 学习进度正确追踪

### Phase 2: UI/UX 打磨 + 数据持久化

- 深浅色主题
- 快捷键系统（Ctrl+N 下一步，Ctrl+P 上一步等）
- 面板拖拽调整大小
- 编辑器-解释面板联动滚动
- 解释面板代码片段可点击跳转
- 动画和过渡（framer-motion）
- SQLite 数据库集成
- 多项目管理（启动页 + 最近项目）
- 学习进度保存/恢复
- 学习路径缓存
- 聊天历史持久化
- Markdown/PDF 导出

### Phase 3: 高级功能

- 文件依赖关系图（@xyflow/react）
- 学习路径可视化时间线
- 全屏可视化模式
- 笔记/标注系统（代码行内标注、编辑器 gutter 图标、标签搜索）
- 详细度级别 UI 控制（Level 1-4）
- 多模型支持配置界面
- 增强 FileAnalyzer（函数级调用关系）

### Phase 4: 团队/协作（远期）

- 导出/导入学习路径包
- 共享机制
- Onboarding 模板
- 后端服务（可选：云同步）

---

## 六、技术决策总结

| 决策点 | 选择 | 理由 |
|-------|------|------|
| 前端框架 | React 18 | Monaco Editor 生态最好 |
| 状态管理 | Zustand | 轻量、TypeScript 友好 |
| UI 框架 | Tailwind + shadcn/ui | 开发快、可定制、组件源码可控 |
| 代码编辑器 | Monaco Editor | VSCode 同源，现有高亮/导航 1:1 映射 |
| 可视化 | @xyflow/react | 最成熟的 React 节点图库 |
| 数据库 | better-sqlite3 | 同步 API + 多项目查询需求 |
| 构建 | electron-vite | HMR 极快，开箱即用 Electron 集成 |
| 打包 | electron-builder | 行业标准，macOS/Windows/Linux |
| Markdown | react-markdown | 替代手写渲染器，插件可扩展 |

## 七、关键风险

1. **Monaco Editor Worker 加载** — `@monaco-editor/react` 的 `loader.config()` 配置 worker 路径
2. **AI JSON 解析失败** — 复用现有 `fixIncompleteJson`（深度括号匹配）+ 3 次重试
3. **Electron 包体积** — asar 打包 + Monaco 按需加载语言
4. **跨平台路径** — 现有代码用 `path.join`，Windows 需测试反斜杠兼容

---

## 八、关键参考文件

以下是实施时需要重点参考的原项目文件：

- `/Users/yangsmac/Desktop/code-with-agent/src/vscode/GuideSession.ts` — 核心中枢（718行），拆分质量决定迁移成败
- `/Users/yangsmac/Desktop/code-with-agent/src/vscode/views/SidebarProvider.ts` — UI 交互蓝图（1131行）
- `/Users/yangsmac/Desktop/code-with-agent/src/types/index.ts` — 类型契约（152行）
- `/Users/yangsmac/Desktop/code-with-agent/src/ai/ClaudeClient.ts` — AI 客户端（176行），需实现 stream()
- `/Users/yangsmac/Desktop/code-with-agent/src/vscode/editor/CodeHighlighter.ts` — 高亮逻辑（100行），Monaco 映射参考
- `/Users/yangsmac/Desktop/code-with-agent/src/vscode/editor/CodeNavigator.ts` — 导航逻辑（95行），Monaco 映射参考
