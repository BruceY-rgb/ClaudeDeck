# 博客可执行 Python 代码功能实现计划

## 概述
为 Hexo 博客添加交互式 Python 代码执行功能，使用 Pyodide（WebAssembly Python）实现纯客户端执行。页面加载零额外开销（懒加载），首次点击运行时加载 Pyodide（3-5秒），支持 NumPy、Matplotlib 等科学计算库按需加载。

## 用户需求
- ✅ 仅支持 Python
- ✅ 按需加载库（不预加载）
- ✅ 手动点击运行按钮触发
- ✅ 页面首次加载 <2 秒（Pyodide 懒加载实现）
- ✅ 赛博朋克风格（青色 #00f0ff 主题）
- ✅ 不修改主题源码

## 技术方案
**Lazy-loaded Pyodide**: 页面加载时不引入任何 Python 运行时（0KB），用户首次点击"Run"按钮时才从 CDN 加载 Pyodide（~6-8MB，3-5秒初始化，后续缓存）。

## 需要创建/修改的文件

### 1. 新建 Hexo Tag Plugin
**路径**: `scripts/pyrun-tag.js`

**作用**: 注册 `{% pyrun %}` 标签，生成可执行代码块的 HTML 结构

**用户使用方式**:
```markdown
{% pyrun %}
import numpy as np
print(np.array([1, 2, 3]))
{% endpyrun %}

{% pyrun matplotlib %}
import matplotlib.pyplot as plt
plt.plot([1, 2, 3])
plt.show()
{% endpyrun %}
```

**生成的 HTML 结构**:
```html
<div class="pyrun-container" data-pyrun-id="xxx" data-preload="numpy">
  <div class="pyrun-code">
    <pre><code class="language-python">代码内容</code></pre>
  </div>
  <button class="pyrun-button" data-target="xxx">▶ Run Python</button>
  <div class="pyrun-output" id="xxx-output"></div>
</div>
```

### 2. 新建 JavaScript 执行引擎
**路径**: `source/js/pyodide-runner.js`

**核心功能**:
- 懒加载 Pyodide（首次点击 Run 时加载）
- 单例模式（页面共享一个 Pyodide 实例）
- 自动检测 import 语句，按需加载包（numpy, pandas, matplotlib 等）
- 捕获 stdout/stderr 输出
- 提取 matplotlib 图表为 base64 PNG
- 错误处理和加载状态显示

**关键实现**:
```javascript
class PyodideRunner {
  async init() {
    // 动态加载 Pyodide CDN 脚本
    // 初始化 Python 运行时
    // 设置 stdout/stderr 捕获
  }

  async run(code, outputEl, preload) {
    // 显示加载状态
    // 检测并加载所需包
    // 执行代码
    // 捕获输出和图表
    // 显示结果
  }

  _detectPackages(code) {
    // 解析 import 语句
    // 返回需要加载的包列表
  }
}
```

### 3. 新建赛博朋克样式
**路径**: `source/css/pyodide-runner.css`

