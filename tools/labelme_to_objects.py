import argparse
import json


def parse_args():
    parser = argparse.ArgumentParser(
        description="Convert LabelMe polygon annotations to mural demo objects.json."
    )
    parser.add_argument("input_json", help="Path to LabelMe JSON file.")
    parser.add_argument("output_json", help="Path to output objects.json file.")
    return parser.parse_args()


def load_labelme_json(input_path):
    with open(input_path, "r", encoding="utf-8-sig") as file:
        labelme_data = json.load(file)

    image_width = labelme_data["imageWidth"]
    image_height = labelme_data["imageHeight"]
    shapes = labelme_data.get("shapes", [])
    polygon_shapes = []

    for shape in shapes:
        shape_type = shape.get("shape_type")
        points = shape.get("points")

        if points and (shape_type == "polygon" or shape_type is None):
            polygon_shapes.append(shape)

    return image_width, image_height, polygon_shapes


def normalize_point(point, image_width, image_height):
    x = round(point[0] / image_width, 6)
    y = round(point[1] / image_height, 6)
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


def parse_label(label):
    if "|" not in label:
        return label.strip(), "未分类"

    name, category = label.split("|", 1)
    return name.strip(), category.strip()


def convert_shapes_to_basic_objects(image_width, image_height, polygon_shapes):
    objects = []

    for index, shape in enumerate(polygon_shapes, start=1):
        name, category = parse_label(shape.get("label", f"对象{index}"))
        objects.append({
            "id": f"obj_{index:03d}",
            "name": name,
            "category": category,
            "polygon": normalize_polygon(shape["points"], image_width, image_height)
        })

    return objects


def main():
    args = parse_args()
    image_width, image_height, polygon_shapes = load_labelme_json(args.input_json)
    objects = convert_shapes_to_basic_objects(image_width, image_height, polygon_shapes)
    print(f"Image size: {image_width} x {image_height}")
    print(f"Polygon shapes: {len(polygon_shapes)}")
    print(json.dumps(objects, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
