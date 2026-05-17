"""V3 本地识别后端配置。"""

from pathlib import Path


MURAL_ID = "mural_001"
ORB_FEATURE_COUNT = 2000
MAX_REFERENCE_IMAGE_WIDTH = 1600
GOOD_MATCH_DISTANCE = 64
MIN_GOOD_MATCHES = 24
CONFIDENCE_MATCH_TARGET = 90
BACKEND_DIR = Path(__file__).resolve().parents[1]
PROJECT_DIR = BACKEND_DIR.parent
REFERENCE_MURAL_CANDIDATES = [
    PROJECT_DIR / "assets" / "murals" / "mural_001.png",
    PROJECT_DIR / "assets" / "murals" / "mural_001.jpg",
]
