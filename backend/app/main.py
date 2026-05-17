from fastapi import FastAPI, File, HTTPException, UploadFile

from app.config import MURAL_ID
from app.recognizer import MuralRecognizer, ReferenceImageError


app = FastAPI(title="Mural Recognition Backend")
recognizer = None


@app.on_event("startup")
def load_recognizer():
    global recognizer
    recognizer = MuralRecognizer()


@app.get("/api/health")
def health_check():
    return {
        "status": "ok",
        "mural_id": MURAL_ID,
    }


@app.post("/api/recognize")
async def recognize_mural(file: UploadFile = File(...)):
    if recognizer is None:
        raise HTTPException(status_code=503, detail="识别器尚未初始化。")

    try:
        image_bytes = await file.read()
        return recognizer.recognize_bytes(image_bytes)
    except ValueError as error:
        raise HTTPException(status_code=400, detail=str(error)) from error
    except ReferenceImageError as error:
        raise HTTPException(status_code=500, detail=str(error)) from error
