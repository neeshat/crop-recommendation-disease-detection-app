import os
from pathlib import Path

import joblib
import pandas as pd
import requests
from dotenv import load_dotenv
from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field


BASE_DIR = Path(__file__).resolve().parent.parent

MODEL_PATH = (
    BASE_DIR
    / "model"
    / "crop_recommendation_model.pkl"
)

load_dotenv()

PLANTNET_API_KEY = os.getenv("PLANTNET_API_KEY")

try:
    crop_model = joblib.load(MODEL_PATH)
except Exception as error:
    raise RuntimeError(
        f"Failed to load crop recommendation model: {error}"
    )


app = FastAPI(
    title="Crop Recommendation and Disease Detection API",
    description="API for crop recommendation and plant disease detection.",
    version="1.0.0",
)


app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:5174",
        "https://cradd.netlify.app",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class CropInput(BaseModel):
    N: float = Field(..., ge=0)
    P: float = Field(..., ge=0)
    K: float = Field(..., ge=0)
    temperature: float
    humidity: float = Field(..., ge=0, le=100)
    ph: float = Field(..., ge=0, le=14)
    rainfall: float = Field(..., ge=0)


@app.get("/")
def root():
    return {
        "message": (
            "Crop Recommendation and Disease Detection API is running."
        )
    }


@app.get("/health")
def health():
    return {
        "status": "ok",
        "crop_model_loaded": True,
        "plantnet_configured": bool(PLANTNET_API_KEY),
    }


@app.post("/predict")
def predict_crop(data: CropInput):
    try:
        input_data = pd.DataFrame(
            [
                {
                    "N": data.N,
                    "P": data.P,
                    "K": data.K,
                    "temperature": data.temperature,
                    "humidity": data.humidity,
                    "ph": data.ph,
                    "rainfall": data.rainfall,
                }
            ]
        )

        prediction = crop_model.predict(input_data)[0]

        probabilities = crop_model.predict_proba(
            input_data
        )[0]

        classes = crop_model.classes_

        ranked_predictions = sorted(
            zip(classes, probabilities),
            key=lambda item: item[1],
            reverse=True,
        )

        top_predictions = [
            {
                "crop": crop,
                "confidence": round(
                    float(probability),
                    4,
                ),
            }
            for crop, probability in ranked_predictions[:3]
        ]

        return {
            "recommended_crop": prediction,
            "confidence": round(
                float(max(probabilities)),
                4,
            ),
            "top_predictions": top_predictions,
        }

    except Exception as error:
        raise HTTPException(
            status_code=500,
            detail=f"Crop prediction failed: {str(error)}",
        )


@app.post("/disease/predict")
async def predict_disease(
    image: UploadFile = File(...)
):
    if not PLANTNET_API_KEY:
        raise HTTPException(
            status_code=500,
            detail="Pl@ntNet API key is not configured.",
        )

    allowed_types = {
        "image/jpeg",
        "image/png",
    }

    if image.content_type not in allowed_types:
        raise HTTPException(
            status_code=400,
            detail="Only JPG and PNG images are supported.",
        )

    image_bytes = await image.read()

    max_file_size = 5 * 1024 * 1024

    if len(image_bytes) > max_file_size:
        raise HTTPException(
            status_code=400,
            detail="Image size must be less than 5 MB.",
        )

    files = {
        "images": (
            image.filename,
            image_bytes,
            image.content_type,
        )
    }

    data = {
        "organs": "leaf",
    }

    params = {
        "api-key": PLANTNET_API_KEY,
        "nb-results": 3,
        "lang": "en",
    }

    api_url = (
        "https://my-api.plantnet.org"
        "/v2/diseases/identify"
    )

    try:
        response = requests.post(
            api_url,
            params=params,
            files=files,
            data=data,
            timeout=60,
        )

        if not response.ok:
            try:
                api_error = response.json()
            except Exception:
                api_error = response.text

            raise HTTPException(
                status_code=response.status_code,
                detail=str(api_error),
            )

        api_result = response.json()

        results = api_result.get(
            "results",
            [],
        )

        if not results:
            return {
                "disease": None,
                "confidence": 0,
                "results": [],
                "message": (
                    "No probable disease was identified "
                    "from this image."
                ),
            }

        formatted_results = []

        for item in results[:3]:
            formatted_results.append(
                {
                    "disease": (
                        item.get("label")
                        or item.get("name")
                        or "Unknown disease"
                    ),
                    "confidence": round(
                        float(
                            item.get(
                                "score",
                                0,
                            )
                        ),
                        4,
                    ),
                    "eppo_code": item.get(
                        "name"
                    ),
                }
            )

        top_result = formatted_results[0]

        return {
            "disease": top_result["disease"],
            "confidence": top_result["confidence"],
            "results": formatted_results,
            "remaining_requests": api_result.get(
                "remainingIdentificationRequests"
            ),
        }

    except requests.RequestException as error:
        raise HTTPException(
            status_code=502,
            detail=(
                "Unable to connect to the Pl@ntNet API: "
                f"{str(error)}"
            ),
        )