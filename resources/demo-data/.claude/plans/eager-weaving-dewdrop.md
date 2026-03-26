# Electron 录屏工具 — 完整实施计划

## 项目概述

基于 Sidecar 架构的 Windows 屏幕录制工具。Electron（TypeScript + React + Vite）作为 UI 控制器，C++ Native Core（`recorder_core.exe`）通过 libobs 实现高性能录制。两者通过 stdio JSON 协议通讯。

**技术栈决策：**
- Electron 端：TypeScript + React + Vite
- Native Core：C++17 + libobs + Win32 API
- 通讯：stdio newline-delimited JSON
- 构建：CMake (C++)、electron-builder (Electron)

---

## 目录结构

```
/screen-recording-tool
├── /native                          # C++ Native Core
│   ├── /src
│   │   ├── main.cpp                # 入口：stdin/stdout JSON 命令循环
│   │   ├── recorder.h/cpp          # OBS 录制编排器
│   │   ├── input_capture.h/cpp     # 键鼠 Hook + 轮询
│   │   ├── csv_writer.h/cpp        # 线程安全 CSV 写入
│   │   ├── protocol.h/cpp          # JSON 协议解析/序列化
│   │   ├── system_info.h/cpp       # 系统信息查询 API
│   │   └── utils.h/cpp             # 时间戳、线程工具
│   ├── /third_party
│   │   ├── /obs-studio             # libobs (git submodule)
│   │   ├── /nlohmann-json          # JSON 库 (header-only)
│   │   └── /readerwriterqueue      # 无锁队列 (header-only)
│   ├── CMakeLists.txt
│   └── /dist                       # 构建产出 (exe + DLLs)
├── /src
│   ├── /main                       # Electron 主进程
│   │   ├── index.ts                # Electron 入口
│   │   ├── /services
│   │   │   ├── RecorderService.ts  # 管理 recorder_core.exe 生命周期
│   │   │   ├── SystemInfoService.ts
│   │   │   └── FileService.ts
│   │   ├── /ipc
│   │   │   └── handlers.ts         # IPC handler 注册
│   │   └── /windows
│   │       ├── mainWindow.ts       # 主控制窗口
│   │       └── overlayWindow.ts    # 悬浮监控窗口
│   ├── /preload
│   │   └── index.ts                # contextBridge API
│   └── /renderer                   # React UI
│       ├── /src
│       │   ├── App.tsx
│       │   ├── main.tsx
│       │   ├── /pages
│       │   │   ├── MainPage.tsx        # 主控制页
│       │   │   └── OverlayPage.tsx     # 悬浮窗页面
│       │   ├── /components
│       │   │   ├── RecordingControls.tsx
│       │   │   ├── SystemStatus.tsx
│       │   │   └── OverlayDisplay.tsx
│       │   ├── /hooks
│       │   │   └── useRecorder.ts
│       │   └── /types
│       │       └── index.ts
│       ├── index.html
│       ├── overlay.html
│       └── vite.config.ts
├── /docs
│   └── plan.md
├── package.json
├── tsconfig.json
├── electron-builder.yml
└── .gitignore
```

---

## Phase 0: 项目初始化与工具配置

### 0.0 Claude Code 工具配置

在开始实施前，先配置 Claude Code 工具链以提升开发效率。

#### 0.0.1 创建 CLAUDE.md
**文件路径**: `/Users/yangsmac/Desktop/screen-recording-tool/CLAUDE.md`

提供项目上下文指导，包含：
- 项目概述（Sidecar 架构、Electron + C++ Native Core）
- 技术栈说明（TypeScript、React、Vite、C++17、libobs、Win32 API）
- 目录结构说明
- 开发规范（命名约定、代码风格、提交规范）
- 关键技术要点（高精度时间戳、无锁队列、stdio JSON 协议）
- 常见问题与解决方案

#### 0.0.2 创建项目专属 Agent
**文件路径**: `/Users/yangsmac/Desktop/screen-recording-tool/.claude/agents/native-core-dev.md`

专门处理 C++ Native Core 开发的 agent，包含：
- libobs 初始化和配置模式
- Win32 Hook 最佳实践
- 高精度时间戳处理
- 无锁队列使用规范
- stdio JSON 协议实现
- DLL 部署清单
- 常见陷阱（timeBeginPeriod、Hook 超时、二进制模式等）

#### 0.0.3 创建测试相关 Slash Commands
**目录**: `/Users/yangsmac/Desktop/screen-recording-tool/.claude/commands/`

