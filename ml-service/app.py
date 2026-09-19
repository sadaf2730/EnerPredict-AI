"""
app.py
FastAPI Microservice for AI/ML-Powered Energy Predictive Engine.
Exposes endpoints:
  - GET  /health   : Health check, model status, validation metrics summary
  - POST /predict  : Predicts daily energy (kWh) and peak demand (kW) from raw user-friendly input
"""

import os
import sys
import json
from typing import Dict, Any
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

# Windows console encoding safeguard
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

from predict import predict_energy_demand, load_artifacts

app = FastAPI(
    title="AI/ML Energy Predictive Insight Engine",
    version="1.0.0",
    description="Full-scale ML prediction engine for multi-facility electrical demand & peak insight."
)

# Enable CORS for future integration with Express backend / React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

METRICS_PATH = os.path.join(os.path.dirname(__file__), "metrics.json")

@app.on_event("startup")
def startup_event():
    """Pre-load model and preprocessor on service startup."""
    try:
        load_artifacts()
        print("Model and preprocessor loaded successfully on startup.")
    except Exception as e:
        print(f"Warning: Failed to preload artifacts: {e}")

@app.get("/")
def root_endpoint():
    """Root status endpoint for the ML service."""
    return {
        "status": "ok",
        "service": "AI/ML Energy Predictive Microservice",
        "version": "1.0.0",
        "endpoints": ["/health", "/predict"]
    }

@app.get("/health")
@app.get("/api/ml/health")
@app.get("/ml/health")
def health_check():
    """
    Returns service health, loaded ML model name, and validation metrics summary.
    """
    try:
        model, preprocessor = load_artifacts()
        model_loaded = True
        model_type = type(model).__name__
    except Exception as e:
        model_loaded = False
        model_type = None

    metrics_summary = {}
    if os.path.exists(METRICS_PATH):
        try:
            with open(METRICS_PATH, "r") as f:
                full_metrics = json.load(f)
                metrics_summary = {
                    "selected_model": full_metrics.get("selected_model", {}).get("model_name"),
                    "selection_reason": full_metrics.get("selected_model", {}).get("selection_reason"),
                    "overall_validation_R2": full_metrics.get("selected_model", {}).get("overall_metrics", {}).get("mean_R2"),
                    "test_period": full_metrics.get("evaluation_split", {}).get("test_period"),
                    "test_samples": full_metrics.get("evaluation_split", {}).get("test_samples"),
                }
        except Exception:
            pass

    return {
        "status": "healthy" if model_loaded else "degraded",
        "service": "AI/ML Energy Predictive Service",
        "model_loaded": model_loaded,
        "model_class": model_type,
        "metrics_summary": metrics_summary
    }

@app.post("/predict")
@app.post("/api/ml/predict")
@app.post("/ml/predict")
def predict_endpoint(payload: Dict[str, Any]):
    """
    Accepts raw user-friendly JSON parameters for any facility type:
      - home
      - society
      - office
      - college
      - function_hall

    Applies feature engineering -> preprocessor transform -> trained model inference -> insight generation.
    Returns complete energy predictions, peak demand, hourly profile, risk, and appliance breakdown.
    """
    try:
        prediction_result = predict_energy_demand(payload)
        return {
            "success": True,
            "data": prediction_result
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Prediction failed: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app:app", host="0.0.0.0", port=8000, reload=True)
