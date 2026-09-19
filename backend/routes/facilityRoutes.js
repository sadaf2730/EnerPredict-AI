const express = require('express');
const router = express.Router();
const {
  createFacility,
  getFacilities,
  getFacilityById,
  deleteFacility,
} = require('../controllers/facilityController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect); // Protect all facility routes

router.route('/')
  .post(createFacility)
  .get(getFacilities);

router.route('/:id')
  .get(getFacilityById)
  .delete(deleteFacility);

module.exports = router;
