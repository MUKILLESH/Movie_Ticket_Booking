const pool = require('../config/db');

exports.getAllBookedSeats = async (req, res, next) => {
    try {
        const [bookedSeats] = await pool.query(`
            SELECT bs.BookingID, bs.SeatID, bs.PriceAtBooking, 
                   s.ScreenNumber, t.Name AS TheatreName, m.Title AS MovieTitle, sh.ShowDate, sh.ShowTime
            FROM BOOKING_SEAT bs
            JOIN SEAT st ON bs.SeatID = st.SeatID
            JOIN BOOKING b ON bs.BookingID = b.BookingID
            JOIN \`SHOW\` sh ON b.ShowID = sh.ShowID
            JOIN MOVIE m ON sh.MovieID = m.MovieID
            JOIN SCREEN s ON sh.ScreenID = s.ScreenID
            JOIN THEATRE t ON s.TheatreID = t.TheatreID
        `);
        res.status(200).json(bookedSeats);
    } catch (error) {
        next(error);
    }
};

exports.createBookedSeat = async (req, res, next) => {
    try {
        const { BookingID, SeatID, PriceAtBooking } = req.body;
        const sql = 'INSERT INTO BOOKING_SEAT (BookingID, SeatID, PriceAtBooking) VALUES (?, ?, ?)';
        const params = [BookingID, SeatID, PriceAtBooking];
        await pool.query(sql, params);
        
        const executedSql = `INSERT INTO BOOKING_SEAT (BookingID, SeatID, PriceAtBooking) VALUES (${BookingID}, ${SeatID}, ${PriceAtBooking});`;

        res.status(201).json({ message: 'Booked seat created successfully', sql: executedSql });
    } catch (error) {
        next(error);
    }
};

exports.updateBookedSeat = async (req, res, next) => {
    try {
        const { bookingId, seatId } = req.params;
        const { PriceAtBooking } = req.body;
        
        const sql = 'UPDATE BOOKING_SEAT SET PriceAtBooking = ? WHERE BookingID = ? AND SeatID = ?';
        const params = [PriceAtBooking, bookingId, seatId];
        await pool.query(sql, params);

        const executedSql = `UPDATE BOOKING_SEAT SET PriceAtBooking = ${PriceAtBooking} WHERE BookingID = ${bookingId} AND SeatID = ${seatId};`;

        res.status(200).json({ message: 'Booked seat updated successfully', sql: executedSql });
    } catch (error) {
        next(error);
    }
};

exports.deleteBookedSeat = async (req, res, next) => {
    try {
        const { bookingId, seatId } = req.params;
        const sql = 'DELETE FROM BOOKING_SEAT WHERE BookingID = ? AND SeatID = ?';
        await pool.query(sql, [bookingId, seatId]);

        const executedSql = `DELETE FROM BOOKING_SEAT WHERE BookingID = ${bookingId} AND SeatID = ${seatId};`;

        res.status(200).json({ message: 'Booked seat deleted successfully', sql: executedSql });
    } catch (error) {
        next(error);
    }
};
