# 组件实现参考

本文件提供常见组件的 Tailwind CSS 实现参考。

## 按钮组件

### 主要按钮 (Primary Button)

```jsx
<button className="
  px-6 py-3
  bg-[#4cb398]
  text-white
  font-semibold
  rounded-md
  hover:bg-[#3da088]
  transition-colors duration-200
  focus:outline-none focus:ring-2 focus:ring-[#4cb398] focus:ring-offset-2
">
  Get Started
</button>
```

### 次要按钮 (Secondary Button)

```jsx
<button className="
  px-6 py-3
  bg-transparent
  text-[#4cb398]
  border border-[#4cb398]
  font-semibold
  rounded-md
  hover:bg-[#e8f5f1]
  transition-colors duration-200
">
  Learn More
</button>
```

### 文字按钮 (Text Button)

```jsx
<button className="
  text-[#4cb398]
  font-medium
  hover:underline
  transition-colors duration-200
">
  Learn More →
</button>
```

## 输入框组件

### 基础输入框

```jsx
<input
  type="text"
  placeholder="Enter your email"
  className="
    w-full
    h-11 px-4
    border border-gray-300
    rounded-md
    focus:outline-none
    focus:border-[#4cb398]
    focus:ring-2 focus:ring-[#4cb398]/20
  "
/>
```

### 带标签输入框

```jsx
<div className="flex flex-col gap-1.5">
  <label className="text-sm font-medium text-gray-700">
    Email
  </label>
  <input
    type="email"
    className="
      h-11 px-4
      border border-gray-300
      rounded-md
      focus:outline-none
      focus:border-[#4cb398]
      focus:ring-2 focus:ring-[#4cb398]/20
    "
  />
</div>
```

### 错误状态输入框

```jsx
<input
  className="
    w-full h-11 px-4
    border border-red-500
    rounded-md
    focus:outline-none
    focus:ring-2 focus:ring-red-500/20
  "
/>
<p className="mt-1 text-sm text-red-500">
  Please enter a valid email
</p>
```

## 卡片组件

### 基础卡片

```jsx
<div className="
  p-6
  bg-white
  rounded-xl
  shadow-sm
  hover:shadow-md
  transition-shadow duration-200
">
  {/* Content */}
</div>
```

### 带边框卡片

```jsx
<div className="
  p-6
  bg-white
  border border-gray-200
  rounded-xl
  hover:border-[#4cb398]/30
  transition-colors duration-200
">
  {/* Content */}
</div>
```

### 悬浮效果卡片

```jsx
<div className="
  p-6
  bg-white
  rounded-xl
  shadow-sm
  hover:-translate-y-1
  hover:shadow-lg
  transition-all duration-200
">
  {/* Content */}
</div>
```

## 导航组件

### 顶部导航栏

```jsx
<nav className="
  fixed top-0 left-0 right-0
  h-16
  bg-white
  border-b border-gray-100
  z-50
">
  <div className="
    max-w-7xl mx-auto px-4 sm:px-6 lg:px-8
    h-full
    flex items-center justify-between
  ">
    {/* Logo */}
    <div className="flex-shrink-0">
      <Logo />
    </div>

    {/* Desktop Nav */}
    <div className="hidden md:flex items-center gap-8">
      <NavLink>Products</NavLink>
      <NavLink>Solutions</NavLink>
      <NavLink>Pricing</NavLink>
    </div>

    {/* CTA + Mobile Menu */}
    <div className="flex items-center gap-4">
      <Button variant="primary">Get Started</Button>
      <button className="md:hidden">
        <MenuIcon />
      </button>
    </div>
  </div>
</nav>
```

### 导航链接

```jsx
<NavLink href="/products" className="
  text-gray-600
  hover:text-[#4cb398]
  transition-colors duration-200
">
  Products
</NavLink>
```

## 下拉菜单组件

### 下拉触发器

