"""V3 本地识别后端配置。"""

from pathlib import Path


MURAL_ID = "mural_001"
BACKEND_DIR = Path(__file__).resolve().parents[1]
PROJECT_DIR = BACKEND_DIR.parent
REFERENCE_MURAL_CANDIDATES = [
    PROJECT_DIR / "assets" / "murals" / "mural_001.jpg",
    PROJECT_DIR / "assets" / "murals" / "mural_001.png",
]
