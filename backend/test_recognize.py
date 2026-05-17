import argparse
import json
from pathlib import Path
from urllib import request


DEFAULT_API_URL = "http://localhost:8010/api/recognize"


def parse_args():
    parser = argparse.ArgumentParser(description="Upload a local image to the mural recognition API.")
    parser.add_argument("image_path", help="本地测试图片路径，例如 ..\\assets\\murals\\mural_001.png")
    parser.add_argument("--url", default=DEFAULT_API_URL, help="识别接口地址")
    return parser.parse_args()


def build_multipart_body(file_path, boundary):
    image_bytes = file_path.read_bytes()
    header = (
        f"--{boundary}\r\n"
        f'Content-Disposition: form-data; name="file"; filename="{file_path.name}"\r\n'
        "Content-Type: image/png\r\n\r\n"
    ).encode("utf-8")
    footer = f"\r\n--{boundary}--\r\n".encode("utf-8")
    return header + image_bytes + footer


def main():
    args = parse_args()
    image_path = Path(args.image_path)

    if not image_path.exists():
        raise SystemExit(f"测试图片不存在：{image_path}")

    boundary = "----mural-recognition-test"
    body = build_multipart_body(image_path, boundary)
    req = request.Request(
        args.url,
        data=body,
        method="POST",
        headers={
            "Content-Type": f"multipart/form-data; boundary={boundary}",
        },
    )

    # 这个脚本只上传用户指定的本地图片，用于人工验证本机后端接口。
    with request.urlopen(req, timeout=30) as response:
        result = json.loads(response.read().decode("utf-8"))

    print(json.dumps(result, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
