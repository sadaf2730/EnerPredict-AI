"""
predict.py
Inference engine that loads the trained machine learning model and preprocessor.
Accepts raw user-friendly inputs, transforms them through feature engineering,
and generates real-time predictions without hardcoding or dataset lookups.

Includes:
  - Prediction of daily_energy_consumption_kwh and peak_demand_kw
  - Dynamic hourly profile & peak window derivation
  - Data-driven peak risk calculation
  - Estimated appliance/equipment contribution breakdown (with AC-hour explanation)
  - Estimated daily & monthly cost projections
"""

import os
import sys
import joblib
import numpy as np
import pandas as pd
from typing import Dict, Any

# Ensure UTF-8 output on Windows consoles
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

from feature_engineering import (
    engineer_features_dict,
    ALL_FEATURE_COLUMNS,
    TARIFF_PER_UNIT
)

MODEL_DIR = os.path.dirname(__file__)
MODEL_PATH = os.path.join(MODEL_DIR, "model.pkl")
PREPROCESSOR_PATH = os.path.join(MODEL_DIR, "preprocessor.pkl")

# Cached model & preprocessor instances
_model = None
_preprocessor = None

def load_artifacts():
    global _model, _preprocessor
    if _model is None or _preprocessor is None:
        if not os.path.exists(MODEL_PATH) or not os.path.exists(PREPROCESSOR_PATH):
            raise FileNotFoundError("Trained model or preprocessor artifacts not found. Run train_model.py first.")
        _model = joblib.load(MODEL_PATH)
        _preprocessor = joblib.load(PREPROCESSOR_PATH)
    return _model, _preprocessor

def calculate_hourly_profile_and_peak_window(facility_type: str, peak_kw: float, daily_kwh: float, raw_data: Dict[str, Any]) -> tuple[dict, str]:
    """
    Computes a realistic 24-hour demand profile (00:00 to 23:00) based on
    operating hours, equipment usage, and diurnal solar/temperature cycles.
    Then derives the highest-demand period (predicted_peak_window) mathematically.
    """
    fac = facility_type.lower()
    temp = float(raw_data.get("temperature", 30.0))
    hours = np.arange(24)
    weights = np.zeros(24)

    # Base shape across 24 hours depending on facility physics
    if fac == "office":
        work_h = float(raw_data.get("working_hours", 9.0))
        start_h = 9
        end_h = min(22, int(start_h + work_h))
        for h in range(24):
            if start_h <= h <= end_h:
                # Solar / heat peak occurs 13:00 to 15:30
                heat_boost = 1.0 + 0.35 * np.exp(-0.5 * ((h - 14.5) / 2.0) ** 2)
                weights[h] = 0.75 * heat_boost
            elif h in [start_h - 1, end_h + 1]:
                weights[h] = 0.35
            else:
                # Night server & security baseload
                weights[h] = 0.15
    elif fac == "society":
        # Society peaks in morning (lifts/pumps) and evening (lighting/lifts/AC)
        for h in range(24):
            morning_peak = 0.85 * np.exp(-0.5 * ((h - 8.0) / 1.5) ** 2)
            evening_peak = 0.95 * np.exp(-0.5 * ((h - 20.0) / 2.0) ** 2)
            afternoon_pump = 0.60 * np.exp(-0.5 * ((h - 14.0) / 1.5) ** 2)
            weights[h] = max(0.20, morning_peak, evening_peak, afternoon_pump)
    elif fac == "college":
        exam = bool(raw_data.get("exam_period", False))
        event = bool(raw_data.get("campus_event", False))
        for h in range(24):
            if 8 <= h <= 17:
                midday_boost = 1.0 + 0.30 * np.exp(-0.5 * ((h - 13.0) / 2.2) ** 2)
                weights[h] = 0.75 * midday_boost
            elif (exam or event) and (17 < h <= 21):
                weights[h] = 0.55
            else:
                weights[h] = 0.15
    elif fac == "function_hall":
        dur = float(raw_data.get("event_duration_hours", raw_data.get("event_duration", 0.0)))
        has_event = dur > 0 or raw_data.get("event_type", "None") not in ["None", "none", ""]
        if has_event:
            # Main reception/wedding peak in evening 19:00 - 23:00
            for h in range(24):
                if 18 <= h <= 23:
                    weights[h] = 0.90 + 0.10 * np.sin((h - 18) / 5.0 * np.pi)
                elif 14 <= h < 18:
                    weights[h] = 0.60 # setup, pre-cooling
                elif 11 <= h < 14:
                    weights[h] = 0.40 # catering prep
                else:
                    weights[h] = 0.08
        else:
            weights[:] = 0.08
    else: # Home
        for h in range(24):
            morning = 0.60 * np.exp(-0.5 * ((h - 7.5) / 1.5) ** 2)
            evening = 1.00 * np.exp(-0.5 * ((h - 20.5) / 2.0) ** 2)
            afternoon_ac = 0.70 * np.exp(-0.5 * ((h - 14.0) / 1.8) ** 2) if float(raw_data.get("ac_hours", 0)) > 6 else 0.2
            weights[h] = max(0.18, morning, evening, afternoon_ac)

    # Normalize weights so that the maximum weight matches peak_kw
    max_w = np.max(weights)
    if max_w > 0:
        hourly_kw = (weights / max_w) * peak_kw
    else:
        hourly_kw = np.full(24, peak_kw)

    hourly_profile = {f"{h:02d}:00": round(float(hourly_kw[h]), 2) for h in range(24)}

    # Find the top 3-4 consecutive hours of highest demand to compute predicted_peak_window
    window_size = 3
    rolling_loads = [sum(hourly_kw[i:(i + window_size)]) for i in range(24 - window_size + 1)]
    best_start = int(np.argmax(rolling_loads))
    best_end = best_start + window_size
    predicted_peak_window = f"{best_start:02d}:00 - {best_end:02d}:00"

    return hourly_profile, predicted_peak_window

