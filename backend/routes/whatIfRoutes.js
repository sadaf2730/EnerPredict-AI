const express = require('express');
const router = express.Router();
const {
  simulateScenario,
  getFacilityScenarios,
  getScenarioById,
} = require('../controllers/whatIfController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

// @desc    Simulate What-If scenario using live FastAPI ML model
// @route   POST /api/whatif/:facilityId
router.post('/:facilityId', simulateScenario);

// @desc    Get What-If scenarios history for a facility
// @route   GET /api/whatif/:facilityId
router.get('/:facilityId', getFacilityScenarios);

// @desc    Get single What-If scenario detail by ID
// @route   GET /api/whatif/detail/:id
router.get('/detail/:id', getScenarioById);

module.exports = router;