**设计要点**:
- 青色霓虹边框 (#00f0ff)
- 深色半透明背景 (rgba(13, 13, 21, 0.8))
- 发光按钮效果（渐变 + 悬停动画）
- 输出区域：stdout 青色边框，stderr 品红色边框
- 加载动画：旋转 spinner + 青色
- Matplotlib 图表：青色边框 + 阴影
- 响应式设计（移动端优化）

**关键样式**:
```css
.pyrun-container {
  border: 2px solid #00f0ff;
  background: rgba(13, 13, 21, 0.8);
  box-shadow: 0 0 20px rgba(0, 240, 255, 0.3);
}

.pyrun-button {
  background: linear-gradient(135deg, #00f0ff, #0099cc);
  /* 悬停发光效果 */
}

.pyrun-stdout {
  border-left: 3px solid #00f0ff;
  background: rgba(0, 240, 255, 0.05);
}

.pyrun-stderr {
  border-left: 3px solid #ff0099;
  background: rgba(255, 0, 153, 0.05);
}
```

### 4. 修改 Butterfly 配置
**路径**: `_config.butterfly.yml`

**修改位置**: `inject` 部分（约 1064-1102 行）

**添加内容**:
```yaml
inject:
  head:
    # ... 现有条目 ...
    - <link rel="stylesheet" href="/css/pyodide-runner.css">

  bottom:
    # ... 现有条目 ...
    - <script src="/js/pyodide-runner.js"></script>
```

## 实现步骤

### 步骤 1: 创建 Tag Plugin（最小化实现）
创建 `scripts/pyrun-tag.js`，约 25 行代码：
```javascript
'use strict';
hexo.extend.tag.register('pyrun', function(args, content) {
  const code = content.trim();
  const id = 'pyrun-' + Math.random().toString(36).substr(2, 9);
  const preload = args.join(',');

  return `
<div class="pyrun-container" data-pyrun-id="${id}" data-preload="${preload}">
  <div class="pyrun-code">
    <pre><code class="language-python">${hexo.util.escapeHTML(code)}</code></pre>
  </div>
  <button class="pyrun-button" data-target="${id}">
    <span class="pyrun-icon">▶</span> Run Python
  </button>
  <div class="pyrun-output" id="${id}-output"></div>
</div>`.trim();
}, { ends: true });
```

### 步骤 2: 创建执行引擎（最小化核心）
创建 `source/js/pyodide-runner.js`，约 120 行核心代码：
- Pyodide 懒加载逻辑
- 包检测和加载
- 代码执行和输出捕获
- Matplotlib 图表提取
- 错误处理

### 步骤 3: 创建样式文件
创建 `source/css/pyodide-runner.css`，约 180 行样式：
- 容器和按钮样式
- 输出区域样式
- 加载动画
- 响应式适配

### 步骤 4: 更新配置
编辑 `_config.butterfly.yml`，在 inject 部分添加 2 行引用

### 步骤 5: 测试
在任意文章中添加测试代码：
```markdown
{% pyrun %}
print("Hello from Python!")
{% endpyrun %}

{% pyrun numpy %}
import numpy as np
print(np.array([1, 2, 3]).mean())
{% endpyrun %}

{% pyrun matplotlib %}
import matplotlib.pyplot as plt
import numpy as np
x = np.linspace(0, 10, 100)
plt.plot(x, np.sin(x), color='cyan')
plt.title('Sine Wave')
plt.show()
{% endpyrun %}
```

运行 `hexo clean && hexo generate && hexo server`，验证：
- 页面加载快速（无额外开销）
- 首次点击 Run 加载 Pyodide（3-5秒可接受）
- 后续执行快速
- 输出正确显示
- 图表正常渲染

## 性能指标

| 指标 | 数值 | 说明 |
|------|------|------|
| 页面初始加载 | 0 KB | Pyodide 懒加载 |
| 首次运行延迟 | 3-5 秒 | 加载 Pyodide 核心 |
| 后续运行 | <100ms | 运行时已缓存 |
| NumPy 加载 | +1-2 秒 | 首次 import 时 |
| Matplotlib 加载 | +2-3 秒 | 首次 import 时 |

## 边界情况处理

1. **长时间运行代码**: 可选添加 30 秒超时
2. **多个代码块**: 共享 Pyodide 实例，独立输出
3. **包不存在**: 显示友好错误信息
4. **浏览器不支持**: 检测 WebAssembly 支持
5. **移动端**: CSS 响应式，但提示性能影响

## 代码量估算

- Tag Plugin: ~25 行
- JavaScript 引擎: ~120 行（最小化核心）
- CSS 样式: ~180 行
- 配置修改: 2 行
- **总计: ~330 行代码**

## 关键文件清单

1. `scripts/pyrun-tag.js` - 新建
2. `source/js/pyodide-runner.js` - 新建
3. `source/css/pyodide-runner.css` - 新建
4. `_config.butterfly.yml` - 修改 inject 部分
