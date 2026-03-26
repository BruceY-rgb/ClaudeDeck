# HIMA AIP 演示版本需求总结

---

## 一、背景与目标

HIMA AIP 是一款用于管理 Claude Code 配置（agents、skills、plugins、commands、hooks、mcp、plans）的桌面应用。

**当前问题**：演示主机（Windows）上没有 Claude Code 相关数据，无法展示产品功能。

**目标**：将本机（开发者）的 Claude Code 配置打包到安装包中，并添加演示数据，使产品在全新环境下也能展示完整功能。

---

## 二、需求详情

### 需求1：本地配置打包（必需）

将当前开发机上 Claude Code 的所有配置数据打包进安装包：

| 数据类型 | 来源路径 | 格式 |
|---------|---------|------|
| Agents | `~/.claude/agents/*.md` | Markdown + Frontmatter |
| Skills | `~/.claude/skills/{name}/SKILL.md` | Markdown + Frontmatter |
| Plugins | `~/.claude/plugins/` | 目录结构 |
| Commands | 插件内 `commands/` 目录 | Markdown |
| Hooks | `~/.claude/hooks/*.json` | JSON |
| MCP | `~/.claude.json` (mcpServers字段) | JSON |
| Plans | `~/.claude/plans/*.md` | Markdown |
| Settings | `~/.claude/settings.json` | JSON |

**打包方式**：在 electron-builder 打包前自动执行导出脚本，将配置数据嵌入到安装包的 resources 目录中。

---

### 需求2：Mock 数据填充（必需）

当目标主机没有本地数据时，使用演示数据展示产品效果。需要生成合理的示例数据：
- 3-5 个示例 Agents
- 5-10 个示例 Skills
- 2-3 个示例 Plugins
- 示例 Commands、Hooks、MCP、Plans
- 模拟项目会话数据

---

### 需求3：多用户共享展示（模拟）

将产品设计为"可打通不同 Claude Code 用户之间共享的中心"：

**界面展示**：
- 显示其他 Claude 账号的头像/昵称
- 展示每个用户贡献的 personal skills、agents 列表
- 用户贡献统计（贡献数量排行）

**实现程度**：仅展示模拟数据，用于演示效果，不需要真实后端支持。

---

## 三、技术架构参考

### 关键文件

- **常量定义**：`src/shared/constants.ts`
- **服务类**：`src/main/services/` 目录下的各 Service 文件
- **前端存储**：`src/renderer/stores/*.ts`

### 配置文件格式参考

**Agent 文件**：
```markdown
---
name: AgentName
description: Description
model: claude-sonnet-4-20250514
tools:
  - Read
  - Write
---

# Agent instructions
```

**Skill 文件**：
```markdown
---
name: SkillName
description: Skill description
userInvocable: true
---

# Skill content
```

---

## 四、下一步

确认以上需求理解准确后，我将制定详细的执行计划。