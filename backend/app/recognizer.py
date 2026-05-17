"""V3 单张壁画识别逻辑。"""

import cv2
import numpy as np

from app.config import (
    CONFIDENCE_MATCH_TARGET,
    GOOD_MATCH_DISTANCE,
    MAX_REFERENCE_IMAGE_WIDTH,
    MIN_GOOD_MATCHES,
    MURAL_ID,
    ORB_FEATURE_COUNT,
    REFERENCE_MURAL_CANDIDATES,
)


class ReferenceImageError(RuntimeError):
    """参考壁画缺失或无法读取时抛出，方便 API 返回清晰错误。"""


class MuralRecognizer:
    """负责加载参考壁画，后续阶段会继续加入 OpenCV 识别。"""

    def __init__(self):
        self.mural_id = MURAL_ID
        self.orb = cv2.ORB_create(nfeatures=ORB_FEATURE_COUNT)
        self.matcher = cv2.BFMatcher(cv2.NORM_HAMMING, crossCheck=True)
        self.reference_image_path = self._find_reference_image_path()
        self.reference_image = self._load_reference_image()
        self.reference_gray = self._prepare_image(self.reference_image)
        self.reference_keypoints, self.reference_descriptors = self._extract_features(self.reference_gray)

        if self.reference_descriptors is None or len(self.reference_keypoints) == 0:
            raise ReferenceImageError(f"参考壁画无法提取 ORB 特征：{self.reference_image_path}")

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

    def _prepare_image(self, image):
        gray_image = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
        height, width = gray_image.shape[:2]

        # 参考壁画原图可能很大，缩放后提特征可以让 Windows 本地启动更稳定。
        if width <= MAX_REFERENCE_IMAGE_WIDTH:
            return gray_image

        scale = MAX_REFERENCE_IMAGE_WIDTH / width
        target_size = (MAX_REFERENCE_IMAGE_WIDTH, int(height * scale))
        return cv2.resize(gray_image, target_size, interpolation=cv2.INTER_AREA)

    def _extract_features(self, gray_image):
        keypoints, descriptors = self.orb.detectAndCompute(gray_image, None)
        return keypoints or [], descriptors

    def recognize(self, frame_image):
        frame_gray = self._prepare_image(frame_image)
        frame_keypoints, frame_descriptors = self._extract_features(frame_gray)

        if frame_descriptors is None or len(frame_keypoints) == 0:
            return self._build_result(False, 0.0, 0)

        matches = self.matcher.match(self.reference_descriptors, frame_descriptors)
        good_matches = [
            match
            for match in matches
            if match.distance <= GOOD_MATCH_DISTANCE
        ]
        good_match_count = len(good_matches)
        confidence = min(good_match_count / CONFIDENCE_MATCH_TARGET, 1.0)
        matched = good_match_count >= MIN_GOOD_MATCHES

        return self._build_result(matched, confidence, good_match_count)

    def recognize_bytes(self, image_bytes):
        image_array = np.frombuffer(image_bytes, dtype=np.uint8)
        frame_image = cv2.imdecode(image_array, cv2.IMREAD_COLOR)

        if frame_image is None:
            raise ValueError("上传文件不是可读取的图片。")

        return self.recognize(frame_image)

    def _build_result(self, matched, confidence, good_matches):
        return {
            "matched": matched,
            "mural_id": self.mural_id if matched else None,
            "confidence": round(confidence, 2),
            "good_matches": good_matches,
        }
