"""
generate_dataset.py
Generates a realistic synthetic historical dataset containing 2 years of daily data (2024-01-01 to 2025-12-31)
across all 5 facility types:
  1. Home
  2. Housing Society
  3. Office / Corporate
  4. College / Educational Institute
  5. Function Hall / Banquet Hall

Features and targets strictly follow the prompt specifications:
Targets:
  - daily_energy_consumption_kwh
  - peak_demand_kw

Common Features:
  - date, day_of_week, is_weekend, is_holiday, is_festival, festival_name, season,
    temperature, humidity, facility_type, previous_demand, previous_peak,
    solar_generation, solar_available, previous_bill

Facility-Specific Features for each facility type.
Outputs to: energy_dataset.csv
"""

import os
import random
import numpy as np
import pandas as pd
from datetime import datetime, timedelta

def get_season(month: int) -> str:
    if month in [3, 4, 5, 6]:
        return "Summer"
    elif month in [7, 8, 9]:
        return "Monsoon"
    elif month in [10, 11]:
        return "Autumn"
    else:
        return "Winter"

def get_weather(season: str, month: int, day_of_year: int) -> tuple[float, float]:
    """Return realistic (temperature in °C, humidity in %) with natural daily noise."""
    base_temp_map = {
        "Summer": (31.0, 43.0),
        "Monsoon": (26.0, 34.0),
        "Autumn": (22.0, 32.0),
        "Winter": (13.0, 25.0)
    }
    t_min, t_max = base_temp_map[season]
    temp = np.random.uniform(t_min, t_max)
    
    if season == "Monsoon":
        humidity = np.random.uniform(68.0, 94.0)
    elif season == "Summer":
        humidity = np.random.uniform(28.0, 52.0)
    elif season == "Winter":
        humidity = np.random.uniform(38.0, 62.0)
    else:
        humidity = np.random.uniform(42.0, 68.0)
        
    return round(float(temp), 1), round(float(humidity), 1)

def get_festival(date: datetime) -> tuple[int, str]:
    """Identifies major Indian festivals and national holidays."""
    festivals = {
        "2024-01-26": "Republic Day",
        "2024-03-25": "Holi",
        "2024-04-11": "Eid-ul-Fitr",
        "2024-08-15": "Independence Day",
        "2024-09-07": "Ganesh Chaturthi",
        "2024-10-12": "Dussehra",
        "2024-11-01": "Diwali",
        "2024-12-25": "Christmas",
        "2025-01-26": "Republic Day",
        "2025-03-14": "Holi",
        "2025-03-31": "Eid-ul-Fitr",
        "2025-08-15": "Independence Day",
        "2025-08-27": "Ganesh Chaturthi",
        "2025-10-02": "Gandhi Jayanti / Dussehra",
        "2025-10-20": "Diwali",
        "2025-12-25": "Christmas",
    }
    d_str = date.strftime("%Y-%m-%d")
    if d_str in festivals:
        return 1, festivals[d_str]
    return 0, "None"