创建以下命令：
- **test-protocol.md**: 测试 C++ 与 Electron 的 JSON 协议通讯
  - 启动 recorder_core.exe
  - 发送测试命令（sysinfo、start、stop）
  - 验证响应格式
- **test-recording.md**: 端到端录制测试
  - 启动完整应用
  - 执行录制流程（start → 10s → pause → resume → stop）
  - 验证产出文件（video.mkv、actions.csv、movements.csv）
  - 检查时间戳对齐
- **test-input-capture.md**: 测试输入采集系统
  - 运行输入采集测试程序
  - 验证 Hook 工作正常
  - 检查轮询频率 ~200Hz
  - 验证 CSV 格式

#### 0.0.4 创建项目设置
**文件路径**: `/Users/yangsmac/Desktop/screen-recording-tool/.claude/settings.json`

配置项目特定权限：
```json
{
  "permissions": {
    "allow": [
      "Bash(cmake:*)",
      "Bash(cd native && cmake:*)",
      "Bash(cd native/build && cmake --build:*)",
      "Bash(npm:*)",
      "Bash(npx:*)",
      "Bash(node:*)",
      "Bash(native/dist/recorder_core.exe:*)",
      "Bash(taskkill:*)"
    ]
  }
}
```

### 验证标准
- CLAUDE.md 文件存在且内容完整
- native-core-dev agent 可被 Claude Code 识别
- 测试命令可通过 `/test-protocol` 等调用
- 项目设置生效，CMake 和 npm 命令可执行

---

### 0.1 Git 与基础配置
- `git init`
- 创建 `.gitignore`（node_modules、dist、build、native/dist、native/build、native/third_party/obs-studio、.claude/）

### 0.2 Electron + React + Vite 脚手架
- **创建 `package.json`**：electron、react、react-dom、typescript、vite、@vitejs/plugin-react、vite-plugin-electron、electron-builder
- **创建 `tsconfig.json`**（主进程）和 `tsconfig.node.json`
- **创建 `src/renderer/vite.config.ts`**：多页面配置（index.html + overlay.html）
- **创建 `electron-builder.yml`**：extraResources 包含 native/dist/

### 0.3 C++ 构建环境
- **前置条件**：Visual Studio 2022 (C++ Desktop)、CMake 3.20+
- **添加第三方依赖**：
  - `git submodule add https://github.com/obsproject/obs-studio native/third_party/obs-studio`（锁定 OBS 30.x 版本）
  - 下载 nlohmann/json（单头文件）→ `native/third_party/nlohmann-json/`
  - 下载 moodycamel::ReaderWriterQueue（单头文件）→ `native/third_party/readerwriterqueue/`
- **创建 `native/CMakeLists.txt`**：
  - C++17 标准
  - 将 obs-studio 作为子目录构建（ENABLE_UI=OFF、ENABLE_BROWSER=OFF、ENABLE_SCRIPTING=OFF）
  - 链接 obs、winmm.lib
  - 构建后拷贝 DLL 到 native/dist/

### 验证标准
- `npm install` 成功
- `npm run dev` 能启动空白 Electron 窗口
- C++ CMake 配置成功（`cmake -B build`）

---

## Phase 1: C++ Native Core — 通讯骨架

### 1.1 JSON 协议层 (`native/src/protocol.h/cpp`)
- 定义命令枚举：`START | STOP | PAUSE | RESUME | SYSINFO | QUIT`
- 定义 `StartConfig` 结构体：resolution、fps、savePath、separateAudio、remuxToMp4
- 使用 nlohmann::json 实现 `parseCommand()` / `serializeResponse()`
- 错误处理：malformed JSON 返回 `{"type":"error","msg":"..."}`

### 1.2 入口程序 (`native/src/main.cpp`)
- **关键**：`_setmode(_fileno(stdin), _O_BINARY)` + `_setmode(_fileno(stdout), _O_BINARY)` 防止 Windows 的 `\n` → `\r\n` 转换
- 启动后发送 `{"type":"status","state":"ready"}`
- 进入 `std::getline(std::cin, line)` 循环，解析 JSON 命令分发
- 每次 stdout 输出后 `std::flush`
- 所有调试日志走 stderr

