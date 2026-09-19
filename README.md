# AI/ML-Powered Personalized Energy Predictive Insight Dashboard

An end-to-end, multi-tier energy intelligence platform that leverages trained machine learning models to forecast daily electricity consumption (kWh), peak power demand (kW), critical grid stress windows, and estimated billing. Features facility-tailored input parameters, dynamic load-breakdown visualizations, and an interactive **What-If Energy Simulator** that runs live counterfactual scenarios through a trained Gradient Boosting model.

---

## 1. System Architecture

```
                  ┌────────────────────────────────────────┐
                  │       React Frontend (Vite)            │
                  │   Tailored Forms • Recharts Analytics  │
                  │   What-If Sliders • Scenario History   │
                  └───────────────────┬────────────────────┘
                                      │ HTTP / REST (JWT Bearer)
                                      ▼
                  ┌────────────────────────────────────────┐
                  │       Express.js Main Backend          │
                  │ Auth • Facility Management • Outages   │
                  │ Multi-Tenant Isolation • History API   │
                  └───────────────┬───────┬────────────────┘
                                  │       │
                     Mongoose /   │       │ Axios (Internal Microservice)
                     MongoDB      │       │ Timeout & 503 Fallback Shield
                                  ▼       ▼
       ┌─────────────────────────────┐  ┌──────────────────────────────────┐
       │     MongoDB Database        │  │      FastAPI ML Microservice     │
       │ Users • Facilities • Scenarios│ │  Feature Engineering Pipeline   │
       │ Predictions • Energy Inputs │  └─────────────────┬────────────────┘
       └─────────────────────────────┘                    │
                                                          ▼
                                        ┌──────────────────────────────────┐
                                        │  Trained ML Model (model.pkl)    │
                                        │  Gradient Boosting Regressor     │
                                        │  R² = 0.9995 (Daily kWh & Peak)  │
                                        └──────────────────────────────────┘
```

---

## 2. Problem Statement & Proposed Solution

### Problem
Traditional energy management tools and utility bill reports provide retrospective data (what has already occurred) without actionable predictive insights. Most existing tools rely on generic, static multiplier formulas or require consumers to know technical engineering variables (such as exact three-phase power factor, connected transformer kVA ratings, or motor inductive reactance in kW).

### Solution
This platform bridges the gap between everyday consumers and advanced predictive analytics:
1. **Zero Technical Jargon**: Users input familiar everyday operational counts (e.g. number of ACs and running hours, computer counts, water pumps, event guest size, ambient temperature, past bills in ₹).
2. **Feature Engineering Bridge**: Translates non-technical parameters into thermodynamic cooling factors, occupancy ratios, and coincident equipment load indices.
3. **Genuine ML Inference**: Evaluates operational parameters using a trained `GradientBoostingRegressor` model (never canned formulas or lookup tables).
4. **What-If Energy Simulator**: Empowers facility managers and homeowners to simulate operational adjustments (e.g. reducing AC runtime from 8h to 5h) and immediately observe before-vs-after ML demand shifts and estimated monthly savings in ₹.

---

## 3. Supported Facilities

| Facility Type | Everyday Inputs | Primary Modeled Drivers |
| :--- | :--- | :--- |
| 🏠 **Residential Home** | Family size, AC units & hours, fans, geyser, EV charger, ambient temp, past bill | Thermodynamic compressor cooling load, morning geyser surges, evening domestic peak. |
| 🏢 **Housing Society** | Occupied flats, elevator intensity, water pumps & hours, common lighting, EV bays | Inductive water pump motor loads, elevator dispatch cycles, perimeter illumination. |
| 💼 **Commercial Office** | Employees present, workstations & hours, HVAC zones & hours, server rooms | Continuous computing loads, central HVAC chiller runtime, corporate operating hours. |
| 🎓 **Educational College** | Students on campus, computing labs, engineering labs, classroom ACs, hostels | Dynamic lecture schedules, high-power technical laboratory equipment, hostel thermal loads. |
| 🎉 **Function Hall / Banquet** | Expected guests, event duration, hall chillers, decorative lighting, catering warmers | Peak guest occupancy thermal cooling, commercial food warmers, stage wash fixtures. |

---

## 4. Machine Learning Approach & Validation

### Dataset & Training Methodology
- **Synthetic Training Dataset**: 10,950 records across 2 full calendar years (`2024-01-01` to `2025-12-30`), covering all 5 facility types across diverse seasons and temperature profiles (-15°C to 45°C).
- **Validation Split**: Chronological out-of-time holdout (75% train / 25% test), ensuring models are validated on future unseen operational conditions.
- **Model Comparison**: Evaluated `RandomForestRegressor` against `GradientBoostingRegressor`:

