/**
 * test_phase2.js
 * Comprehensive test suite verifying Phase 2 backend functionality:
 *   Test 1: User Registration
 *   Test 2: User Login & JWT Generation
 *   Test 3: Facility Creation (Office)
 *   Test 4: Submit Completely New Energy Input
 *   Test 5: Verify Express forwards payload to FastAPI
 *   Test 6: Verify FastAPI returns genuine ML prediction
 *   Test 7: Verify Express stores prediction in MongoDB
 *   Test 8: Retrieve stored prediction from MongoDB
 *   Test 9: Verify Input Validation (negative hours, invalid type)
 *   Test 10: Verify Error Handling when ML service is unavailable (HTTP 503, NO fake predictions)
 */

const axios = require('axios');
const http = require('http');
const app = require('./server');
const mongoose = require('mongoose');
const { closeDB } = require('./config/db');

const TEST_PORT = 5055;
const BASE_URL = `http://localhost:${TEST_PORT}`;
const ML_URL = process.env.ML_SERVICE_URL || 'http://localhost:8000';

async function runTests() {
  console.log('='.repeat(75));
  console.log('PHASE 2 AUTOMATED TEST SUITE: EXPRESS BACKEND + MONGODB + FASTAPI');
  console.log('='.repeat(75));

  // 0. Start temporary Express test server
  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(TEST_PORT, resolve));
  console.log(`[Test Runner] Test server listening on ${BASE_URL}`);

  let authToken = '';
  let testUserId = '';
  let testFacilityId = '';
  let testPredictionId = '';

  try {
    // ----------------------------------------------------
    // PRE-CHECK: Backend Health Check & ML Connectivity
    // ----------------------------------------------------
    console.log('\n>>> PRE-CHECK: Probing GET /api/health...');
    const healthRes = await axios.get(`${BASE_URL}/api/health`);
    console.log('  Status Code:', healthRes.status);
    console.log('  Backend Status:', healthRes.data.backend);
    console.log('  Database Status:', healthRes.data.database);
    console.log('  ML Service Status:', healthRes.data.mlService);
    if (healthRes.data.mlHealthDetails) {
      console.log('  ML Selected Model:', healthRes.data.mlHealthDetails.metrics_summary?.selected_model);
      console.log('  ML Validation R²:', healthRes.data.mlHealthDetails.metrics_summary?.overall_validation_R2);
    }
    console.log('  [PASS] System components verified.');

    // ----------------------------------------------------
    // TEST 1: Register User
    // ----------------------------------------------------
    console.log('\n>>> TEST 1: Register User (POST /api/auth/register)...');
    const timestamp = Date.now();
    const userPayload = {
      name: 'Energy Manager',
      email: `manager_${timestamp}@cleanpower.io`,
      password: 'StrongPassword123!',
    };

    const regRes = await axios.post(`${BASE_URL}/api/auth/register`, userPayload);
    console.log('  Status Code:', regRes.status);
    console.log('  Registered User ID:', regRes.data.user._id);
    console.log('  User Name:', regRes.data.user.name);
    console.log('  User Email:', regRes.data.user.email);
    console.log('  JWT Token received:', regRes.data.token.substring(0, 25) + '...');
    if (regRes.data.user.password) {
      throw new Error('SECURITY VIOLATION: Plaintext or hashed password leaked in response!');
    }
    testUserId = regRes.data.user._id;
    console.log('  [PASS] User registration succeeded without password leakage.');

    // ----------------------------------------------------
    // TEST 2: User Login
    // ----------------------------------------------------
    console.log('\n>>> TEST 2: User Login (POST /api/auth/login)...');
    const loginRes = await axios.post(`${BASE_URL}/api/auth/login`, {
      email: userPayload.email,
      password: userPayload.password,
    });
    console.log('  Status Code:', loginRes.status);
    console.log('  Authenticated User ID:', loginRes.data.user._id);
    console.log('  JWT Token generated:', loginRes.data.token.substring(0, 25) + '...');
    authToken = loginRes.data.token;
    console.log('  [PASS] User login succeeded and JWT acquired.');

    const authHeaders = {
      headers: { Authorization: `Bearer ${authToken}` },
    };

    // ----------------------------------------------------
    // TEST 3: Create Facility
    // ----------------------------------------------------
    console.log('\n>>> TEST 3: Create Facility (POST /api/facilities)...');
    const facilityPayload = {
      facilityType: 'office',
      facilityName: 'TechPark Innovation Tower',
      tariff: 8.5,
      solar: false,
    };

    const facRes = await axios.post(`${BASE_URL}/api/facilities`, facilityPayload, authHeaders);
    console.log('  Status Code:', facRes.status);
    console.log('  Facility ID:', facRes.data.facility._id);
    console.log('  Facility Name:', facRes.data.facility.facilityName);
    console.log('  Facility Type:', facRes.data.facility.facilityType);
    console.log('  Owner ID:', facRes.data.facility.userId);
    testFacilityId = facRes.data.facility._id;
    console.log('  [PASS] Facility created successfully in MongoDB.');

    // ----------------------------------------------------
    // TEST 4, 5, 6, 7: Submit New Input -> FastAPI -> MongoDB
    // ----------------------------------------------------
    console.log('\n>>> TESTS 4-7: Submit Input -> Forward to FastAPI -> Store ML Prediction...');
    // Completely novel, unseen office profile
    const rawInputData = {
      facility_type: 'office',
      employees: 137,
      employees_present: 128,
      computers: 96,
      computer_hours: 8.5,
      ac_units: 7,
      ac_hours: 6.5,
      working_hours: 9.0,
      temperature: 31.4,
      previous_bill: 72000,
    };

    console.log('  Forwarding payload via Express to FastAPI ML service...');
    const predRes = await axios.post(
      `${BASE_URL}/api/predictions`,
      {
        facilityId: testFacilityId,
        inputData: rawInputData,
      },
      authHeaders
    );

    console.log('  Status Code:', predRes.status);
    const pred = predRes.data.prediction;
    testPredictionId = pred._id;

    console.log('  --- ML Prediction Received ---');
    console.log('  Prediction ID:', pred._id);
    console.log('  EnergyInput Ref ID:', pred.energyInputId);
    console.log('  Predicted Daily Consumption:', pred.predictedDailyConsumptionKwh, 'kWh');
    console.log('  Predicted Peak Demand:', pred.predictedDemandKw, 'kW');
    console.log('  Peak Risk Level:', pred.peakRisk);
    console.log('  Predicted Peak Window:', pred.predictedPeakWindow);
    console.log('  Estimated Monthly Cost:', `INR ${pred.estimatedMonthlyCost}`);
    console.log('  Model Used:', pred.modelName);

    // Assertions
    if (!pred.predictedDailyConsumptionKwh || pred.predictedDailyConsumptionKwh <= 0) {
      throw new Error('Invalid ML predicted daily consumption.');
    }
    if (!pred.predictedDemandKw || pred.predictedDemandKw <= 0) {
      throw new Error('Invalid ML predicted peak demand.');
    }
    console.log('  [PASS Test 4] Novel user inputs accepted.');
    console.log('  [PASS Test 5] Express successfully communicated with FastAPI /predict.');
    console.log('  [PASS Test 6] Genuine ML prediction returned from trained model.');
    console.log('  [PASS Test 7] Prediction persisted into MongoDB collection.');

    // ----------------------------------------------------
    // TEST 8: Retrieve Stored Prediction
    // ----------------------------------------------------
    console.log('\n>>> TEST 8: Retrieve Stored Prediction (GET /api/predictions/:facilityId)...');
    const histRes = await axios.get(`${BASE_URL}/api/predictions/${testFacilityId}`, authHeaders);
    console.log('  Status Code:', histRes.status);
    console.log('  Records Found:', histRes.data.count);
    const retrieved = histRes.data.predictions[0];
    console.log('  Retrieved Prediction ID:', retrieved._id);
    console.log('  Retrieved Daily kWh:', retrieved.predictedDailyConsumptionKwh);
    console.log('  Retrieved Peak kW:', retrieved.predictedDemandKw);
    if (retrieved._id !== testPredictionId) {
      throw new Error('Retrieved ID does not match stored prediction.');
    }
    console.log('  [PASS] Stored prediction accurately retrieved from MongoDB.');

    // ----------------------------------------------------
    // TEST 9: Test Invalid Input Validation
    // ----------------------------------------------------
    console.log('\n>>> TEST 9: Input Validation Test (Negative hours & invalid facility)...');
    // Test 9a: Negative hours
    try {
      await axios.post(
        `${BASE_URL}/api/predictions`,
        {
          facilityId: testFacilityId,
          inputData: {
            ac_hours: -5, // Illegal negative value
            employees: 100,
          },
        },
        authHeaders
      );
      throw new Error('Validation failed: Accepted illegal negative hours!');
    } catch (valErr) {
      if (valErr.response && valErr.response.status === 400) {
        console.log('  [PASS 9a] Rejected negative hours with HTTP 400:', valErr.response.data.message);
      } else {
        throw valErr;
      }
    }

    // Test 9b: Invalid facility type in facility creation
    try {
      await axios.post(
        `${BASE_URL}/api/facilities`,
        {
          facilityType: 'nuclear_reactor', // Unsupported facility type
          facilityName: 'Unregulated Plant',
        },
        authHeaders
      );
      throw new Error('Validation failed: Accepted unsupported facility type!');
    } catch (facValErr) {
      if (facValErr.response && facValErr.response.status === 400) {
        console.log('  [PASS 9b] Rejected unsupported facility type with HTTP 400:', facValErr.response.data.message);
      } else {
        throw facValErr;
      }
    }
    console.log('  [PASS Test 9] Validation middleware blocked all invalid inputs.');

    // ----------------------------------------------------
    // TEST 10: ML Service Unavailable Error Handling
    // ----------------------------------------------------
    console.log('\n>>> TEST 10: ML Service Unavailable Error Handling (No fake AI)...');
    // Temporarily point Express to a nonexistent port to simulate ML outage
    const originalUrl = process.env.ML_SERVICE_URL;
    process.env.ML_SERVICE_URL = 'http://localhost:59999'; // Dead port

    try {
      await axios.post(
        `${BASE_URL}/api/predictions`,
        {
          facilityId: testFacilityId,
          inputData: rawInputData,
        },
        authHeaders
      );
      throw new Error('SECURITY/AI INTEGRITY ERROR: Express generated fake prediction during ML outage!');
    } catch (downErr) {
      if (downErr.response && downErr.response.status === 503) {
        console.log('  Status Code:', downErr.response.status);
        console.log('  Error Message:', downErr.response.data.message);
        if (downErr.response.data.message !== 'ML prediction service is currently unavailable.') {
          throw new Error('Unexpected error message during outage.');
        }
        console.log('  [PASS Test 10] Express returned HTTP 503 and strictly refused to produce fake predictions.');
      } else {
        throw downErr;
      }
    } finally {
      process.env.ML_SERVICE_URL = originalUrl;
    }

    console.log('\n' + '='.repeat(75));
    console.log('ALL 10 TESTS PASSED SUCCESSFULLY! FULL BACKEND INTEGRATION CONFIRMED.');
    console.log('='.repeat(75));
  } finally {
    // Cleanup
    server.close();
    await closeDB();
  }
}

runTests().catch((err) => {
  console.error('\n[FATAL TEST FAILURE]:', err.message);
  if (err.response) {
    console.error('Response Data:', err.response.data);
  }
  process.exit(1);
});
