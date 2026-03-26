# CodeGuide - 引导式代码讲解 VS Code 插件

## 产品定位

一个 VS Code 插件，通过 **AI 引导 + 代码跳转 + 实时对齐** 的方式，帮助程序员系统、有条理、完整地理解陌生代码库。

**核心差异化**：
- 不是输出大段文字让用户自己读，而是**工具控制节奏**
- 每次**跳转到代码的特定位置**，在上下文中进行讲解
- 支持**自动引导**和**手动提问**混合模式
- 在编辑器中**高亮代码段**，在侧边栏展示讲解内容

## 技术栈

- TypeScript + VS Code Extension API
- @anthropic-ai/sdk (Claude API)
- Webview (侧边栏 UI)
- globby (文件扫描)

## 已完成的可复用模块

```
src/types/index.ts          # 类型定义 ✅
src/utils/fileUtils.ts      # 文件工具 ✅
src/ai/ClaudeClient.ts      # Claude API 客户端 ✅
src/ai/prompts/system.ts    # 系统 Prompt ✅ (需改为输出结构化 JSON)
src/ai/prompts/explain.ts   # 讲解 Prompt ✅
src/ai/prompts/learn.ts     # 学习路径 Prompt ✅
src/ai/prompts/chat.ts      # 聊天 Prompt ✅
```

---

## 项目结构（VS Code 插件化）

```
codeguide/
├── src/
│   ├── extension.ts                    # 插件入口 (activate/deactivate)
│   │
│   ├── core/                           # 核心逻辑（复用）
│   │   ├── scanner/
│   │   │   ├── ProjectScanner.ts       # 项目扫描
│   │   │   └── FileAnalyzer.ts         # 文件分析
│   │   ├── context/
│   │   │   └── ContextManager.ts       # 上下文管理
│   │   └── explainer/
│   │       ├── ExplainerEngine.ts      # 讲解引擎
│   │       └── LearningPathPlanner.ts  # 学习路径规划
│   │
│   ├── ai/                             # AI 层（复用）
│   │   ├── ClaudeClient.ts
│   │   └── prompts/
│   │       ├── system.ts
│   │       ├── explain.ts
│   │       ├── learn.ts
│   │       └── chat.ts
│   │
│   ├── vscode/                         # VS Code 集成层（新增）
│   │   ├── commands/                   # 命令注册
│   │   │   ├── startGuide.ts           # 开始引导式学习
│   │   │   ├── explainFile.ts          # 讲解当前文件
│   │   │   ├── explainSelection.ts     # 讲解选中代码
│   │   │   └── askQuestion.ts          # 提问
│   │   ├── views/
│   │   │   ├── SidebarProvider.ts      # 侧边栏 Webview 提供者
│   │   │   ├── LearningPathView.ts     # 学习路径 TreeView
│   │   │   └── webview/               # Webview HTML/CSS/JS
│   │   │       ├── index.html
│   │   │       ├── main.js
│   │   │       └── styles.css
│   │   ├── editor/
│   │   │   ├── CodeHighlighter.ts      # 代码高亮装饰器
│   │   │   ├── CodeNavigator.ts        # 代码跳转控制器
│   │   │   └── CodeLensProvider.ts     # CodeLens 提供者
│   │   └── GuideSession.ts            # 引导会话管理器
│   │
│   ├── utils/
│   │   └── fileUtils.ts
│   │
│   └── types/
│       └── index.ts
│
├── package.json                        # VS Code 扩展清单
├── tsconfig.json
└── .vscodeignore
```

---

## 实现步骤

### Step 1: 将项目转为 VS Code Extension

- 修改 `package.json`：添加 VS Code extension 配置（activationEvents, contributes）
- 修改 `tsconfig.json`：调整编译目标
- 创建 `src/extension.ts` 插件入口
- 删除 CLI 相关文件（src/cli/）
- 安装 `@types/vscode`

**修改文件**: `package.json`, `tsconfig.json`
**新建文件**: `src/extension.ts`
**删除文件**: `src/cli/` 目录, `src/utils/formatter.ts`

