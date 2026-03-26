# Repo-Pulse 阶段四：团队协同与通知

> 严格遵循 CLAUDE.md 中的"微步长"执行原则

## 背景

根据 `docs/project-plan-v2.md` 阶段四，包含三个核心任务：
1. **规则引擎实现** - FilterModule
2. **审批流与拦截** - Approval 流程
3. **多渠道通知** - 邮件/钉钉/飞书/Webhook

**已有基础**：
- 数据库 Schema 已定义 `FilterRule`, `Approval`, `Notification` 模型
- 前端已有 `Notifications.tsx` 页面（Mock 数据）
- 现有模块：Auth, User, Repository, Webhook, Event, Settings, AI

---

## 微步长执行计划

### 任务 4.1: 规则引擎实现 (FilterModule)

**任务**: 创建 FilterModule，支持用户配置事件过滤规则

**文件**:
- `apps/api/src/modules/filter/filter.module.ts` (新建)
- `apps/api/src/modules/filter/filter.service.ts` (新建)
- `apps/api/src/modules/filter/filter.controller.ts` (新建)

**接口**:
- `GET /filters` - 获取用户规则列表
- `POST /filters` - 创建新规则
- `PUT /filters/:id` - 更新规则
- `DELETE /filters/:id` - 删除规则
- `POST /filters/test` - 测试规则匹配

**规则条件结构** (conditions):
```typescript
interface FilterCondition {
  field: 'eventType' | 'repository' | 'author' | 'riskLevel' | 'customRegex';
  operator: 'eq' | 'contains' | 'regex' | 'in';
  value: string | string[];
}
```

**验收**: `pnpm --filter api typecheck` 通过

---

### 任务 4.2: 审批流与拦截

**任务**: 实现高风险事件的人工审批流程

**文件**:
- `apps/api/src/modules/approval/approval.module.ts` (新建)
- `apps/api/src/modules/approval/approval.service.ts` (新建)
- `apps/api/src/modules/approval/approval.controller.ts` (新建)

**接口**:
- `GET /approvals` - 获取待审批列表
- `POST /approvals/:id/approve` - 审批通过
- `POST /approvals/:id/reject` - 审批拒绝
- `POST /approvals/:id/edit` - 编辑后审批

**触发条件**: AI 分析风险等级为 HIGH 或 CRITICAL 时自动创建 Approval 记录

**验收**: `pnpm --filter api typecheck` 通过

---

### 任务 4.3: 多渠道通知服务

**任务**: 实现通知发送服务，支持邮件/钉钉/飞书/Webhook

**文件**:
- `apps/api/src/modules/notification/notification.module.ts` (新建)
- `apps/api/src/modules/notification/notification.service.ts` (新建)
- `apps/api/src/modules/notification/channels/email.channel.ts` (新建)
- `apps/api/src/modules/notification/channels/dingtalk.channel.ts` (新建)
- `apps/api/src/modules/notification/channels/feishu.channel.ts` (新建)
- `apps/api/src/modules/notification/channels/webhook.channel.ts` (新建)

**通知触发场景**:
1. 新事件到来（根据 FilterRule 过滤）
2. AI 分析完成
3. 审批请求
4. 审批结果通知

**用户通知偏好** (存储在 User.preferences):
```typescript
interface NotificationPreferences {
  channels: ('email' | 'dingtalk' | 'feishu' | 'webhook' | 'inApp')[];
  events: {
    highRisk: boolean;
    prUpdates: boolean;
    analysisComplete: boolean;
    weeklyReport: boolean;
  };
  webhookUrl?: string;
  email?: string;
}
```

**验收**: `pnpm --filter api typecheck` 通过

---

### 任务 4.4: 前端通知配置界面

**任务**: 在 Settings 页面添通知渠道配置

**文件**:
- `apps/web/src/pages/Settings.tsx` (修改 - 添加通知 Tab)

**功能**:
- 邮箱配置
- 钉钉/飞书 Webhook 配置
- 通知开关（高风险、PR 更新、AI 分析、周报）

**验收**: `pnpm --filter web typecheck` 通过

---

### 任务 4.5: 前端审批管理界面

**任务**: 创建审批管理页面

**文件**:
- `apps/web/src/pages/Approvals.tsx` (新建)

**功能**:
- 待审批事件列表
- 审批操作（通过/拒绝/编辑）
- 审批历史记录

**验收**: `pnpm --filter web typecheck` 通过

---

## 关键文件清单

| 步骤 | 文件 | 操作 | 验证命令 |
|------|------|------|---------|
| 4.1 | `apps/api/src/modules/filter/*` | 新建 | `pnpm --filter api typecheck` |
| 4.2 | `apps/api/src/modules/approval/*` | 新建 | `pnpm --filter api typecheck` |
| 4.3 | `apps/api/src/modules/notification/*` | 新建 | `pnpm --filter api typecheck` |
| 4.4 | `apps/web/src/pages/Settings.tsx` | 修改 | `pnpm --filter web typecheck` |
| 4.5 | `apps/web/src/pages/Approvals.tsx` | 新建 | `pnpm --filter web typecheck` |

---

## 执行约束

1. 每个任务完成后必须独立 git commit
2. 验证命令必须通过才能进入下一个任务
3. 前后端类型必须在 `@repo-pulse/shared` 中定义
4. 禁止使用 `any` 类型
5. 通知渠道实现先聚焦核心功能，暂不接入真实三方 API