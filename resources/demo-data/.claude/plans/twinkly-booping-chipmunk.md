# Marketplace 两层浏览 — 深度解析方案

## 问题

`browsePlugins` 扫描目录时只做一层浅扫描，无法区分"分类文件夹"和"真正的 plugin/skill/agent"。导致用户看到的卡片是分类文件夹而非实际可安装的内容。

## 方案概述

在 `MarketplacePlugin` 类型上增加 `isCategory` / `categoryPath` 字段。`browsePlugins` 返回的列表中，分类文件夹标记为 `isCategory: true`。前端点击分类卡片时，调用新的 `browseCategory` IPC 获取该分类下的子内容，支持面包屑导航回退。

## 需要修改的文件（8 个）

1. `src/shared/types/marketplace.ts` — 类型扩展
2. `src/shared/ipc-channels.ts` — 新增 IPC 通道
3. `src/main/services/MarketplaceService.ts` — 核心逻辑改造
4. `src/main/ipc/registerHandlers.ts` — 注册新 handler
5. `src/preload/index.ts` — 暴露新 API
6. `src/renderer/stores/marketplaceStore.ts` — 新增 category 导航状态
7. `src/renderer/components/marketplace/MarketplaceDetail.tsx` — UI 支持分类卡片和面包屑
8. `src/renderer/i18n/locales/{en,zh-CN}.json` — 新增翻译 key

---

## 详细变更

### 1. 类型扩展 — `src/shared/types/marketplace.ts`

`MarketplacePlugin` 新增 3 个可选字段：

```ts
export interface MarketplacePlugin {
  // ... 现有字段 ...
  isCategory?: boolean      // 是否为分类文件夹
  childCount?: number       // 分类下的子项数量
  categoryPath?: string     // 分类目录的绝对路径（用于 drill-down）
}
```

### 2. 新增 IPC 通道 — `src/shared/ipc-channels.ts`

```ts
MARKETPLACE_BROWSE_CATEGORY: "marketplace:browseCategory",
```

### 3. MarketplaceService 改造 — `src/main/services/MarketplaceService.ts`

#### 3a. 将 SKIP 提升为类级常量

```ts
private static readonly SKIP = new Set([
  ".git", ".github", ".vscode", ".devcontainer", ".claude",
  ".claude-plugin", "scripts", "docs", "examples", "tests",
  "schemas", "Script", "tools", "node_modules", "_images",
  "assets", "screenshots",
]);
```

#### 3b. 新增 `isRealPlugin(dirPath)` 方法

检查目录是否为真正的 plugin/skill/agent，判断条件（满足任一即可）：
- 存在 `.claude-plugin/plugin.json`
- 存在 `SKILL.md`
- 存在 `agents/*.md`
- 存在 `commands/*.md`
- 存在 `hooks/hooks.json`
- 存在 `package.json` 且有 `name` 字段

#### 3c. 新增 `countChildren(dirPath)` 方法

统计目录下的有效子项数量（.md 文件 + 子目录中的 real plugin），返回 `{ isCategory: boolean, childCount: number }`。

#### 3d. 修改 `browsePlugins` 方法

**无 manifest 分支**（第 282-332 行）：
- 遍历 scanDir 下的子目录时，先调用 `isRealPlugin(dir)`
- 如果是 real plugin → 走现有 `extractPluginInfo` 逻辑
- 如果不是 → 调用 `countChildren(dir)`，如果有子项则标记为 `isCategory: true` 的卡片

**有 manifest 分支**（第 263-280 行，"Normal local path source" 分支）：
- 解析 pluginDir 后，先检查 `isRealPlugin`
- 如果不是 real plugin 但有子项 → 标记为 category

#### 3e. 新增 `browseCategory(marketplaceId, categoryPath)` 方法

扫描 categoryPath 目录下的内容：
1. 先检查是否有 `.claude-plugin/plugin.json` 且包含 `agents` 数组 → 按数组列出
2. 收集目录下的 `.md` 文件（排除 README.md）作为 agent 卡片
3. 收集子目录中的 real plugin
4. 子目录如果还是分类 → 递归标记为 `isCategory`

#### 3f. 新增 `extractMdDescription(mdPath)` 辅助方法

从 .md 文件提取第一段有意义的文本作为 description。

### 4. 注册 IPC Handler — `src/main/ipc/registerHandlers.ts`

```ts
ipcMain.handle(
  IPC.MARKETPLACE_BROWSE_CATEGORY,
  async (_e, marketplaceId: string, categoryPath: string) => {
    return marketplaceService.browseCategory(marketplaceId, categoryPath);
  },
);
```

### 5. Preload 桥接 — `src/preload/index.ts`

marketplace 对象新增：
```ts
browseCategory: (marketplaceId: string, categoryPath: string): Promise<MarketplacePlugin[]> =>
  ipcRenderer.invoke(IPC.MARKETPLACE_BROWSE_CATEGORY, marketplaceId, categoryPath),
```

### 6. Store 变更 — `src/renderer/stores/marketplaceStore.ts`

新增状态和方法：
```ts
// 状态
categoryStack: Array<{ name: string; path: string }>  // 面包屑栈

// 方法
browseCategory(marketplaceId: string, categoryPath: string, categoryName: string)
  → push 到 categoryStack，调用 IPC 获取子内容，更新 plugins
popCategory()
  → pop categoryStack，如果栈空则重新调用 browsePlugins，否则调用 browseCategory 回到上一层
resetCategoryStack()
  → 清空 categoryStack（在 setCurrentSource 时调用）
```

### 7. UI 变更 — `src/renderer/components/marketplace/MarketplaceDetail.tsx`

#### 面包屑导航
在 "← Back to marketplaces" 按钮下方，当 `categoryStack.length > 0` 时显示面包屑：
```
marketplace名 > 分类1 > 分类2
```
点击面包屑中的某一层可以回退到该层。

#### 分类卡片样式
当 `plugin.isCategory === true` 时：
- 卡片右上角显示子项数量 badge（如 "12 items"）
- 不显示 Install/View 按钮，改为显示 Browse 按钮
- 点击 Browse → 调用 `browseCategory`
- 可以用文件夹图标区分

### 8. i18n 翻译

```json
// en.json
"marketplace.category": "Category",
"marketplace.itemCount": "{{count}} items",
"marketplace.browseCategory": "Browse"

// zh-CN.json
"marketplace.category": "分类",
"marketplace.itemCount": "{{count}} 个项目",
"marketplace.browseCategory": "浏览"
```
