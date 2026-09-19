const axios = require('axios');
const mongoose = require('mongoose');
const Facility = require('../models/Facility');
const EnergyInput = require('../models/EnergyInput');
const Prediction = require('../models/Prediction');

const getMLServiceUrl = () => process.env.ML_SERVICE_URL || 'http://localhost:8000';

// Validation helper for facility-specific inputs
const validateInputData = (inputData, facilityType) => {
  if (!inputData || typeof inputData !== 'object') {
    return 'inputData must be a non-empty object.';
  }

  // Check general negative numbers
  for (const [key, val] of Object.entries(inputData)) {
    if (typeof val === 'number') {
      if (isNaN(val)) {
        return `Field '${key}' must be a valid number.`;
      }
      if (key !== 'temperature' && val < 0) {
        return `Field '${key}' cannot be negative (received: ${val}).`;
      }
    }
  }

  // Temperature reasonable range (-15°C to 65°C)
  if (inputData.temperature !== undefined) {
    const temp = Number(inputData.temperature);
    if (isNaN(temp) || temp < -15 || temp > 65) {
      return `Temperature must be within realistic ambient bounds (-15°C to 65°C), received: ${inputData.temperature}.`;
    }
  }

  // Hours per day bounds (0 to 24)
  const hourKeys = [
    'ac_hours', 'fan_hours', 'working_hours', 'computer_hours',
    'pump_hours', 'common_lighting_hours', 'lab_hours',
    'event_duration_hours', 'ev_charging_hours', 'decorative_lighting_hours'
  ];

  for (const hKey of hourKeys) {
    if (inputData[hKey] !== undefined) {
      const hVal = Number(inputData[hKey]);
      if (hVal < 0 || hVal > 24) {
        return `Field '${hKey}' must be between 0 and 24 hours per day (received: ${hVal}).`;
      }
    }
  }

  return null; // Valid
};

// @desc    Submit facility input, forward to FastAPI ML service, store prediction
// @route   POST /api/predictions
// @access  Private
const createPrediction = async (req, res) => {
  try {
    const { facilityId, inputData } = req.body;

    if (!facilityId) {
      return res.status(400).json({
        success: false,
        message: 'Please provide facilityId.',
      });
    }

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
        message: 'Not authorized to request prediction for this facility.',
      });
    }

    // Validate inputs
    const validationError = validateInputData(inputData, facility.facilityType);
    if (validationError) {
      return res.status(400).json({
        success: false,
        message: validationError,
      });
    }

    // 1. Store the raw input in EnergyInput collection
    const energyInput = await EnergyInput.create({
      userId: req.user._id,
      facilityId: facility._id,
      facilityType: facility.facilityType,
      inputData,
    });

    // 2. Prepare payload for FastAPI ML Service
    const mlPayload = {
      ...inputData,
      facility_type: inputData.facility_type || facility.facilityType,
      tariff: facility.tariff,
      solar_available: facility.solar || inputData.solar_available,
    };

    // 3. Send input to FastAPI ML Service using Axios
    let mlResponse;
    const mlServiceUrl = getMLServiceUrl();
    try {
      mlResponse = await axios.post(`${mlServiceUrl}/predict`, mlPayload, {
        timeout: 10000,
      });
    } catch (apiError) {
      console.error(`[FastAPI Communication Error at ${mlServiceUrl}] ${apiError.message}`);
      // As explicitly required: DO NOT produce fake predictions when ML service is down
      return res.status(503).json({
        success: false,
        message: 'ML prediction service is currently unavailable.',
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

    // 4. Store prediction from FastAPI in MongoDB
    const predictionRecord = await Prediction.create({
      userId: req.user._id,
      facilityId: facility._id,
      energyInputId: energyInput._id,
      predictedDailyConsumptionKwh: mlData.predicted_daily_consumption_kwh,
      predictedDemandKw: mlData.predicted_demand_kw,
      peakRisk: mlData.peak_risk || 'Low',
      predictedPeakWindow: mlData.predicted_peak_window || '',
      expectedPeakKw: mlData.expected_peak_kw || mlData.predicted_demand_kw,
      estimatedDailyCost: mlData.estimated_daily_cost || 0,
      estimatedMonthlyCost: mlData.estimated_monthly_cost || 0,
      applianceBreakdown: mlData.estimated_appliance_breakdown || {},
      hourlyProfile: mlData.hourly_demand_profile_kw || {},
      modelName: 'GradientBoostingRegressor',
    });

    // 5. Return clean response to the client
    res.status(201).json({
      success: true,
      prediction: {
        _id: predictionRecord._id,
        facilityId: predictionRecord.facilityId,
        energyInputId: predictionRecord.energyInputId,
        energyInput: energyInput,
        predictedDailyConsumptionKwh: predictionRecord.predictedDailyConsumptionKwh,
        predictedDemandKw: predictionRecord.predictedDemandKw,
        peakRisk: predictionRecord.peakRisk,
        predictedPeakWindow: predictionRecord.predictedPeakWindow,
        expectedPeakKw: predictionRecord.expectedPeakKw,
        estimatedDailyCost: predictionRecord.estimatedDailyCost,
        estimatedMonthlyCost: predictionRecord.estimatedMonthlyCost,
        applianceBreakdown: predictionRecord.applianceBreakdown,
        hourlyProfile: predictionRecord.hourlyProfile,
        modelName: predictionRecord.modelName,
        createdAt: predictionRecord.createdAt,
      },
    });
  } catch (error) {
    console.error(`[Prediction Controller Error] ${error.message}`);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error processing prediction request.',
    });
  }
};

// @desc    Get prediction history for a specific facility
// @route   GET /api/predictions/:facilityId
// @access  Private
const getFacilityPredictions = async (req, res) => {
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
        message: 'Not authorized to view predictions for this facility.',
      });
    }

    const predictions = await Prediction.find({ facilityId: facility._id })
      .populate('energyInputId')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: predictions.length,
      predictions,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Server error fetching prediction history.',
    });
  }
};

// @desc    Get single prediction by ID
// @route   GET /api/predictions/detail/:id
// @access  Private
const getPredictionById = async (req, res) => {
  try {
    const prediction = await Prediction.findById(req.params.id).populate('energyInputId');

    if (!prediction) {
      return res.status(404).json({
        success: false,
        message: 'Prediction not found.',
      });
    }

    if (prediction.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view this prediction.',
      });
    }

    res.status(200).json({
      success: true,
      prediction,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Server error retrieving prediction.',
    });
  }
};

module.exports = {
  createPrediction,
  getFacilityPredictions,
  getPredictionById,
};
