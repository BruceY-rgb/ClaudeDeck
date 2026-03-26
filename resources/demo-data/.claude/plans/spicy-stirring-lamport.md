# 修复按钮激活状态区分度问题

## 问题
左侧导航栏和仓库页面的按钮点击后区分度不够明显，用户希望用**橙色**强调显示激活状态。

## 需要修改的位置

### 1. 左侧导航栏 (Layout.tsx)
```typescript
// 当前样式
isActive
  ? 'bg-[var(--github-accent)]/10 text-[var(--github-accent)] border border-[var(--github-accent)]/20'

// 修改为橙色
isActive
  ? 'bg-orange-500/10 text-orange-500 border border-orange-500/20'
```

### 2. 仓库页面 Tabs (Repositories.tsx)
```typescript
// 当前样式
className="data-[state=active]:bg-[var(--github-accent)] data-[state=active]:text-white"

// 修改为橙色
className="data-[state=active]:bg-orange-500 data-[state=active]:text-white data-[state=active]:border-orange-500"
```

### 3. 仓库页面筛选按钮 (Repositories.tsx)
```typescript
// 当前样式
activeFilter === filter.value
  ? 'bg-[var(--github-accent)] text-white hover:bg-[var(--github-accent-hover)]'

// 修改为橙色
activeFilter === filter.value
  ? 'bg-orange-500 text-white hover:bg-orange-600'
```

---

## 修改文件清单
1. `apps/web/src/components/ui-custom/Layout.tsx` - 左侧导航栏
2. `apps/web/src/pages/Repositories.tsx` - Tabs 和筛选按钮
