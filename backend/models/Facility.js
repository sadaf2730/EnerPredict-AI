const mongoose = require('mongoose');

const facilitySchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  facilityType: {
    type: String,
    required: [true, 'Please specify facility type'],
    enum: {
      values: ['home', 'housing_society', 'office', 'college', 'function_hall'],
      message: '{VALUE} is not a supported facility type',
    },
  },
  facilityName: {
    type: String,
    required: [true, 'Please provide a facility name'],
    trim: true,
  },
  configuration: {
    type: mongoose.Schema.Types.Mixed,
    default: {},
  },
  tariff: {
    type: Number,
    default: 8.5,
  },
  solar: {
    type: Boolean,
    default: false,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('Facility', facilitySchema);
