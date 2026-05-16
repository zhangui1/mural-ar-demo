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
