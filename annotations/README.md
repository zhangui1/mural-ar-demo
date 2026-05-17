# LabelMe 壁画对象标注说明

本目录用于保存 LabelMe 导出的壁画对象标注文件。V2 阶段只做精细标注和数据规范化，不接摄像头、数据库、AI 或 VITURE。

## 1. 安装 LabelMe

建议在 Windows PowerShell 中安装：

```powershell
pip install labelme
```

安装完成后启动：

```powershell
labelme
```

如果命令无法识别，可以尝试：

```powershell
python -m labelme
```

## 2. 打开壁画图片

在 LabelMe 中打开项目里的壁画图片：

```text
assets/murals/mural_001.jpg
```

如果当前项目使用的是 PNG 图片，则打开：

```text
assets/murals/mural_001.png
```

## 3. 使用 polygon 标注对象

1. 选择 LabelMe 的 `Create Polygons` 工具。
2. 沿着壁画中的人物、建筑、器物等对象边缘依次点击。
3. 标完一圈后闭合 polygon。
4. 每个可讲解对象单独标一个 polygon。

标注时尽量贴合对象轮廓，但不需要追求像素级完美。V2 的目标是形成稳定的数据流程，后续还能继续细修标注。

## 4. label 命名规则

每个对象的 label 必须尽量使用下面格式：

```text
对象名称|类别
```

示例：

```text
人物一|人物
建筑构件|建筑
瓷器一|器物
```

竖线 `|` 左侧是对象名称，右侧是对象类别。转换脚本会把它们分别写入 `name` 和 `category`。

如果忘记写 `|`，转换脚本会把整个 label 当作对象名称，并把类别设为 `未分类`。

## 5. 保存标注文件

保存 LabelMe JSON 时使用下面路径：

```text
annotations/mural_001_labelme.json
```

保存后不要直接手写改动 JSON。需要调整对象轮廓时，优先回到 LabelMe 中重新打开图片和 JSON 文件再编辑。