def calculate_peak_risk(predicted_demand_kw: float, raw_data: Dict[str, Any]) -> str:
    """
    Computes peak risk (Low, Medium, High) mathematically based on predicted peak
    relative to previous baseline or estimated connection capacity.
    """
    prev_peak = float(raw_data.get("previous_peak", 0.0))
    prev_bill = float(raw_data.get("previous_bill", 0.0))
    prev_units = float(raw_data.get("previous_units", 0.0) or 0.0)

    # Baseline peak proxy
    if prev_peak > 0:
        baseline_kw = prev_peak
    elif prev_bill > 0:
        # Implied historical daily kWh / 8 hours effective load
        implied_daily_kwh = (prev_bill / TARIFF_PER_UNIT) / 30.0
        baseline_kw = implied_daily_kwh / 6.0
    elif prev_units > 0:
        baseline_kw = (prev_units / 30.0) / 6.0
    else:
        # Fallback to facility nominal load threshold
        fac = str(raw_data.get("facility_type", "home")).lower()
        if fac == "home":
            baseline_kw = 5.0
        elif fac == "society":
            baseline_kw = 45.0
        elif fac == "office":
            baseline_kw = 35.0
        elif fac == "college":
            baseline_kw = 60.0
        else:
            baseline_kw = 40.0

    ratio = predicted_demand_kw / max(0.5, baseline_kw)

    # Risk thresholding:
    # High: demand exceeds baseline by >= 15% or high stress
    # Medium: demand within 85% to 115% of baseline
    # Low: demand below 85% of baseline
    if ratio >= 1.15:
        return "High"
    elif ratio >= 0.85:
        return "Medium"
    else:
        return "Low"

