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


def main():
    args = parse_args()
    image_width, image_height, polygon_shapes = load_labelme_json(args.input_json)
    print(f"Image size: {image_width} x {image_height}")
    print(f"Polygon shapes: {len(polygon_shapes)}")


if __name__ == "__main__":
    main()
