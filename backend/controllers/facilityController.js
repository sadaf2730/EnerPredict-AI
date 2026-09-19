const mongoose = require('mongoose');
const Facility = require('../models/Facility');

const VALID_FACILITY_TYPES = ['home', 'housing_society', 'office', 'college', 'function_hall'];

// @desc    Create a new facility for authenticated user
// @route   POST /api/facilities
// @access  Private
const createFacility = async (req, res) => {
  try {
    const { facilityType, facilityName, configuration, tariff, solar } = req.body;

    if (!facilityType || !facilityName) {
      return res.status(400).json({
        success: false,
        message: 'Please provide facilityType and facilityName.',
      });
    }

    const normalizedType = facilityType.toLowerCase().trim();
    if (!VALID_FACILITY_TYPES.includes(normalizedType)) {
      return res.status(400).json({
        success: false,
        message: `Invalid facility type: ${facilityType}. Allowed types: ${VALID_FACILITY_TYPES.join(', ')}`,
      });
    }

    const facility = await Facility.create({
      userId: req.user._id,
      facilityType: normalizedType,
      facilityName,
      configuration: configuration || {},
      tariff: tariff !== undefined ? Number(tariff) : 8.5,
      solar: Boolean(solar),
    });

    res.status(201).json({
      success: true,
      facility,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Server error creating facility.',
    });
  }
};

// @desc    Get all facilities belonging to authenticated user
// @route   GET /api/facilities
// @access  Private
const getFacilities = async (req, res) => {
  try {
    const facilities = await Facility.find({ userId: req.user._id }).sort({ createdAt: -1 });
    res.status(200).json({
      success: true,
      count: facilities.length,
      facilities,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Server error fetching facilities.',
    });
  }
};

// @desc    Get single facility by ID
// @route   GET /api/facilities/:id
// @access  Private
const getFacilityById = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid facility ID format.',
      });
    }

    const facility = await Facility.findById(req.params.id);

    if (!facility) {
      return res.status(404).json({
        success: false,
        message: 'Facility not found.',
      });
    }

    if (facility.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access this facility.',
      });
    }

    res.status(200).json({
      success: true,
      facility,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Server error retrieving facility.',
    });
  }
};

// @desc    Delete facility
// @route   DELETE /api/facilities/:id
// @access  Private
const deleteFacility = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid facility ID format.',
      });
    }

    const facility = await Facility.findById(req.params.id);

    if (!facility) {
      return res.status(404).json({
        success: false,
        message: 'Facility not found.',
      });
    }

    if (facility.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this facility.',
      });
    }

    await facility.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Facility deleted successfully.',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Server error deleting facility.',
    });
  }
};

module.exports = {
  createFacility,
  getFacilities,
  getFacilityById,
  deleteFacility,
};
