# Mural AR Demo

文物壁画 AR 导览 Web 原型。第一版用于在 Windows 本地浏览器中演示“点击壁画对象后出现类 AR 导览效果”的交互流程。

## 当前阶段

本项目当前只实现 Windows 本地 Web 原型，方便后续迁移到 VITURE 设备或其它 AR 展示方案。

## 当前功能

- 加载一张本地壁画图片；
- 读取 `data/objects.json` 中的对象标注；
- 在壁画上绘制 polygon 热区；
- 鼠标悬停时显示对象名称；
- 点击对象后进入聚焦模式；
- 对象高亮、背景变暗并轻微模糊；
- 显示对象信息卡片；
- 从对象到卡片生成放射状粒子光束；
- 最多同时打开两个对象卡片；
- 支持单独关闭卡片；
- 支持上一个 / 下一个对象切换；
- 支持 LabelMe JSON 转换脚本。

## 暂不包含

- VITURE SDK
- 摄像头
- 自动识别
- Unity
- 数据库
- AI 问答
- 语音讲解

## 技术栈

- HTML
- CSS
- JavaScript
- 本地 JSON
- Python 标注转换脚本

## 运行方式

先进入项目根目录：

```powershell
cd "F:\zhi yuan\Viture\mural_ar_demo"
```

然后启动本地静态服务：

```powershell
python -m http.server 8000
```

然后用浏览器访问：

```text
http://localhost:8000
```

如果本机 `localhost` 不通，可以访问：

```text
http://127.0.0.1:8000
```

不建议直接双击 `index.html` 打开页面，因为页面需要通过 `fetch` 加载本地 JSON 文件。直接用文件方式打开时，浏览器可能会因为本地文件访问限制导致 JSON 加载失败。

壁画图片请放在：

```text
assets/murals/
```

支持以下文件名之一：

```text
mural_001.jpg
mural_001.png
```

## 替换壁画图片

把新的壁画图片放入：

```text
assets/murals/
```

并命名为下面任意一种：

```text
mural_001.jpg
mural_001.png
```

建议优先使用压缩后的 `mural_001.jpg`。如果图片超过 GitHub 普通单文件 100 MB 限制，不要直接提交到普通 Git 仓库。

替换图片后，原来的 polygon 坐标通常会错位。原因是 `data/objects.json` 里的 `polygon`、`anchor`、`cardPosition` 都是基于当前图片位置和尺寸标注的。换成新图后，应重新用 LabelMe 标注并重新生成 `objects.json`。

## 如何标注壁画对象

V2 阶段使用 LabelMe 对壁画中的人物、建筑、器物等对象进行 polygon 精细标注。完整标注说明见：

[annotations/README.md](annotations/README.md)

## objects.json 字段说明

`data/objects.json` 是页面加载的对象标注数据。每个对象包含：

- `id`：对象唯一编号，例如 `obj_001`。不要重复。
- `name`：对象名称，显示在 tooltip 和信息卡片标题中。
- `category`：对象类别，显示在信息卡片上方，例如 `人物`、`建筑`、`器物`。
- `polygon`：对象轮廓点数组，使用 0 到 1 的归一化坐标。`[0.5, 0.3]` 表示图片宽度 50%、高度 30% 的位置。
- `anchor`：光束从对象发出的锚点位置，也使用归一化坐标。通常位于对象中心或重要视觉点附近。
- `cardPosition`：信息卡片的初始位置，也使用归一化坐标。可以手动微调用来避开主体画面。
- `summary`：信息卡片中的简介文字。

如果只想修改文案，通常只需要改 `name`、`category`、`summary`。如果对象轮廓不准，需要重新调整 `polygon`，并同步检查 `anchor` 和 `cardPosition`。

## LabelMe 标注流程

1. 安装 LabelMe。
2. 用 LabelMe 打开当前壁画图片。
3. 使用 polygon 工具沿对象轮廓标注。
4. 每个对象的 label 建议写成：

```text
名称|类别
```

例如：

```text
中央主尊|人物
建筑元素|建筑
器物元素|器物
```

5. 保存 LabelMe JSON。建议放在本地 `annotations/` 目录。
6. 运行转换脚本：

```powershell
python tools/labelme_to_objects.py annotations/mural_001.json data/objects.json
```

7. 启动本地服务，刷新页面检查 polygon、卡片和光束是否对齐。

图片、标注 JSON、转换后的 `data/objects.json` 可以只作为本地数据使用。如果文件较大或只是本地测试数据，不需要提交到 GitHub。

## 常见问题

### 1. 为什么直接打开 index.html 可能无法加载 JSON？

页面使用 `fetch` 加载 `data/mural.json` 和 `data/objects.json`。直接双击 `index.html` 时，浏览器可能会限制本地文件读取，导致 JSON 加载失败。请使用 `python -m http.server 8000` 启动本地服务。

### 2. 如何用 python -m http.server 启动？

在项目根目录运行：

```powershell
python -m http.server 8000
```

然后访问 `http://localhost:8000` 或 `http://127.0.0.1:8000`。

### 3. polygon 不对齐怎么办？

先确认图片是否被替换过。如果换过图片，需要重新标注。也可以检查 `data/objects.json` 中的 `polygon` 是否使用 0 到 1 的归一化坐标。

### 4. 图片替换后为什么对象位置错了？

对象坐标是基于原图标注的。新图片的尺寸、裁切、内容位置不同，都会导致原坐标错位，所以替换图片后应重新用 LabelMe 标注。

### 5. 如何调整信息卡片位置？

修改 `data/objects.json` 中对应对象的 `cardPosition`。`x` 越大越靠右，`y` 越大越靠下。

### 6. 如何修改发光颜色？

在 `style.css` 中搜索 `.object-polygon.is-active`、`.connector-light-cone`、`.connector-particle`，调整其中的 `rgba(...)` 颜色即可。

### 7. git push 失败怎么办？

先运行 `git status`，确认没有误提交大文件或本地数据。如果提示单文件超过 100 MB，不要把大图直接提交到普通 GitHub 仓库，可以改用压缩图片或 Git LFS。

### 8. GitHub 仓库为空怎么办？

确认已经绑定远程仓库并推送：

```powershell
git remote -v
git push -u origin main
```

如果远程地址不对，用 `git remote set-url origin 仓库地址` 修正后再推送。
