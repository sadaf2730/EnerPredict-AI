const mongoose = require('mongoose');

const whatIfScenarioSchema = new mongoose.Schema({
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
  baseInput: {
    type: mongoose.Schema.Types.Mixed,
    required: true,
  },
  modifiedInput: {
    type: mongoose.Schema.Types.Mixed,
    required: true,
  },
  beforePrediction: {
    type: mongoose.Schema.Types.Mixed,
    required: true,
  },
  afterPrediction: {
    type: mongoose.Schema.Types.Mixed,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('WhatIfScenario', whatIfScenarioSchema);