def generate_energy_dataset():
    np.random.seed(42)
    random.seed(42)

    start_date = datetime(2024, 1, 1)
    total_days = 730  # 2 full years (2024 & 2025)

    # Multi-tier facility profiles for realistic scale representation
    facility_profiles = {
        "home": [
            {"id": "H1_compact", "members": 2, "base_acs": 1, "has_ev": 0, "has_solar": 0, "monthly_bill_base": 2400},
            {"id": "H2_family", "members": 4, "base_acs": 2, "has_ev": 1, "has_solar": 0, "monthly_bill_base": 6500},
            {"id": "H3_villa", "members": 6, "base_acs": 4, "has_ev": 1, "has_solar": 1, "monthly_bill_base": 14000},
        ],
        "society": [
            {"id": "S1_midrise", "flats": 45, "lifts": 2, "pumps": 1, "ev_points": 2, "has_solar": 0, "monthly_bill_base": 42000},
            {"id": "S2_gated", "flats": 120, "lifts": 4, "pumps": 3, "ev_points": 6, "has_solar": 1, "monthly_bill_base": 115000},
            {"id": "S3_township", "flats": 260, "lifts": 8, "pumps": 6, "ev_points": 12, "has_solar": 1, "monthly_bill_base": 240000},
        ],
        "office": [
            {"id": "O1_startup", "employees": 35, "computers": 35, "acs": 4, "has_server": 1, "has_solar": 0, "monthly_bill_base": 28000},
            {"id": "O2_midsize", "employees": 115, "computers": 110, "acs": 12, "has_server": 1, "has_solar": 1, "monthly_bill_base": 82000},
            {"id": "O3_enterprise", "employees": 320, "computers": 300, "acs": 32, "has_server": 1, "has_solar": 1, "monthly_bill_base": 260000},
        ],
        "college": [
            {"id": "C1_polytechnic", "students": 450, "classrooms": 14, "labs": 4, "acs": 6, "has_hostel": 0, "has_solar": 0, "monthly_bill_base": 60000},
            {"id": "C2_engg_college", "students": 1400, "classrooms": 32, "labs": 14, "acs": 18, "has_hostel": 1, "has_solar": 1, "monthly_bill_base": 185000},
            {"id": "C3_university", "students": 3100, "classrooms": 65, "labs": 30, "acs": 42, "has_hostel": 1, "has_solar": 1, "monthly_bill_base": 420000},
        ],
        "function_hall": [
            {"id": "F1_community_hall", "capacity": 250, "acs": 6, "has_solar": 0, "monthly_bill_base": 35000},
            {"id": "F2_banquet_hall", "capacity": 650, "acs": 14, "has_solar": 1, "monthly_bill_base": 95000},
            {"id": "F3_convention_center", "capacity": 1400, "acs": 28, "has_solar": 1, "monthly_bill_base": 220000},
        ]
    }

    records = []

    for day_idx in range(total_days):
        current_date = start_date + timedelta(days=day_idx)
        month = current_date.month
        day_of_week = current_date.weekday() # 0 = Monday, 6 = Sunday
        is_weekend = 1 if day_of_week in [5, 6] else 0
        season = get_season(month)
        temp, humidity = get_weather(season, month, day_idx)
        is_festival, festival_name = get_festival(current_date)
        is_holiday = 1 if (is_weekend or is_festival) else 0

        cooling_intensity = max(0.0, (temp - 24.0) / 10.0)

        # -----------------------------
        # 1. HOME SIMULATION
        # -----------------------------
        for prof in facility_profiles["home"]:
            members = prof["members"]
            base_acs = prof["base_acs"]
            has_ev = prof["has_ev"]
            has_solar = prof["has_solar"]
            bill_base = prof["monthly_bill_base"]

            if season == "Summer":
                ac_hours = float(np.clip(np.random.normal(7.5 + 2.2 * cooling_intensity, 1.4), 2.0, 16.0))
                active_acs = min(base_acs, max(1, int(round(np.random.normal(base_acs * 0.9, 0.5)))))
            elif season in ["Monsoon", "Autumn"]:
                ac_hours = float(np.clip(np.random.normal(3.5 + 1.2 * cooling_intensity, 1.4), 0.0, 8.0))
                active_acs = min(base_acs, max(0, int(round(np.random.normal(base_acs * 0.5, 0.6)))))
            else: # Winter
                ac_hours = float(np.clip(np.random.normal(0.4, 0.6), 0.0, 3.0))
                active_acs = 1 if (ac_hours > 0 and base_acs > 0 and np.random.rand() < 0.18) else 0

            if is_weekend or is_festival:
                ac_hours = min(18.0, ac_hours * 1.2)

            fan_units = members * 2
            fan_hours = float(np.clip(np.random.normal(12.0 if season != 'Winter' else 3.5, 1.8), 1.0, 20.0))
            refrigerator_units = 1
            washing_machine_hours = float(np.random.choice([0.0, 1.0, 1.5, 2.0], p=[0.35, 0.40, 0.18, 0.07]))
            geyser_hours = float(np.clip(np.random.normal(1.9 if season == 'Winter' else 0.4, 0.35), 0.0, 4.0))
            tv_hours = float(np.clip(np.random.normal(4.5 if is_weekend else 2.8, 0.9), 0.5, 8.0))
            
            ev_charging = has_ev if (has_ev and np.random.rand() > 0.3) else 0
            ev_hours = float(np.random.uniform(2.5, 6.0)) if ev_charging else 0.0

            ac_unit_power = 1.35 + 0.022 * max(0.0, temp - 26.0)
            ac_kwh = active_acs * ac_hours * ac_unit_power
            appliances_kwh = (
                (members * 0.8) +
                (fan_units * fan_hours * 0.07) +
                (refrigerator_units * 2.1) +
                (washing_machine_hours * 0.75) +
                (geyser_hours * 2.0) +
                (tv_hours * 0.12)
            )
            ev_kwh = ev_hours * 3.3
            solar_gen = round(float(np.random.uniform(4.0, 11.0) * (0.85 if season == "Monsoon" else 1.0)), 2) if has_solar else 0.0

            # Realistic physics + random behavioral noise (+- 5%)
            noise_kwh = float(np.random.normal(0, 0.4 + 0.03 * appliances_kwh))
            total_kwh = max(1.5, round(ac_kwh + appliances_kwh + ev_kwh - (solar_gen * 0.45) + noise_kwh, 2))

            coincidence_ac = active_acs * ac_unit_power * 0.85
            peak_kw = round(max(0.7, 0.35 * members + coincidence_ac + (2.0 if geyser_hours > 0 and season == "Winter" else 0.0) + (3.3 if ev_charging and np.random.rand() > 0.4 else 0.0)), 2)
            peak_kw = max(0.5, round(peak_kw + float(np.random.normal(0, 0.1)), 2))

            # Previous bill with seasonal baseline fluctuation
            prev_bill = int(round(bill_base * (1.25 if season == "Summer" else (0.85 if season == "Winter" else 1.0)) * np.random.uniform(0.92, 1.08)))

            records.append({
                "date": current_date.strftime("%Y-%m-%d"),
                "day_of_week": day_of_week,
                "is_weekend": is_weekend,
                "is_holiday": is_holiday,
                "is_festival": is_festival,
                "festival_name": festival_name,
                "season": season,
                "temperature": temp,
                "humidity": humidity,
                "facility_type": "home",
                # Home specific
                "family_members": members,
                "ac_units": active_acs,
                "ac_hours": round(ac_hours, 1),
                "fan_units": fan_units,
                "fan_hours": round(fan_hours, 1),
                "refrigerator_units": refrigerator_units,
                "geyser_hours": round(geyser_hours, 1),
                "washing_machine_hours": round(washing_machine_hours, 1),
                "tv_hours": round(tv_hours, 1),
                "ev_charging": ev_charging,
                "ev_charging_hours": round(ev_hours, 1),
                # Society specific (0)
                "total_flats": 0, "occupied_flats": 0, "residents": 0, "lifts": 0, "lift_usage_level": 0, "pumps": 0, "pump_hours": 0.0, "common_lighting_hours": 0.0, "gym_pool_active": 0, "ev_points": 0, "ev_usage_hours": 0.0, "cctv_active": 0,
                # Office specific (0)
                "employees": 0, "employees_present": 0, "working_hours": 0.0, "computers": 0, "computer_hours": 0.0, "server_active": 0, "server_hours": 0.0, "lighting_hours": 0.0, "heavy_equipment": 0,
                # College specific (0)
                "students": 0, "students_present": 0, "classrooms": 0, "labs": 0, "lab_hours": 0.0, "hostel_active": 0, "hostel_occupancy": 0, "exam_period": 0, "campus_event": 0, "event_duration_hours": 0.0,
                # Function Hall specific (0)
                "event_type": "None", "expected_guests": 0, "decorative_lighting_hours": 0.0, "catering_active": 0, "sound_system_active": 0,
                # Solar & Historical Baselines
                "solar_available": has_solar,
                "solar_generation": solar_gen,
                "previous_demand": round(peak_kw * np.random.uniform(0.92, 1.08), 2),
                "previous_peak": round(peak_kw * np.random.uniform(0.90, 1.10), 2),
                "previous_bill": prev_bill,
                # TARGETS
                "daily_energy_consumption_kwh": total_kwh,
                "peak_demand_kw": peak_kw
            })

        # -----------------------------
        # 2. HOUSING SOCIETY SIMULATION
        # -----------------------------
        for prof in facility_profiles["society"]:
            total_flats = prof["flats"]
            occupancy_pct = np.random.uniform(0.86, 0.96)
            occupied_flats = int(round(total_flats * occupancy_pct))
            residents = int(round(occupied_flats * np.random.uniform(3.1, 3.4)))
            lifts = prof["lifts"]
            pumps = prof["pumps"]
            ev_points = prof["ev_points"]
            has_solar = prof["has_solar"]
            bill_base = prof["monthly_bill_base"]

            pump_hours = float(np.clip(np.random.normal(7.5 if season == "Summer" else 5.0, 0.9), 3.0, 12.0))
            lift_usage_level = 3 if (is_weekend or is_festival) else 2 # 1=low, 2=med, 3=high
            common_lighting_hours = float(np.clip(np.random.normal(11.5 if season == "Winter" else 10.0, 0.5), 9.0, 13.0))
            gym_pool_active = 1 if total_flats > 50 else 0
            cctv_active = 1

            common_kwh = (
                (total_flats * 0.42 * common_lighting_hours * 0.05) +
                (lifts * 5.8 * (1.2 if lift_usage_level == 3 else 1.0) * 1.5) +
                (pumps * 5.5 * pump_hours) +
                (32.0 if gym_pool_active else 8.0) +
                (cctv_active * 4.5)
            )

            ev_usage_count = int(np.random.binomial(ev_points, 0.55))
            ev_usage_hours = float(np.random.uniform(3.0, 6.0)) if ev_usage_count > 0 else 0.0
            ev_kwh = ev_usage_count * ev_usage_hours * 3.3

            solar_gen = round(float(np.random.uniform(30.0, 85.0) * (total_flats / 100.0)), 2) if has_solar else 0.0

            noise_kwh = float(np.random.normal(0, 1.2 + 0.02 * common_kwh))
            total_kwh = max(18.0, round(common_kwh + ev_kwh - (solar_gen * 0.4) + noise_kwh, 2))

            coincident_lifts = lifts * 5.5 * 0.75
            coincident_pumps = pumps * 5.5 * (1.0 if pump_hours > 6 else 0.5)
            common_light_kw = (total_flats * 0.025) + 3.5
            peak_kw = round(coincident_lifts + coincident_pumps + common_light_kw + (ev_usage_count * 3.3 * 0.5), 2)
            peak_kw = max(4.0, round(peak_kw + float(np.random.normal(0, 0.3)), 2))

            prev_bill = int(round(bill_base * (1.15 if season == "Summer" else 0.95) * np.random.uniform(0.93, 1.07)))

            records.append({
                "date": current_date.strftime("%Y-%m-%d"),
                "day_of_week": day_of_week,
                "is_weekend": is_weekend,
                "is_holiday": is_holiday,
                "is_festival": is_festival,
                "festival_name": festival_name,
                "season": season,
                "temperature": temp,
                "humidity": humidity,
                "facility_type": "society",
                # Home specific (0)
                "family_members": 0, "ac_units": 0, "ac_hours": 0.0, "fan_units": 0, "fan_hours": 0.0,
                "refrigerator_units": 0, "geyser_hours": 0.0, "washing_machine_hours": 0.0, "tv_hours": 0.0,
                "ev_charging": 1 if ev_usage_count > 0 else 0, "ev_charging_hours": round(ev_usage_hours, 1),
                # Society specific
                "total_flats": total_flats,
                "occupied_flats": occupied_flats,
                "residents": residents,
                "lifts": lifts,
                "lift_usage_level": lift_usage_level,
                "pumps": pumps,
                "pump_hours": round(pump_hours, 1),
                "common_lighting_hours": round(common_lighting_hours, 1),
                "gym_pool_active": gym_pool_active,
                "ev_points": ev_points,
                "ev_usage_hours": round(ev_usage_hours, 1),
                "cctv_active": cctv_active,
                # Office specific (0)
                "employees": 0, "employees_present": 0, "working_hours": 0.0, "computers": 0, "computer_hours": 0.0, "server_active": 0, "server_hours": 0.0, "lighting_hours": 0.0, "heavy_equipment": 0,
                # College specific (0)
                "students": 0, "students_present": 0, "classrooms": 0, "labs": 0, "lab_hours": 0.0, "hostel_active": 0, "hostel_occupancy": 0, "exam_period": 0, "campus_event": 0, "event_duration_hours": 0.0,
                # Function Hall specific (0)
                "event_type": "None", "expected_guests": 0, "decorative_lighting_hours": 0.0, "catering_active": 0, "sound_system_active": 0,
                # Solar & Historical Baselines
                "solar_available": has_solar,
                "solar_generation": solar_gen,
                "previous_demand": round(peak_kw * np.random.uniform(0.93, 1.07), 2),
                "previous_peak": round(peak_kw * np.random.uniform(0.91, 1.09), 2),
                "previous_bill": prev_bill,
                # TARGETS
                "daily_energy_consumption_kwh": total_kwh,
                "peak_demand_kw": peak_kw
            })

        # -----------------------------
        # 3. OFFICE / CORPORATE SIMULATION
        # -----------------------------
        for prof in facility_profiles["office"]:
            tot_emp = prof["employees"]
            computers = prof["computers"]
            base_acs = prof["acs"]
            has_server = prof["has_server"]
            has_solar = prof["has_solar"]
            bill_base = prof["monthly_bill_base"]

            if day_of_week == 6: # Sunday
                present_ratio = np.random.uniform(0.02, 0.07)
                working_hours = 0.0
                active_acs = 0
                ac_hours = 0.0
                comp_hours = 0.0
                lighting_hours = 2.0
            elif day_of_week == 5: # Saturday
                present_ratio = np.random.uniform(0.15, 0.35)
                working_hours = float(np.random.choice([0.0, 5.0, 7.0], p=[0.3, 0.5, 0.2]))
                active_acs = int(round(base_acs * 0.35)) if working_hours > 0 else 0
                ac_hours = working_hours
                comp_hours = working_hours
                lighting_hours = working_hours + 1.0
            elif is_festival: # Festival
                present_ratio = np.random.uniform(0.04, 0.10)
                working_hours = 0.0
                active_acs = 0
                ac_hours = 0.0
                comp_hours = 0.0
                lighting_hours = 2.0
            else: # Weekday
                present_ratio = np.random.uniform(0.78, 0.95)
                working_hours = float(np.clip(np.random.normal(8.5, 0.5), 7.5, 10.5))
                active_acs = base_acs
                if season == "Summer":
                    ac_hours = working_hours + float(np.random.uniform(0.5, 1.5))
                elif season in ["Monsoon", "Autumn"]:
                    ac_hours = working_hours
                else: # Winter
                    ac_hours = working_hours * 0.5
                comp_hours = working_hours * 0.92
                lighting_hours = working_hours + 1.5

            employees_present = int(round(tot_emp * present_ratio))

            comp_kwh = computers * (employees_present / max(1, tot_emp)) * comp_hours * 0.15
            ac_power_per_unit = 2.0 + 0.038 * max(0.0, temp - 24.0)
            ac_kwh = active_acs * ac_hours * ac_power_per_unit
            server_kw = (tot_emp * 0.045) + (3.0 if has_server else 0.0)
            server_kwh = server_kw * 24.0
            lighting_kwh = (employees_present * lighting_hours * 0.04) + (tot_emp * 0.01 * 24.0)
            heavy_equipment = 1 if tot_emp > 120 else 0
            heavy_kwh = (18.0 * (working_hours / 8.0)) if heavy_equipment and working_hours > 0 else 0.0

            solar_gen = round(float(np.random.uniform(30.0, 140.0) * (tot_emp / 100.0)), 2) if has_solar else 0.0

            noise_kwh = float(np.random.normal(0, 1.5 + 0.02 * (comp_kwh + ac_kwh)))
            total_kwh = max(12.0, round(comp_kwh + ac_kwh + server_kwh + lighting_kwh + heavy_kwh - (solar_gen * 0.4) + noise_kwh, 2))

            if working_hours > 0:
                peak_kw = round(server_kw + (active_acs * ac_power_per_unit * 0.88) + (computers * (employees_present / max(1, tot_emp)) * 0.15) + (employees_present * 0.04) + (4.0 if heavy_equipment else 0.0), 2)
            else:
                peak_kw = round(server_kw + 2.2, 2)
            peak_kw = max(2.5, round(peak_kw + float(np.random.normal(0, 0.4)), 2))

            prev_bill = int(round(bill_base * (1.20 if season == "Summer" else (0.88 if season == "Winter" else 1.0)) * np.random.uniform(0.93, 1.07)))

            records.append({
                "date": current_date.strftime("%Y-%m-%d"),
                "day_of_week": day_of_week,
                "is_weekend": is_weekend,
                "is_holiday": is_holiday,
                "is_festival": is_festival,
                "festival_name": festival_name,
                "season": season,
                "temperature": temp,
                "humidity": humidity,
                "facility_type": "office",
                # Home specific (0)
                "family_members": 0, "ac_units": active_acs, "ac_hours": round(ac_hours, 1), "fan_units": 0, "fan_hours": 0.0,
                "refrigerator_units": 0, "geyser_hours": 0.0, "washing_machine_hours": 0.0, "tv_hours": 0.0,
                "ev_charging": 0, "ev_charging_hours": 0.0,
                # Society specific (0)
                "total_flats": 0, "occupied_flats": 0, "residents": 0, "lifts": 2 if tot_emp > 80 else 1, "lift_usage_level": 2 if working_hours > 0 else 1, "pumps": 0, "pump_hours": 0.0, "common_lighting_hours": 0.0, "gym_pool_active": 0, "ev_points": 0, "ev_usage_hours": 0.0, "cctv_active": 1,
                # Office specific
                "employees": tot_emp,
                "employees_present": employees_present,
                "working_hours": round(working_hours, 1),
                "computers": computers,
                "computer_hours": round(comp_hours, 1),
                "server_active": has_server,
                "server_hours": 24.0 if has_server else 0.0,
                "lighting_hours": round(lighting_hours, 1),
                "heavy_equipment": heavy_equipment,
                # College specific (0)
                "students": 0, "students_present": 0, "classrooms": 0, "labs": 0, "lab_hours": 0.0, "hostel_active": 0, "hostel_occupancy": 0, "exam_period": 0, "campus_event": 0, "event_duration_hours": 0.0,
                # Function Hall specific (0)
                "event_type": "None", "expected_guests": 0, "decorative_lighting_hours": 0.0, "catering_active": 0, "sound_system_active": 0,
                # Solar & Historical Baselines
                "solar_available": has_solar,
                "solar_generation": solar_gen,
                "previous_demand": round(peak_kw * np.random.uniform(0.94, 1.06), 2),
                "previous_peak": round(peak_kw * np.random.uniform(0.92, 1.08), 2),
                "previous_bill": prev_bill,
                # TARGETS
                "daily_energy_consumption_kwh": total_kwh,
                "peak_demand_kw": peak_kw
            })

        # -----------------------------
        # 4. COLLEGE SIMULATION
        # -----------------------------
        for prof in facility_profiles["college"]:
            tot_students = prof["students"]
            classrooms = prof["classrooms"]
            labs = prof["labs"]
            base_acs = prof["acs"]
            has_hostel = prof["has_hostel"]
            has_solar = prof["has_solar"]
            bill_base = prof["monthly_bill_base"]
            computers = int(round(classrooms * 7 + labs * 20))

            is_summer_vacation = 1 if (month in [5, 6] and day_idx % 30 < 25) else 0
            is_exam_period = 1 if (month in [4, 11, 12] and not is_summer_vacation and not is_holiday) else 0
            is_campus_event = 1 if (day_of_week in [4, 5] and np.random.rand() < 0.08 and not is_summer_vacation) else 0
            event_duration_hours = float(np.random.uniform(4.0, 9.0)) if is_campus_event else 0.0

            if is_summer_vacation or is_holiday or (day_of_week == 6):
                present_ratio = np.random.uniform(0.04, 0.12)
                lab_hours = 0.0
                active_acs = int(base_acs * 0.1)
                ac_hours = 2.0
                comp_hours = 1.0
            elif is_exam_period:
                present_ratio = np.random.uniform(0.85, 0.96)
                lab_hours = float(np.clip(np.random.normal(3.5, 0.5), 1.0, 5.0))
                active_acs = base_acs
                ac_hours = float(np.clip(np.random.normal(7.5, 1.0), 4.0, 10.0)) if season == "Summer" else 3.5
                comp_hours = 7.0
            else: # Regular semester
                present_ratio = np.random.uniform(0.75, 0.90)
                lab_hours = float(np.clip(np.random.normal(5.2, 0.8), 2.0, 7.5))
                active_acs = int(base_acs * (0.85 if season == "Summer" else 0.45))
                ac_hours = float(np.clip(np.random.normal(6.0, 1.0), 2.0, 9.0))
                comp_hours = 5.0

            students_present = int(round(tot_students * present_ratio))
            hostel_occupancy = int(round(tot_students * 0.35)) if has_hostel else 0
            if is_summer_vacation:
                hostel_occupancy = int(hostel_occupancy * 0.1)

            ac_power_per_unit = 2.2 + 0.032 * max(0.0, temp - 24.0)
            ac_kwh = active_acs * ac_hours * ac_power_per_unit
            comp_kwh = computers * 0.13 * comp_hours * (students_present / max(1, tot_students))
            lab_equipment_kwh = labs * lab_hours * 3.4
            class_lighting_kwh = classrooms * 0.6 * (6.0 if not is_holiday else 0.5)
            hostel_kwh = hostel_occupancy * (1.6 if season != "Winter" else 2.3)
            event_kwh = event_duration_hours * 25.0 if is_campus_event else 0.0

            solar_gen = round(float(np.random.uniform(40.0, 200.0) * (tot_students / 1000.0)), 2) if has_solar else 0.0

            noise_kwh = float(np.random.normal(0, 2.0 + 0.02 * (ac_kwh + comp_kwh)))
            total_kwh = max(25.0, round(ac_kwh + comp_kwh + lab_equipment_kwh + class_lighting_kwh + hostel_kwh + event_kwh - (solar_gen * 0.4) + noise_kwh, 2))

            peak_kw = round(
                (active_acs * ac_power_per_unit * 0.85) +
                (computers * 0.12 * 0.65) +
                (labs * 2.8 * (1.0 if lab_hours > 0 else 0.1)) +
                (classrooms * 0.4) +
                (hostel_occupancy * 0.07) +
                (25.0 if is_campus_event else 0.0),
                2
            )
            peak_kw = max(7.0, round(peak_kw + float(np.random.normal(0, 0.5)), 2))

            prev_bill = int(round(bill_base * (1.18 if season == "Summer" else (0.90 if season == "Winter" else 1.0)) * np.random.uniform(0.92, 1.08)))

            records.append({
                "date": current_date.strftime("%Y-%m-%d"),
                "day_of_week": day_of_week,
                "is_weekend": is_weekend,
                "is_holiday": is_holiday,
                "is_festival": is_festival,
                "festival_name": festival_name,
                "season": season,
                "temperature": temp,
                "humidity": humidity,
                "facility_type": "college",
                # Home specific (0)
                "family_members": 0, "ac_units": active_acs, "ac_hours": round(ac_hours, 1), "fan_units": 0, "fan_hours": 0.0,
                "refrigerator_units": 0, "geyser_hours": 0.0, "washing_machine_hours": 0.0, "tv_hours": 0.0,
                "ev_charging": 0, "ev_charging_hours": 0.0,
                # Society specific (0)
                "total_flats": 0, "occupied_flats": 0, "residents": 0, "lifts": 2, "lift_usage_level": 2, "pumps": 0, "pump_hours": 0.0, "common_lighting_hours": 0.0, "gym_pool_active": 0, "ev_points": 0, "ev_usage_hours": 0.0, "cctv_active": 1,
                # Office specific (0)
                "employees": 0, "employees_present": 0, "working_hours": 0.0, "computers": computers, "computer_hours": round(comp_hours, 1), "server_active": 0, "server_hours": 0.0, "lighting_hours": 0.0, "heavy_equipment": 0,
                # College specific
                "students": tot_students,
                "students_present": students_present,
                "classrooms": classrooms,
                "labs": labs,
                "lab_hours": round(lab_hours, 1),
                "hostel_active": has_hostel,
                "hostel_occupancy": hostel_occupancy,
                "exam_period": is_exam_period,
                "campus_event": is_campus_event,
                "event_duration_hours": round(event_duration_hours, 1),
                # Function Hall specific (0)
                "event_type": "None", "expected_guests": 0, "decorative_lighting_hours": 0.0, "catering_active": 0, "sound_system_active": 0,
                # Solar & Historical Baselines
                "solar_available": has_solar,
                "solar_generation": solar_gen,
                "previous_demand": round(peak_kw * np.random.uniform(0.93, 1.07), 2),
                "previous_peak": round(peak_kw * np.random.uniform(0.91, 1.09), 2),
                "previous_bill": prev_bill,
                # TARGETS
                "daily_energy_consumption_kwh": total_kwh,
                "peak_demand_kw": peak_kw
            })

        # -----------------------------
        # 5. FUNCTION HALL / BANQUET HALL SIMULATION
        # -----------------------------
        for prof in facility_profiles["function_hall"]:
            capacity = prof["capacity"]
            base_acs = prof["acs"]
            has_solar = prof["has_solar"]
            bill_base = prof["monthly_bill_base"]

            event_prob = 0.72 if is_weekend else (0.52 if is_festival else 0.22)
            has_event = 1 if np.random.rand() < event_prob else 0

            if has_event:
                event_type = np.random.choice(["Wedding", "Reception", "Birthday", "Corporate"], p=[0.45, 0.25, 0.15, 0.15])
                if event_type == "Wedding":
                    guests = int(round(np.random.uniform(capacity * 0.7, capacity * 1.15)))
                    duration = float(np.random.uniform(8.0, 14.0))
                    active_acs = base_acs
                    ac_hours = duration * 0.92
                    lighting_hours = float(np.random.uniform(7.0, 12.0))
                    catering_active = 1
                    sound_system_active = 1
                elif event_type == "Reception":
                    guests = int(round(np.random.uniform(capacity * 0.5, capacity * 0.95)))
                    duration = float(np.random.uniform(5.0, 8.0))
                    active_acs = int(base_acs * 0.9)
                    ac_hours = duration
                    lighting_hours = float(np.random.uniform(5.0, 7.5))
                    catering_active = 1
                    sound_system_active = 1
                elif event_type == "Corporate":
                    guests = int(round(np.random.uniform(capacity * 0.3, capacity * 0.7)))
                    duration = float(np.random.uniform(6.0, 9.0))
                    active_acs = int(base_acs * 0.8)
                    ac_hours = duration
                    lighting_hours = float(np.random.uniform(3.0, 6.0))
                    catering_active = 1
                    sound_system_active = 0
                else: # Birthday / Party
                    guests = int(round(np.random.uniform(capacity * 0.2, capacity * 0.5)))
                    duration = float(np.random.uniform(4.0, 6.0))
                    active_acs = int(base_acs * 0.6)
                    ac_hours = duration
                    lighting_hours = float(np.random.uniform(2.5, 5.0))
                    catering_active = 1
                    sound_system_active = 1
            else:
                event_type = "None"
                guests = 0
                duration = 0.0
                active_acs = 0
                ac_hours = 0.0
                lighting_hours = 0.0
                catering_active = 0
                sound_system_active = 0

            if not has_event:
                total_kwh = round(float(np.random.uniform(12.0, 26.0)), 2)
                peak_kw = round(float(np.random.uniform(1.2, 3.2)), 2)
                solar_gen = 0.0
            else:
                ac_power_per_unit = 2.4 + 0.04 * max(0.0, temp - 24.0)
                ac_kwh = active_acs * ac_hours * ac_power_per_unit
                lighting_kwh = lighting_hours * 18.0 * (capacity / 600.0)
                catering_kwh = (18.0 * duration * 0.5) if catering_active else 0.0
                sound_kwh = (6.0 * duration * 0.6) if sound_system_active else 0.0
                guest_kwh = guests * duration * 0.015

                solar_gen = round(float(np.random.uniform(20.0, 75.0)), 2) if has_solar else 0.0

                noise_kwh = float(np.random.normal(0, 3.0 + 0.02 * ac_kwh))
                total_kwh = round(max(28.0, ac_kwh + lighting_kwh + catering_kwh + sound_kwh + guest_kwh - (solar_gen * 0.3) + noise_kwh), 2)

                peak_kw = round(
                    (active_acs * ac_power_per_unit * 0.9) +
                    (lighting_hours * 2.2) +
                    (12.0 if catering_active else 0.0) +
                    (5.0 if sound_system_active else 0.0) +
                    (guests * 0.01),
                    2
                )
                peak_kw = max(4.0, round(peak_kw + float(np.random.normal(0, 0.6)), 2))

            prev_bill = int(round(bill_base * np.random.uniform(0.85, 1.15)))

            records.append({
                "date": current_date.strftime("%Y-%m-%d"),
                "day_of_week": day_of_week,
                "is_weekend": is_weekend,
                "is_holiday": is_holiday,
                "is_festival": is_festival,
                "festival_name": festival_name,
                "season": season,
                "temperature": temp,
                "humidity": humidity,
                "facility_type": "function_hall",
                # Home specific (0)
                "family_members": 0, "ac_units": active_acs, "ac_hours": round(ac_hours, 1), "fan_units": 0, "fan_hours": 0.0,
                "refrigerator_units": 0, "geyser_hours": 0.0, "washing_machine_hours": 0.0, "tv_hours": 0.0,
                "ev_charging": 0, "ev_charging_hours": 0.0,
                # Society specific (0)
                "total_flats": 0, "occupied_flats": 0, "residents": 0, "lifts": 1, "lift_usage_level": 1, "pumps": 0, "pump_hours": 0.0, "common_lighting_hours": 0.0, "gym_pool_active": 0, "ev_points": 0, "ev_usage_hours": 0.0, "cctv_active": 1,
                # Office specific (0)
                "employees": 0, "employees_present": 0, "working_hours": 0.0, "computers": 0, "computer_hours": 0.0, "server_active": 0, "server_hours": 0.0, "lighting_hours": 0.0, "heavy_equipment": 0,
                # College specific (0)
                "students": 0, "students_present": 0, "classrooms": 0, "labs": 0, "lab_hours": 0.0, "hostel_active": 0, "hostel_occupancy": 0, "exam_period": 0, "campus_event": 0, "event_duration_hours": 0.0,
                # Function Hall specific
                "event_type": event_type,
                "expected_guests": guests,
                "event_duration_hours": round(duration, 1),
                "decorative_lighting_hours": round(lighting_hours, 1),
                "catering_active": catering_active,
                "sound_system_active": sound_system_active,
                # Solar & Historical Baselines
                "solar_available": has_solar,
                "solar_generation": solar_gen,
                "previous_demand": round(peak_kw * np.random.uniform(0.85, 1.15), 2),
                "previous_peak": round(peak_kw * np.random.uniform(0.85, 1.15), 2),
                "previous_bill": prev_bill,
                # TARGETS
                "daily_energy_consumption_kwh": total_kwh,
                "peak_demand_kw": peak_kw
            })

    df = pd.DataFrame(records)
    output_path = os.path.join(os.path.dirname(__file__), "energy_dataset.csv")
    df.to_csv(output_path, index=False)
    print(f"Dataset generated successfully.")
    print(f"Total rows: {len(df)}")
    print(f"Total columns: {len(df.columns)}")
    print(f"Date range: {df['date'].min()} to {df['date'].max()}")
    print("Facility distribution:\n", df['facility_type'].value_counts())
    return df

if __name__ == "__main__":
    generate_energy_dataset()
