const axios = require('axios');
const mongoose = require('mongoose');
const Facility = require('../models/Facility');
const Prediction = require('../models/Prediction');
const EnergyInput = require('../models/EnergyInput');
const WhatIfScenario = require('../models/WhatIfScenario');

const getMLServiceUrl = () => process.env.ML_SERVICE_URL || 'http://localhost:8000';

// Validation helper for modified inputs
const validateModifiedInput = (modifiedInput) => {
  if (!modifiedInput || typeof modifiedInput !== 'object') {
    return 'modifiedInput must be a valid object.';
  }

  // Check general negative numbers
  for (const [key, val] of Object.entries(modifiedInput)) {
    if (typeof val === 'number') {
      if (isNaN(val)) {
        return `Field '${key}' must be a valid number.`;
      }
      if (key !== 'temperature' && val < 0) {
        return `Field '${key}' cannot be negative (received: ${val}).`;
      }
    }
  }

  // Temperature bounds
  if (modifiedInput.temperature !== undefined) {
    const temp = Number(modifiedInput.temperature);
    if (isNaN(temp) || temp < -15 || temp > 65) {
      return `Temperature must be within realistic bounds (-15°C to 65°C), received: ${modifiedInput.temperature}.`;
    }
  }

  // Hours per day bounds
  const hourKeys = [
    'ac_hours', 'fan_hours', 'working_hours', 'computer_hours',
    'pump_hours', 'common_lighting_hours', 'lab_hours',
    'event_duration_hours', 'ev_charging_hours', 'decorative_lighting_hours', 'server_hours'
  ];

  for (const hKey of hourKeys) {
    if (modifiedInput[hKey] !== undefined) {
      const hVal = Number(modifiedInput[hKey]);
      if (hVal < 0 || hVal > 24) {
        return `Field '${hKey}' must be between 0 and 24 hours per day (received: ${hVal}).`;
      }
    }
  }

  return null;
};

