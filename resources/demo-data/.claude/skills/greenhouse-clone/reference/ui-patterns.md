# UI 模式库

本文件列出常见的 UI 模式及其实现要点。

## 导航栏模式

### 标准导航栏

```
[Logo] ---- [Nav Links] ---- [CTA Button]
```

**实现要点**:
- 固定定位 position: fixed
- 高度: 64px - 80px
- 背景: 白色或半透明
- 导航项间距: 24px - 32px
- 移动端: 折叠为汉堡菜单

### 带下拉菜单的导航

```
[Products ▼] [Solutions ▼] [Pricing] [About] ---- [Login] [Get Started]
```

**实现要点**:
- 下拉触发: hover 或 click
- 下拉面板: absolute 定位
- 下拉动画: fadeIn + slideDown
- 箭头旋转指示

### 移动端导航

- 汉堡菜单按钮 (三条横线)
- 全屏遮罩层
- 侧边抽屉或全屏菜单
- 关闭按钮

## Hero 区域模式

### 中心对齐 Hero

```
         [Eyebrow Text]
         [Main Heading]
         [Subheading Text]
    [Primary CTA]  [Secondary CTA]
         [Hero Image]
```

**实现要点**:
- 最小高度: 500px - 600px
- 文本最大宽度: 600px - 800px
- 背景: 深色或渐变
- CTA 按钮组间距: 16px

### 左侧文字 + 右侧图片

```
[Text Content]              [Image/Screenshot]
- Eyebrow                   (浮在内容上方)
- Heading                    带阴影和圆角)
- Description
- CTA Buttons
```

**实现要点**:
- 两列布局 grid 或 flex
- 图片: 40% - 50% 宽度
- 图片可添加投影效果

### 带背景图的 Hero

- 背景图 + 遮罩层 (保证文字可读性)
- 遮罩: rgba(0,0,0,0.4) - rgba(0,0,0,0.6)
- 文字白色

## 卡片网格模式

### 基础卡片网格

```
[Card] [Card] [Card]
[Card] [Card] [Card]
```

**实现要点**:
- Grid 布局 grid-template-columns: repeat(3, 1fr)
- Gap: 24px - 32px
- 卡片: 白色背景，圆角，阴影

### 特性卡片 (带图标)

```
  [Icon]
  [Title]
  [Description]
  [Learn More →]
```

**实现要点**:
- 图标大小: 40px - 48px
- 图标颜色: 主题色
- 悬浮效果: 轻微上浮 + 阴影加深

### 产品卡片 (带截图)

```
[Screenshot]
[Badge] (可选)
[Title]
[Description]
[Features List]
[Get Started]
```

### 客户 Logo 网格

```
[Logo] [Logo] [Logo] [Logo]
[Logo] [Logo] [Logo] [Logo]
```

**实现要点**:
- Logo 灰度，悬浮变彩色
- 统一高度
- 保持纵横比

## 表单模式

### 登录/注册表单

```
[Email Input]
[Password Input]
[Remember Me] ---- [Forgot Password]
[Submit Button]
[Social Login]
[Sign Up Link]
```

**实现要点**:
- 输入框高度: 44px - 48px
- 标签: 浮动标签或顶部标签
- 验证: 实时反馈
- 错误状态: 红色边框 + 错误消息

### 搜索表单

```
[🔍 Search Input] [Search Button]
```

**实现要点**:
- 搜索图标在输入框内
- 键盘支持: Enter 提交
- 清除按钮 (有内容时显示)

### 联系表单

```
[Name] [Email]
[Subject]
[Message (Textarea)]
[Submit Button]
```

## 列表模式

### 功能特性列表

```
✓ [Feature One] - Description
✓ [Feature Two] - Description
✓ [Feature Three] - Description
```

**实现要点**:
- 图标 + 标题 + 描述
- 图标颜色: 主题色
- 间距: 16px - 24px

### 步骤列表

```
1. [Step One]
   Description...
2. [Step Two]
   Description...
3. [Step Three]
   Description...
```

**实现要点**:
- 步骤数字大号突出
- 当前步骤高亮

## 页脚模式

### 复杂页脚

```
[Logo + Description]  [Product]  [Company]  [Resources]  [Legal]
[Social Links]         [Link]     [Link]     [Link]        [Link]
[Newsletter Form]      [Link]     [Link]     [Link]        [Link]
                       [Link]     [Link]     [Link]
---------------------- Copyright 2024 ------
```

**实现要点**:
- 多列布局
- 背景: 深色
- 链接分组清晰
- Newsletter 表单
- 社交媒体链接

## 响应式模式

### 桌面到移动端

- 桌面: 3-4 列
- 平板: 2 列
- 移动端: 1 列

**实现要点**:
- 使用 CSS Grid 或 Flexbox
- 移动端调整字体大小
- 移动端隐藏非必要元素
- 触控区域至少 44px

### 图片响应式

```css
img {
  max-width: 100%;
  height: auto;
}
```

## 动画模式

### 淡入上移动画

```css
@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
```

### 悬浮效果

- 按钮: 背景色变深/变浅
- 卡片: 轻微上浮 (translateY -4px)
- 链接: 下划线出现

### 加载状态

- 骨架屏 (Skeleton)
- 旋转加载器
- 进度条

## 模态框模式

### 基础模态框

```
[遮罩层 - 半透明黑色]
  [模态框容器]
    [关闭按钮 ×]
    [标题]
    [内容]
    [操作按钮]
```

**实现要点**:
- 遮罩: fixed, 全屏, rgba(0,0,0,0.5)
- 居中: flex 或 absolute + transform
- 关闭: 点击遮罩或 × 按钮
- 动画: fadeIn + scaleIn
- 禁止背景滚动: overflow: hidden