### 1.3 时间戳工具 (`native/src/utils.h/cpp`)
- `getHighPrecisionTimestamp()`：使用 `GetSystemTimePreciseAsFileTime()` 返回毫秒
- `initHighResTimer()`：调用 `timeBeginPeriod(1)` 设置系统时钟 1ms 精度
- `cleanupHighResTimer()`：调用 `timeEndPeriod(1)` 恢复

### 验证标准
- 手动运行 exe，通过管道输入 JSON 命令，验证 stdout 输出合法 JSON
- 测试非法输入返回 error 响应

---

## Phase 2: C++ Native Core — 输入采集系统

### 2.1 事件结构定义 (`native/src/input_capture.h`)

```
MouseClickEvent: rawTime, x, y, button(1/2/3), isDown, altKey, ctrlKey, shiftKey, metaKey
KeyboardEvent:   rawTime, keycode, keyChar, isDown, altKey, ctrlKey, shiftKey, metaKey
MouseMoveEvent:  rawTime, x, y, dx, dy
```

三个无锁队列（`moodycamel::ReaderWriterQueue`，初始容量 4096）

### 2.2 全局 Hook (`native/src/input_capture.cpp`)

- **Hook 线程**：专用线程安装 `WH_KEYBOARD_LL` + `WH_MOUSE_LL`
  - 必须运行消息泵 `GetMessage/DispatchMessage`（否则 Hook 不触发）
  - 通过 `PostThreadMessage(WM_QUIT)` 停止
- **键盘回调**：
  - 使用 `GetSystemTimePreciseAsFileTime` 取时间戳（**禁止用** `KBDLLHOOKSTRUCT.time`）
  - 通过 `GetAsyncKeyState` 获取修饰键状态
  - 将事件入队无锁队列，**禁止在回调中做 I/O**（否则超时被系统摘除）
- **鼠标回调**：
  - 仅处理 `WM_LBUTTONDOWN/UP`、`WM_RBUTTONDOWN/UP`、`WM_MBUTTONDOWN/UP`
  - 忽略 `WM_MOUSEMOVE`（由轮询线程处理）
- **DPI 设置**：进程启动时调用 `SetProcessDpiAwarenessContext(DPI_AWARENESS_CONTEXT_PER_MONITOR_AWARE_V2)` 确保坐标为物理像素

### 2.3 鼠标轮询线程 (200Hz)

- 专用线程，`Sleep(5)` + `GetCursorPos` 循环
- 计算 dx/dy = 当前位置 - 上次位置
- 入队 `MouseMoveEvent` 到无锁队列
- **关键**：依赖 Phase 1.3 的 `timeBeginPeriod(1)`，否则 `Sleep(5)` 实际约 15.6ms（仅 ~64Hz）

> **技术选型说明**：不使用 DirectInput（已废弃，仅提供相对位移需额外 `GetCursorPos`，且需 COM）。也不使用 Raw Input（增加复杂度但对本场景无额外收益）。`GetCursorPos` 轮询是最简单可靠的方案。

### 2.4 CSV 写入线程 (`native/src/csv_writer.h/cpp`)

- 单独线程消费三个无锁队列
- 计算相对时间：`relativeTime = rawTime - recordingStartTime - totalPausedDuration`
- 写入两个文件：
  - `actions.csv`：格式 `type,time,rawTime,x,y,button,keycode,keyChar,altKey,ctrlKey,shiftKey,metaKey`
  - `movements.csv`：格式 `time,rawTime,x,y,dx,dy`
- 缓冲写入，每 ~100ms flush 一次
- stop 时排空队列后关闭文件句柄

### 验证标准
- 运行采集 10 秒，验证 CSV 文件格式正确
- 分析时间戳确认轮询频率 ~200Hz
- 验证修饰键组合正确记录
- 验证相对时间从 0 开始递增

---

## Phase 3: C++ Native Core — OBS 录制集成

### 3.1 OBS 初始化 (`native/src/recorder.cpp`)

初始化顺序（严格按序）：
1. `obs_startup("en-US", nullptr, nullptr)`
2. `obs_reset_video(&ovi)` — D3D11 后端、NV12 格式、BT.709 色彩空间
3. `obs_reset_audio(&oai)` — 48kHz 立体声
4. `obs_add_data_path` + `obs_add_module_path` 指向 DLL 部署目录
5. `obs_load_all_modules()` + `obs_post_load_modules()` — **不调用此步则无编码器/源可用**

### 3.2 屏幕捕获源

- 使用 `monitor_capture`（DXGI Desktop Duplication）— 全屏低开销
- 创建 `obs_scene`，将源添加到场景
- `obs_set_output_source(0, scene_source)` 设为主视频通道

