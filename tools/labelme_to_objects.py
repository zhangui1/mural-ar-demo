import argparse


def parse_args():
    parser = argparse.ArgumentParser(
        description="Convert LabelMe polygon annotations to mural demo objects.json."
    )
    parser.add_argument("input_json", help="Path to LabelMe JSON file.")
    parser.add_argument("output_json", help="Path to output objects.json file.")
    return parser.parse_args()


def main():
    args = parse_args()
    print(f"Input LabelMe JSON: {args.input_json}")
    print(f"Output objects JSON: {args.output_json}")


if __name__ == "__main__":
    main()
