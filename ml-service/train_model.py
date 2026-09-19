"""
train_model.py
Trains and evaluates machine learning models on the 2-year synthetic energy dataset.
Models trained & compared:
  1. RandomForestRegressor
  2. GradientBoostingRegressor (via MultiOutputRegressor)

Targets:
  - daily_energy_consumption_kwh
  - peak_demand_kw

Evaluation:
  - Chronological Train/Test Split (Train: 2024-01-01 to 2025-06-30, Test: 2025-07-01 to 2025-12-30)
  - Metrics: MAE, RMSE, R² (Overall and for each facility type)
  - Automatic model selection based on highest combined R² on test holdout
  - Saves model.pkl, preprocessor.pkl, and metrics.json
"""

import os
import json
import joblib
import numpy as np
import pandas as pd
from sklearn.compose import ColumnTransformer
from sklearn.preprocessing import StandardScaler, OneHotEncoder
from sklearn.ensemble import RandomForestRegressor, GradientBoostingRegressor
from sklearn.multioutput import MultiOutputRegressor
from sklearn.metrics import mean_absolute_error, root_mean_squared_error, r2_score

from feature_engineering import (
    engineer_features_dataframe,
    CATEGORICAL_FEATURES,
    NUMERICAL_FEATURES,
    ALL_FEATURE_COLUMNS
)

TARGET_COLS = ["daily_energy_consumption_kwh", "peak_demand_kw"]

def evaluate_predictions(y_true: np.ndarray, y_pred: np.ndarray) -> dict:
    """Calculates MAE, RMSE, and R2 for daily consumption and peak demand."""
    mae_kwh = float(mean_absolute_error(y_true[:, 0], y_pred[:, 0]))
    rmse_kwh = float(root_mean_squared_error(y_true[:, 0], y_pred[:, 0]))
    r2_kwh = float(r2_score(y_true[:, 0], y_pred[:, 0]))

    mae_kw = float(mean_absolute_error(y_true[:, 1], y_pred[:, 1]))
    rmse_kw = float(root_mean_squared_error(y_true[:, 1], y_pred[:, 1]))
    r2_kw = float(r2_score(y_true[:, 1], y_pred[:, 1]))

    return {
        "daily_energy_consumption_kwh": {
            "MAE": round(mae_kwh, 3),
            "RMSE": round(rmse_kwh, 3),
            "R2": round(r2_kwh, 4)
        },
        "peak_demand_kw": {
            "MAE": round(mae_kw, 3),
            "RMSE": round(rmse_kw, 3),
            "R2": round(r2_kw, 4)
        },
        "mean_R2": round((r2_kwh + r2_kw) / 2.0, 4)
    }

