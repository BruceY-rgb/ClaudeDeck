# Repo-Pulse 完整项目搭建计划

## 一、项目概述

Repo-Pulse 是一个 AI 驱动的代码仓库监控与管理平台，支持 Web 端和 Electron 桌面端。核心能力包括：仓库事件监听、AI 智能分析、内容过滤与审批、多渠道通知、可视化仪表板、自动报告生成、跨仓库对比。

---

## 二、确认的技术选型

| 层级 | 技术 | 说明 |
|------|------|------|
| 前端 | React 19 + TypeScript 5.9 + Vite 7.2 | 已有项目壳 |
| UI 组件 | shadcn/ui (New York) + Tailwind CSS 3.4 | 已配置 |
| 图表 | Recharts | 已安装 |
| 动画 | GSAP 3.14 | 已安装 |
| 状态管理 | TanStack Query + Zustand | 新增 |
| 后端 | NestJS + TypeScript | 用户确认 |
| 数据库 | PostgreSQL + Prisma ORM | 用户确认 |
| 缓存/队列 | Redis + BullMQ | 异步任务处理 |
| AI | 多模型抽象层 (OpenAI/Claude/Ollama) | 用户确认 |
| 桌面端 | Electron | 用户确认 |
| Monorepo | pnpm workspaces + Turborepo | 统一管理 |
| 认证 | JWT + GitHub/GitLab OAuth | - |
| 实时通信 | Socket.io + SSE (AI 流式) | - |
| 国际化 | 中文优先，支持英文 | 用户确认 |

---

## 三、交付物清单

本计划执行后将产出以下文件和配置：

1. **`/docs/frontend-style-guide.md`** — 前端样式约束文档（75+ 条规则）【最高优先级】
2. **`/docs/project-plan.md`** — 完整项目搭建计划（本文档的副本）
3. **`/CLAUDE.md`** — 项目级 Claude Code 指导文件
4. **`.claude/agents/`** — 项目级专用 agent 配置（从全局复制并定制）
5. **`.claude/skills/`** — 项目级专用 skill 配置
6. **项目 Monorepo 脚手架** — 完整的目录结构和基础配置
7. **数据库 Schema** — Prisma 模型定义

---

## 四、Monorepo 目录结构