// @desc    Simulate What-If energy scenario using FastAPI ML model
// @route   POST /api/whatif/:facilityId
// @access  Private
const simulateScenario = async (req, res) => {
  try {
    const { facilityId } = req.params;
    const { modifiedInput } = req.body;

    if (!mongoose.Types.ObjectId.isValid(facilityId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid facility ID format.',
      });
    }

    if (!modifiedInput) {
      return res.status(400).json({
        success: false,
        message: 'Please provide modifiedInput object in request body.',
      });
    }

    // 1. Verify Facility Ownership
    const facility = await Facility.findById(facilityId);
    if (!facility) {
      return res.status(404).json({
        success: false,
        message: 'Facility not found.',
      });
    }

    if (facility.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to simulate scenarios for this facility.',
      });
    }

    // 2. Validate Inputs
    const validationError = validateModifiedInput(modifiedInput);
    if (validationError) {
      return res.status(400).json({
        success: false,
        message: validationError,
      });
    }

    // 3. Retrieve Latest Baseline Prediction
    const latestPrediction = await Prediction.findOne({ facilityId: facility._id })
      .populate('energyInputId')
      .sort({ createdAt: -1 });

    if (!latestPrediction) {
      return res.status(400).json({
        success: false,
        message: 'No baseline prediction found for this facility. Please run an initial prediction first.',
      });
    }

    // Extract baseline raw input
    let baseInput = {};
    if (latestPrediction.energyInputId && latestPrediction.energyInputId.inputData) {
      baseInput = latestPrediction.energyInputId.inputData;
    } else {
      const latestInput = await EnergyInput.findOne({ facilityId: facility._id }).sort({ createdAt: -1 });
      if (latestInput && latestInput.inputData) {
        baseInput = latestInput.inputData;
      }
    }

    const beforePrediction = {
      predictedDailyConsumptionKwh: latestPrediction.predictedDailyConsumptionKwh,
      predictedDemandKw: latestPrediction.predictedDemandKw,
      peakRisk: latestPrediction.peakRisk,
      predictedPeakWindow: latestPrediction.predictedPeakWindow,
      expectedPeakKw: latestPrediction.expectedPeakKw,
      estimatedDailyCost: latestPrediction.estimatedDailyCost,
      estimatedMonthlyCost: latestPrediction.estimatedMonthlyCost,
      hourlyProfile: latestPrediction.hourlyProfile || {},
      applianceBreakdown: latestPrediction.applianceBreakdown || {},
      modelName: latestPrediction.modelName,
    };

    // 4. Prepare Payload for FastAPI ML Service
    const mlPayload = {
      ...baseInput,
      ...modifiedInput,
      facility_type: facility.facilityType,
      tariff: facility.tariff || 8.0,
      solar_available: facility.solar,
    };

    // 5. Send to FastAPI ML Service (No fake fallback!)
    const mlServiceUrl = getMLServiceUrl();
    let mlResponse;
    try {
      mlResponse = await axios.post(`${mlServiceUrl}/predict`, mlPayload, {
        timeout: 10000,
      });
    } catch (apiError) {
      console.error(`[What-If ML Error at ${mlServiceUrl}] ${apiError.message}`);
      return res.status(503).json({
        success: false,
        message: 'Unable to run the simulation right now. The prediction service is temporarily unavailable.',
        error: apiError.message,
      });
    }

    if (!mlResponse.data || !mlResponse.data.data) {
      return res.status(502).json({
        success: false,
        message: 'Invalid response format received from ML service.',
      });
    }

    const mlData = mlResponse.data.data;

    // 6. Extract New ML Prediction Output
    const afterPrediction = {
      predictedDailyConsumptionKwh: mlData.predicted_daily_consumption_kwh,
      predictedDemandKw: mlData.predicted_demand_kw,
      peakRisk: mlData.peak_risk || 'Low',
      predictedPeakWindow: mlData.predicted_peak_window || '',
      expectedPeakKw: mlData.expected_peak_kw || mlData.predicted_demand_kw,
      estimatedDailyCost: mlData.estimated_daily_cost || 0,
      estimatedMonthlyCost: mlData.estimated_monthly_cost || 0,
      hourlyProfile: mlData.hourly_demand_profile_kw || {},
      applianceBreakdown: mlData.estimated_appliance_breakdown || {},
      modelName: 'GradientBoostingRegressor',
    };

    // 7. Calculate Mathematical Differences
    const beforeKwh = beforePrediction.predictedDailyConsumptionKwh;
    const afterKwh = afterPrediction.predictedDailyConsumptionKwh;
    const dailyConsumptionDiff = Number((afterKwh - beforeKwh).toFixed(2));
    const dailyConsumptionPct = beforeKwh > 0 ? Number((((afterKwh - beforeKwh) / beforeKwh) * 100).toFixed(1)) : 0;

    const beforeKw = beforePrediction.predictedDemandKw;
    const afterKw = afterPrediction.predictedDemandKw;
    const demandDiff = Number((afterKw - beforeKw).toFixed(2));
    const demandPct = beforeKw > 0 ? Number((((afterKw - beforeKw) / beforeKw) * 100).toFixed(1)) : 0;

    const beforeCost = beforePrediction.estimatedMonthlyCost;
    const afterCost = afterPrediction.estimatedMonthlyCost;
    const monthlyCostDiff = Number((afterCost - beforeCost).toFixed(2));
    const monthlyCostPct = beforeCost > 0 ? Number((((afterCost - beforeCost) / beforeCost) * 100).toFixed(1)) : 0;

    const potentialMonthlySavings = monthlyCostDiff < 0 ? Math.abs(monthlyCostDiff) : 0;

    const comparison = {
      dailyConsumptionDiff,
      dailyConsumptionPct,
      demandDiff,
      demandPct,
      monthlyCostDiff,
      monthlyCostPct,
      potentialMonthlySavings,
      peakRiskBefore: beforePrediction.peakRisk,
      peakRiskAfter: afterPrediction.peakRisk,
      peakWindowBefore: beforePrediction.predictedPeakWindow,
      peakWindowAfter: afterPrediction.predictedPeakWindow,
    };

    // 8. Persist Scenario in WhatIfScenario Collection
    const scenario = await WhatIfScenario.create({
      userId: req.user._id,
      facilityId: facility._id,
      baseInput,
      modifiedInput,
      beforePrediction,
      afterPrediction,
    });

    res.status(201).json({
      success: true,
      scenario: {
        _id: scenario._id,
        facilityId: scenario.facilityId,
        baseInput: scenario.baseInput,
        modifiedInput: scenario.modifiedInput,
        beforePrediction: scenario.beforePrediction,
        afterPrediction: scenario.afterPrediction,
        comparison,
        createdAt: scenario.createdAt,
      },
    });
  } catch (error) {
    console.error(`[What-If Controller Error] ${error.message}`);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error processing What-If simulation.',
    });
  }
};

// @desc    Get all What-If scenarios for a facility
// @route   GET /api/whatif/:facilityId
// @access  Private
const getFacilityScenarios = async (req, res) => {
  try {
    const { facilityId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(facilityId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid facility ID format.',
      });
    }

    const facility = await Facility.findById(facilityId);
    if (!facility) {
      return res.status(404).json({
        success: false,
        message: 'Facility not found.',
      });
    }

    if (facility.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view scenarios for this facility.',
      });
    }

    const scenarios = await WhatIfScenario.find({
      facilityId: facility._id,
      userId: req.user._id,
    }).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: scenarios.length,
      scenarios,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Server error fetching What-If scenarios.',
    });
  }
};

// @desc    Get single What-If scenario detail by ID
// @route   GET /api/whatif/detail/:id
// @access  Private
const getScenarioById = async (req, res) => {
  try {
    const scenario = await WhatIfScenario.findById(req.params.id);

    if (!scenario) {
      return res.status(404).json({
        success: false,
        message: 'What-If scenario not found.',
      });
    }

    if (scenario.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view this scenario.',
      });
    }

    res.status(200).json({
      success: true,
      scenario,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Server error retrieving scenario details.',
    });
  }
};

module.exports = {
  simulateScenario,
  getFacilityScenarios,
  getScenarioById,
};
