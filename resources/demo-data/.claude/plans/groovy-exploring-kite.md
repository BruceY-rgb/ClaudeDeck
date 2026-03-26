# WHAM 项目执行计划 - 使用官方PyTorch3D渲染器

## 目标

使用WHAM官方推荐的PyTorch3D渲染器处理视频。

---

## 执行计划

### 步骤 1：在终端（你的电脑）创建Python 3.9环境

在**你的终端**执行：

```bash
# 1. 初始化conda
source ~/miniconda3/etc/profile.d/conda.sh

# 2. 创建Python 3.9环境（如果还没有）
conda create -n wham python=3.9 -y

# 3. 激活环境
conda activate wham

# 4. 验证Python版本
python --version  # 应该是 3.9.x
```

### 步骤 2：安装PyTorch和PyTorch3D

```bash
# 5. 安装PyTorch 1.11.0
conda install pytorch==1.11.0 torchvision==0.12.0 -c pytorch

# 6. 安装PyTorch3D（官方渲染器核心依赖）
pip install pytorch3d -f https://dl.fbaipublicfiles.com/pytorch3d/packaging/wheels/py39_cu113_pyt1110/download.html
```

### 步骤 3：安装WHAM其他依赖

```bash
# 7. 安装WHAM依赖
pip install -r requirements.txt

# 8. 安装ViTPose（人体检测）
pip install -v -e third-party/ViTPose

# 9. 安装chumpy（SMPL依赖）
pip install chumpy@git+https://github.com/mattloper/chumpy
```

### 步骤 4：运行WHAM处理视频

```bash
# 10. 进入WHAM目录
cd /Users/yangsmac/Desktop/motion_rendering/WHAM

# 11. 处理视频（使用官方渲染器）
python demo.py --video input/video.mp4 --visualize --save_pkl
```

---

## 预期输出

运行成功后，会在以下位置生成文件：
- `output/video/output.mp4` - 渲染后的视频
- `output/video/wham_output.pkl` - SMPL运动数据

---

## 关键依赖说明

| 依赖 | 版本 | 用途 |
|------|------|------|
| Python | 3.9 | 运行环境 |
| PyTorch | 1.11.0 | 深度学习框架 |
| PyTorch3D | - | 3D渲染（官方渲染器） |
| chumpy | git版本 | SMPL模型依赖 |
| ViTPose | - | 人体姿态检测 |
