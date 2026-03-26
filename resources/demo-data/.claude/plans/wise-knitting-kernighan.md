# Plan: 创建文档网站生成 Skill

## 目标
创建一个全局可用的 Claude Code skill，参照 Repo-Pulse 项目的文档架构模式，每次用户想制作文档网站时自动生成类似结构的项目。

## 用户选择
- 使用范围: 通用（适用于任何项目的文档网站）
- 多语言支持: 可选（用户调用时决定）
- 存放位置: `~/.claude/skills/doc-site-generator/`

## Repo-Pulse 项目架构总结（作为模板参照）

### 技术栈
- **框架**: React 19 + TypeScript + Vite
- **UI 组件**: shadcn/ui (Radix UI 原语)
- **样式**: Tailwind CSS 3 + CSS 变量主题系统
- **图标**: lucide-react

### 核心架构模式
1. **App 入口** (`App.tsx`): LanguageProvider 包裹 → Header + Sidebar + Content 三栏布局
2. **Header** (`Header.tsx`): 固定顶部导航栏，含搜索（⌘K）、语言切换、外部链接
3. **Sidebar** (`Sidebar.tsx`): 固定左侧导航，支持嵌套菜单项（NavItem 含 children）
4. **Content** (`Content.tsx`): 根据 `activeSection` 状态切换渲染不同 Section 组件
5. **Section 组件** (`sections/*.tsx`): 每个大章节一个组件，内部通过 `activeSubsection` 切换子内容
6. **搜索对话框** (`SearchDialog.tsx`): Cmd+K 触发的搜索功能
7. **国际化** (`LanguageContext.tsx`): 简单的 key-value 翻译字典，支持中英文
8. **CSS 变量主题** (`index.css`): HSL 色彩变量，支持 light/dark 模式

### 关键 UI 模式
- Badge + Card 组合展示功能特性
- 图标 + 标题 + 描述的三段式卡片
- 表格展示功能清单
- 带编号的步骤流程
- Grid 响应式布局 (1-3 列)
- ScrollArea 内容滚动

## 需要创建的文件

### 1. `~/.claude/skills/doc-site-generator/SKILL.md`
Skill 主文件，包含：
- frontmatter: name, description
- 使用说明和工作流程指引
- 详细的架构模式参考
- 生成步骤指南

### 2. `~/.claude/skills/doc-site-generator/references/architecture.md`
参考文件，包含：
- 完整的项目结构模板
- 关键组件的代码模式/模板
- Tailwind CSS 变量配置
- shadcn/ui 组件使用规范

### 3. `~/.claude/skills/doc-site-generator/references/patterns.md`
参考文件，包含：
- Section 组件的编写模式
- 国际化实现模式
- 搜索功能实现模式
- 常用 UI 组合模式（卡片网格、功能列表、步骤流程等）

## 实施步骤

1. 创建 `~/.claude/skills/doc-site-generator/` 目录
2. 编写 `SKILL.md` — 核心 skill 文件，包含触发条件、工作流程和核心指引
3. 编写 `references/architecture.md` — 项目结构和基础配置参考
4. 编写 `references/patterns.md` — UI 模式和组件模式参考
