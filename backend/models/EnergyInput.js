const mongoose = require('mongoose');

const energyInputSchema = new mongoose.Schema({
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
  facilityType: {
    type: String,
    required: true,
  },
  inputData: {
    type: mongoose.Schema.Types.Mixed,
    required: [true, 'Please provide facility input parameters'],
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('EnergyInput', energyInputSchema);
