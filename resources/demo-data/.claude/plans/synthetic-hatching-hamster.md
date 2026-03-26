# macOS 开发 + 远程 Windows C++ 核心 - 方案设计

## 背景

项目是 Windows 端的屏幕录制工具，使用 libobs + Win32 Hooks。现在需要在 macOS 上进行开发测试。

**核心思路**：修改 C++ 核心支持网络通信，macOS 上的 Electron 连接到远程 Windows 机器上的 recorder_core.exe。

## 方案架构

```
[macOS 开发机]
    |
    | npm run dev (Electron UI)
    |
    | TCP Socket 连接
    v
[Windows 主机] <--TCP--> [recorder_core.exe --socket 8765]
    |
    | libobs 录制
    | Win32 Hooks (键鼠)
    v
[屏幕/音频捕获]
```

## 实现步骤

### Phase 1: 修改 C++ 核心支持 Socket 通信

**文件**：`native/src/main.cpp`

添加命令行参数解析：
- `--socket <port>` : 启动 TCP Socket 服务器模式
- 不带参数（或 `--stdio`）: 保持原有 stdio 模式（向后兼容）

添加网络监听逻辑：
- 监听指定端口（默认 8765）
- 接受客户端连接
- 使用 select/poll 处理多客户端（单客户端即可）

### Phase 2: 修改 Electron 端支持网络连接

**文件**：
- `src/main/services/RecorderService.ts` - 添加网络连接模式
- `src/main/index.ts` - 添加配置读取（远程 IP/端口）
- 创建 `.env` 配置文件存储远程地址

修改为：
- 读取配置文件中的 `RECORDER_HOST` 和 `RECORDER_PORT`
- 使用 `net.Socket` 替代 `child_process.spawn`
- 保持原有 JSON 协议不变

### Phase 3: 配置与测试

1. Windows 端：
   - 编译 C++ 代码
   - 开放防火墙端口 8765
   - 运行 `recorder_core.exe --socket 8765`

2. macOS 端：
   - 配置 `.env` 文件（远程 IP）
   - `npm run dev` 测试连接

## 需要修改的文件

| 文件 | 修改内容 |
|------|---------|
| `native/src/main.cpp` | 添加 TCP Socket 监听，支持 --socket 参数 |
| `src/main/services/RecorderService.ts` | 添加网络连接模式，替换 spawn 为 net.Socket |
| `src/main/index.ts` | 添加环境变量配置读取 |
| `.env.example` | 新建配置示例文件 |

## 预计工作量

- C++ Socket 逻辑: ~2 小时
- Electron 网络客户端: ~1 小时
- 配置与测试: ~1 小时

**总计: ~4 小时**

## 启动命令

### Windows 端
```bash
# 编译后运行
cd native/dist
./recorder_core.exe --socket 8765
```

### macOS 端
```bash
# 创建 .env 文件
echo "RECORDER_HOST=192.168.1.100" > .env
echo "RECORDER_PORT=8765" >> .env

# 启动开发
npm run dev
```

## 防火墙配置（Windows 端）

```powershell
# 以管理员身份运行 PowerShell
New-NetFirewallRule -DisplayName "RecorderCore" -Direction Inbound -Protocol TCP -LocalPort 8765 -Action Allow
```
