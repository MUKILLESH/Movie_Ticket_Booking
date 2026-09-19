const express = require('express');
const router = express.Router({ mergeParams: true });
const seatController = require('../controllers/seatController');
const { recommendationLimiter } = require('../middleware/rateLimiter');

// The route will be mounted at /api/shows/:showId/seats
router.get('/', seatController.getShowSeats);

// The recommendation endpoint
router.post('/recommend', recommendationLimiter, seatController.recommendSeats);

module.exports = router;
