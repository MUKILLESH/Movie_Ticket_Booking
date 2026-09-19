const express = require('express');
const router = express.Router();
const bookingController = require('../controllers/bookingController');
// const { bookingLimiter } = require('../middleware/rateLimiter'); // Will add this in Phase 10

// Create a booking
// router.post('/', bookingLimiter, bookingController.createBooking);
router.post('/', bookingController.createBooking);

// Get booking by ID
router.get('/:bookingId', bookingController.getBookingById);

// Get bookings for a customer (moved from customer routes for simplicity)
router.get('/customer/:customerId', bookingController.getCustomersBookings);

module.exports = router;
