# Mural AR Demo

文物壁画 AR 导览 Web 原型。

## 当前阶段

本项目当前只实现 Windows 本地 Web 原型。

暂不包含：
- VITURE SDK
- 摄像头
- 自动识别
- Unity
- 数据库
- AI 问答
- 语音讲解

## 运行方式

在项目根目录运行：

```powershell
python -m http.server 8000
```

然后用浏览器访问：

```text
http://localhost:8000
```

不建议直接双击 `index.html` 打开页面，因为后续加载本地 JSON 文件时，浏览器可能会因为本地文件访问限制导致加载失败。

壁画图片请放在：

```text
assets/murals/
```

支持以下文件名之一：

```text
mural_001.jpg
mural_001.png
```
