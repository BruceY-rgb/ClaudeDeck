# 仓库管理页面 UI 优化计划

## 当前问题分析

当前 `/apps/web/src/pages/Repositories.tsx` 存在以下问题：
1. 分类过滤按钮过于简单（只有 All/Active/Inactive）
2. 搜索和筛选区域布局不够合理
3. 仓库卡片信息展示不够丰富
4. 添加仓库对话框采用手动输入模式，体验不佳

## 优化目标

### 1. 仓库分类过滤按钮设计

**分类选项设计：**
- `全部` - 显示所有仓库
- `我的仓库` - 用户创建/添加的仓库
- `已监控` - 已配置 webhook 正在监控的仓库
- `最近更新` - 按最后更新时间排序（最近优先）
- `高风险` - 事件数量超过阈值的仓库

**实现方案：**
- 使用 `Tabs` 组件（来自 shadcn/ui）实现标签式过滤
- 选中状态使用 `--primary` 橙色强调色
- 每个标签显示对应仓库数量 badge

### 2. 搜索和筛选区域优化

**布局设计：**
```
┌─────────────────────────────────────────────────────────────┐
│ [搜索框                    ] [筛选器▼] [排序▼] [+添加仓库]  │
│ ─────────────────────────────────────────────────────────── │
│ [全部] [我的仓库] [已监控] [最近更新] [高风险]            │
└─────────────────────────────────────────────────────────────┘
```

**响应式断点：**
- Desktop: 搜索框 + 筛选按钮 + 分类标签在一行
- Tablet: 搜索框 + 筛选按钮，分类标签换行
- Mobile: 搜索框占据整行，下方排列分类标签

### 3. 仓库卡片/列表展示优化

**信息增强：**
- 仓库名称和描述
- 平台图标（GitHub/GitLab）
- 编程语言（如果有）
- 监控状态（已监控/未监控）
- 事件统计（今日/本周/总数）
- 最后同步时间
- 操作按钮组

**视觉优化：**
- 使用 `Card` + `CardHeader` + `CardContent` 结构
- 悬停效果：边框高亮 + 轻微上浮
- 状态使用 `Badge` 组件展示

### 4. 添加仓库对话框改为搜索选择模式

**实现方案：**
- 移除手动输入 owner/repo 的表单
- 改为搜索选择模式：
  1. 输入框：输入关键词（如 "react", "facebook"）
  2. 实时搜索：调用 GitHub/GitLab API 搜索仓库
  3. 结果列表：显示匹配的仓库（名称、描述、语言、星数）
  4. 点击选择：选中后添加到监控列表
  5. 添加按钮：确认添加

**交互设计：**
- 搜索框有 300ms 防抖
- 加载状态显示 skeleton
- 空结果显示提示文案
- 选中结果高亮显示

## 文件修改清单

### 1. 修改 `/apps/web/src/pages/Repositories.tsx`

**改动点：**
- 导入新的组件和图标
- 添加分类过滤逻辑（扩展 filter 数组）
- 重构搜索筛选区域布局（使用 Tabs）
- 优化仓库卡片展示内容
- 重构添加仓库对话框为搜索选择模式
- 添加仓库搜索 API 调用函数

### 2. 可能需要的新组件/类型

- `RepositorySearchResult` 类型定义
- 仓库搜索服务函数（调用 GitHub API）

## 实现步骤

### Step 1: 扩展分类过滤

将现有的 `filters = ['All', 'Active', 'Inactive']` 扩展为：
```tsx
type FilterType = 'all' | 'owned' | 'monitored' | 'recent' | 'high-risk';

const filters: { key: FilterType; label: string; icon: LucideIcon }[] = [
  { key: 'all', label: '全部', icon: Layers },
  { key: 'owned', label: '我的仓库', icon: User },
  { key: 'monitored', label: '已监控', icon: Eye },
  { key: 'recent', label: '最近更新', icon: Clock },
  { key: 'high-risk', label: '高风险', icon: AlertTriangle },
];
```

### Step 2: 优化搜索区域

使用 `Tabs` 组件重构：
```tsx
<Tabs value={activeFilter} onValueChange={setActiveFilter}>
  <TabsList>
    {filters.map(f => (
      <TabsTrigger value={f.key}>
        <f.icon className="w-4 h-4 mr-2" />
        {f.label}
        <span className="ml-2 px-1.5 py-0.5 text-xs rounded-full bg-muted">
          {countByFilter[f.key]}
        </span>
      </TabsTrigger>
    ))}
  </TabsList>
</Tabs>
```

### Step 3: 重构添加仓库对话框

```tsx
// 搜索选择模式
const [searchQuery, setSearchQuery] = useState('');
const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
const [isSearching, setIsSearching] = useState(false);

// 搜索函数
const handleSearch = debounce(async (query: string) => {
  if (!query.trim()) {
    setSearchResults([]);
    return;
  }
  setIsSearching(true);
  try {
    const results = await searchGitHubRepositories(query);
    setSearchResults(results);
  } catch (error) {
    console.error('Search failed:', error);
  } finally {
    setIsSearching(false);
  }
}, 300);
```

### Step 4: 优化仓库卡片

增强信息展示：
- 添加语言信息
- 添加监控状态
- 优化事件统计显示

## 验收标准

1. 分类过滤按钮正确显示5个选项，并能正确过滤仓库
2. 搜索框+分类按钮+排序选项布局正确，响应式适配正常
3. 仓库卡片信息丰富，视觉风格统一
4. 添加仓库对话框可搜索选择，体验流畅
5. 所有颜色使用 CSS 变量，无硬编码
6. 符合前端样式约束文档的全部规则