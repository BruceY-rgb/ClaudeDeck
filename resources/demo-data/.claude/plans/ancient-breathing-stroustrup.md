# GitHub API "Bad credentials" 错误修复计划

## 问题描述
调用 `/repositories/my-repos` 或 `/repositories/starred` 接口时，GitHub API 返回 401 "Bad credentials" 错误。

## 根本原因
1. **Token 未存储**: GitHub OAuth token 没有被保存到数据库，`GithubStrategy.validate()` 忽略了 `_accessToken` 和 `_refreshToken` 参数
2. **Schema 缺失字段**: User 模型只有 `githubId`，缺少 `githubAccessToken` 和 `githubRefreshToken` 字段
3. **参数传错**: Controller 把用户内部 ID（`cuid123...`）当作 GitHub token 传给 service

## 修复步骤

### 步骤 1: 修改 Prisma Schema
**文件**: `packages/database/prisma/schema.prisma`

在 User 模型中添加：
```prisma
githubAccessToken String?
githubRefreshToken String?
```

### 步骤 2: 运行数据库迁移
```bash
pnpm db:generate
pnpm db:migrate
```

### 步骤 3: 修改 GithubStrategy
**文件**: `apps/api/src/modules/auth/strategies/github.strategy.ts`

在 validate 方法中返回 GitHub token：
```typescript
async validate(
  accessToken: string,
  refreshToken: string,
  profile: {...},
) {
  return {
    id: profile.id,
    email: profile.emails[0]?.value,
    displayName: profile.displayName,
    avatar: profile.photos[0]?.value,
    githubAccessToken: accessToken,      // 新增
    githubRefreshToken: refreshToken,    // 新增
  };
}
```

### 步骤 4: 修改 AuthController
**文件**: `apps/api/src/modules/auth/auth.controller.ts`

修改 `githubCallback` 方法中的 profile 类型定义，传递 token：
```typescript
async githubCallback(@Req() req: Request, @Res() res: Response) {
  const profile = req.user as {
    id: string;
    email: string;
    displayName: string;
    avatar: string;
    githubAccessToken: string;     // 新增
    githubRefreshToken: string;    // 新增
  };

  const tokens = await this.authService.handleGithubAuth(profile);  // 传递完整 profile
  // ...
}
```

### 步骤 5: 修改 AuthService
**文件**: `apps/api/src/modules/auth/auth.service.ts`

修改 `handleGithubAuth` 方法，接收并保存 token：
```typescript
async handleGithubAuth(profile: {
  id: string;
  email: string | undefined;
  displayName: string;
  avatar: string;
  githubAccessToken: string;      // 新增
  githubRefreshToken?: string;    // 新增
}) {
  // ... 现有逻辑 ...

  // 更新或创建用户时保存 token
  if (!user) {
    user = await this.userService.create({
      // ... 现有字段 ...
      githubAccessToken: profile.githubAccessToken,
      githubRefreshToken: profile.githubRefreshToken,
    });
  } else {
    // 已存在用户，更新 token
    user = await this.userService.update(user.id, {
      githubAccessToken: profile.githubAccessToken,
      githubRefreshToken: profile.githubRefreshToken,
    });
  }

  // ...
}
```

### 步骤 6: 修改 UserService（如果需要）
**文件**: `apps/api/src/modules/user/user.service.ts`

确保 `update` 方法可以更新 token 字段。

### 步骤 7: 修改 RepositoryController
**文件**: `apps/api/src/modules/repository/repository.controller.ts`