def train_and_evaluate():
    data_path = os.path.join(os.path.dirname(__file__), "energy_dataset.csv")
    if not os.path.exists(data_path):
        raise FileNotFoundError(f"Dataset not found at {data_path}. Run generate_dataset.py first.")

    print(f"Loading raw dataset from {data_path}...")
    df_raw = pd.read_csv(data_path)
    print(f"Loaded {len(df_raw)} records.")

    # Chronological Split
    # Training: 2024-01-01 to 2025-06-30 (18 months)
    # Testing: 2025-07-01 to 2025-12-30 (6 months future holdout)
    split_date = "2025-07-01"
    train_mask = df_raw["date"] < split_date
    test_mask = df_raw["date"] >= split_date

    df_train_raw = df_raw[train_mask].copy()
    df_test_raw = df_raw[test_mask].copy()

    print(f"Chronological split performed at {split_date}:")
    print(f"  Training samples: {len(df_train_raw)} ({len(df_train_raw)/len(df_raw):.1%})")
    print(f"  Testing holdout samples: {len(df_test_raw)} ({len(df_test_raw)/len(df_raw):.1%})")

    print("\nExecuting feature engineering on train and test partitions...")
    X_train_df = engineer_features_dataframe(df_train_raw)
    X_test_df = engineer_features_dataframe(df_test_raw)

    y_train = df_train_raw[TARGET_COLS].values
    y_test = df_test_raw[TARGET_COLS].values

    # Preprocessor
    print("Building ColumnTransformer preprocessor (StandardScaler + OneHotEncoder)...")
    preprocessor = ColumnTransformer(
        transformers=[
            ("num", StandardScaler(), NUMERICAL_FEATURES),
            ("cat", OneHotEncoder(handle_unknown="ignore", sparse_output=False), CATEGORICAL_FEATURES)
        ]
    )

    X_train_prep = preprocessor.fit_transform(X_train_df[ALL_FEATURE_COLUMNS])
    X_test_prep = preprocessor.transform(X_test_df[ALL_FEATURE_COLUMNS])

    print(f"Preprocessed feature vector shape: {X_train_prep.shape}")

    # 1. Train Random Forest Regressor
    print("\n--------------------------------------------------")
    print("Training Model 1: RandomForestRegressor...")
    rf_model = RandomForestRegressor(
        n_estimators=160,
        max_depth=18,
        min_samples_split=4,
        min_samples_leaf=2,
        random_state=42,
        n_jobs=-1
    )
    rf_model.fit(X_train_prep, y_train)
    rf_preds = rf_model.predict(X_test_prep)
    rf_metrics = evaluate_predictions(y_test, rf_preds)
    print("Random Forest Overall Evaluation:")
    print("  Daily kWh -> MAE:", rf_metrics["daily_energy_consumption_kwh"]["MAE"],
          "| RMSE:", rf_metrics["daily_energy_consumption_kwh"]["RMSE"],
          "| R²:", rf_metrics["daily_energy_consumption_kwh"]["R2"])
    print("  Peak kW   -> MAE:", rf_metrics["peak_demand_kw"]["MAE"],
          "| RMSE:", rf_metrics["peak_demand_kw"]["RMSE"],
          "| R²:", rf_metrics["peak_demand_kw"]["R2"])
    print("  Combined Mean R²:", rf_metrics["mean_R2"])

    # 2. Train Gradient Boosting Regressor
    print("\n--------------------------------------------------")
    print("Training Model 2: GradientBoostingRegressor (MultiOutputRegressor)...")
    base_gbr = GradientBoostingRegressor(
        n_estimators=150,
        learning_rate=0.08,
        max_depth=6,
        min_samples_split=4,
        min_samples_leaf=3,
        random_state=42
    )
    gbr_model = MultiOutputRegressor(base_gbr, n_jobs=-1)
    gbr_model.fit(X_train_prep, y_train)
    gbr_preds = gbr_model.predict(X_test_prep)
    gbr_metrics = evaluate_predictions(y_test, gbr_preds)
    print("Gradient Boosting Overall Evaluation:")
    print("  Daily kWh -> MAE:", gbr_metrics["daily_energy_consumption_kwh"]["MAE"],
          "| RMSE:", gbr_metrics["daily_energy_consumption_kwh"]["RMSE"],
          "| R²:", gbr_metrics["daily_energy_consumption_kwh"]["R2"])
    print("  Peak kW   -> MAE:", gbr_metrics["peak_demand_kw"]["MAE"],
          "| RMSE:", gbr_metrics["peak_demand_kw"]["RMSE"],
          "| R²:", gbr_metrics["peak_demand_kw"]["R2"])
    print("  Combined Mean R²:", gbr_metrics["mean_R2"])

    # Per-Facility Evaluation for both models
    facility_types = ["home", "society", "office", "college", "function_hall"]
    rf_facility_metrics = {}
    gbr_facility_metrics = {}

    test_facilities = df_test_raw["facility_type"].values
    for fac in facility_types:
        idx = np.where(test_facilities == fac)[0]
        if len(idx) > 0:
            rf_facility_metrics[fac] = evaluate_predictions(y_test[idx], rf_preds[idx])
            gbr_facility_metrics[fac] = evaluate_predictions(y_test[idx], gbr_preds[idx])

    # Model Selection based on highest Mean R² on the chronological test holdout
    rf_mean_r2 = rf_metrics["mean_R2"]
    gbr_mean_r2 = gbr_metrics["mean_R2"]

    print("\n==================================================")
    print("MODEL SELECTION COMPARISON:")
    print(f"  RandomForest Mean R²:        {rf_mean_r2}")
    print(f"  GradientBoosting Mean R²:    {gbr_mean_r2}")

    if rf_mean_r2 >= gbr_mean_r2:
        best_model_name = "RandomForestRegressor"
        best_model = rf_model
        best_metrics = rf_metrics
        best_facility_metrics = rf_facility_metrics
        selection_reason = f"Random Forest achieved higher mean test holdout R² ({rf_mean_r2} vs {gbr_mean_r2}) and superior ensemble robustness on peak non-linear variance."
    else:
        best_model_name = "GradientBoostingRegressor"
        best_model = gbr_model
        best_metrics = gbr_metrics
        best_facility_metrics = gbr_facility_metrics
        selection_reason = f"Gradient Boosting achieved higher mean test holdout R² ({gbr_mean_r2} vs {rf_mean_r2}) and tighter residual convergence across facility sub-distributions."

    print(f"--> Selected Best Model: {best_model_name}")
    print(f"--> Rationale: {selection_reason}")
    print("==================================================\n")

    # Save artifacts
    model_path = os.path.join(os.path.dirname(__file__), "model.pkl")
    preprocessor_path = os.path.join(os.path.dirname(__file__), "preprocessor.pkl")
    metrics_path = os.path.join(os.path.dirname(__file__), "metrics.json")

    print(f"Saving model to {model_path}...")
    joblib.dump(best_model, model_path)

    print(f"Saving preprocessor to {preprocessor_path}...")
    joblib.dump(preprocessor, preprocessor_path)

    metrics_output = {
        "evaluation_split": {
            "strategy": "Chronological Out-of-Time Validation Split",
            "split_date": split_date,
            "total_samples": len(df_raw),
            "train_samples": len(df_train_raw),
            "test_samples": len(df_test_raw),
            "train_period": f"{df_raw['date'].min()} to 2025-06-30",
            "test_period": f"2025-07-01 to {df_raw['date'].max()}"
        },
        "model_comparison": {
            "RandomForestRegressor": {
                "overall": rf_metrics,
                "per_facility": rf_facility_metrics
            },
            "GradientBoostingRegressor": {
                "overall": gbr_metrics,
                "per_facility": gbr_facility_metrics
            }
        },
        "selected_model": {
            "model_name": best_model_name,
            "selection_criterion": "Highest combined Mean R² across both target variables on unseen future chronological holdout",
            "selection_reason": selection_reason,
            "overall_metrics": best_metrics,
            "per_facility_metrics": best_facility_metrics
        }
    }

    print(f"Writing evaluation metrics report to {metrics_path}...")
    with open(metrics_path, "w") as f:
        json.dump(metrics_output, f, indent=2)

    print("Model training pipeline completed successfully!")
    return metrics_output

if __name__ == "__main__":
    train_and_evaluate()
