"""
feature_engineering.py
Transforms user-friendly, non-technical facility inputs into rich, standardized
engineering features for training and real-time model inference.

Converts realistic user knowledge (e.g. number of ACs and hours run,
computers, previous bill in rupees, family members, guest count) into physical load indices.
Avoids requiring user knowledge of kW, kWh, or power factors.
"""

import numpy as np
import pandas as pd
from typing import Union, Dict, Any

TARIFF_PER_UNIT = 8.5  # Standard commercial/residential blended tariff assumption (₹/kWh)

def extract_raw_fields(data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Normalizes keys and handles default fallback values for raw user inputs.
    Supports non-technical user inputs and aliases.
    """
    facility_type = str(data.get("facility_type", "home")).lower().strip()
    if facility_type in ["housing_society", "residential_society"]:
        facility_type = "society"
    elif facility_type in ["corporate", "commercial"]:
        facility_type = "office"
    elif facility_type in ["banquet_hall", "banquet", "function"]:
        facility_type = "function_hall"
    elif facility_type in ["school", "university", "institute"]:
        facility_type = "college"

    # Default weather / contextual assumptions if not entered by user
    temp = float(data.get("temperature", 30.0))
    humidity = float(data.get("humidity", 55.0))
    season = str(data.get("season", "Summer" if temp >= 30 else ("Winter" if temp <= 22 else "Monsoon")))
    
    is_weekend = int(data.get("is_weekend", 0))
    is_holiday = int(data.get("is_holiday", 0))
    is_festival = int(data.get("is_festival", 0))
    
    prev_bill = float(data.get("previous_bill", 0.0))
    # If units explicitly provided, compute implied bill or use units
    prev_units = data.get("previous_units")
    if (prev_bill == 0.0 or prev_bill is None) and prev_units is not None and float(prev_units) > 0:
        prev_bill = float(prev_units) * TARIFF_PER_UNIT

    solar_available = int(bool(data.get("solar_available", 0)))
    solar_generation = float(data.get("solar_generation", 0.0))
    if solar_available and solar_generation == 0.0:
        # Default mild solar generation estimate based on facility scale
        solar_generation = 15.0

    return {
        "facility_type": facility_type,
        "temperature": temp,
        "humidity": humidity,
        "season": season,
        "is_weekend": is_weekend,
        "is_holiday": is_holiday,
        "is_festival": is_festival,
        "previous_bill": prev_bill,
        "solar_available": solar_available,
        "solar_generation": solar_generation,
        "previous_demand": float(data.get("previous_demand", 0.0)),
        "previous_peak": float(data.get("previous_peak", 0.0)),
        # Home
        "family_members": float(data.get("family_members", 0)),
        "fan_units": float(data.get("fan_units", 0)),
        "fan_hours": float(data.get("fan_hours", 0.0)),
        "refrigerator_units": float(data.get("refrigerator_units", 1 if facility_type == "home" else 0)),
        "geyser_hours": float(data.get("geyser_hours", 0.0)),
        "washing_machine_hours": float(data.get("washing_machine_hours", 0.0)),
        "tv_hours": float(data.get("tv_hours", 0.0)),
        "ev_charging": int(bool(data.get("ev_charging", 0))),
        "ev_charging_hours": float(data.get("ev_charging_hours", 0.0)),
        # Society
        "total_flats": float(data.get("total_flats", 0)),
        "occupied_flats": float(data.get("occupied_flats", data.get("total_flats", 0))),
        "residents": float(data.get("residents", 0)),
        "lifts": float(data.get("lifts", 0)),
        "lift_usage_level": float(data.get("lift_usage_level", 2)),
        "pumps": float(data.get("pumps", 0)),
        "pump_hours": float(data.get("pump_hours", 0.0)),
        "common_lighting_hours": float(data.get("common_lighting_hours", 0.0)),
        "gym_pool_active": int(bool(data.get("gym_pool_active", 0))),
        "ev_points": float(data.get("ev_points", 0)),
        "ev_usage_hours": float(data.get("ev_usage_hours", 0.0)),
        "cctv_active": int(bool(data.get("cctv_active", 1 if facility_type == "society" else 0))),
        # Office
        "employees": float(data.get("employees", 0)),
        "employees_present": float(data.get("employees_present", data.get("employees", 0))),
        "working_hours": float(data.get("working_hours", 8.0 if facility_type == "office" else 0.0)),
        "computers": float(data.get("computers", 0)),
        "computer_hours": float(data.get("computer_hours", 0.0)),
        "server_active": int(bool(data.get("server_active", 1 if facility_type == "office" else 0))),
        "server_hours": float(data.get("server_hours", 24.0 if data.get("server_active", 0) else 0.0)),
        "lighting_hours": float(data.get("lighting_hours", 0.0)),
        "heavy_equipment": int(bool(data.get("heavy_equipment", 0))),
        # College
        "students": float(data.get("students", 0)),
        "students_present": float(data.get("students_present", data.get("students", 0))),
        "classrooms": float(data.get("classrooms", 0)),
        "labs": float(data.get("labs", 0)),
        "lab_hours": float(data.get("lab_hours", 0.0)),
        "hostel_active": int(bool(data.get("hostel_active", 0))),
        "hostel_occupancy": float(data.get("hostel_occupancy", 0)),
        "exam_period": int(bool(data.get("exam_period", 0))),
        "campus_event": int(bool(data.get("campus_event", 0))),
        "event_duration_hours": float(data.get("event_duration_hours", 0.0)),
        # Function Hall
        "event_type": str(data.get("event_type", "None")),
        "expected_guests": float(data.get("expected_guests", 0)),
        "decorative_lighting_hours": float(data.get("decorative_lighting_hours", 0.0)),
        "catering_active": int(bool(data.get("catering_active", 0))),
        "sound_system_active": int(bool(data.get("sound_system_active", 0))),
        # Shared AC fields
        "ac_units": float(data.get("ac_units", 0)),
        "ac_hours": float(data.get("ac_hours", 0.0))
    }

def engineer_features_dict(raw: Dict[str, Any]) -> Dict[str, Any]:
    """
    Computes all engineered physical features from a single raw input dict.
    Returns feature dictionary ready for vectorization/preprocessing.
    """
    d = extract_raw_fields(raw)
    fac = d["facility_type"]
    temp = d["temperature"]
    ac_units = d["ac_units"]
    ac_hours = d["ac_hours"]

    # 1. Temperature & cooling factor
    temp_factor = max(0.0, (temp - 24.0) / 10.0)

    # 2. AC Load Index: units * hours * non-linear thermal demand
    ac_load_index = ac_units * ac_hours * (1.0 + 0.18 * temp_factor)

    # 3. Computer Load Index: count * operating hours
    comp_units = d["computers"]
    comp_hours = d["computer_hours"]
    computer_load_index = comp_units * comp_hours * 0.15

    # 4. Occupancy Ratio
    if fac == "office":
        tot = max(1.0, d["employees"])
        occupancy_ratio = min(1.5, d["employees_present"] / tot)
        scale_size = d["employees"]
    elif fac == "college":
        tot = max(1.0, d["students"])
        occupancy_ratio = min(1.5, d["students_present"] / tot)
        scale_size = d["students"]
    elif fac == "society":
        tot = max(1.0, d["total_flats"])
        occupancy_ratio = min(1.2, d["occupied_flats"] / tot)
        scale_size = d["total_flats"]
    elif fac == "function_hall":
        occupancy_ratio = min(2.0, d["expected_guests"] / 500.0)
        scale_size = d["expected_guests"]
    else: # Home
        occupancy_ratio = min(2.0, d["family_members"] / 4.0)
        scale_size = d["family_members"]

    # 5. HVAC Load Index: AC load coupled with occupancy scale
    hvac_load_index = ac_load_index * (0.5 + 0.5 * max(0.1, occupancy_ratio))

    # 6. Lighting Load Index
    if fac == "office":
        lighting_load_index = d["employees_present"] * d["lighting_hours"] * 0.04
    elif fac == "society":
        lighting_load_index = d["total_flats"] * d["common_lighting_hours"] * 0.05
    elif fac == "college":
        lighting_load_index = (d["classrooms"] * 3.5) + (35.0 if d["campus_event"] else 0.0)
    elif fac == "function_hall":
        lighting_load_index = d["decorative_lighting_hours"] * 18.0 * max(0.2, d["expected_guests"] / 400.0)
    else: # Home
        lighting_load_index = (d["family_members"] * 1.5) + (d["fan_units"] * d["fan_hours"] * 0.07)

    # 7. Pump Load Index
    if fac == "society":
        pump_load_index = d["pumps"] * d["pump_hours"] * 5.5 * (1.15 if d["season"] == "Summer" else 1.0)
    else:
        pump_load_index = 0.0

    # 8. Equipment Load Index
    if fac == "home":
        eq_load = (
            d["refrigerator_units"] * 2.2 +
            d["washing_machine_hours"] * 0.75 +
            d["geyser_hours"] * 2.0 +
            d["tv_hours"] * 0.12 +
            (d["ev_charging"] * d["ev_charging_hours"] * 3.3)
        )
    elif fac == "society":
        eq_load = (
            d["lifts"] * 5.8 * (1.2 if d["lift_usage_level"] >= 3 else 1.0) +
            (30.0 if d["gym_pool_active"] else 0.0) +
            (d["ev_points"] * d["ev_usage_hours"] * 3.3) +
            (d["cctv_active"] * 4.5)
        )
    elif fac == "office":
        server_h = d["server_hours"] if d["server_active"] else 0.0
        eq_load = (
            (d["employees"] * 0.045 + 3.0) * server_h +
            (18.0 * (d["working_hours"] / 8.0) if d["heavy_equipment"] else 0.0) +
            (d["lifts"] * 4.0)
        )
    elif fac == "college":
        eq_load = (
            d["labs"] * d["lab_hours"] * 3.4 +
            d["hostel_occupancy"] * (1.6 if d["season"] != "Winter" else 2.3)
        )
    elif fac == "function_hall":
        dur = d["event_duration_hours"]
        eq_load = (
            (18.0 * dur * 0.5 if d["catering_active"] else 0.0) +
            (6.0 * dur * 0.6 if d["sound_system_active"] else 0.0)
        )
    else:
        eq_load = 0.0
    equipment_load_index = eq_load

    # 9. Event Load Index
    if fac == "function_hall":
        dur = d["event_duration_hours"]
        base_event = 50.0 if d["event_type"] == "Wedding" else (25.0 if d["event_type"] == "Reception" else (10.0 if d["event_type"] != "None" else 0.0))
        event_load_index = base_event + (d["expected_guests"] * dur * 0.015)
    elif fac == "college":
        event_load_index = (d["event_duration_hours"] * 25.0 if d["campus_event"] else 0.0) + (35.0 if d["exam_period"] else 0.0)
    else:
        event_load_index = 0.0

    # 10. Operating Intensity
    active_hours_sum = ac_hours + d["working_hours"] + d["pump_hours"] + d["lab_hours"] + d["event_duration_hours"]
    operating_intensity = min(3.0, active_hours_sum / 10.0)

    # 11. Estimated Baseline from Bill (contextual feature, NOT final answer)
    if d["previous_bill"] > 0:
        estimated_baseline_from_bill = (d["previous_bill"] / TARIFF_PER_UNIT) / 30.0
    else:
        # Fallback estimation if user omitted bill
        estimated_baseline_from_bill = 0.0

    # Baseline kW estimates for previous demand/peak if omitted
    prev_demand = d["previous_demand"]
    prev_peak = d["previous_peak"]
    if prev_demand == 0.0 and estimated_baseline_from_bill > 0:
        prev_demand = estimated_baseline_from_bill / 8.0 # approximate average kW
    if prev_peak == 0.0 and prev_demand > 0:
        prev_peak = prev_demand * 1.5

    return {
        "facility_type": fac,
        "season": d["season"],
        "is_weekend": d["is_weekend"],
        "is_holiday": d["is_holiday"],
        "is_festival": d["is_festival"],
        "temperature": temp,
        "humidity": d["humidity"],
        "temperature_factor": round(temp_factor, 3),
        "scale_size": float(scale_size),
        "ac_units": float(ac_units),
        "ac_hours": float(ac_hours),
        "ac_load_index": round(ac_load_index, 3),
        "computer_load_index": round(computer_load_index, 3),
        "occupancy_ratio": round(occupancy_ratio, 3),
        "hvac_load_index": round(hvac_load_index, 3),
        "lighting_load_index": round(lighting_load_index, 3),
        "pump_load_index": round(pump_load_index, 3),
        "equipment_load_index": round(equipment_load_index, 3),
        "event_load_index": round(event_load_index, 3),
        "operating_intensity": round(operating_intensity, 3),
        "estimated_baseline_from_bill": round(estimated_baseline_from_bill, 3),
        "previous_bill": d["previous_bill"],
        "previous_demand": round(prev_demand, 3),
        "previous_peak": round(prev_peak, 3),
        "solar_available": d["solar_available"],
        "solar_generation": round(d["solar_generation"], 3)
    }

def engineer_features_dataframe(df: pd.DataFrame) -> pd.DataFrame:
    """
    Transforms a DataFrame of raw synthetic dataset records into engineered features.
    """
    records = []
    for _, row in df.iterrows():
        raw_dict = row.to_dict()
        eng = engineer_features_dict(raw_dict)
        records.append(eng)
    return pd.DataFrame(records)

# Feature definitions for scikit-learn ColumnTransformer
CATEGORICAL_FEATURES = ["facility_type", "season"]

NUMERICAL_FEATURES = [
    "is_weekend",
    "is_holiday",
    "is_festival",
    "temperature",
    "humidity",
    "temperature_factor",
    "scale_size",
    "ac_units",
    "ac_hours",
    "ac_load_index",
    "computer_load_index",
    "occupancy_ratio",
    "hvac_load_index",
    "lighting_load_index",
    "pump_load_index",
    "equipment_load_index",
    "event_load_index",
    "operating_intensity",
    "estimated_baseline_from_bill",
    "previous_bill",
    "previous_demand",
    "previous_peak",
    "solar_available",
    "solar_generation"
]

ALL_FEATURE_COLUMNS = CATEGORICAL_FEATURES + NUMERICAL_FEATURES
