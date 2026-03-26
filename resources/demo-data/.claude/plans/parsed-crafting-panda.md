# Boss 直聘招聘助手 - 完整工作流重构方案

## 当前问题总结

1. **Domain Filter 导致页面损坏**：之前为了稳定 URL 添加了 `--allowed-domains zhipin.com,www.zhipin.com`，导致页面 CSS/JS 资源（来自 CDN 域名）被拦截，页面渲染破坏，且无法跳转到任何其他页面
2. **前后端 API 不匹配**：前端 `useApi.ts` 中多个端点 URL 与后端路由不一致（如 `POST /api/candidates/search` 不存在、`sendMessage` 响应格式不匹配）
3. **登录流程不完整**：当前只是打开浏览器让用户自己操作，没有引导性

## 核心发现

- **不指定 `--allowed-domains` 时默认允许所有域名**，无需任何 domain filter
- **agent-browser 支持完整的页面交互**：`fill`, `click`, `press`, `snapshot`, `screenshot`, `get url`, `eval`, `cookies` 等
- **Session 机制自动保存 cookies/localStorage**，登录后后续操作自动带登录态

## 新工作流设计

```
用户前端点击"登录"
  ↓
后端: agent-browser --headed --session-name boss-recruiter open https://www.zhipin.com/web/user/enter
  (不加 --allowed-domains，允许所有域名，CSS/JS/CDN 正常加载)
  ↓
浏览器窗口打开完整的登录页面（用户可以正常操作）
  ↓
前端轮询 /api/login/check-status（每3秒）
  ↓
后端: agent-browser get url → 检测 URL 是否离开了登录页
       agent-browser snapshot -c → 检测页面中是否有登录后标识
  ↓
检测到登录成功 → 前端自动关闭弹窗
  ↓
用户在对话框输入需求（如"帮我找杭州3年经验的Java工程师"）
  ↓
后端: LLM 解析需求 → JobRequirement { position, city, skills, ... }
  ↓
后端: agent-browser（同一 session，自动携带登录态）
  1. open 搜索页
  2. fill 搜索框
  3. press Enter
  4. snapshot -c 获取结果 HTML
  5. LLM 解析 HTML → 结构化候选人数据
  ↓
LLM 生成友好的回复 + 候选人列表返回前端
```

## 实施步骤

### 步骤 1: 移除 Domain Filter，修复 spawn 环境

**文件**: `server/src/services/browser.ts`

- 删除 `ALLOWED_DOMAINS` 常量
- `runCommand()` 和 `runCommandNoWait()` 中：删除 `--allowed-domains` 参数，删除设置 `AGENT_BROWSER_ALLOWED_DOMAINS` 的代码
- 环境变量处理改为：删除 `AGENT_BROWSER_ALLOWED_DOMAINS`（确保不从父进程继承）
- 所有 `startBrowser()`, `openBossWebsite()`, `navigateToLogin()` 中移除 `--allowed-domains` 参数

### 步骤 2: 重写 openBossWebsite 打开登录页

**文件**: `server/src/services/browser.ts`

```typescript
async openBossWebsite(): Promise<boolean> {
  // 先关闭可能存在的旧 daemon（带旧 domain filter 的）
  try { await runCommand(['close'], 3000); } catch {}

  // 使用 runCommandNoWait，不加 --allowed-domains
  runCommandNoWait(['--headed', 'open', BOSS_LOGIN_URL]);
  await new Promise(resolve => setTimeout(resolve, 3000));
  isRunning = true;
  return true;
}
```

### 步骤 3: 优化 checkLoginStatus

**文件**: `server/src/services/browser.ts`

- 获取 URL，如果不在登录相关页面（不含 `/user/enter`, `/user/login`）且在 zhipin.com 域下，认为登录成功
- 通过 `snapshot -c` 检查页面中的用户标识

### 步骤 4: 重写 searchCandidates - 用 LLM 解析搜索结果

**文件**: `server/src/services/browser.ts`

当前的 `parseCandidateCards()` 用硬编码 CSS 选择器解析，非常脆弱。改为：

