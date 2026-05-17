import argparse
import json
from pathlib import Path


DEFAULT_SUMMARY = "该对象是壁画中的重要视觉元素，后续将补充更准确的文物说明。"
DEFAULT_CATEGORY = "未分类"
COORDINATE_PRECISION = 6
SUPPORTED_SHAPE_TYPE = "polygon"
USAGE_EXAMPLE = (
    "python tools/labelme_to_objects.py "
    "annotations/mural_001_labelme.json data/objects.json"
)


def parse_args():
    parser = argparse.ArgumentParser(
        description="Convert LabelMe polygon annotations to mural demo objects.json.",
        epilog=f"Example: {USAGE_EXAMPLE}"
    )
    parser.add_argument("input_json", help="Path to LabelMe JSON file.")
    parser.add_argument("output_json", help="Path to output objects.json file.")
    return parser.parse_args()


def load_labelme_json(input_path):
    with open(input_path, "r", encoding="utf-8-sig") as file:
        labelme_data = json.load(file)

    image_width = labelme_data["imageWidth"]
    image_height = labelme_data["imageHeight"]
    ensure_positive_image_size(image_width, image_height)
    shapes = labelme_data.get("shapes", [])
    polygon_shapes = collect_polygon_shapes(shapes)

    return image_width, image_height, polygon_shapes


def ensure_positive_image_size(image_width, image_height):
    if image_width <= 0 or image_height <= 0:
        raise ValueError("LabelMe JSON 中的 imageWidth 和 imageHeight 必须大于 0。")


def collect_polygon_shapes(shapes):
    polygon_shapes = []

    for shape in shapes:
        shape_type = shape.get("shape_type")
        label = shape.get("label", "")
        points = shape.get("points", [])

        # LabelMe 旧文件可能没有 shape_type；这种情况按 polygon 处理。
        if not points or (shape_type not in (SUPPORTED_SHAPE_TYPE, None)):
            continue

        polygon_shapes.append({
            "label": label,
            "points": points
        })

    return polygon_shapes


def normalize_point(point, image_width, image_height):
    # 前端统一读取 0~1 坐标，保留 6 位小数方便人工检查 diff。
    x = round(point[0] / image_width, COORDINATE_PRECISION)
    y = round(point[1] / image_height, COORDINATE_PRECISION)
    return [x, y]


def normalize_polygon(points, image_width, image_height):
    return [
        normalize_point(point, image_width, image_height)
        for point in points
    ]


def convert_shapes_to_polygons(image_width, image_height, polygon_shapes):
    polygons = []

    for shape in polygon_shapes:
        polygons.append(normalize_polygon(shape["points"], image_width, image_height))

    return polygons


def write_objects_json(output_path, objects):
    output_file = Path(output_path)
    output_file.parent.mkdir(parents=True, exist_ok=True)

    with open(output_file, "w", encoding="utf-8") as file:
        json.dump(objects, file, ensure_ascii=False, indent=2)
        file.write("\n")


def parse_label(label):
    label = str(label).strip()

    if "|" not in label:
        return label, DEFAULT_CATEGORY

    name, category = label.split("|", 1)
    # LabelMe 的 label 由人工输入，空类别统一收敛为“未分类”。
    return name.strip(), category.strip() or DEFAULT_CATEGORY


def convert_shapes_to_basic_objects(image_width, image_height, polygon_shapes):
    objects = []

    for index, shape in enumerate(polygon_shapes, start=1):
        name, category = parse_label(shape.get("label", f"对象{index}"))
        polygon = normalize_polygon(shape["points"], image_width, image_height)
        anchor = build_anchor(polygon)
        objects.append({
            "id": f"obj_{index:03d}",
            "name": name,
            "category": category,
            "polygon": polygon,
            "anchor": anchor,
            "cardPosition": build_card_position(anchor),
            "summary": DEFAULT_SUMMARY
        })

    return objects


def build_anchor(polygon):
    point_count = len(polygon)
    anchor_x = sum(point[0] for point in polygon) / point_count
    anchor_y = sum(point[1] for point in polygon) / point_count
    return [round(anchor_x, 6), round(anchor_y, 6)]


def build_card_position(anchor):
    card_x = min(anchor[0] + 0.18, 0.82)
    card_y = max(anchor[1] - 0.08, 0.08)
    return [round(card_x, 6), round(card_y, 6)]


def main():
    args = parse_args()
    image_width, image_height, polygon_shapes = load_labelme_json(args.input_json)
    objects = convert_shapes_to_basic_objects(image_width, image_height, polygon_shapes)
    write_objects_json(args.output_json, objects)
    print(f"Converted {len(objects)} objects.")
    print(f"Output: {args.output_json}")


if __name__ == "__main__":
    main()