```
repo-pulse/
├── apps/
│   ├── web/                    # 现有前端（迁移进来）
│   │   ├── src/
│   │   │   ├── components/
│   │   │   │   ├── ui/         # shadcn/ui 基础组件（已有）
│   │   │   │   ├── ui-custom/  # 自定义业务组件（已有）
│   │   │   │   ├── dashboard/  # 仪表板组件
│   │   │   │   ├── repository/ # 仓库管理组件
│   │   │   │   ├── analysis/   # AI 分析组件
│   │   │   │   ├── notification/ # 通知组件
│   │   │   │   └── report/     # 报告组件
│   │   │   ├── hooks/          # 自定义 hooks
│   │   │   ├── stores/         # Zustand stores
│   │   │   ├── services/       # API 调用层
│   │   │   ├── contexts/       # React Context
│   │   │   ├── lib/            # 工具函数
│   │   │   ├── types/          # 类型定义
│   │   │   └── locales/        # i18n 翻译文件
│   │   ├── index.html
│   │   ├── vite.config.ts
│   │   ├── tailwind.config.js
│   │   └── package.json
│   │
│   ├── api/                    # NestJS 后端
│   │   ├── src/
│   │   │   ├── modules/
│   │   │   │   ├── auth/       # 认证模块
│   │   │   │   ├── user/       # 用户模块
│   │   │   │   ├── repository/ # 仓库集成模块
│   │   │   │   ├── webhook/    # Webhook 接收模块
│   │   │   │   ├── event/      # 事件处理模块
│   │   │   │   ├── ai/         # AI 分析模块
│   │   │   │   ├── filter/     # 过滤模块
│   │   │   │   ├── approval/   # 审批模块
│   │   │   │   ├── notification/ # 通知模块
│   │   │   │   ├── dashboard/  # 仪表板数据模块
│   │   │   │   ├── report/     # 报告模块
│   │   │   │   └── workspace/  # 工作空间模块
│   │   │   ├── common/         # 公共模块（守卫、拦截器、管道）
│   │   │   ├── config/         # 配置管理
│   │   │   └── main.ts
│   │   ├── prisma/
│   │   │   └── schema.prisma
│   │   ├── nest-cli.json
│   │   └── package.json
│   │
│   └── desktop/                # Electron 壳
│       ├── src/
│       │   ├── main/           # 主进程
│       │   ├── preload/        # 预加载脚本
│       │   └── renderer/       # 指向 web app
│       ├── electron-builder.yml
│       └── package.json
│
├── packages/
│   ├── shared/                 # 前后端共享类型和工具
│   │   ├── src/
│   │   │   ├── types/          # 共享 TypeScript 类型
│   │   │   ├── constants/      # 共享常量
│   │   │   └── utils/          # 共享工具函数
│   │   └── package.json
│   │
│   ├── database/               # Prisma Client 封装
│   │   ├── prisma/
│   │   │   ├── schema.prisma
│   │   │   └── migrations/
│   │   ├── src/
│   │   │   └── index.ts
│   │   └── package.json
│   │
│   └── ai-sdk/                 # AI 多模型抽象层
│       ├── src/
│       │   ├── providers/
│       │   │   ├── openai.ts
│       │   │   ├── claude.ts
│       │   │   └── ollama.ts
│       │   ├── interfaces/
│       │   │   └── ai-provider.ts
│       │   ├── services/
│       │   │   └── ai-service.ts
│       │   └── index.ts
│       └── package.json
│
├── .claude/
│   ├── agents/                 # 项目级 agent 配置
│   │   ├── backend-developer.md
│   │   ├── frontend-developer.md
│   │   ├── fullstack-developer.md
│   │   ├── typescript-pro.md
│   │   ├── websocket-engineer.md
│   │   ├── electron-pro.md
│   │   ├── api-designer.md
│   │   ├── ui-designer.md
│   │   ├── sql-pro.md
│   │   ├── debugger.md
│   │   ├── error-detective.md
│   │   ├── test-automator.md
│   │   ├── code-reviewer.md
│   │   ├── performance-engineer.md
│   │   └── security-auditor.md
│   ├── skills/                 # 项目级 skill 配置
│   │   └── (symlink 或复制相关 skills)
│   └── commands/               # 项目级自定义命令
│       └── (按需添加)
│
├── docs/
│   ├── frontend-style-guide.md # 前端样式约束文档【最高优先级】
│   └── project-plan.md         # 完整项目搭建计划
│
├── CLAUDE.md                   # 项目级 Claude Code 指导文件
├── docker-compose.yml          # 开发环境
├── turbo.json                  # Turborepo 配置
├── pnpm-workspace.yaml
├── package.json                # 根 package.json
├── .env.example
└── tsconfig.base.json
```

---

## 五、后端架构设计（NestJS）

### 5.1 核心模块

| 模块 | 职责 | 关键端点 |
|------|------|----------|
| **AuthModule** | JWT 签发/验证、OAuth 登录、Token 刷新 | `POST /auth/login`, `POST /auth/github/callback` |
| **UserModule** | 用户 CRUD、偏好设置、工作空间 | `GET /users/me`, `PATCH /users/preferences` |
| **RepositoryModule** | 仓库绑定、同步、Webhook 管理 | `POST /repositories`, `POST /repositories/:id/sync` |
| **WebhookModule** | 接收 GitHub/GitLab Webhook、签名验证 | `POST /webhooks/github`, `POST /webhooks/gitlab` |
| **EventModule** | 事件标准化、存储、查询 | `GET /events`, `GET /events/:id` |
| **AIModule** | AI 分析调度、流式输出、模型切换 | `POST /ai/analyze`, `GET /ai/stream/:taskId` |
| **FilterModule** | 过滤规则 CRUD、规则引擎 | `POST /filters`, `GET /filters` |
| **ApprovalModule** | 审批队列、审批/拒绝操作 | `GET /approvals/pending`, `POST /approvals/:id/approve` |
| **NotificationModule** | 通知路由、渠道管理、通知历史 | `POST /notifications/send`, `GET /notifications` |
| **DashboardModule** | 聚合指标、DORA 指标、趋势数据 | `GET /dashboard/metrics`, `GET /dashboard/dora` |
| **ReportModule** | 报告生成、模板管理、导出 | `POST /reports/generate`, `GET /reports/:id/export` |
| **WorkspaceModule** | 个性化工作空间配置 | `GET /workspaces`, `PATCH /workspaces/:id` |

