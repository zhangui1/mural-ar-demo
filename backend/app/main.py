from fastapi import FastAPI

from app.config import MURAL_ID


app = FastAPI(title="Mural Recognition Backend")


@app.get("/api/health")
def health_check():
    return {
        "status": "ok",
        "mural_id": MURAL_ID,
    }
