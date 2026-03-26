# 美亚航旅API MCP Server 项目执行计划

## 项目概述
基于美亚航旅API (https://meiya.apifox.cn/) 创建一个生产级的MCP Server，提供国际机票查询、预订、支付等功能。

## 技术选型
- **框架**: FastMCP (Python)
- **认证**: Token-based (MD5+Base64)
- **架构**: 四层架构（API客户端层、认证管理层、业务逻辑层、MCP工具层）

---

## 阶段一：项目基础搭建

### 1.1 创建项目结构
```
meiya-mcp-server/
├── src/
│   ├── __init__.py
│   ├── server.py              # MCP Server主入口
│   ├── api/
│   │   ├── __init__.py
│   │   ├── client.py          # API客户端
│   │   └── endpoints.py       # API端点定义
│   ├── auth/
│   │   ├── __init__.py
│   │   └── manager.py         # 认证管理器
│   ├── workflow/
│   │   ├── __init__.py
│   │   └── orchestrator.py    # 工作流编排器
│   └── tools/
│       ├── __init__.py
│       ├── flights.py         # 航班相关工具
│       ├── passengers.py      # 出行人工具
│       └── orders.py          # 订单相关工具
├── tests/
├── config/
├── docker/
├── requirements.txt
├── pyproject.toml
├── .env.example
└── README.md
```

### 1.2 创建配置文件
- `requirements.txt` - Python依赖
- `pyproject.toml` - 项目配置
- `.env.example` - 环境变量示例
- `docker/Dockerfile` - 容器化配置
- `docker/docker-compose.yml` - 编排配置

---

## 阶段二：核心模块开发

### 2.1 API客户端层 (src/api/client.py)
- 实现 `MeiyaApiClient` 类
- 封装HTTP请求（httpx异步）
- 实现Token认证头生成（MD5+Base64）
- 重试机制和错误处理
- 实现接口：
  - Shopping - 航班查询
  - Pricing - 计价
  - TOOrderSave - 生单
  - OrderPayVer - 验价验舱
  - OrderPayConfirm - 支付确认
  - TOOrderDetailQuery - 订单查询
  - TOOrderCancel - 取消订单

### 2.2 认证管理层 (src/auth/manager.py)
- 实现 `AuthManager` 类
- Token缓存机制
- Token自动刷新
- 用户登录Token管理

### 2.3 业务逻辑层 (src/workflow/orchestrator.py)
- 实现 `WorkflowOrchestrator` 类
- 预订工作流编排（查询→计价→创建出行人→生单→验价验舱）
- 错误恢复机制

---

## 阶段三：MCP工具开发

### 3.1 航班工具 (src/tools/flights.py)
- `search_international_flights` - 查询国际航班
- `get_flight_details` - 获取航班详情
- `pricing_flight` - 航班计价

### 3.2 出行人工具 (src/tools/passengers.py)
- `create_passenger` - 创建出行人
- `update_passenger` - 更新出行人
- `get_passenger` - 获取出行人信息

### 3.3 订单工具 (src/tools/orders.py)
- `book_ticket` - 预订机票（完整流程）
- `query_order` - 查询订单
- `pay_order` - 支付订单
- `cancel_order` - 取消订单

### 3.4 MCP Server主入口 (src/server.py)
- 集成所有模块
- 生命周期管理
- 工具注册

---

## 阶段四：测试与部署

### 4.1 单元测试
- `tests/test_client.py` - API客户端测试
- `tests/test_auth.py` - 认证管理测试
- `tests/test_tools.py` - 工具测试

### 4.2 部署配置
- Claude Desktop配置
- Docker部署
- HTTP/SSE传输模式

---

## 关键里程碑

| 序号 | 里程碑 | 状态 |
|------|--------|------|
| 1 | 项目基础结构搭建 | - |
| 2 | API客户端层实现 | - |
| 3 | 认证管理层实现 | - |
| 4 | 业务逻辑层实现 | - |
| 5 | MCP工具开发 | - |
| 6 | 单元测试编写 | - |
| 7 | 配置与部署文档 | - |

---

## 执行顺序
按照上述阶段顺序执行，每个阶段完成后进入下一阶段。