| Model Architecture | Target Variable | MAE | RMSE | $R^2$ Score |
| :--- | :--- | :--- | :--- | :--- |
| **RandomForestRegressor** | `daily_energy_consumption_kwh` | 11.087 | 22.798 | 0.9992 |
| **RandomForestRegressor** | `peak_demand_kw` | 0.962 | 2.048 | 0.9993 |
| **GradientBoostingRegressor (Selected)** | `daily_energy_consumption_kwh` | 11.355 | 20.323 | **0.9993** |
| **GradientBoostingRegressor (Selected)** | `peak_demand_kw` | 0.633 | 1.272 | **0.9997** |
| **Mean Combined Performance** | **Combined** | — | — | **0.9995** |

*Note: High metrics reflect synthetic physics-based generative equations. The model was rigorously stress-tested on unseen multi-facility inputs to confirm smooth generalization.*

---

## 5. What-If Energy Simulator

The What-If Simulator is a real-time counterfactual analysis tool:
- **No Canned Heuristics**: Modified inputs are transmitted from React through Express to FastAPI, generating an authentic new ML prediction from `model.pkl`.
- **Side-by-Side Outlook**:
  - Daily Consumption: `Before kWh` → `After kWh` (`±XX.X%`)
  - Peak Demand: `Before kW` → `After kW` (`±XX.X%`)
  - Projected Monthly Bill: `₹Before` → `₹After`
  - Peak Risk Level: `Before Risk` → `After Risk`
- **Estimated Potential Savings**: Accurately computes $\text{Savings} = \text{Cost}_{\text{before}} - \text{Cost}_{\text{after}}$ (strictly labeled as *estimated potential saving*).
- **Dual-Line 24-Hour Curve**: Recharts interactive comparison overlaying baseline hourly demand against modified scenario demand.
- **Dynamic Simulation Insights**: Explains which specific modified parameter contributed to the observed demand reduction.
- **Scenario History**: Stores all past simulations in MongoDB for 1-click comparison and auditing.

---

## 6. Technology Stack

- **Frontend**: React 19, Vite, Recharts, Lucide React, CSS Variables Design System.
- **Backend**: Node.js, Express.js, MongoDB / Mongoose, Axios, JWT, bcryptjs, dotenv, cors.
- **ML Service**: Python 3.11, FastAPI, Uvicorn, Scikit-learn, NumPy, Pandas, Joblib.

---

## 7. Setup & Installation Instructions

### Prerequisites
- Node.js (v18+)
- Python (v3.9+)
- MongoDB (Local daemon or MongoDB Atlas URI; falls back to embedded in-memory server for development)

### Step 1: Start the FastAPI ML Service
```bash
cd ml-service
pip install -r requirements.txt
python -m uvicorn app:app --host 0.0.0.0 --port 8000
```
*Health Check*: Verify at `http://localhost:8000/health`.

### Step 2: Start the Express Backend
```bash
cd backend
npm install
npm start
```
*Health Check*: Verify at `http://localhost:5000/api/health`.

### Step 3: Start the React Frontend
```bash
cd frontend
npm install
npm run dev
```
*Application*: Open `http://localhost:5173`.

---

## 8. Environment Variables

### Backend (`backend/.env`)
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/energy_dashboard
JWT_SECRET=your_production_jwt_secret_key_here
ML_SERVICE_URL=http://localhost:8000
```

### Frontend (`frontend/.env`)
```env
VITE_API_URL=http://localhost:5000/api
```

---

## 9. API Overview

| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/health` | Public | Checks Express, MongoDB connection, and FastAPI reachability. |
| `POST` | `/api/auth/register` | Public | Registers a new user with bcrypt-hashed password and returns JWT. |
| `POST` | `/api/auth/login` | Public | Authenticates credentials and issues JWT token. |
| `POST` | `/api/facilities` | Private | Creates a facility for the authenticated user. |
| `GET` | `/api/facilities` | Private | Lists all facilities owned by the authenticated user. |
| `GET` | `/api/facilities/:id` | Private | Retrieves facility details (with strict tenant ownership check). |
| `POST` | `/api/predictions` | Private | Forwards facility inputs to FastAPI ML model and stores prediction. |
| `GET` | `/api/predictions/:facilityId` | Private | Retrieves historical predictions for a facility. |
| `POST` | `/api/whatif/:facilityId` | Private | Simulates modified inputs using FastAPI and stores `WhatIfScenario`. |
| `GET` | `/api/whatif/:facilityId` | Private | Lists all saved What-If scenarios for a facility. |

---

## 10. Security & Data Privacy

1. **Multi-Tenant Isolation**: Every facility, prediction, and What-If scenario is bound to the creator's `userId`. Unauthorized access across users is rejected with `HTTP 403 Forbidden`.
2. **Password Protection**: Passwords are salted and hashed with `bcryptjs` (10 salt rounds) and excluded from JSON responses.
3. **Outage Shielding (No Fake Predictions)**: If the ML service is offline, the backend returns `HTTP 503 Service Unavailable` with clear user messaging. It **never** returns canned or fake predictions.
4. **Input Bounds Validation**: Negative runtimes, impossible hours (> 24h), extreme temperatures, and invalid data types are rejected at the backend level (`HTTP 400`).

---


