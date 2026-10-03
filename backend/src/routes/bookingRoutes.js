const express = require('express');
const router = express.Router();
const bookingController = require('../controllers/bookingController');
const { requireAuth, requireAdmin } = require('../middleware/authMiddleware');
// const { bookingLimiter } = require('../middleware/rateLimiter'); // Will add this in Phase 10

// Create a booking
// router.post('/', bookingLimiter, requireAuth, bookingController.createBooking);
router.post('/', requireAuth, bookingController.createBooking);

// Get bookings for a customer (moved from customer routes for simplicity)
router.get('/my-bookings', requireAuth, bookingController.getMyBookings);
router.get('/customer/:customerId', requireAuth, bookingController.getCustomersBookings);

// Get booking by ID
router.get('/:bookingId', requireAuth, bookingController.getBookingById);

// CRUD operations for Demo Lab
router.get('/', requireAuth, requireAdmin, bookingController.getAllBookings);
router.put('/:id', requireAuth, requireAdmin, bookingController.updateBooking);
router.delete('/:id', requireAuth, requireAdmin, bookingController.deleteBooking);

module.exports = router;