def calculate_estimated_contributions(facility_type: str, predicted_kwh: float, raw_data: Dict[str, Any]) -> dict:
    """
    Calculates estimated percentage & kWh contribution breakdown per appliance/system.
    Clearly labeled as 'Estimated contribution' per requirements.
    Includes AC-hours explanation feature (Req 5).
    """
    fac = facility_type.lower()
    temp = float(raw_data.get("temperature", 30.0))
    ac_units = float(raw_data.get("ac_units", 0))
    ac_hours = float(raw_data.get("ac_hours", 0))
    combined_ac_hours = ac_units * ac_hours

    # AC explanation text per Requirement 5
    ac_explanation = {
        "ac_units": int(ac_units),
        "ac_hours_per_day": round(ac_hours, 1),
        "combined_ac_hours": round(combined_ac_hours, 1),
        "summary": f"Your ACs were used for approximately {round(combined_ac_hours, 1)} combined AC-hours.",
        "disclaimer": "Estimated AC contribution. Actual consumption depends on AC capacity, star efficiency, ambient temperature, thermostat setting, and room insulation."
    }

    breakdown = {}
    if fac == "office":
        comps = float(raw_data.get("computers", 0))
        comp_h = float(raw_data.get("computer_hours", 8))
        emp = float(raw_data.get("employees", 10))
        has_serv = bool(raw_data.get("server_active", True))

        ac_est = combined_ac_hours * (2.0 + 0.04 * max(0, temp - 24))
        comp_est = comps * comp_h * 0.15
        server_est = ((emp * 0.045) + (3.0 if has_serv else 0.0)) * 24.0
        light_est = emp * float(raw_data.get("lighting_hours", 9.0)) * 0.04
        other_est = max(5.0, predicted_kwh * 0.08)

        total_est = max(1.0, ac_est + comp_est + server_est + light_est + other_est)
        breakdown = {
            "AC / HVAC": round(ac_est / total_est * predicted_kwh, 2),
            "Computers & Workstations": round(comp_est / total_est * predicted_kwh, 2),
            "Server Room & Infrastructure": round(server_est / total_est * predicted_kwh, 2),
            "Lighting & Ventilation": round(light_est / total_est * predicted_kwh, 2),
            "Other Equipment & Elevators": round(other_est / total_est * predicted_kwh, 2)
        }
    elif fac == "society":
        lifts = float(raw_data.get("lifts", 2))
        pumps = float(raw_data.get("pumps", 2))
        pump_h = float(raw_data.get("pump_hours", 6))
        flats = float(raw_data.get("total_flats", 50))
        ev_pts = float(raw_data.get("ev_points", 0))

        pump_est = pumps * pump_h * 5.5
        lift_est = lifts * 5.8 * 8.0
        light_est = flats * float(raw_data.get("common_lighting_hours", 10)) * 0.05
        ev_est = ev_pts * float(raw_data.get("ev_usage_hours", 0)) * 3.3
        other_est = max(10.0, flats * 0.3)

        total_est = max(1.0, pump_est + lift_est + light_est + ev_est + other_est)
        breakdown = {
            "Water Pumps": round(pump_est / total_est * predicted_kwh, 2),
            "Elevators / Lifts": round(lift_est / total_est * predicted_kwh, 2),
            "Common Area & Corridor Lighting": round(light_est / total_est * predicted_kwh, 2),
            "EV Charging Points": round(ev_est / total_est * predicted_kwh, 2),
            "Clubhouse, Security & Gate": round(other_est / total_est * predicted_kwh, 2)
        }
    elif fac == "college":
        comps = float(raw_data.get("computers", 50))
        comp_h = float(raw_data.get("computer_hours", 5))
        labs = float(raw_data.get("labs", 6))
        lab_h = float(raw_data.get("lab_hours", 4))
        classrooms = float(raw_data.get("classrooms", 20))
        hostel = float(raw_data.get("hostel_occupancy", 0))

        ac_est = combined_ac_hours * 2.2
        comp_est = comps * comp_h * 0.13
        lab_est = labs * lab_h * 3.4
        class_est = classrooms * 4.0
        hostel_est = hostel * 1.8
        other_est = max(10.0, predicted_kwh * 0.08)

        total_est = max(1.0, ac_est + comp_est + lab_est + class_est + hostel_est + other_est)
        breakdown = {
            "Air Conditioning": round(ac_est / total_est * predicted_kwh, 2),
            "Computer Labs": round(comp_est / total_est * predicted_kwh, 2),
            "Science & Engineering Labs": round(lab_est / total_est * predicted_kwh, 2),
            "Classrooms & Campus Lighting": round(class_est / total_est * predicted_kwh, 2),
            "Hostels & Administration": round((hostel_est + other_est) / total_est * predicted_kwh, 2)
        }
    elif fac == "function_hall":
        ac_est = combined_ac_hours * 2.4
        guests = float(raw_data.get("expected_guests", 0))
        dur = float(raw_data.get("event_duration_hours", 0))
        light_est = float(raw_data.get("decorative_lighting_hours", 0)) * 18.0 * max(0.3, guests / 500.0)
        cater_est = 18.0 * dur * 0.5 if raw_data.get("catering_active") else 0.0
        sound_est = 6.0 * dur * 0.6 if raw_data.get("sound_system_active") else 0.0
        other_est = max(5.0, predicted_kwh * 0.05)

        total_est = max(1.0, ac_est + light_est + cater_est + sound_est + other_est)
        breakdown = {
            "Central AC & Cooling": round(ac_est / total_est * predicted_kwh, 2),
            "Decorative & Stage Lighting": round(light_est / total_est * predicted_kwh, 2),
            "Catering Equipment": round(cater_est / total_est * predicted_kwh, 2),
            "Sound & Audio-Visual Systems": round(sound_est / total_est * predicted_kwh, 2),
            "Base Infrastructure & Standby": round(other_est / total_est * predicted_kwh, 2)
        }
    else: # Home
        fans = float(raw_data.get("fan_units", 3))
        fan_h = float(raw_data.get("fan_hours", 10))
        geyser_h = float(raw_data.get("geyser_hours", 0.5))
        wm_h = float(raw_data.get("washing_machine_hours", 0.5))
        ev_h = float(raw_data.get("ev_charging_hours", 0))

        ac_est = combined_ac_hours * (1.35 + 0.02 * max(0, temp - 26))
        fan_est = fans * fan_h * 0.07
        geyser_est = geyser_h * 2.0
        fridge_est = 2.2
        wm_est = wm_h * 0.75
        ev_est = ev_h * 3.3
        other_est = max(2.0, predicted_kwh * 0.08)

        total_est = max(1.0, ac_est + fan_est + geyser_est + fridge_est + wm_est + ev_est + other_est)
        breakdown = {
            "Air Conditioning": round(ac_est / total_est * predicted_kwh, 2),
            "Geyser / Water Heater": round(geyser_est / total_est * predicted_kwh, 2),
            "Fans & Ambient Cooling": round(fan_est / total_est * predicted_kwh, 2),
            "Refrigerator": round(fridge_est / total_est * predicted_kwh, 2),
            "Washing Machine & Appliances": round(wm_est / total_est * predicted_kwh, 2),
            "EV Charger & Other Electronics": round((ev_est + other_est) / total_est * predicted_kwh, 2)
        }

    # Percentages
    breakdown_percentages = {k: round(v / max(0.1, predicted_kwh) * 100.0, 1) for k, v in breakdown.items()}

    return {
        "estimated_kwh_contributions": breakdown,
        "estimated_percentage_contributions": breakdown_percentages,
        "ac_feature_details": ac_explanation,
        "label": "Estimated contribution (not an exact utility meter measurement)"
    }