### 5.2 横切关注点

- **全局守卫**: JwtAuthGuard, RolesGuard, ThrottlerGuard
- **全局拦截器**: TransformInterceptor (统一响应格式), TimeoutInterceptor
- **全局管道**: ValidationPipe (基于 class-validator)
- **全局过滤器**: HttpExceptionFilter (统一异常响应)
- **日志**: 基于 NestJS Logger + Winston
- **配置**: @nestjs/config + Joi schema 验证

### 5.3 异步任务架构（BullMQ）

```
队列名称:
├── webhook-events    # Webhook 事件入队
├── ai-analysis       # AI 分析任务
├── notifications     # 通知发送
├── report-generation # 报告生成
└── repository-sync   # 仓库同步
```

每个队列对应独立的 Processor，支持并发控制、重试、死信队列。

---

## 六、数据库设计（Prisma Schema 核心模型）

```prisma
model User {
  id            String   @id @default(cuid())
  email         String   @unique
  name          String
  avatar        String?
  githubId      String?  @unique
  gitlabId      String?  @unique
  role          Role     @default(MEMBER)
  preferences   Json     @default("{}")
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
  repositories  UserRepository[]
  approvals     Approval[]
  notifications Notification[]
  workspaces    Workspace[]
  filterRules   FilterRule[]
}

model Repository {
  id            String   @id @default(cuid())
  name          String
  fullName      String
  platform      Platform        // GITHUB | GITLAB
  externalId    String
  url           String
  defaultBranch String   @default("main")
  webhookId     String?
  webhookSecret String?
  isActive      Boolean  @default(true)
  lastSyncAt    DateTime?
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
  users         UserRepository[]
  events        Event[]

  @@unique([platform, externalId])
}

model Event {
  id            String    @id @default(cuid())
  repositoryId  String
  repository    Repository @relation(fields: [repositoryId], references: [id])
  type          EventType         // PUSH, PR_OPENED, PR_MERGED, ISSUE_OPENED, etc.
  action        String
  title         String
  body          String?   @db.Text
  author        String
  authorAvatar  String?
  externalId    String
  externalUrl   String?
  metadata      Json      @default("{}")
  rawPayload    Json?
  createdAt     DateTime  @default(now())
  analyses      AIAnalysis[]
  approvals     Approval[]
  notifications Notification[]

  @@index([repositoryId, createdAt])
  @@index([type, createdAt])
}

model AIAnalysis {
  id            String   @id @default(cuid())
  eventId       String
  event         Event    @relation(fields: [eventId], references: [id])
  model         String                 // gpt-4o, claude-sonnet, etc.
  summary       String   @db.Text
  riskLevel     RiskLevel              // LOW, MEDIUM, HIGH, CRITICAL
  riskReason    String?  @db.Text
  categories    String[]               // bug-fix, feature, refactor, etc.
  sentiment     Float?                 // -1.0 ~ 1.0
  keyChanges    Json     @default("[]")
  suggestions   Json     @default("[]")
  tokensUsed    Int      @default(0)
  latencyMs     Int      @default(0)
  status        AnalysisStatus         // PENDING, PROCESSING, COMPLETED, FAILED
  errorMessage  String?
  createdAt     DateTime @default(now())

  @@index([eventId])
  @@index([status])
}

model FilterRule {
  id            String   @id @default(cuid())
  userId        String
  user          User     @relation(fields: [userId], references: [id])
  name          String
  description   String?
  conditions    Json                   // 规则条件 JSON
  action        FilterAction           // INCLUDE, EXCLUDE, TAG
  isActive      Boolean  @default(true)
  priority      Int      @default(0)
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
}

model Approval {
  id            String   @id @default(cuid())
  eventId       String
  event         Event    @relation(fields: [eventId], references: [id])
  reviewerId    String?
  reviewer      User?    @relation(fields: [reviewerId], references: [id])
  status        ApprovalStatus         // PENDING, APPROVED, REJECTED, EDITED
  originalContent String? @db.Text
  editedContent   String? @db.Text
  comment       String?
  createdAt     DateTime @default(now())
  reviewedAt    DateTime?

  @@index([status, createdAt])
}

model Notification {
  id            String   @id @default(cuid())
  userId        String
  user          User     @relation(fields: [userId], references: [id])
  eventId       String?
  event         Event?   @relation(fields: [eventId], references: [id])
  channel       NotificationChannel    // EMAIL, DINGTALK, FEISHU, WEBHOOK, IN_APP
  title         String
  content       String   @db.Text
  status        NotificationStatus     // PENDING, SENT, FAILED, READ
  sentAt        DateTime?
  readAt        DateTime?
  metadata      Json     @default("{}")
  createdAt     DateTime @default(now())

  @@index([userId, createdAt])
  @@index([status])
}

model Workspace {
  id            String   @id @default(cuid())
  userId        String
  user          User     @relation(fields: [userId], references: [id])
  name          String
  layout        Json     @default("{}")    // 仪表板布局配置
  widgets       Json     @default("[]")    // 组件列表
  isDefault     Boolean  @default(false)
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
}

model Report {
  id            String   @id @default(cuid())
  type          ReportType             // WEEKLY, MONTHLY, CUSTOM
  title         String
  content       String   @db.Text
  format        ReportFormat           // MARKDOWN, PDF, HTML
  repositoryIds String[]
  dateFrom      DateTime
  dateTo        DateTime
  generatedBy   String                 // user ID or "system"
  status        ReportStatus           // GENERATING, COMPLETED, FAILED
  fileUrl       String?
  createdAt     DateTime @default(now())
}

// Enums
enum Role { ADMIN, MANAGER, MEMBER, VIEWER }
enum Platform { GITHUB, GITLAB }
enum EventType { PUSH, PR_OPENED, PR_MERGED, PR_CLOSED, PR_REVIEW, ISSUE_OPENED, ISSUE_CLOSED, ISSUE_COMMENT, RELEASE, BRANCH_CREATED, BRANCH_DELETED }
enum RiskLevel { LOW, MEDIUM, HIGH, CRITICAL }
enum AnalysisStatus { PENDING, PROCESSING, COMPLETED, FAILED }
enum FilterAction { INCLUDE, EXCLUDE, TAG }
enum ApprovalStatus { PENDING, APPROVED, REJECTED, EDITED }
enum NotificationChannel { EMAIL, DINGTALK, FEISHU, WEBHOOK, IN_APP }
enum NotificationStatus { PENDING, SENT, FAILED, READ }
enum ReportType { WEEKLY, MONTHLY, CUSTOM }
enum ReportFormat { MARKDOWN, PDF, HTML }
enum ReportStatus { GENERATING, COMPLETED, FAILED }
```