### 3.3 硬件编码器（降级链）

按优先级尝试创建，使用第一个成功的：
1. `jim_nvenc` (NVIDIA NVENC) — 最低 CPU 开销
2. `h264_texture_amf` (AMD AMF)
3. `obs_qsv11_v2` (Intel QSV)
4. `obs_x264` (软件回退，最后手段)

配置：`bitrate=15000`（2K60）或 `10000`（1080p60）、`rate_control=CBR`、`preset=Quality`、`profile=high`

### 3.4 音频采集（分轨）

- 系统音频：`wasapi_output_capture`（WASAPI 回环）→ `obs_set_output_source(1, ...)`
- 麦克风：`wasapi_input_capture` → `obs_set_output_source(3, ...)`
- 两个独立 AAC 编码器分别挂载到 output 的 track 0 和 track 1
- MKV 内多轨音频，录制完成后可用 ffmpeg 分离

### 3.5 输出（ffmpeg_muxer）

- 使用 `ffmpeg_muxer` 输出到 MKV（容错：崩溃后文件仍可用）
- 注册 `obs_output_get_signal_handler` 的 `"stop"` 信号用于确认停止完成
- 可选：stop 后调用 `ffmpeg -i input.mkv -c copy output.mp4` 转封装

### 3.6 录制生命周期

**start 流程**：
1. 初始化 OBS（如未初始化）
2. 创建源、场景、编码器、输出
3. `obs_output_start()` 开始录制
4. 记录 `recordingStartTime`
5. 启动 InputCapture + CSVWriter
6. stdout 发送 `{"type":"status","state":"recording"}`

**stop 流程**：
1. 停止 InputCapture + CSVWriter（排空队列）
2. `obs_output_stop()` 停止录制
3. 等待 output 不再 active
4. stdout 发送 `{"type":"finish","videoPath":"...","actionsPath":"...","movementsPath":"..."}`

**pause/resume**：
- `obs_output_pause(output, true/false)` — OBS 28+ 支持
- pause 时记录暂停起始时间
- resume 时累加暂停时长到 `g_totalPausedDuration`
- 确保视频相对时间戳与 CSV 相对时间戳保持对齐

### 3.7 所需 DLL 部署清单

```
recorder_core.exe
obs.dll, libobs-d3d11.dll, w32-pthreads.dll
avcodec-60.dll, avformat-60.dll, avutil-58.dll, swscale-7.dll, swresample-4.dll, zlib.dll
data/libobs/                     (着色器、LUT)
obs-plugins/64bit/
  win-capture.dll, obs-ffmpeg.dll, obs-qsv11.dll, win-wasapi.dll, obs-x264.dll
data/obs-plugins/
  win-capture/, obs-ffmpeg/
vcruntime140.dll, msvcp140.dll   (VC++ 运行时)
```

总部署体积约 80-120 MB。

### 验证标准
- 完整录制周期：start → 录制 30s → stop
- 视频文件 2K 60fps、码率 ≥10Mbps
- CPU 占用 <10%（使用硬件编码时）
- 音频双轨正常
- pause/resume 后时间戳对齐

---

## Phase 4: C++ Native Core — 系统信息 API

### 4.1 系统信息查询 (`native/src/system_info.h/cpp`)

查询内容：
- **显示器**：分辨率 (`EnumDisplaySettings`)、刷新率、DPI 缩放比例 (`GetDeviceCaps`)
- **CPU**：名称 (注册表 `HKLM\HARDWARE\DESCRIPTION\System\CentralProcessor\0`)
- **GPU**：名称 (DXGI `IDXGIFactory::EnumAdapters`)
- **内存**：总量 (`GlobalMemoryStatusEx`)
- **输入设备**：键盘/鼠标名称 (HID API)、鼠标轮询率

响应格式：
```json
{"type":"sysinfo","data":{"screenWidth":2560,"screenHeight":1440,"scalingFactor":1.0,"refreshRate":60,"cpuName":"...","gpuName":"...","ramGB":32,"mousePollingRate":1000}}
```

### 验证标准
- 发送 `{"action":"sysinfo"}` 命令，返回正确的系统信息 JSON

---

## Phase 5: Electron 主进程

### 5.1 入口 (`src/main/index.ts`)
- 创建 `BrowserWindow`（主窗口）
- 注册 IPC handlers
- 启动 `RecorderService`（spawn recorder_core.exe）
- 应用退出时调用 `RecorderService.destroy()`