```jsx
<div className="relative group">
  <button className="
    flex items-center gap-1
    text-gray-600
    hover:text-[#4cb398]
  ">
    Products
    <ChevronDownIcon className="w-4 h-4" />
  </button>

  {/* Dropdown Panel */}
  <div className="
    absolute top-full left-0
    w-48
    bg-white
    rounded-lg
    shadow-lg
    opacity-0 invisible
    group-hover:opacity-100 group-hover:visible
    transition-all duration-200
  ">
    <a href="#" className="block px-4 py-2 hover:bg-gray-50">
      Feature A
    </a>
    <a href="#" className="block px-4 py-2 hover:bg-gray-50">
      Feature B
    </a>
  </div>
</div>
```

## 徽章组件

### 基础徽章

```jsx
<span className="
  inline-flex items-center
  px-2.5 py-0.5
  text-xs font-medium
  bg-[#e8f5f1]
  text-[#4cb398]
  rounded-full
">
  New
</span>
```

### 功能徽章

```jsx
<span className="
  inline-flex items-center
  px-3 py-1
  text-sm
  bg-gray-100
  text-gray-700
  rounded-full
">
  Popular
</span>
```

## 图标组件

### 使用 Heroicons

```jsx
import { ChevronDownIcon } from '@heroicons/react/24/outline';

<ChevronDownIcon className="w-5 h-5 text-gray-500" />
```

### 图标按钮

```jsx
<button className="
  p-2
  rounded-lg
  hover:bg-gray-100
  transition-colors duration-200
">
  <SearchIcon className="w-5 h-5 text-gray-500" />
</button>
```

## 模态框组件

### 基础模态框

```jsx
{isOpen && (
  <>
    {/* Overlay */}
    <div
      className="fixed inset-0 bg-black/50 z-50"
      onClick={onClose}
    />

    {/* Modal */}
    <div className="
      fixed top-1/2 left-1/2
      -translate-x-1/2 -translate-y-1/2
      w-full max-w-md
      bg-white rounded-xl
      shadow-xl z-50
    ">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <h3 className="text-lg font-semibold">Title</h3>
        <button onClick={onClose}>
          <XIcon className="w-5 h-5" />
        </button>
      </div>

      {/* Content */}
      <div className="p-4">
        {/* ... */}
      </div>

      {/* Footer */}
      <div className="flex justify-end gap-3 p-4 border-t">
        <Button variant="secondary" onClick={onClose}>
          Cancel
        </Button>
        <Button variant="primary">
          Confirm
        </Button>
      </div>
    </div>
  </>
)}
```

## 列表组件

### 功能列表

```jsx
<ul className="space-y-4">
  <li className="flex items-start gap-3">
    <CheckIcon className="w-5 h-5 text-[#4cb398] flex-shrink-0 mt-0.5" />
    <span className="text-gray-600">Feature description here</span>
  </li>
  {/* More items */}
</ul>
```

## 布局组件

### Section 容器

```jsx
<section className="
  py-16 md:py-24
  bg-white
">
  <div className="
    max-w-7xl mx-auto
    px-4 sm:px-6 lg:px-8
  ">
    {/* Content */}
  </div>
</section>
```

### 两列布局 (文字 + 图片)

```jsx
<div className="
  grid grid-cols-1 lg:grid-cols-2
  gap-12 lg:gap-16
  items-center
">
  {/* Text */}
  <div>{/* ... */}</div>

  {/* Image */}
  <div>{/* ... */}</div>
</div>
```

### 三列网格

```jsx
<div className="
  grid
  grid-cols-1 md:grid-cols-2 lg:grid-cols-3
  gap-8
">
  {/* Cards */}
  <Card />
  <Card />
  <Card />
</div>
```

## 页脚组件

```jsx
<footer className="
  bg-[#15372c]
  text-white
  py-16
">
  <div className="
    max-w-7xl mx-auto
    px-4 sm:px-6 lg:px-8
  ">
    <div className="
      grid
      grid-cols-2 md:grid-cols-4 lg:grid-cols-6
      gap-8
    ">
      {/* Columns */}
    </div>

    <div className="
      mt-12 pt-8
      border-t border-white/20
      flex flex-col md:flex-row
      justify-between items-center
      gap-4
    ">
      <p>© 2024 Company. All rights reserved.</p>
      <div className="flex gap-4">
        {/* Social Links */}
      </div>
    </div>
  </div>
</footer>
```
