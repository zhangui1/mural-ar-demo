import argparse
import json
import sys


REQUIRED_FIELDS = [
    "id",
    "name",
    "category",
    "polygon",
    "anchor",
    "cardPosition",
    "summary",
]
POINT_FIELDS = ["anchor", "cardPosition"]


def parse_args():
    parser = argparse.ArgumentParser(
        description="Validate mural demo objects.json structure and coordinates."
    )
    parser.add_argument("objects_json", help="Path to objects.json file.")
    return parser.parse_args()


def load_objects(path):
    with open(path, "r", encoding="utf-8-sig") as file:
        return json.load(file)


def validate_objects(objects):
    errors = []

    if not isinstance(objects, list):
        return ["根节点必须是对象数组。"]

    seen_ids = set()

    for index, object_item in enumerate(objects, start=1):
        label = f"第 {index} 个对象"

        if not isinstance(object_item, dict):
            errors.append(f"{label} 必须是 object。")
            continue

        validate_required_fields(object_item, label, errors)
        validate_unique_id(object_item, label, seen_ids, errors)
        validate_polygon(object_item.get("polygon"), label, errors)

        for field_name in POINT_FIELDS:
            validate_point(object_item.get(field_name), f"{label}.{field_name}", errors)

    return errors


def validate_required_fields(object_item, label, errors):
    for field_name in REQUIRED_FIELDS:
        if field_name not in object_item:
            errors.append(f"{label} 缺少字段：{field_name}")


def validate_unique_id(object_item, label, seen_ids, errors):
    object_id = object_item.get("id")

    if not object_id:
        errors.append(f"{label}.id 不能为空。")
        return

    if object_id in seen_ids:
        errors.append(f"{label}.id 重复：{object_id}")
        return

    seen_ids.add(object_id)


def validate_polygon(polygon, label, errors):
    if not isinstance(polygon, list):
        errors.append(f"{label}.polygon 必须是数组。")
        return

    if len(polygon) < 3:
        errors.append(f"{label}.polygon 至少需要 3 个点。")

    for point_index, point in enumerate(polygon, start=1):
        validate_point(point, f"{label}.polygon[{point_index}]", errors)


def validate_point(point, label, errors):
    # 前端只接受归一化坐标：[x, y]，每个数值必须在 0~1 范围内。
    if not isinstance(point, list) or len(point) != 2:
        errors.append(f"{label} 必须是 [x, y] 两个数字。")
        return

    for axis, value in zip(("x", "y"), point):
        if not isinstance(value, (int, float)):
            errors.append(f"{label}.{axis} 必须是数字。")
            continue

        if value < 0 or value > 1:
            errors.append(f"{label}.{axis} 超出 0~1 范围：{value}")


def main():
    args = parse_args()

    try:
        objects = load_objects(args.objects_json)
    except (OSError, json.JSONDecodeError) as error:
        print(f"读取 JSON 失败：{error}", file=sys.stderr)
        return 1

    errors = validate_objects(objects)

    if errors:
        print("objects.json 校验失败：", file=sys.stderr)
        for error in errors:
            print(f"- {error}", file=sys.stderr)
        return 1

    print(f"objects.json 校验通过，共 {len(objects)} 个对象。")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