### 5.2 RecorderService (`src/main/services/RecorderService.ts`)

核心职责：管理 recorder_core.exe 子进程生命周期

```typescript
// 关键实现要点：
spawn():
  - child_process.spawn(binPath, [], { stdio: ['pipe','pipe','pipe'], windowsHide: true })
  - readline.createInterface 逐行读取 stdout JSON
  - stderr 转发到 console.error 用于调试
  - 监听 exit 事件处理意外退出

send(command):
  - JSON.stringify(command) + '\n' 写入 stdin

handleMessage(msg):
  - 按 msg.type 分发：status → 更新状态、error → 报错、finish → 通知完成、sysinfo → 返回信息

stopRecording():
  - 发送 stop 命令
  - 等待 finish 响应（15s 超时）

destroy():
  - 发送 quit → 3s 后 force kill（Windows 上用 taskkill /PID /T /F）
```

### 5.3 IPC Handlers (`src/main/ipc/handlers.ts`)

注册 Electron IPC 处理器（renderer → main → native core）：

```typescript
ipcMain.handle('recorder:start', (_, config) => recorderService.send({action:'start', config}))
ipcMain.handle('recorder:stop',  () => recorderService.stopRecording())
ipcMain.handle('recorder:pause', () => recorderService.send({action:'pause'}))
ipcMain.handle('recorder:resume',() => recorderService.send({action:'resume'}))
ipcMain.handle('system:info',    () => recorderService.requestSysInfo())
```

### 5.4 窗口管理

**主窗口** (`src/main/windows/mainWindow.ts`)：
- 标准 BrowserWindow，加载 index.html

**悬浮窗** (`src/main/windows/overlayWindow.ts`)：
- `alwaysOnTop: true`
- `transparent: true`
- `frame: false`
- 小尺寸（如 300x120）
- OBS `monitor_capture` 默认使用 DXGI Desktop Duplication，**不会捕获** Electron 的窗口内容（仅捕获桌面合成层），但需要验证此行为
- 接收来自主进程的实时状态（分辨率、帧率、键鼠状态）
- 支持拖动（`-webkit-app-region: drag`）

### 验证标准
- Electron 启动后成功 spawn recorder_core.exe
- IPC 命令能到达 native core 并收到响应
- 悬浮窗显示且不被录入视频

---

## Phase 6: Preload Bridge

### 6.1 Context Bridge (`src/preload/index.ts`)

```typescript
contextBridge.exposeInMainWorld('electronAPI', {
  // 录制控制
  startRecording: (config) => ipcRenderer.invoke('recorder:start', config),
  stopRecording:  ()       => ipcRenderer.invoke('recorder:stop'),
  pauseRecording: ()       => ipcRenderer.invoke('recorder:pause'),
  resumeRecording:()       => ipcRenderer.invoke('recorder:resume'),

  // 系统信息
  getSystemInfo:  ()       => ipcRenderer.invoke('system:info'),

  // 事件监听
  onRecordingStatus: (cb)  => ipcRenderer.on('recording-status', (_, data) => cb(data)),
  onRecordingError:  (cb)  => ipcRenderer.on('recording-error', (_, data) => cb(data)),
  onRecordingFinish: (cb)  => ipcRenderer.on('recording-finished', (_, data) => cb(data)),
})
```

### 6.2 TypeScript 类型定义 (`src/renderer/src/types/index.ts`)

定义所有共享类型：`RecordingConfig`、`RecordingStatus`、`SystemInfo`、`FinishResult` 等。

---

## Phase 7: React 渲染进程

### 7.1 主页面 (`src/renderer/src/pages/MainPage.tsx`)
- 录制前：显示系统信息、配置选项（分辨率/帧率/保存路径/音频设置）
- 录制中：显示录制时长、暂停/停止按钮
- 录制后：显示生成的文件路径

### 7.2 悬浮窗页面 (`src/renderer/src/pages/OverlayPage.tsx`)
- 紧凑布局，透明背景
- 显示：分辨率、帧率、录制时长、键鼠最近活动状态
- 可拖动

### 7.3 自定义 Hook (`src/renderer/src/hooks/useRecorder.ts`)
- 封装所有 `window.electronAPI` 调用
- 管理录制状态机：idle → recording → paused → idle
- 错误处理

