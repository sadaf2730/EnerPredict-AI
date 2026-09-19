/**
 * Phase 4 Comprehensive Automated Verification Script
 * Validates the full Personalized Energy Dashboard pipeline:
 * 1. User Authentication (JWT)
 * 2. Facility Management (all 5 facility types)
 * 3. Live ML Prediction generation (GradientBoostingRegressor forwarding)
 * 4. Prediction History population (energyInputId populated)
 * 5. Dashboard Data Model integrity (24-hour profile, appliance donut breakdown, peak window, peak risk)
 * 6. Recommendation Engine validation (dynamic rule evaluation, realistic INR ₹ monthly savings)
 */

import axios from 'axios';
import { generateRecommendations } from './src/utils/recommendationEngine.js';

const BACKEND_URL = 'http://localhost:5000/api';
const ML_URL = 'http://localhost:8000';

async function runPhase4Verification() {
  console.log('===============================================================');
  console.log('🚀 STARTING PHASE 4 DASHBOARD & RECOMMENDATIONS VERIFICATION');
  console.log('===============================================================\n');

  let passedTests = 0;
  let totalTests = 0;

  function assert(condition, testName, details = '') {
    totalTests++;
    if (condition) {
      console.log(`  ✅ [PASS] ${testName}`);
      passedTests++;
    } else {
      console.error(`  ❌ [FAIL] ${testName}: ${details}`);
    }
  }

  try {
    // 1. Verify ML Service Health
    console.log('--- 1. ML Service Health Check ---');
    const mlHealth = await axios.get(`${ML_URL}/health`);
    assert(mlHealth.status === 200 && mlHealth.data.model_loaded === true, 'FastAPI ML Service is healthy with model loaded');

    // 2. User Authentication
    console.log('\n--- 2. User Registration & Auth ---');
    const testEmail = `dashboard_tester_${Date.now()}@example.com`;
    const regRes = await axios.post(`${BACKEND_URL}/auth/register`, {
      name: 'Energy Dashboard Lead',
      email: testEmail,
      password: 'Password123!',
      organization: 'Green Energy Analytics Corp',
    });
    assert(regRes.status === 201 && regRes.data.token, 'User registered and JWT token issued');
    const token = regRes.data.token;
    const authHeaders = { headers: { Authorization: `Bearer ${token}` } };

    // 3. Test Cases for All 5 Facility Types
    const testCases = [
      {
        facilityType: 'home',
        name: 'Smart Eco Villa',
        tariff: 7.5,
        solar: false,
        inputs: {
          temperature: 34.0,
          previous_bill: 4500,
          family_members: 4,
          ac_units: 3,
          ac_hours: 8.0,
          fan_units: 4,
          fan_hours: 14.0,
          refrigerator_units: 1,
          geyser_hours: 1.5,
          washing_machine_hours: 1.0,
          tv_hours: 4.0,
          ev_charging: 1,
          ev_charging_hours: 3.0,
        },
      },
      {
        facilityType: 'housing_society',
        name: 'Palm Meadows Residency',
        tariff: 9.0,
        solar: false,
        inputs: {
          temperature: 32.0,
          previous_bill: 75000,
          total_flats: 120,
          occupied_flats: 110,
          residents: 380,
          lifts: 4,
          lift_usage_level: 3,
          pumps: 3,
          pump_hours: 6.0,
          common_lighting_hours: 11.0,
          gym_pool_active: 1,
          ev_points: 6,
          ev_usage_hours: 5.0,
          cctv_active: 1,
        },
      },
      {
        facilityType: 'office',
        name: 'InnoTech IT Tower',
        tariff: 10.5,
        solar: false,
        inputs: {
          temperature: 33.0,
          previous_bill: 110000,
          employees: 140,
          employees_present: 125,
          working_hours: 10.0,
          computers: 130,
          computer_hours: 9.0,
          ac_units: 14,
          ac_hours: 10.0,
          server_active: 1,
          server_hours: 24.0,
          lighting_hours: 10.0,
          heavy_equipment: 1,
          lifts: 3,
        },
      },
      {
        facilityType: 'college',
        name: 'Vanguard Institute of Tech',
        tariff: 8.5,
        solar: false,
        inputs: {
          temperature: 30.0,
          previous_bill: 320000,
          students: 1200,
          students_present: 1050,
          classrooms: 40,
          computers: 250,
          computer_hours: 7.0,
          labs: 8,
          lab_hours: 6.0,
          ac_units: 25,
          ac_hours: 8.0,
          hostel_active: 1,
          hostel_occupancy: 450,
          exam_period: 0,
          campus_event: 1,
          event_duration_hours: 5.0,
        },
      },
      {
        facilityType: 'function_hall',
        name: 'Grand Imperial Ballroom',
        tariff: 11.0,
        solar: false,
        inputs: {
          temperature: 35.0,
          previous_bill: 180000,
          event_type: 'Wedding Reception',
          expected_guests: 600,
          event_duration_hours: 7.0,
          ac_units: 20,
          ac_hours: 8.0,
          decorative_lighting_hours: 7.0,
          catering_active: 1,
          sound_system_active: 1,
        },
      },
    ];

    console.log('\n--- 3. Testing Complete Dashboard Pipeline Across 5 Facilities ---');

    for (const tc of testCases) {
      console.log(`\n🔍 Verifying [${tc.facilityType.toUpperCase()}] "${tc.name}"...`);

      // A. Create Facility
      const facRes = await axios.post(`${BACKEND_URL}/facilities`, {
        facilityName: tc.name,
        facilityType: tc.facilityType,
        tariff: tc.tariff,
        solar: tc.solar,
      }, authHeaders);
      assert(facRes.status === 201 && facRes.data.facility._id, `Facility "${tc.name}" created`);
      const facilityId = facRes.data.facility._id;

      // B. Submit Live Prediction
      const predRes = await axios.post(`${BACKEND_URL}/predictions`, {
        facilityId,
        inputData: tc.inputs,
      }, authHeaders);
      assert(predRes.status === 201 && predRes.data.prediction, `Live ML Prediction generated for ${tc.name}`);
      const pred = predRes.data.prediction;

      // C. Validate Core KPI Metrics
      assert(
        typeof pred.predictedDailyConsumptionKwh === 'number' && pred.predictedDailyConsumptionKwh > 0,
        `Daily consumption: ${pred.predictedDailyConsumptionKwh.toFixed(2)} kWh`
      );
      assert(
        typeof pred.predictedDemandKw === 'number' && pred.predictedDemandKw > 0,
        `Peak demand: ${pred.predictedDemandKw.toFixed(2)} kW`
      );
      assert(
        ['Low', 'Medium', 'High'].includes(pred.peakRisk),
        `Peak risk computed: ${pred.peakRisk}`
      );
      assert(
        Boolean(pred.predictedPeakWindow && pred.predictedPeakWindow.includes('-')),
        `Peak window: ${pred.predictedPeakWindow}`
      );
      assert(
        typeof pred.estimatedMonthlyCost === 'number' && pred.estimatedMonthlyCost > 0,
        `Monthly cost projection: ₹${pred.estimatedMonthlyCost.toFixed(0)}`
      );

      // D. Validate 24-Hour Profile Integrity
      const hourlyKeys = Object.keys(pred.hourlyProfile || {});
      assert(
        hourlyKeys.length === 24,
        `Hourly demand profile contains 24 distinct hours (h00 to h23)`
      );

      // E. Validate Appliance Contributor Breakdown
      const breakdown = pred.applianceBreakdown;
      assert(
        Boolean(breakdown && breakdown.estimated_percentage_contributions),
        `Appliance breakdown percentage contributions present`
      );

      // F. Validate Prediction History (GET /api/predictions/:facilityId)
      const histRes = await axios.get(`${BACKEND_URL}/predictions/${facilityId}`, authHeaders);
      assert(
        histRes.status === 200 && histRes.data.predictions.length >= 1,
        `Prediction history retrieved (${histRes.data.predictions.length} run stored)`
      );
      const histItem = histRes.data.predictions[0];
      assert(
        Boolean(histItem.energyInputId && (histItem.energyInputId.inputData || histItem.energyInputId._id)),
        `Prediction history populated with energyInput record`
      );

      // G. Validate Dynamic Recommendations Engine
      const recs = generateRecommendations(
        tc.facilityType,
        { ...tc.inputs, tariff: tc.tariff },
        pred
      );
      assert(
        Array.isArray(recs) && recs.length >= 2,
        `Generated ${recs.length} personalized recommendations for ${tc.facilityType}`
      );

      // Verify recommendation structure & INR savings
      const totalSavings = recs.reduce((sum, r) => sum + (r.estimatedSavingsMonthly || 0), 0);
      assert(
        totalSavings > 0,
        `Total potential monthly savings calculated: ₹${totalSavings.toLocaleString('en-IN')}/mo`
      );

      for (const rec of recs) {
        assert(
          Boolean(rec.title && rec.why && rec.expectedEffect && rec.actionStep),
          `Recommendation "${rec.title.slice(0, 35)}..." contains Title, Why, Effect, Action`
        );
      }
    }

    console.log('\n===============================================================');
    console.log(`🏁 VERIFICATION COMPLETE: ${passedTests} / ${totalTests} TESTS PASSED!`);
    console.log('===============================================================');

    if (passedTests === totalTests) {
      console.log('🎉 ALL PHASE 4 TESTS PASSED FLAWLESSLY!');
      process.exit(0);
    } else {
      console.error('⚠️ Some tests did not pass. Check logs above.');
      process.exit(1);
    }
  } catch (error) {
    console.error('Fatal Verification Error:', error.response?.data || error.message);
    process.exit(1);
  }
}

runPhase4Verification();
