# Plan 可视化功能 - 动态架构分析方案

## 整体工作流

```
Claude Code 中调用 /plan-viz
    ↓
调用 Claude Code API 分析当前对话中的 plan
    ↓
生成 JSON 架构文件（保存到项目目录）
    ↓
桌面应用读取 JSON 文件
    ↓
可视化展示架构图
```

---

## 核心设计

### 1. 架构文件格式 (JSON)

```json
{
  "planName": "plan-name",
  "generatedAt": "2025-03-15T10:30:00Z",
  "architecture": {
    "root": {
      "name": "项目名称",
      "type": "project",
      "description": "项目描述",
      "children": [
        {
          "name": "模块1",
          "type": "module",
          "description": "模块描述",
          "files": ["file1.ts", "file2.ts"]
        }
      ]
    }
  },
  "summary": "一句话项目简介"
}
```

### 2. 文件存储位置

- 项目目录：`{projectDir}/.claude/architectures/{plan-name}.json`
- 如果是全局 plan：存储在 `~/.claude/architectures/{plan-name}.json`

### 3. 桌面应用集成

- 在 PlansPage 中，点击 plan 时检查是否有对应的架构文件
- 如果有，显示"查看架构"按钮
- 点击后在新窗口中打开架构图

---

## 实现方案

### Part 1: Claude Code 端 - Slash Command

**文件**: `~/.claude/commands/plan-viz.md`

```markdown
# Plan Architecture Analyzer
分析当前 plan 并生成项目架构 JSON 文件

## 使用方式
/plan-viz
/plan-viz --project

## 说明
分析当前对话中的 plan 内容，生成结构化的架构分析 JSON 文件。
文件将保存到项目的 .claude/architectures/ 目录下。
```

**实现逻辑**:
1. 读取当前对话上下文中的 plan 内容
2. 调用 Claude 分析架构（使用 API 或 prompt）
3. 生成 JSON 文件
4. 返回文件路径

### Part 2: 桌面应用端 - 架构服务

**新建文件**: `src/main/services/ArchitectureService.ts`

```typescript
class ArchitectureService {
  // 列出架构文件
  async listArchitectures(projectDir?: string): Promise<ArchitectureInfo[]>

  // 读取架构文件
  async readArchitecture(projectDir: string, planName: string): Promise<Architecture | null>

  // 删除架构文件
  async deleteArchitecture(projectDir: string, planName: string): Promise<void>

  // 查找关联的架构文件
  async findArchitectureForPlan(planName: string): Promise<Architecture | null>
}
```

### Part 3: IPC 通道

**修改文件**: `src/shared/ipc-channels.ts`

```typescript
// Architecture
ARCHITECTURE_LIST: "architecture:list"
ARCHITECTURE_READ: "architecture:read"
```

### Part 4: 桌面应用 - 可视化展示

**修改**: PlansPage
- 点击 plan 时检查是否有对应架构文件
- 显示"架构图"按钮（如果有对应文件）
- 点击打开新窗口展示架构图

**新建**: 简化版架构图组件
- 不需要复杂的 Flowchart
- 使用简单的树形结构展示
- 每个节点显示：名称、类型、描述

---

## 关键文件清单

### 新建文件
| 文件路径 | 说明 |
|---------|------|
| `~/.claude/commands/plan-viz.md` | Slash Command 定义 |
| `src/main/services/ArchitectureService.ts` | 架构文件服务 |
| `src/renderer/components/plan/ArchitectureTree.tsx` | 简化版架构树组件 |

### 修改文件
| 文件路径 | 修改内容 |
|---------|---------|
| `src/shared/ipc-channels.ts` | 添加架构 IPC 通道 |
| `src/preload/index.ts` | 暴露架构 API |
| `src/main/ipc/registerHandlers.ts` | 注册架构处理器 |
| `src/renderer/pages/PlansPage.tsx` | 添加架构查看入口 |

---

## 实现步骤

### Step 1: 创建 ArchitectureService
1. 创建 `ArchitectureService.ts`
2. 实现文件读写逻辑
3. 定义 JSON 数据结构

### Step 2: 添加 IPC 通道
1. 在 `ipc-channels.ts` 添加通道
2. 在 `preload/index.ts` 暴露方法
3. 在 `registerHandlers.ts` 注册处理器

### Step 3: 创建架构树组件
1. 创建 `ArchitectureTree.tsx`
2. 简化版的树形展示
3. 适合展示 JSON 架构数据

### Step 4: 修改 PlansPage
1. 检查 plan 对应的架构文件
2. 添加"架构图"按钮
3. 点击打开新窗口

### Step 5: 创建 Slash Command (用户手动创建)
1. 指导用户创建 `~/.claude/commands/plan-viz.md`

---

## 预期效果

1. 在 Claude Code 中输入 `/plan-viz`
2. Claude Code 分析当前 plan，生成 JSON 文件
3. 在桌面应用的 PlansPage 中
4. 点击有对应架构文件的 plan
5. 点击"架构图"按钮
6. 在新窗口中展示架构树
