# Repo-Pulse 文档整合计划

## 目标

调整 `/Users/yangsmac/Desktop/Repo-Pulse-docs` 的导航结构：
- 项目概览：现有 7 个章节压缩为一级目录
- 项目计划：新增 4 个文档

---

## 导航结构

```
项目概览 (Overview) - 现有内容压缩
项目计划 (Project Plan) - 新增
├── 技术架构
├── 后端设计
├── 实施计划
└── 开发规范
```

---

## 修改文件

| 文件 | 操作 |
|------|------|
| `app/src/components/Sidebar.tsx` | 导航结构调整 |
| `app/src/components/Content.tsx` | 添加新section渲染 |
| `app/src/contexts/LanguageContext.tsx` | 添加翻译key |

---

## 新增组件

4 个内容组件，从 `/Users/yangsmac/Desktop/Repo-Pulse/docs/` 提取内容：
- `TechArchitectureSection.tsx`
- `BackendDesignSection.tsx`
- `ImplementationPlanSection.tsx`
- `DevStandardsSection.tsx`

---

## 四个文档内容

**1. 技术架构**
- 技术选型、Monorepo结构、核心模块、实时通信

**2. 后端设计**
- NestJS模块、Prisma Schema、AI抽象层、队列架构

**3. 实施计划**
- 6个Phase：基础设施→认证→仓库集成→AI分析→过滤审批→仪表板报告→增强

**4. 开发规范**
- 前端样式约束、后端规范、数据库规范、代码规范