---

## 七、AI 多模型抽象层设计

```typescript
// packages/ai-sdk/src/interfaces/ai-provider.ts
interface AIProvider {
  readonly name: string;
  analyze(input: AnalysisInput): Promise<AnalysisOutput>;
  analyzeStream(input: AnalysisInput): AsyncIterable<AnalysisChunk>;
  isAvailable(): Promise<boolean>;
}

interface AnalysisInput {
  eventType: string;
  title: string;
  body: string;
  diff?: string;
  comments?: string[];
  context?: Record<string, unknown>;
  language?: 'zh' | 'en';
}

interface AnalysisOutput {
  summary: string;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  riskReason?: string;
  categories: string[];
  keyChanges: string[];
  suggestions: string[];
  tokensUsed: number;
  latencyMs: number;
}
```

支持的提供商：
- **OpenAI**: GPT-4o / GPT-4o-mini
- **Anthropic**: Claude Sonnet / Claude Haiku
- **Ollama**: 本地模型（Llama 3, Qwen 等）

路由策略：用户可在设置中选择默认模型，系统支持 fallback 链（主模型不可用时自动切换备用模型）。

---

## 八、实时通信设计

### WebSocket (Socket.io)

```
事件类型:
├── event:new           # 新仓库事件
├── analysis:progress   # AI 分析进度
├── analysis:complete   # AI 分析完成
├── approval:new        # 新审批请求
├── approval:updated    # 审批状态变更
├── notification:new    # 新通知
└── dashboard:update    # 仪表板数据更新
```

