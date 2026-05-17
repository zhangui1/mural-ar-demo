"""V3 单张壁画识别逻辑。"""

import cv2

from app.config import MURAL_ID, REFERENCE_MURAL_CANDIDATES


class ReferenceImageError(RuntimeError):
    """参考壁画缺失或无法读取时抛出，方便 API 返回清晰错误。"""


class MuralRecognizer:
    """负责加载参考壁画，后续阶段会继续加入 OpenCV 识别。"""

    def __init__(self):
        self.mural_id = MURAL_ID
        self.reference_image_path = self._find_reference_image_path()
        self.reference_image = self._load_reference_image()

    def _find_reference_image_path(self):
        for image_path in REFERENCE_MURAL_CANDIDATES:
            if image_path.exists():
                return image_path

        candidates = "\n".join(str(path) for path in REFERENCE_MURAL_CANDIDATES)
        raise ReferenceImageError(f"找不到参考壁画图片，请确认以下路径至少存在一个：\n{candidates}")

    def _load_reference_image(self):
        # OpenCV 读取失败时会返回 None，这里提前报错，避免后续识别阶段难以定位问题。
        image = cv2.imread(str(self.reference_image_path))

        if image is None:
            raise ReferenceImageError(f"参考壁画图片无法读取：{self.reference_image_path}")

        return image