def predict_energy_demand(raw_input: Dict[str, Any]) -> Dict[str, Any]:
    """
    Main prediction pipeline:
    raw input -> feature engineering -> preprocessor transform -> trained model -> prediction
    """
    model, preprocessor = load_artifacts()

    # 1. Feature Engineering
    engineered_dict = engineer_features_dict(raw_input)
    df_features = pd.DataFrame([engineered_dict])[ALL_FEATURE_COLUMNS]

    # 2. Preprocessor transform
    X_prep = preprocessor.transform(df_features)

    # 3. Model Prediction
    preds = model.predict(X_prep)
    predicted_daily_kwh = float(round(max(0.5, preds[0, 0]), 2))
    predicted_demand_kw = float(round(max(0.2, preds[0, 1]), 2))

    # 4. Hourly Profile & Peak Window
    hourly_profile, peak_window = calculate_hourly_profile_and_peak_window(
        engineered_dict["facility_type"],
        predicted_demand_kw,
        predicted_daily_kwh,
        raw_input
    )

    # 5. Peak Risk
    peak_risk = calculate_peak_risk(predicted_demand_kw, raw_input)

    # 6. Appliance Contribution Breakdown
    contributions = calculate_estimated_contributions(
        engineered_dict["facility_type"],
        predicted_daily_kwh,
        raw_input
    )

    # 7. Estimated Costs
    estimated_daily_cost = round(predicted_daily_kwh * TARIFF_PER_UNIT, 2)
    estimated_monthly_cost = round(estimated_daily_cost * 30.0, 2)

    return {
        "facility_type": engineered_dict["facility_type"],
        "predicted_daily_consumption_kwh": predicted_daily_kwh,
        "predicted_demand_kw": predicted_demand_kw,
        "expected_peak_kw": predicted_demand_kw,
        "peak_risk": peak_risk,
        "predicted_peak_window": peak_window,
        "estimated_daily_cost": estimated_daily_cost,
        "estimated_monthly_cost": estimated_monthly_cost,
        "tariff_rate_assumed": f"INR {TARIFF_PER_UNIT}/kWh (Estimated)",
        "estimated_appliance_breakdown": contributions,
        "hourly_demand_profile_kw": hourly_profile
    }

if __name__ == "__main__":
    # Smoke test on a raw sample
    sample = {
        "facility_type": "office",
        "employees": 100,
        "employees_present": 90,
        "computers": 100,
        "computer_hours": 8,
        "ac_units": 10,
        "ac_hours": 8,
        "working_hours": 9,
        "temperature": 32,
        "previous_bill": 80000
    }
    result = predict_energy_demand(sample)
    print("Test Prediction Output:")
    print(result)
