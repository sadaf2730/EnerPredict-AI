/**
 * test_phase3_flow.js
 * Validates the complete Phase 3 flow across all 5 facility types:
 * 1. Register & Login (Auth flow)
 * 2. Create and submit:
 *    - Home
 *    - Office
 *    - College
 *    - Housing Society
 *    - Function Hall
 * 3. Asserts each returns genuine, distinct predictions from FastAPI via Express & MongoDB
 */

import axios from 'axios';

const BACKEND_URL = 'http://localhost:5000/api';
const FRONTEND_URL = 'http://localhost:5173';

async function runPhase3Tests() {
  console.log('='.repeat(75));
  console.log('PHASE 3 END-TO-END FLOW VERIFICATION ACROSS ALL 5 FACILITY TYPES');
  console.log('='.repeat(75));

  // 1. Verify Frontend server is reachable
  console.log('\n>>> CHECK 1: Verifying Vite Frontend Server at ' + FRONTEND_URL + '...');
  const feRes = await axios.get(FRONTEND_URL);
  console.log('  Vite Frontend HTTP Status:', feRes.status);
  console.log('  [PASS] Frontend server is running.');

  // 2. Register new test account
  console.log('\n>>> STEP 1: Registration & Authentication...');
  const userPayload = {
    name: 'Chief Facilities Officer',
    email: `cfo_${Date.now()}@multisite.com`,
    password: 'SecurePassword2026!',
  };
  const regRes = await axios.post(`${BACKEND_URL}/auth/register`, userPayload);
  const token = regRes.data.token;
  const headers = { Authorization: `Bearer ${token}` };
  console.log('  Registered User:', regRes.data.user.name, `(${regRes.data.user.email})`);
  console.log('  JWT Token acquired:', token.substring(0, 25) + '...');
  console.log('  [PASS] Auth flow ready.');

  // 3. Define 5 test facilities with distinct, realistic inputs
  const testFacilities = [
    {
      name: '1. Home / Residential',
      facilityType: 'home',
      facilityName: 'Greenwood Villa Residence',
      inputData: {
        family_members: 4,
        ac_units: 2,
        ac_hours: 8.0,
        fan_units: 4,
        fan_hours: 14.0,
        refrigerator_units: 1,
        geyser_hours: 1.0,
        washing_machine_hours: 1.5,
        tv_hours: 4.0,
        ev_charging: 1,
        ev_charging_hours: 3.5,
        temperature: 33.5,
        previous_bill: 6200,
      }
    },
    {
      name: '2. Office / Corporate',
      facilityType: 'office',
      facilityName: 'Apex Tech Innovation Hub',
      inputData: {
        employees: 137,
        employees_present: 128,
        computers: 96,
        computer_hours: 8.5,
        ac_units: 7,
        ac_hours: 6.5,
        working_hours: 9.0,
        server_active: 1,
        server_hours: 24.0,
        lighting_hours: 9.5,
        heavy_equipment: 1,
        temperature: 31.4,
        previous_bill: 72000,
      }
    },
    {
      name: '3. College / Educational Institute',
      facilityType: 'college',
      facilityName: 'Imperial Polytechnic Campus',
      inputData: {
        students: 1400,
        students_present: 1250,
        classrooms: 25,
        computers: 220,
        computer_hours: 7.0,
        labs: 8,
        lab_hours: 5.5,
        ac_units: 14,
        ac_hours: 7.5,
        hostel_active: 1,
        hostel_occupancy: 450,
        exam_period: 1,
        campus_event: 0,
        temperature: 32.0,
        previous_bill: 175000,
      }
    },
    {
      name: '4. Housing Society',
      facilityType: 'housing_society',
      facilityName: 'Palm Heights Gated Society',
      inputData: {
        total_flats: 90,
        occupied_flats: 84,
        residents: 280,
        lifts: 4,
        lift_usage_level: 2,
        pumps: 3,
        pump_hours: 7.0,
        common_lighting_hours: 11.0,
        gym_pool_active: 1,
        ev_points: 6,
        ev_usage_hours: 5.0,
        cctv_active: 1,
        temperature: 29.5,
        previous_bill: 135000,
      }
    },
    {
      name: '5. Function Hall / Banquet',
      facilityType: 'function_hall',
      facilityName: 'Royal Grand Banquet Palace',
      inputData: {
        event_type: 'Wedding',
        expected_guests: 650,
        event_duration_hours: 8.0,
        ac_units: 14,
        ac_hours: 7.5,
        decorative_lighting_hours: 7.0,
        catering_active: 1,
        sound_system_active: 1,
        temperature: 30.0,
        previous_bill: 95000,
      }
    }
  ];

  const results = [];

  for (const tf of testFacilities) {
    console.log(`\n--------------------------------------------------`);
    console.log(`>>> Testing ${tf.name}...`);

    // Step A: Create facility
    const facRes = await axios.post(
      `${BACKEND_URL}/facilities`,
      {
        facilityType: tf.facilityType,
        facilityName: tf.facilityName,
      },
      { headers }
    );
    const facilityId = facRes.data.facility._id;
    console.log(`  Created Facility ID: ${facilityId} (${tf.facilityName})`);

    // Step B: Submit prediction
    const predRes = await axios.post(
      `${BACKEND_URL}/predictions`,
      {
        facilityId,
        inputData: tf.inputData,
      },
      { headers }
    );

    const pred = predRes.data.prediction;
    console.log(`  Predicted Daily Energy:  ${pred.predictedDailyConsumptionKwh} kWh`);
    console.log(`  Predicted Peak Demand:   ${pred.predictedDemandKw} kW`);
    console.log(`  Peak Risk Rating:        ${pred.peakRisk}`);
    console.log(`  Predicted Peak Window:   ${pred.predictedPeakWindow}`);
    console.log(`  Estimated Monthly Cost:  INR ${pred.estimatedMonthlyCost}`);
    console.log(`  Model Used:              ${pred.modelName}`);

    results.push({
      facilityType: tf.facilityType,
      facilityName: tf.facilityName,
      kwh: pred.predictedDailyConsumptionKwh,
      kw: pred.predictedDemandKw,
      risk: pred.peakRisk,
      window: pred.predictedPeakWindow,
    });
  }

  // 4. Assert Distinct Predictions (Verifying NO Hardcoding / Canned values)
  console.log('\n' + '='.repeat(75));
  console.log('SUMMARY OF MULTI-FACILITY PREDICTIONS (DYNAMIC ML VERIFICATION):');
  console.log('='.repeat(75));
  results.forEach((r, idx) => {
    console.log(`  ${idx + 1}. [${r.facilityType.toUpperCase().padEnd(16)}] ${r.facilityName.padEnd(28)} => ${String(r.kwh).padStart(8)} kWh | ${String(r.kw).padStart(6)} kW | Peak: ${r.window}`);
  });

  // Verify all outputs are different
  const kwhSet = new Set(results.map(r => r.kwh));
  if (kwhSet.size !== results.length) {
    throw new Error('FAILED: Detected duplicate or canned outputs across different facility types!');
  }

  console.log('\n  [PASS] All 5 facility types produced distinct, tailored ML predictions!');
  console.log('='.repeat(75));
}

runPhase3Tests().catch((err) => {
  console.error('\n[TEST FAILURE]:', err.message);
  if (err.response) {
    console.error('API Error Response:', err.response.data);
  }
  process.exit(1);
});
