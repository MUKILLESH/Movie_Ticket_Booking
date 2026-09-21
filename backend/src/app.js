const express = require('express');
const cors = require('cors');

// Import middleware
const { apiLimiter, bookingLimiter } = require('./middleware/rateLimiter');
// const errorHandler = require('./middleware/errorHandler');

// Import routes
const movieRoutes = require('./routes/movieRoutes');
const theatreRoutes = require('./routes/theatreRoutes');
const showRoutes = require('./routes/showRoutes');
const seatRoutes = require('./routes/seatRoutes');
const bookingRoutes = require('./routes/bookingRoutes');
const bookedSeatRoutes = require('./routes/bookedSeatRoutes');
// const paymentRoutes = require('./routes/paymentRoutes');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Admin & demo routes (independent of general rate limiter)
app.use('/api/admin', require('./routes/adminRoutes'));

// Apply general rate limiter to public API routes
app.use('/api/', apiLimiter);

// Mount Routes
app.use('/api/movies', movieRoutes);
app.use('/api/theatres', theatreRoutes);
app.use('/api/shows', showRoutes);
app.use('/api/shows/:showId/seats', seatRoutes);
app.use('/api/booked-seats', bookedSeatRoutes);

// Apply strict rate limiter to bookings
app.use('/api/bookings', bookingLimiter, bookingRoutes);
// app.use('/api/payments', paymentRoutes);

// Generic error handler
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Internal Server Error', message: err.message });
});

module.exports = app;
