const express = require('express');
const router = express.Router();
const {
  createPrediction,
  getFacilityPredictions,
  getPredictionById,
} = require('../controllers/predictionController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect); // Protect all prediction routes

router.post('/', createPrediction);
router.get('/:facilityId', getFacilityPredictions);
router.get('/detail/:id', getPredictionById);

module.exports = router;
