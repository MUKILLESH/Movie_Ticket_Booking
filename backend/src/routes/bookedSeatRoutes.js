const express = require('express');
const router = express.Router();
const bookedSeatController = require('../controllers/bookedSeatController');

router.get('/', bookedSeatController.getAllBookedSeats);
router.post('/', bookedSeatController.createBookedSeat);
router.put('/:bookingId/:seatId', bookedSeatController.updateBookedSeat);
router.delete('/:bookingId/:seatId', bookedSeatController.deleteBookedSeat);

module.exports = router;
