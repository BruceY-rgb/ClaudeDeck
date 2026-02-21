# Claude Skills Manager

<p align="center">
  <img src="resources/icon.png" alt="Claude Skills Manager" width="128" height="128" />
</p>

<p align="center">
  <a href="https://github.com/claude-skills-and-agents-manager/releases/latest">
    <img src="https://img.shields.io/github/release/claude-skills-and-agents-manager/claude-skills-and-agents-manager.svg" alt="最新版本" />
  </a>
  <a href="https://github.com/claude-skills-and-agents-manager/releases/latest">
    <img src="https://img.shields.io/github/downloads/claude-skills-and-agents-manager/claude-skills-and-agents-manager/total.svg" alt="下载次数" />
  </a>
  <a href="https://github.com/claude-skills-and-agents-manager/blob/master/LICENSE">
    <img src="https://img.shields.io/github/license/claude-skills-and-agents-manager/claude-skills-and-agents-manager.svg" alt="许可证" />
  </a>
</p>

> English | [中文](./README-zh.md)

一个用于管理 Claude Code 智能体、skills、插件和斜杠命令的可视化桌面应用程序。基于 Electron + React + TypeScript 构建。

## 功能特性

### 🎯 智能体管理
- 在可视化界面中查看所有 Claude Code 智能体
- 配置智能体设置和参数
- 监控智能体状态和活动

### 🛠️ Skills 管理
- 浏览市场上已安装的 skills
- 一键启用/禁用 skills
- 查看 skills 详情和文档
- 创建和编辑自定义 skills

### 🔌 插件管理
- 查看所有已安装的插件
- 配置插件设置
- 启用/禁用插件

### ⚡ 斜杠命令
- 浏览可用的斜杠命令
- 查看命令描述和使用方法
- 快速访问命令文档

### 📁 文件管理
- 监控观察的目录
- 配置文件系统监视选项
- 查看文件变更历史

### 🖥️ 系统集成
- 原生系统托盘支持
- 系统通知
- 全局快捷键
- 深色/浅色主题支持

## 下载

### 最新版本
- **macOS**: [Claude Skills Manager-1.0.0-mac.dmg](https://github.com/claude-skills-and-agents-manager/releases/latest)
- **Windows**: [Claude Skills Manager Setup 1.0.0.exe](https://github.com/claude-skills-and-agents-manager/releases/latest)

## 开发

### 环境要求
- Node.js 20+
- npm 10+
- Electron 40+

### 安装步骤

```bash
# 克隆仓库
git clone https://github.com/claude-skills-and-agents-manager/claude-skills-and-agents-manager.git
cd claude-skills-and-agents-manager

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

### 项目结构

```
claude-skills-and-agents-manager/
├── src/
│   ├── main/           # Electron 主进程
│   ├── preload/        # 预加载脚本
│   └── renderer/       # React 前端
├── resources/          # 应用资源（图标等）
├── release/           # 构建后的安装包
├── electron.vite.config.ts
├── package.json
└── README.md
```

## 技术栈

- **框架**: Electron 40+
- **前端**: React 19 + TypeScript
- **样式**: Tailwind CSS 4
- **状态管理**: Zustand
- **构建工具**: electron-vite + electron-builder

## 许可证

MIT 许可证 - 详见 [LICENSE](LICENSE) 文件。

## 贡献

欢迎提交 Pull Request！

---

<p align="center">使用 ❤️ 基于 Electron 构建</p>
