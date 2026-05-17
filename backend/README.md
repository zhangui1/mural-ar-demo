# V3 本地识别后端

本目录用于 V3 Web 摄像头识别后端。技术路线是 FastAPI + OpenCV，先在 Windows 本地识别普通摄像头画面中是否出现 `mural_001`。

## 启动方式

先进入后端目录：

```powershell
cd backend
```

创建并激活 Python 虚拟环境：

```powershell
python -m venv .venv
.\.venv\Scripts\activate
```

安装依赖：

```powershell
pip install -r requirements.txt
```

启动本地识别服务：

```powershell
uvicorn app.main:app --reload --port 8010
```

启动后，后续阶段会通过下面地址访问识别接口：

```text
http://localhost:8010
```

`.venv` 是本地环境目录，不需要提交到 GitHub。
