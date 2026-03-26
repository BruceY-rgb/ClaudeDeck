# 实现计划：侧边栏工作流日志视图

## 目标
在 CodeGuide 侧边栏中添加一个"工作流日志"区域，实时显示 AI Agent 的工作过程。

## 当前架构
- `GuideSession` - 工作流编排器
- `ClaudeClient` - AI API 调用
- `SidebarProvider` - Webview 侧边栏

## 实现步骤

### 1. 扩展消息类型 (types/index.ts)
添加工作流日志消息类型：
```typescript
type ExtensionMessage =
  | { type: 'workflowLog'; level: 'info' | 'ai' | 'success' | 'error'; message: string; timestamp: string }
  // ... 现有类型
```

### 2. 创建 WorkflowLogger 服务 (vscode/WorkflowLogger.ts)
- 新的 `WorkflowLogger` 类
- 提供 `log()` 方法，发送日志到 webview
- 自动添加时间戳
- 支持不同级别：info（系统）、ai（AI交互）、success（完成）、error（错误）

### 3. 集成到 GuideSession
在每个关键步骤添加日志：
- `startGuide()` - 开始引导
- 项目扫描阶段 - "正在扫描项目..."
- AI 调用阶段 - "正在请求 AI 生成学习路径..."
- 文件分析阶段 - "正在分析文件..."
- 步骤执行 - "正在解释代码..."

### 4. 修改 SidebarProvider Webview UI
在现有 HTML 中添加日志区域：
- 左侧：现有的解释内容
- 右侧（或底部）：工作流日志面板
- 使用不同颜色区分日志级别：
  - 蓝色：系统信息
  - 紫色：AI 交互
  - 绿色：成功
  - 红色：错误

### 5. 显示内容
- 发送的提示词（摘要）
- AI 返回的状态
- 当前进度

## 需要修改的文件
1. `src/types/index.ts` - 添加消息类型
2. `src/vscode/WorkflowLogger.ts` - 新建日志服务
3. `src/vscode/GuideSession.ts` - 集成日志调用
4. `src/vscode/views/SidebarProvider.ts` - 添加日志 UI

## 预期效果
用户在侧边栏可以实时看到：
```
[12:30:15] 🔵 开始引导学习
[12:30:16] 🔵 正在扫描项目结构...
[12:30:18] 🔵 找到 23 个 TypeScript 文件
[12:30:20] 🟣 → 正在请求 AI 生成学习路径...
[12:30:45] 🟢 ← AI 返回学习路径（3个阶段）
[12:30:46] 🔵 正在分析文件: src/extension.ts
[12:30:48] 🟣 → 正在请求 AI 解释代码...
```
