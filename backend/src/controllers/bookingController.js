const bookingService = require('../services/bookingService');
const queueService = require('../services/queueService');
const pool = require('../config/db');

exports.createBooking = async (req, res, next) => {
    try {
        const { showId, seatIds, paymentMode } = req.body;
        // In a real app, customerId would come from an authenticated token (req.user.id)
        // For this demo, we'll accept it in the body or default to Customer 1
        const customerId = req.body.customerId || 1;

        if (!showId || !seatIds || !Array.isArray(seatIds) || seatIds.length === 0) {
            return res.status(400).json({ error: 'Bad Request', message: 'showId and an array of seatIds are required.' });
        }

        // Add the booking transaction to the queue for this specific show
        const result = await queueService.enqueueBookingRequest(showId, async () => {
            return await bookingService.createBookingTransaction(customerId, showId, seatIds, paymentMode);
        });

        res.status(201).json({
            message: 'Booking successful',
            booking: result
        });

    } catch (error) {
        // Handle specific business logic errors
        if (error.message === 'SEAT_UNAVAILABLE' || error.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({ 
                error: 'SEAT_UNAVAILABLE', 
                message: 'One or more selected seats are no longer available.' 
            });
        }
        if (error.message === 'SHOW_NOT_FOUND') {
            return res.status(404).json({ error: 'Not Found', message: 'Show not found.' });
        }
        if (error.message === 'INVALID_SEATS') {
            return res.status(400).json({ error: 'Bad Request', message: 'One or more invalid seat IDs provided.' });
        }

        next(error);
    }
};

exports.getBookingById = async (req, res, next) => {
    try {
        const bookingId = req.params.bookingId;
        const [bookings] = await pool.query(`
            SELECT b.BookingID, b.BookingDate, b.TotalAmount, b.Status, c.Name as CustomerName,
                   s.ShowDate, s.ShowTime, m.Title as MovieTitle, t.Name as TheatreName, sc.ScreenNumber
            FROM BOOKING b
            JOIN CUSTOMER c ON b.CustomerID = c.CustomerID
            JOIN \`SHOW\` s ON b.ShowID = s.ShowID
            JOIN MOVIE m ON s.MovieID = m.MovieID
            JOIN SCREEN sc ON s.ScreenID = sc.ScreenID
            JOIN THEATRE t ON sc.TheatreID = t.TheatreID
            WHERE b.BookingID = ?
        `, [bookingId]);

        if (bookings.length === 0) {
            return res.status(404).json({ error: 'Not Found', message: 'Booking not found' });
        }

        // Fetch booked seats for this booking
        const [seats] = await pool.query(`
            SELECT st.SeatNumber, st.SeatType
            FROM BOOKING_SEAT bs
            JOIN SEAT st ON bs.SeatID = st.SeatID
            WHERE bs.BookingID = ?
        `, [bookingId]);

        const bookingDetails = {
            ...bookings[0],
            seats: seats.map(s => s.SeatNumber)
        };

        res.status(200).json(bookingDetails);
    } catch (error) {
        next(error);
    }
};

exports.getCustomersBookings = async (req, res, next) => {
    try {
        const customerId = req.params.customerId;
        const [bookings] = await pool.query(`
            SELECT b.BookingID, b.BookingDate, b.TotalAmount, b.Status, m.Title as MovieTitle
            FROM BOOKING b
            JOIN \`SHOW\` s ON b.ShowID = s.ShowID
            JOIN MOVIE m ON s.MovieID = m.MovieID
            WHERE b.CustomerID = ?
            ORDER BY b.BookingDate DESC
        `, [customerId]);

        res.status(200).json(bookings);
    } catch (error) {
        next(error);
    }
};
