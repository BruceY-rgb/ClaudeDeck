# Whole Body Tracking 训练时间优化方案

## 项目概述
- **项目**: BeyondMimic Motion Tracking (whole_body_tracking)
- **技术栈**: IsaacLab 2.1.0 + Isaac Sim 4.5.0 + Python 3.10 + RL (PPO)
- **目标**: 优化训练时间，构建轻量级虚拟测试环境

## 项目结构分析
```
whole_body_tracking/
├── source/whole_body_tracking/whole_body_tracking/
│   ├── tasks/tracking/          # 任务定义 (MDP)
│   │   ├── mdp/                # 奖励/观测/终止条件 (torch计算)
│   │   ├── config/             # 环境配置 (G1, Humanoid)
│   │   └── tracking_env_cfg.py # 主配置
│   ├── robots/                  # 机器人定义
│   └── utils/                  # 工具函数
├── scripts/
│   ├── rsl_rl/train.py         # 训练入口 (依赖 Isaac Sim)
│   └── rsl_rl/play.py          # 评估入口
└── LAFAN1_Retargeting_Dataset/ # 数据集
```

## 关键发现
1. **训练瓶颈**: Isaac Sim 物理模拟 + 渲染 (需要 GPU)
2. **MDP 计算**: 使用 PyTorch 向量化计算，可独立于 Sim
3. **环境数量**: 默认 4096 个并行环境 (`num_envs=4096`)
4. **时间步**: `dt=0.005`, `decimation=4` → 每步模拟 0.02s

## 方案设计

### 方案一：Mock 环境测试平台（推荐）
创建轻量级 Mock 环境，跳过 Isaac Sim 物理模拟：

#### 核心组件
1. **MockEnv 类**: 模拟 `gym.make(task)` 接口
2. **简化物理引擎**: 用 NumPy 实现简化版状态更新
3. **保留 MDP 逻辑**: 直接调用现有的 rewards.py/observations.py
4. **Mock 传感器**: 模拟 contact_forces 等传感器数据

#### 优势
- 无需 GPU/Isaac Sim
- 可在本地笔记本运行
- 保留完整训练循环
- 快速迭代算法改动

#### 实现位置
```
source/whole_body_tracking/whole_body_tracking/envs/
├── mock_env.py              # Mock 环境类
├── mock_robot.py             # 简化机器人模型
└── __init__.py               # 导出
```

### 方案二：算法层面优化（补充）
1. **减少环境数量**: `num_envs=4096` → `num_envs=512`
2. **简化观测空间**: 减少 body 数量计算
3. **编译优化**: 使用 `torch.compile()`
4. **混合精度**: FP16 训练

### 方案三：分布式训练
1. 多 GPU 并行训练
2. 使用 IsaacLab 内置的分布式支持

## 实施计划

### Phase 1: Mock 环境核心
- [ ] 创建 MockRobot 类（简化关节模型）
- [ ] 创建 MockEnv 类（兼容 gym 接口）
- [ ] 实现简化物理步进（action → state）

### Phase 2: MDP 集成
- [ ] 复用现有 rewards.py 计算
- [ ] 复用现有 observations.py
- [ ] 复用现有 commands.py

### Phase 3: 训练循环
- [ ] 修改 train.py 支持 Mock 模式
- [ ] 添加 `--mock` 命令行参数
- [ ] 验证训练收敛性

### Phase 4: 优化
- [ ] 添加 torch.compile 加速
- [ ] 可配置精度选项

## 关键文件
- `scripts/rsl_rl/train.py` - 训练入口（需修改）
- `source/whole_body_tracking/whole_body_tracking/tasks/tracking/tracking_env_cfg.py` - 环境配置
- `source/whole_body_tracking/whole_body_tracking/tasks/tracking/mdp/rewards.py` - 奖励函数（复用）
- `source/whole_body_tracking/whole_body_tracking/tasks/tracking/mdp/observations.py` - 观测函数（复用）
- `source/whole_body_tracking/whole_body_tracking/tasks/tracking/mdp/commands.py` - 命令模块（复用）

## 用户需求（已确认）
- **兼容性**: 需要与 Isaac Sim 兼容，训练结果可直接部署
- **使用场景**: 综合需求（算法调试 + 流程验证）

## 最终方案

### 核心设计：双模式训练
1. **Mock 模式**: 本地快速调试（无需 GPU/Isaac Sim）
2. **Isaac Sim 模式**: 正式训练和部署

### 架构
```
                    ┌─────────────────────┐
                    │   train.py          │
                    │   (双模式入口)       │
                    └─────────┬───────────┘
                              │
              ┌───────────────┴───────────────┐
              │                               │
    ┌─────────▼─────────┐          ┌──────────▼──────────┐
    │   MockEnv        │          │   IsaacLab Env      │
    │ (轻量模拟)        │          │ (完整物理模拟)       │
    └─────────┬─────────┘          └──────────┬──────────┘
              │                               │
    ┌─────────▼─────────┐          ┌──────────▼──────────┐
    │  MDP (复用)       │          │  MDP (复用)          │
    │ rewards.py        │          │ rewards.py           │
    │ observations.py   │          │ observations.py      │
    └───────────────────┘          └──────────────────────┘
```

### 实现要点
- MockEnv 模拟与 IsaacLab 相同的接口
- 奖励函数、观测函数完全复用
- 通过 `--mock` 参数切换模式
- 训练结果可直接在 Isaac Sim 上验证
