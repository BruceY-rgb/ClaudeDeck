# Greenhouse 网站分析参考

本文件记录 Greenhouse 网站的设计系统，实现时应该尽量还原这些设计数值。

## 品牌色彩

### 主色调

| 颜色名称 | 色值 | 用途 |
|---------|------|------|
| 深绿色 | #15372c | 主要品牌色，用于背景、强调元素 |
| 薄荷绿 | #4cb398 | 强调色，用于按钮、链接、图标 |
| 浅薄荷 | #e8f5f1 | 浅色背景、卡片背景 |

### 功能色

| 颜色名称 | 色值 | 用途 |
|---------|------|------|
| 白色 | #ffffff | 文字、背景 |
| 浅灰 | #f8f9fa | 页面背景 |
| 中灰 | #6c757d | 次要文字 |
| 深灰 | #343a40 | 主要文字 |
| 黑色 | #1a1a1a | 标题文字 |

## 字体系统

### 字体族

- **主要字体**：system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto
- **衬线字体**（可选）：Georgia, "Times New Roman", serif
- **等宽字体**（代码）：SFMono-Regular, Menlo, Monaco, Consolas

### 字号体系

| 用途 | 字号 | 行高 |
|-----|------|------|
| Hero 标题 | 48px - 64px | 1.1 - 1.2 |
| 页面标题 | 32px - 40px | 1.2 - 1.3 |
| 章节标题 | 24px - 28px | 1.3 - 1.4 |
| 卡片标题 | 18px - 20px | 1.4 |
| 正文 | 16px | 1.5 - 1.6 |
| 辅助文字 | 14px | 1.5 |
| 小字 | 12px | 1.4 |

### 字重

- Regular (400): 正文
- Medium (500): 强调文字
- Semibold (600): 按钮文字、导航链接
- Bold (700): 标题

## 间距系统

### 基础单位

- xs: 4px
- sm: 8px
- md: 16px
- lg: 24px
- xl: 32px
- 2xl: 48px
- 3xl: 64px
- 4xl: 96px

### 常见间距模式

- 卡片内边距: 24px - 32px
- 页面-section间距: 64px - 96px
- 组件间距: 16px - 24px
- 网格gap: 24px - 32px

## 视觉效果

### 阴影

```css
/* 卡片阴影 */
box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);

/* 悬浮阴影 */
box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);

/* 弹窗阴影 */
box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
```

### 圆角

- 按钮: 4px - 8px
- 卡片: 8px - 12px
- 输入框: 4px - 6px
- 图片: 8px - 12px

### 过渡效果

- 默认过渡时长: 200ms - 300ms
- 缓动函数: ease-in-out
- 动画效果: fadeIn, slideUp, scale

## 布局模式

### 页面结构

1. **固定导航栏**: 高度 64px - 80px，白色背景
2. **Hero 区域**: 全宽，高度 500px - 600px，深色背景
3. **内容区块**: 最大宽度 1200px，居中
4. **页脚**: 深色背景，包含多列链接

### 响应式断点

- Mobile: < 640px
- Tablet: 640px - 1024px
- Desktop: > 1024px

### 网格系统

- 12列网格
- 移动端: 1列
- 平板: 2列
- 桌面: 3-4列

## 组件规范

### 按钮

**主要按钮**:
- 背景: #4cb398
- 文字: #ffffff
- 字体: Semibold, 16px
- 内边距: 12px 24px
- 圆角: 6px
- 悬浮: 背景变深 10%

**次要按钮**:
- 背景: transparent
- 边框: 1px solid #4cb398
- 文字: #4cb398
- 悬浮: 背景 #e8f5f1

### 输入框

- 高度: 44px - 48px
- 边框: 1px solid #dee2e6
- 圆角: 4px - 6px
- 聚焦: 边框 #4cb398，阴影 0 0 0 3px rgba(76, 179, 152, 0.1)

### 卡片

- 背景: #ffffff
- 边框: 1px solid #e9ecef (可选)
- 圆角: 12px
- 阴影: 默认卡片阴影
- 悬浮: 提升阴影效果

### 导航

- 高度: 64px - 80px
- 背景: #ffffff
- 文字: #343a40
- 悬浮: 文字 #4cb398
- 下拉菜单: 白色背景，阴影，12px 圆角

## 无障碍设计

- 焦点环: 2px solid #4cb398
- 对比度: 符合 WCAG AA 标准
- ARIA 属性: 完整的标签和角色
- 键盘导航: 支持 Tab 键导航
- 跳过链接: 提供跳到主要内容

## 页面类型参考

### Landing Page 布局

1. Navbar (固定)
2. Hero (深色背景 + 标题 + CTA)
3. Social Proof (客户Logo墙)
4. Features (功能特点，三列卡片)
5. Testimonials (用户评价)
6. CTA Section (行动号召)
7. Footer (多列链接)

### 产品页面布局

1. Navbar
2. Hero (产品截图)
3. Feature Sections (交替布局)
4. Integration (集成列表)
5. Pricing (可选)
6. CTA
7. Footer

### 博客/资源页面

1. Navbar
2. Page Title
3. Content (最大宽度 800px)
4. Sidebar (可选)
5. Related Posts
6. Footer