修改 `getMyRepos` 和 `getStarred` 方法，从数据库获取 GitHub token：
```typescript
@Get('my-repos')
async getMyRepos(@Req() req: Request) {
  const userId = (req.user as { sub: string }).sub;
  // 从数据库获取用户的完整信息（包括 GitHub token）
  const user = await this.userService.findById(userId);
  if (!user?.githubAccessToken) {
    return { error: '未绑定 GitHub 账号，请重新登录' };
  }
  const results = await this.repositoryService.searchUserRepositories(user.githubAccessToken);
  return results;
}

@Get('starred')
async getStarred(@Req() req: Request) {
  const userId = (req.user as { sub: string }).sub;
  const user = await this.userService.findById(userId);
  if (!user?.githubAccessToken) {
    return { error: '未绑定 GitHub 账号，请重新登录' };
  }
  const results = await this.repositoryService.searchStarredRepositories(user.githubAccessToken);
  return results;
}
```

### 步骤 8: 修改 GithubService - 实现 Token 刷新
**文件**: `apps/api/src/modules/repository/services/github.service.ts`

添加刷新 token 的方法，并在 API 调用失败时自动重试：

```typescript
/**
 * 刷新 GitHub OAuth Token
 */
async refreshGithubToken(refreshToken: string): Promise<{
  accessToken: string;
  refreshToken: string;
}> {
  const response = await axios.post(
    'https://github.com/login/oauth/access_token',
    {
      client_id: this.configService.get<string>('GITHUB_CLIENT_ID'),
      client_secret: this.configService.get<string>('GITHUB_CLIENT_SECRET'),
      refresh_token: refreshToken,
      grant_type: 'refresh_token',
    },
    {
      headers: {
        Accept: 'application/json',
      },
    },
  );

  return {
    accessToken: response.data.access_token,
    refreshToken: response.data.refresh_token || refreshToken,
  };
}
```

修改 `getUserRepositories` 和 `getStarredRepos` 方法，在收到 401 错误时尝试刷新 token：

```typescript
async getUserRepositories(userToken: string, refreshToken?: string): Promise<GithubRepoResponse[]> {
  const maxRetries = 3;
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      // ... 原逻辑 ...
    } catch (error) {
      // 如果是 401 错误且有 refreshToken，尝试刷新
      if (error.response?.status === 401 && refreshToken && attempt === 1) {
        try {
          const newTokens = await this.refreshGithubToken(refreshToken);
          userToken = newTokens.accessToken;
          refreshToken = newTokens.refreshToken;
          // 刷新成功后重试（不计入重试次数）
          continue;
        } catch (refreshError) {
          this.logger.error('GitHub token 刷新失败，用户需要重新授权');
        }
      }
      // ... 现有重试逻辑 ...
    }
  }
  return [];
}
```

### 步骤 9: 修改 RepositoryService - 传递 Refresh Token
**文件**: `apps/api/src/modules/repository/repository.service.ts`

修改 `searchUserRepositories` 和 `searchStarredRepositories` 方法，同时传递 accessToken 和 refreshToken：

```typescript
async searchUserRepositories(userId: string) {
  // 从数据库获取用户信息（包括 token）
  const user = await this.userService.findById(userId);
  if (!user?.githubAccessToken) {
    this.logger.warn('未绑定 GitHub 账号');
    return [];
  }

  const repos = await this.githubService.getUserRepositories(
    user.githubAccessToken,
    user.githubRefreshToken,  // 传递 refresh token
  );
  // ...
}
```

### 步骤 10: 验证修改
```bash
pnpm --filter api typecheck
pnpm --filter api lint
```

## 关键文件清单

| 文件 | 修改内容 |
|------|---------|
| `packages/database/prisma/schema.prisma` | 添加 token 字段 |
| `apps/api/src/modules/auth/strategies/github.strategy.ts` | 返回 token |
| `apps/api/src/modules/auth/auth.controller.ts` | 传递 token |
| `apps/api/src/modules/auth/auth.service.ts` | 保存 token |
| `apps/api/src/modules/user/user.service.ts` | 更新用户 token |
| `apps/api/src/modules/repository/repository.controller.ts` | 传递正确的 token |
| `apps/api/src/modules/repository/repository.service.ts` | 传递 refresh token |
| `apps/api/src/modules/repository/services/github.service.ts` | 刷新 token 并重试 |