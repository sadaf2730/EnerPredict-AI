const mongoose = require('mongoose');

const predictionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  facilityId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Facility',
    required: true,
  },
  energyInputId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'EnergyInput',
  },
  predictedDailyConsumptionKwh: {
    type: Number,
    required: true,
  },
  predictedDemandKw: {
    type: Number,
    required: true,
  },
  peakRisk: {
    type: String,
    enum: ['Low', 'Medium', 'High'],
    default: 'Low',
  },
  predictedPeakWindow: {
    type: String,
    default: '',
  },
  expectedPeakKw: {
    type: Number,
    default: 0,
  },
  estimatedDailyCost: {
    type: Number,
    default: 0,
  },
  estimatedMonthlyCost: {
    type: Number,
    default: 0,
  },
  applianceBreakdown: {
    type: mongoose.Schema.Types.Mixed,
    default: {},
  },
  hourlyProfile: {
    type: mongoose.Schema.Types.Mixed,
    default: {},
  },
  modelName: {
    type: String,
    default: 'GradientBoostingRegressor',
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('Prediction', predictionSchema);