### Step 2: 创建项目扫描器

- `src/core/scanner/ProjectScanner.ts`
- `src/core/scanner/FileAnalyzer.ts`

### Step 3: Prompt 改造（输出结构化 JSON）

讲解 Prompt 需要返回结构化数据，包含：
- 讲解步骤列表（每步对应一个代码位置 + 讲解内容）
- 每个步骤包含：文件路径、起始行、结束行、讲解文本

修改 `src/ai/prompts/system.ts` 和 `src/ai/prompts/explain.ts`

### Step 4: 侧边栏 Webview

- `src/vscode/views/SidebarProvider.ts` - Webview 提供者
- `src/vscode/views/webview/` - 前端界面

侧边栏显示：
1. 当前讲解步骤的内容（Markdown 渲染）
2. 进度指示器（步骤 3/10）
3. 底部操作栏：「继续」「上一步」「提问」「退出」

### Step 5: 代码跳转与高亮

- `src/vscode/editor/CodeHighlighter.ts` - 高亮当前讲解的代码段
- `src/vscode/editor/CodeNavigator.ts` - 自动打开文件跳转到指定行

### Step 6: 引导会话管理

- `src/vscode/GuideSession.ts` - 核心控制器

流程：
1. 用户触发"开始引导" → 扫描项目 → 生成学习路径
2. AI 分析第一个文件 → 返回讲解步骤列表
3. 执行第一步：打开文件 → 跳转行号 → 高亮代码 → 侧边栏显示讲解
4. 用户点击"继续" → 下一步（可能跳转到同文件的另一段，或另一个文件）
5. 用户点击"提问" → 切换到问答模式
6. 讲完一个文件 → 标记完成 → 自动进入下一个

### Step 7: 命令注册

- `src/vscode/commands/startGuide.ts`
- `src/vscode/commands/explainFile.ts`
- `src/vscode/commands/explainSelection.ts`
- `src/vscode/commands/askQuestion.ts`

### Step 8: CodeLens 集成

- `src/vscode/editor/CodeLensProvider.ts`
- 在每个函数/类定义上方显示"CodeGuide: 讲解这个"

### Step 9: 学习路径 TreeView

- `src/vscode/views/LearningPathView.ts`
- 在侧边栏显示学习路径树，可点击跳转

### Step 10: 打包发布

- 配置 `.vscodeignore`
- 使用 `@vscode/vsce` 打包
- 发布到 VS Code Marketplace

---

## 核心交互流程

```
用户触发 "CodeGuide: 开始引导式学习"
  ↓
[扫描项目] → 生成 ProjectMetadata
  ↓
[AI 生成学习路径] → LearningPath (3-5 阶段, 每阶段 2-5 文件)
  ↓
[侧边栏显示学习路径] + [展示项目概览]
  ↓
自动开始第一阶段
  ↓
[AI 分析文件] → 返回 ExplainStep[] (每步 = 代码位置 + 讲解)
  ↓
┌─ 循环每个步骤 ─────────────────────────┐
│  1. 打开文件、跳转到指定行               │
│  2. 高亮相关代码段（黄色背景）           │
│  3. 侧边栏显示讲解内容                   │
│  4. 等待用户操作：                       │
│     - [继续] → 下一步                    │
│     - [提问] → 进入问答模式              │
│     - [跳过] → 下一个文件                │
│     - [退出] → 结束引导                  │
└──────────────────────────────────────────┘
```

## 关键类型补充

```typescript
// 讲解步骤（AI 返回的结构化数据）
interface ExplainStep {
  file: string;         // 文件路径
  startLine: number;    // 高亮起始行
  endLine: number;      // 高亮结束行
  title: string;        // 步骤标题
  content: string;      // Markdown 讲解内容
  codeSnippet?: string; // 关键代码片段
}

// 引导式讲解结果
interface GuidedExplanation {
  overview: string;           // 文件概述
  steps: ExplainStep[];       // 分步讲解
  summary: string;            // 总结
  suggestedQuestions: string[]; // 建议提问
}
```
