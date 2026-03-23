# Claude Skills Manager

<p align="center">
  <img src="resources/icon.png" alt="Claude Skills Manager" width="128" height="128" />
</p>

<p align="center">
  <strong>完全掌控你的 Claude Code 配置</strong>
</p>

<p align="center">
  一个精美的桌面应用程序，可以在一个地方管理 Claude Code 的智能体、skills、插件和斜杠命令。
</p>

<p align="center">
  <a href="https://github.com/BruceY-rgb/ClaudeDeck/releases/tag/v2.0.0">
    <img src="https://img.shields.io/github/v/release/BruceY-rgb/ClaudeDeck?include_prereleases&label=Version&color=6366f1" alt="版本" />
  </a>
  <a href="https://github.com/BruceY-rgb/ClaudeDeck/releases/tag/v2.0.0">
    <img src="https://img.shields.io/github/downloads/BruceY-rgb/ClaudeDeck/total?label=Downloads&color=10b981" alt="下载量" />
  </a>
  <a href="https://github.com/BruceY-rgb/ClaudeDeck">
    <img src="https://img.shields.io/github/stars/BruceY-rgb/ClaudeDeck?label=Stars&color=f59e0b" alt="Stars" />
  </a>
  <a href="https://github.com/BruceY-rgb/ClaudeDeck/blob/master/LICENSE">
    <img src="https://img.shields.io/github/license/BruceY-rgb/ClaudeDeck?color=3b82f6" alt="许可证" />
  </a>
  <a href="#">
    <img src="https://img.shields.io/badge/platform-macOS%20%7C%20Windows%20%7C%20Linux-8b5cf6" alt="平台" />
  </a>
</p>

> [English](./README.md) | 中文

---

## 功能特性

### 智能体管理
- 在精美的可视化界面中查看所有 Claude Code 智能体
- 轻松配置智能体设置和参数
- 实时监控智能体状态和活动

### Skills 管理
- 从市场浏览和发现 skills
- 一键安装或禁用 skills
- 查看每个 skill 的详细文档
- 创建自己的自定义 skills

### 插件管理
- 一目了然地查看所有已安装的插件
- 无需离开应用即可配置插件设置
- 即时启用/禁用插件

### 斜杠命令
- 探索所有可用的斜杠命令
- 阅读描述和使用示例
- 快速访问命令文档

### 文件监控
- 监控目录的文件变化
- 配置文件系统监视选项
- 跟踪文件变更历史

### 系统集成
- 支持系统托盘和快捷操作
- 原生系统通知
- 全局键盘快捷键
- 深色和浅色主题支持

---

## 截图展示

> **提示:** 在这里添加你的应用截图！
>
> 推荐添加的截图类型：
> - 主仪表盘概览
> - 智能体管理界面
> - Skills 市场浏览器
> - 设置/偏好设置页面

<!--
添加截图的方式如下：
![仪表盘](screenshots/dashboard.png)
![智能体](screenshots/agents.png)
![Skills](screenshots/skills.png)
-->

---

## 快速开始

### 下载与安装

**最新版本 (v2.0.0)**

| 平台 | 下载 |
|------|------|
| macOS | [Claude Skills Manager-2.0.0-mac.dmg](https://github.com/BruceY-rgb/ClaudeDeck/releases/tag/v2.0.0) |
| Windows | [Claude Skills Manager Setup 2.0.0.exe](https://github.com/BruceY-rgb/ClaudeDeck/releases/tag/v2.0.0) |

> **注意:** macOS 用户下载后可能需要右键点击并选择"打开"来绕过 Gatekeeper。

---

## 开发

### 环境要求

- Node.js 20+
- npm 10+

### 安装步骤

```bash
# 克隆仓库
git clone https://github.com/BruceY-rgb/ClaudeDeck.git
cd ClaudeDeck

# 安装依赖
npm install

# 启动开发服务器
npm run dev
```

### 构建

```bash
# 为当前平台构建
npm run dist

# 为 macOS 构建
npm run dist:mac

# 为 Windows 构建
npm run dist:win
```

---

## 项目结构

```
claude-skills-and-agents-manager/
├── src/
│   ├── main/           # Electron 主进程
│   ├── preload/        # 预加载脚本
│   └── renderer/       # React 前端
├── resources/          # 应用资源（图标等）
├── release/            # 构建后的安装包
├── electron.vite.config.ts
├── package.json
└── README.md
```

---

## 技术栈

- **框架:** Electron 40+
- **前端:** React 19 + TypeScript
- **样式:** Tailwind CSS 4
- **状态管理:** Zustand
- **构建工具:** electron-vite + electron-builder

---

## 许可证

MIT 许可证 - 详见 [LICENSE](LICENSE) 文件。

---

<p align="center">
  使用 Electron + React + TypeScript 构建
</p>
