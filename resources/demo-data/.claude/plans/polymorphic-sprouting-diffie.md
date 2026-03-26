# NestJS 构建问题修复计划

## 问题
NestJS CLI 在 watch 模式默认使用 webpack，输出不到 dist 目录

## 修复方案（方案一）

### 步骤 1：修改 nest-cli.json
文件：`apps/api/nest-cli.json`

添加 `"compiler": "tsc"` 配置：

```json
{
  "$schema": "https://json.schemastore.org/nest-cli",
  "collection": "@nestjs/schematics",
  "sourceRoot": "src",
  "compiler": "tsc",
  "compilerOptions": {
    "deleteOutDir": true
  }
}
```

### 步骤 2：修改 package.json
文件：`apps/api/package.json`

更新 dev 脚本，明确指定使用 tsc 编译器：

```json
{
  "dev": "node_modules/.bin/nest start --watch --compiler tsc",
  "build": "node_modules/.bin/nest build"
}
```

### 步骤 3：测试
```bash
# 重新启动开发服务器
pnpm --filter @repo-pulse/api run dev
```

预期：watch 模式会使用 tsc 编译，输出到 dist/main