### SSE (Server-Sent Events)

用于 AI 流式输出：`GET /ai/stream/:taskId` 返回 SSE 流，前端逐字渲染分析结果。

---

## 九、前端样式约束文档概要

将在 `/docs/frontend-style-guide.md` 中写入完整的 75+ 条规则文档，核心内容包括：

### 9.1 颜色系统
- 仅使用 CSS 变量定义的语义色（`--background`, `--primary`, `--github-*` 等）
- 禁止硬编码任意颜色值
- 状态色：success (#238636), warning (#f0883e), danger (#da3633), info (#58a6ff)
- 主题色/强调色：#ff4d00（橙色）

### 9.2 排版
- 字体：Inter 为主，系统字体为回退
- 代码字体：SF Mono, Monaco, Cascadia Code
- 尺寸层级：text-xs(12) / text-sm(14) / text-base(16) / text-lg(18) / text-xl(20) / text-2xl(24) / text-3xl(30) / text-4xl(36)
- 标题用 font-bold/font-semibold，正文用默认粗细

### 9.3 间距与圆角
- 间距遵循 4px 倍数体系（Tailwind 默认）
- 圆角使用 `--radius` 变量：xs/sm/md/lg/xl
- 卡片统一 rounded-xl，按钮统一 rounded-lg，Badge 用 rounded-full

### 9.4 组件规范
- 优先使用 shadcn/ui 组件，不自行实现已有组件
- Card 必须使用 CardHeader + CardContent 结构
- 图标统一使用 lucide-react，尺寸 h-4 w-4 / h-5 w-5 / h-8 w-8
- 表单用 shadcn/ui 的 Input + Label 组合

### 9.5 动画
- 微交互用 Tailwind transition（duration-200 ease-out）
- 复杂动画用 GSAP
- 禁止使用 CSS @keyframes 自定义动画（已有的除外）
- 所有动画需 respect prefers-reduced-motion

### 9.6 布局
- 侧边栏固定 264px，可折叠
- 头部固定 64px，sticky 定位
- 内容区最大宽度无限制，响应式网格用 grid-cols-1 md:grid-cols-2 lg:grid-cols-3
- 页面间距统一 space-y-6 / space-y-8

### 9.7 禁止事项
- 禁止使用内联 style
- 禁止导入外部 CSS 框架（Bootstrap, Ant Design 等）
- 禁止使用 !important
- 禁止在组件中硬编码中/英文文案（必须走 i18n）
- 禁止使用 px 单位指定间距（使用 Tailwind 类）

---

## 十、分阶段实施计划

### Phase 0: 基础设施搭建
- [ ] 初始化 Monorepo（pnpm-workspace.yaml + turbo.json）
- [ ] 迁移现有前端代码到 `apps/web/`
- [ ] 创建 `apps/api/` NestJS 项目骨架
- [ ] 创建 `packages/shared/`、`packages/database/`、`packages/ai-sdk/` 包
- [ ] 配置 Docker Compose（PostgreSQL + Redis）
- [ ] 配置 tsconfig.base.json 和路径别名
- [ ] 创建 .env.example
- [ ] 写入 `/docs/frontend-style-guide.md` 完整约束文档

### Phase 1: 认证与用户系统
- [ ] 实现 AuthModule（JWT + GitHub OAuth）
- [ ] 实现 UserModule（注册、登录、个人信息）
- [ ] 前端登录页面和认证状态管理（Zustand store）
- [ ] 配置全局守卫和拦截器
- [ ] 前端 API 调用层（axios 实例 + TanStack Query）

### Phase 2: 仓库集成与事件监听
- [ ] 实现 RepositoryModule（GitHub/GitLab API 集成）
- [ ] 实现 WebhookModule（接收并验证 Webhook）
- [ ] 实现 EventModule（事件标准化与存储）
- [ ] 配置 BullMQ 队列（webhook-events）
- [ ] 前端仓库管理页面（绑定、列表、状态）

### Phase 3: AI 分析引擎
- [ ] 实现 packages/ai-sdk（多模型抽象层）
- [ ] 实现 AIModule（分析调度、流式输出）
- [ ] 配置 BullMQ 队列（ai-analysis）
- [ ] SSE 流式接口实现
- [ ] 前端 AI 分析结果展示 + 流式渲染

### Phase 4: 过滤、审批与通知
- [ ] 实现 FilterModule（规则引擎）
- [ ] 实现 ApprovalModule（审批工作流）
- [ ] 实现 NotificationModule（邮件 + 应用内通知）
- [ ] WebSocket 实时推送（Socket.io Gateway）
- [ ] 前端过滤规则配置、审批队列、通知中心

### Phase 5: 仪表板与报告
- [ ] 实现 DashboardModule（聚合查询、DORA 指标）
- [ ] 实现 ReportModule（报告生成、Markdown/PDF 导出）
- [ ] 前端可视化仪表板（Recharts 图表组件）
- [ ] 前端报告查看与导出

### Phase 6: 增强功能
- [ ] 个性化工作空间（可拖拽仪表板布局）
- [ ] 自然语言查询接口
- [ ] 安全扫描集成
- [ ] Electron 桌面端打包与分发
- [ ] 钉钉/飞书通知渠道集成

---

## 十一、开发环境配置

### Docker Compose

```yaml
services:
  postgres:
    image: postgres:16-alpine
    ports: ["5432:5432"]
    environment:
      POSTGRES_DB: repo_pulse
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
    volumes: [postgres_data:/var/lib/postgresql/data]

  redis:
    image: redis:7-alpine
    ports: ["6379:6379"]
    volumes: [redis_data:/var/lib/redis/data]
```

### 环境变量 (.env.example)

```env
# Database
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/repo_pulse

# Redis
REDIS_URL=redis://localhost:6379

# JWT
JWT_SECRET=your-secret-key
JWT_EXPIRATION=7d

# GitHub OAuth
GITHUB_CLIENT_ID=
GITHUB_CLIENT_SECRET=
GITHUB_CALLBACK_URL=http://localhost:3000/auth/github/callback

# GitLab OAuth
GITLAB_CLIENT_ID=
GITLAB_CLIENT_SECRET=

# AI Providers
OPENAI_API_KEY=
ANTHROPIC_API_KEY=
OLLAMA_BASE_URL=http://localhost:11434

# AI Default
AI_DEFAULT_PROVIDER=openai
AI_DEFAULT_MODEL=gpt-4o-mini

# App
APP_PORT=3001
APP_URL=http://localhost:5173
WEBHOOK_SECRET=your-webhook-secret
```

---

## 十二、关键文件清单

执行时需要创建/修改的核心文件：

| 文件路径 | 操作 | 说明 |
|----------|------|------|
| `/pnpm-workspace.yaml` | 创建 | Monorepo 工作空间定义 |
| `/turbo.json` | 创建 | Turborepo 任务配置 |
| `/package.json` | 创建 | 根 package.json |
| `/tsconfig.base.json` | 创建 | 共享 TypeScript 配置 |
| `/docker-compose.yml` | 创建 | 开发环境 |
| `/.env.example` | 创建 | 环境变量模板 |
| `/docs/frontend-style-guide.md` | 创建 | 前端样式约束文档 |
| `/apps/web/` | 迁移 | 现有前端代码迁移 |
| `/apps/api/` | 创建 | NestJS 后端项目 |
| `/apps/desktop/` | 创建 | Electron 壳 |
| `/packages/shared/` | 创建 | 共享类型和工具 |
| `/packages/database/` | 创建 | Prisma 数据库包 |
| `/packages/ai-sdk/` | 创建 | AI 多模型抽象层 |
| `/CLAUDE.md` | 创建 | 项目级 Claude Code 指导文件 |
| `/docs/project-plan.md` | 创建 | 本计划文档副本 |
| `/.claude/agents/*.md` | 创建 | 15 个项目级 agent 配置 |

---

## 十三、CLAUDE.md 项目指导文件

创建 `/CLAUDE.md`，内容包括：

```markdown
# Repo-Pulse - Claude Code 项目指导

## 项目概述
Repo-Pulse 是一个 AI 驱动的代码仓库监控与管理平台。
- 前端: React 19 + TypeScript + Vite + shadcn/ui + Tailwind CSS
- 后端: NestJS + TypeScript + Prisma + PostgreSQL + Redis
- 桌面端: Electron
- AI: 多模型抽象层 (OpenAI/Claude/Ollama)
- Monorepo: pnpm workspaces + Turborepo

## 项目结构
- `apps/web/` - React 前端应用
- `apps/api/` - NestJS 后端 API
- `apps/desktop/` - Electron 桌面端
- `packages/shared/` - 前后端共享类型和工具
- `packages/database/` - Prisma 数据库包
- `packages/ai-sdk/` - AI 多模型抽象层
- `docs/` - 项目文档

## 关键约束

### 前端开发
- **必须遵守** `/docs/frontend-style-guide.md` 中的所有规则
- 颜色仅使用 CSS 变量（--background, --primary, --github-* 等），禁止硬编码
- 组件优先使用 shadcn/ui，图标统一使用 lucide-react
- 样式只用 Tailwind CSS 类，禁止内联 style 和 !important
- 动画微交互用 Tailwind transition，复杂动画用 GSAP
- 所有文案走 i18n，中文优先
- 状态管理: 服务端状态用 TanStack Query，客户端状态用 Zustand

### 后端开发
- NestJS 模块化架构，每个功能领域一个模块
- Prisma 作为唯一 ORM，Schema 定义在 packages/database/
- 异步任务通过 BullMQ 队列处理
- API 统一响应格式: { code, data, message, timestamp }
- 全局守卫: JwtAuthGuard, RolesGuard, ThrottlerGuard
- 全局管道: ValidationPipe (class-validator)

### 数据库
- PostgreSQL 为主数据库
- Redis 用于缓存和消息队列
- 所有模型 id 使用 cuid()
- 时间字段统一 createdAt/updatedAt
- 关联使用 Prisma 关系定义

### AI 服务
- 通过 packages/ai-sdk 统一接口调用
- 支持模型切换和 fallback
- 流式输出通过 SSE
- 分析结果结构化存储

### 代码规范
- TypeScript strict mode
- 中文优先的 i18n
- 函数式组件 + hooks
- 文件命名: kebab-case 文件，PascalCase 组件/类，camelCase 函数/变量

## 常用命令
- `pnpm dev` - 启动所有开发服务
- `pnpm dev:web` - 仅启动前端
- `pnpm dev:api` - 仅启动后端
- `pnpm build` - 构建所有包
- `pnpm db:migrate` - 运行数据库迁移
- `pnpm db:generate` - 生成 Prisma Client
- `pnpm lint` - 代码检查
- `pnpm test` - 运行测试

## Agent 使用指南
项目配置了 15 个专用 agent（位于 .claude/agents/），适用场景：
- 前端开发 → frontend-developer, ui-designer
- 后端开发 → backend-developer, api-designer
- 数据库 → sql-pro
- 全栈 → fullstack-developer, typescript-pro
- WebSocket → websocket-engineer
- 桌面端 → electron-pro
- 调试 → debugger, error-detective
- 测试 → test-automator
- 代码审查 → code-reviewer
- 性能 → performance-engineer
- 安全 → security-auditor
```

---

## 十四、项目级 Agent 配置方案

从全局 `~/.claude/agents/` 复制 15 个相关 agent 到项目级 `.claude/agents/`，并为每个 agent 注入 Repo-Pulse 项目上下文。

### 复制清单

| Agent | 来源路径 | 定制说明 |
|-------|----------|----------|
| **backend-developer** | `~/.claude/agents/backend-developer.md` | 注入 NestJS + Prisma + BullMQ 约束 |
| **frontend-developer** | `~/.claude/agents/frontend-developer.md` | 注入前端样式约束文档引用 |
| **fullstack-developer** | `~/.claude/agents/fullstack-developer.md` | 注入 Monorepo 结构信息 |
| **typescript-pro** | `~/.claude/agents/typescript-pro.md` | 注入 strict mode 和路径别名配置 |
| **websocket-engineer** | `~/.claude/agents/websocket-engineer.md` | 注入 Socket.io 事件目录 |
| **electron-pro** | `~/.claude/agents/electron-pro.md` | 注入 Electron + Vite 集成方式 |
| **api-designer** | `~/.claude/agents/api-designer.md` | 注入 API 端点设计规范 |
| **ui-designer** | `~/.claude/agents/ui-designer.md` | 注入设计系统（GitHub Dark + 橙色主题） |
| **sql-pro** | `~/.claude/agents/sql-pro.md` | 注入 Prisma schema 和 PostgreSQL 约束 |
| **debugger** | `~/.claude/agents/debugger.md` | 注入项目目录结构和日志位置 |
| **error-detective** | `~/.claude/agents/error-detective.md` | 注入错误处理模式 |
| **test-automator** | `~/.claude/agents/test-automator.md` | 注入 Vitest(前端) + Jest(后端) 配置 |
| **code-reviewer** | `~/.claude/agents/code-reviewer.md` | 注入项目编码规范检查项 |
| **performance-engineer** | `~/.claude/agents/performance-engineer.md` | 注入性能基准和优化目标 |
| **security-auditor** | `~/.claude/agents/security-auditor.md` | 注入安全检查清单 |

### Agent 定制方式

每个 agent 文件将保持全局版本的完整内容，并在文件开头追加项目特定的上下文段落，例如：

```markdown
---
name: frontend-developer
description: "Repo-Pulse 前端开发专用 agent"
tools: Read, Write, Edit, Bash, Glob, Grep
model: sonnet
---

## Repo-Pulse 项目上下文

你正在 Repo-Pulse 项目中工作。请严格遵守以下约束：
- 阅读并遵守 `/docs/frontend-style-guide.md` 中的所有前端样式规则
- 使用 shadcn/ui (New York 风格) 组件，图标用 lucide-react
- 颜色只使用 CSS 变量，禁止硬编码
- 状态管理: TanStack Query (服务端) + Zustand (客户端)
- 所有文案必须通过 i18n 系统，中文优先

[...保留全局 agent 原始内容...]
```

### 相关 Skills

以下 Impeccable skills 对前端开发有帮助，建议在 `.claude/skills/` 中建立 symlink：

| Skill | 用途 |
|-------|------|
| **frontend-design** | 创建高质量前端界面 |
| **audit** | UI 质量审计（可访问性、性能、响应式） |
| **polish** | 上线前最终质量检查 |
| **harden** | 错误处理、i18n、边界情况加固 |
| **optimize** | 前端性能优化 |
| **animate** | 动画和微交互设计 |

---

## 十五、执行优先级（更新后）

基于用户要求，调整执行顺序如下：

### 优先级 1【最高】: 前端样式约束文档
- 创建 `/docs/frontend-style-guide.md`
- 完整的 75+ 条规则，覆盖颜色、排版、间距、组件、动画、布局、禁止事项等全部 15 个章节
- 这是所有前端开发的基础，必须首先完成

### 优先级 2: 项目配置文件
- 创建 `/CLAUDE.md` — 项目级 Claude Code 指导文件
- 创建 `/docs/project-plan.md` — 本计划文档的副本
- 创建 `/.claude/agents/` — 复制并定制 15 个 agent
- 创建 `/.claude/skills/` — symlink 相关 skills

### 优先级 3: 基础设施搭建（Phase 0）
- Monorepo 初始化
- 前端代码迁移
- NestJS 骨架
- Docker Compose
- 共享包创建

### 优先级 4-7: 功能实现（Phase 1-6）
- 按原计划的 Phase 1 → Phase 6 顺序执行