### 7.4 组件
- `RecordingControls.tsx`：开始/暂停/停止按钮组
- `SystemStatus.tsx`：系统信息展示面板

### 验证标准
- UI 能完成完整录制流程（配置 → 开始 → 暂停 → 恢复 → 停止 → 查看结果）
- 悬浮窗实时更新状态

---

## Phase 8: 集成测试与优化

### 8.1 端到端测试
- 完整录制流程：启动 → 系统检查 → 开始录制 → 操作键鼠 → 暂停 → 恢复 → 停止
- 验证产出文件：
  - video.mkv：2K 60fps、码率合格、音频双轨
  - actions.csv：格式正确、时间戳精确
  - movements.csv：~200Hz 采样率、时间戳精确
  - 视频第一帧时间与 CSV 首行时间对齐

### 8.2 异常场景
- 无硬件编码器时自动降级到 x264
- 录制过程中 exe 崩溃，Electron 正确处理
- 磁盘空间不足时的错误反馈

### 8.3 性能验证
- CPU 占用（硬件编码 <10%、软件编码 <60%）
- 内存占用
- 轮询频率实际达到 ~200Hz

---

## Phase 9: 构建与打包

### 9.1 C++ 构建
- CMake Release 构建
- 拷贝 exe + 所有 DLLs + data 文件到 `native/dist/`
- 验证 `native/dist/recorder_core.exe` 可独立运行

### 9.2 Electron 打包
- `electron-builder` 配置 `extraResources` 包含 `native/dist/`
- 代码签名（可选，但建议：全局 Hook 易被杀毒误报）
- 输出 NSIS 安装程序或 portable zip

### 9.3 `electron-builder.yml` 关键配置
```yaml
extraResources:
  - from: "native/dist/"
    to: "native/"
    filter: ["**/*"]
win:
  target: ["nsis", "portable"]
```

---

## 已知风险与注意事项

| 风险 | 影响 | 缓解措施 |
|------|------|---------|
| 杀毒软件误报全局 Hook | 用户无法使用 | 代码签名 + 杀毒白名单申请 |
| libobs API 不稳定 | 升级 OBS 版本可能 break | 锁定 OBS 30.x 版本 |
| 悬浮窗可能被录入 | 产品需求不满足 | 测试 DXGI DD 行为；必要时用 `SetWindowDisplayAffinity` 排除 |
| `timeBeginPeriod(1)` 增加功耗 | 笔记本续航降低 | 仅录制期间启用，stop 后 `timeEndPeriod(1)` |
| 多显示器场景 | 仅录主显示器 | 后续可扩展为选择指定显示器 |
| OBS 部署体积大 (80-120MB) | 安装包偏大 | 剥离不需要的插件（game capture 等） |
| DPI 缩放影响坐标 | 坐标与实际不符 | 启动时设置 `PER_MONITOR_AWARE_V2` |

---

## 实施顺序依赖图

```
Phase 0.0 (Claude Code 工具配置)
    ↓
Phase 0.1-0.3 (Git + Electron + C++ 环境初始化)
    ↓
Phase 1 (C++ 通讯骨架)
    ↓
Phase 2 (输入采集) ──→ Phase 3 (OBS 录制) ──→ Phase 4 (系统信息)
                              ↓
Phase 5 (Electron 主进程) ← ──┘
    ↓
Phase 6 (Preload Bridge)
    ↓
Phase 7 (React UI)
    ↓
Phase 8 (集成测试)
    ↓
Phase 9 (构建打包)
```

**关键说明**：
- Phase 0.0 必须最先完成（配置工具链）
- Phase 2 和 Phase 3 可以并行开发（独立模块），但 Phase 3 的录制生命周期需要集成 Phase 2 的输入采集
- 测试命令（/test-*）在各阶段完成后使用验证

---

## 工具链使用指南

### CLAUDE.md
为 Claude Code 提供项目上下文，确保 AI 理解项目架构和技术栈。每次会话开始时 Claude Code 会自动读取此文件。

### native-core-dev Agent
专门处理 C++ Native Core 开发任务。调用方式：
```
使用 native-core-dev agent 实现 input_capture.cpp
```

### Slash Commands
快速执行测试任务：
- `/test-protocol` - 测试 JSON 协议通讯
- `/test-recording` - 端到端录制测试
- `/test-input-capture` - 输入采集系统测试

### 项目设置
`.claude/settings.json` 配置了 CMake、npm 等命令的执行权限，确保构建流程顺畅。