```typescript
async searchCandidates(requirements: JobRequirement): Promise<Candidate[]> {
  // 1. 导航到搜索页
  await runCommand(['open', `https://www.zhipin.com/web/geek/index?city=${encodeURIComponent(requirements.city)}`], 15000);
  await runCommand(['wait', '3000']);

  // 2. 填充搜索关键词并搜索
  const keywords = [requirements.position, ...requirements.skills.slice(0, 2)].join(' ');
  await runCommand(['fill', 'input.ipt-search', keywords], 5000);
  await runCommand(['press', 'Enter']);
  await runCommand(['wait', '3000']);

  // 3. 获取页面 HTML
  const snapshot = await runCommand(['get', 'html'], 15000);

  // 4. 用 LLM 解析 HTML 为结构化候选人数据
  const candidates = await llmService.parseHtmlToCandidates(snapshot.stdout, requirements);

  return candidates;
}
```

### 步骤 5: 新增 LLM 解析 HTML 功能

**文件**: `server/src/services/llm.ts`

新增 `parseHtmlToCandidates(html, requirements)` 方法：
- 先用 cheerio 粗提取页面关键内容区域（减少 token 消耗）
- 将精简后的 HTML 发给 LLM，让 LLM 提取结构化的候选人数据
- LLM 同时根据 requirements 给出匹配度评分

### 步骤 6: 修复前后端 API 契约

**文件**: `server/src/routes/api.ts` + `client/src/hooks/useApi.ts`

需要对齐的端点：

| 前端调用 | 当前后端路由 | 修复方案 |
|---------|-----------|---------|
| `POST /api/candidates/search` | 不存在 | 后端新增此路由，或前端改为 `POST /api/search` |
| `sendMessage` 期望 `result.response` | 后端返回 `data.message` | 修复后端 `/api/chat` 返回格式 |
| `GET /api/exports` | `GET /api/exported-files` | 统一端点名 |
| `exportCandidate` 发 `{ candidate }` | 期望 `{ candidateId, format }` | 对齐请求格式 |

重点修复 `/api/chat` 的返回格式：
```typescript
// 后端返回
res.json({
  response: responseMessage,  // 前端期望的字段名
  candidates: candidates,
  success: true
});
```

### 步骤 7: 清理废弃代码

**文件**: `server/src/routes/api.ts`

- 删除重复的登录路由（`/login/start`, `/login/code`, `/login/send-code` 等旧流程）
- 保留：`/login/open-browser`, `/login/check-status`, `/login/confirm`, `/login/logout`
- 删除重复的 export 路由（保留一个）

**文件**: `client/src/hooks/useApi.ts`

- 删除不再使用的 `sendVerificationCode`, `verifyCode` 等旧方法

## 关键文件清单

需要修改：
1. `server/src/services/browser.ts` - 移除 domain filter，重写 searchCandidates
2. `server/src/services/llm.ts` - 新增 HTML 解析功能
3. `server/src/routes/api.ts` - 修复 API 契约，清理废弃路由
4. `client/src/hooks/useApi.ts` - 对齐端点 URL 和响应格式
5. `client/src/components/LoginModal.tsx` - 微调（已有轮询，基本可用）

不需要修改：
- `server/src/types/index.ts` - 类型定义基本完整
- `client/src/components/` - 其他 UI 组件不在本次范围

## 验证测试

1. **登录测试**：打开浏览器 → 页面正常渲染（CSS/JS 完整）→ 手动登录 → 前端自动检测成功
2. **搜索测试**：输入"帮我找杭州的Java工程师" → LLM 解析 → 浏览器搜索 → LLM 提取候选人 → 返回结构化结果
3. **对话测试**：前端发送消息 → 后端正确返回 → 前端正确显示

## 技术要点

1. **不用 `--allowed-domains`**：让浏览器完全正常工作，所有 CDN、第三方域名都能访问
2. **用 LLM 代替硬编码选择器**：让 LLM 解析 HTML 内容，不依赖特定 CSS 选择器，对页面改版有鲁棒性
3. **Session 持久化**：`--session-name boss-recruiter` 自动保存登录态，搜索操作复用登录 session
4. **先 close 旧 daemon 再 open**：确保不会继承旧的 domain filter 配置
