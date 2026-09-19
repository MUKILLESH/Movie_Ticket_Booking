const pool = require('../config/db');

/**
 * Core transaction logic for booking seats.
 * Ensures atomicity and prevents double booking using DB locks and constraints.
 */
exports.createBookingTransaction = async (customerId, showId, seatIds, paymentMode) => {
    const connection = await pool.getConnection();
    
    try {
        console.log(`[DB] Transaction started for Customer: ${customerId}, Show: ${showId}`);
        await connection.beginTransaction();

        // 1. Verify show exists and get details
        const [shows] = await connection.query('SELECT * FROM `SHOW` WHERE ShowID = ? FOR SHARE', [showId]);
        if (shows.length === 0) {
            throw new Error('SHOW_NOT_FOUND');
        }
        const show = shows[0];

        // 2. Lock relevant seat rows to prevent concurrent modifications on these specific seats
        // This is a crucial step for concurrency control
        console.log(`[DB] Checking seat availability and locking rows`);
        const [seats] = await connection.query(
            'SELECT SeatID, SeatType FROM SEAT WHERE SeatID IN (?) AND ScreenID = ? FOR UPDATE',
            [seatIds, show.ScreenID]
        );

        if (seats.length !== seatIds.length) {
            throw new Error('INVALID_SEATS');
        }

        // 3. Re-check availability by checking if they exist in BOOKING_SEAT for this show
        // The UNIQUE(ShowID, SeatID) constraint in the DB will also catch this, 
        // but checking here gives a better error message before attempting insert.
        const [existingBookings] = await connection.query(
            'SELECT SeatID FROM BOOKING_SEAT WHERE ShowID = ? AND SeatID IN (?)',
            [showId, seatIds]
        );

        if (existingBookings.length > 0) {
            throw new Error('SEAT_UNAVAILABLE');
        }

        // 4. Calculate Total Amount
        const totalAmount = show.Price * seatIds.length;

        // 5. Create BOOKING
        console.log(`[DB] Inserting Booking`);
        const [bookingResult] = await connection.query(
            'INSERT INTO BOOKING (TotalAmount, Status, CustomerID, ShowID) VALUES (?, ?, ?, ?)',
            [totalAmount, 'PENDING', customerId, showId]
        );
        const bookingId = bookingResult.insertId;

        // 6. Create BOOKING_SEAT records
        // If a concurrent transaction somehow got here, the UNIQUE(ShowID, SeatID) 
        // constraint will trigger an ER_DUP_ENTRY error here.
        console.log(`[DB] Inserting Booking Seats`);
        const bookingSeatValues = seatIds.map(seatId => [bookingId, showId, seatId]);
        await connection.query(
            'INSERT INTO BOOKING_SEAT (BookingID, ShowID, SeatID) VALUES ?',
            [bookingSeatValues]
        );

        // 7. Create PAYMENT simulation
        // In a real app, this would call a payment gateway. 
        // Here we simulate success.
        console.log(`[DB] Simulating Payment and Inserting Payment Record`);
        const paymentStatus = 'SUCCESS'; // Simulated success
        await connection.query(
            'INSERT INTO PAYMENT (Amount, PaymentMode, PaymentStatus, BookingID) VALUES (?, ?, ?, ?)',
            [totalAmount, paymentMode || 'UPI', paymentStatus, bookingId]
        );

        // 8. Update Booking Status to CONFIRMED
        await connection.query(
            'UPDATE BOOKING SET Status = ? WHERE BookingID = ?',
            ['CONFIRMED', bookingId]
        );

        // 9. COMMIT
        console.log(`[DB] Transaction committed successfully for BookingID: ${bookingId}`);
        await connection.commit();

        return {
            bookingId,
            totalAmount,
            status: 'CONFIRMED',
            seats: seatIds
        };

    } catch (error) {
        // 10. ROLLBACK on any failure
        console.error(`[DB] Transaction rolled back due to error: ${error.message}`);
        await connection.rollback();
        throw error;
    } finally {
        // Always release connection back to pool
        connection.release();
    }
};
