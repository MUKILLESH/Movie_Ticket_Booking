const pool = require('../config/db');

exports.getShowSeats = async (req, res, next) => {
    try {
        const showId = req.params.showId;
        
        // Use the view we created in schema.sql to easily get seat availability
        const [seats] = await pool.query(`
            SELECT SeatID, SeatNumber, SeatType, Price, Status
            FROM view_show_seats
            WHERE ShowID = ?
        `, [showId]);
        
        if (seats.length === 0) {
            // It could be an invalid show ID or a show with no seats setup
            // Let's verify if the show exists
            const [shows] = await pool.query('SELECT ShowID FROM `SHOW` WHERE ShowID = ?', [showId]);
            if (shows.length === 0) {
                return res.status(404).json({ error: 'Not Found', message: 'Show not found' });
            }
        }

        res.status(200).json(seats);
    } catch (error) {
        next(error);
    }
};

const { findBestContiguousSeats } = require('../utils/bestSeatAlgorithm');

exports.recommendSeats = async (req, res, next) => {
    try {
        const showId = req.params.showId;
        const { groupSize, preferredType } = req.body;

        if (!groupSize || groupSize <= 0) {
            return res.status(400).json({ error: 'Bad Request', message: 'Valid groupSize is required.' });
        }

        // 1. Fetch current seat layout for the show using the view
        const [seats] = await pool.query(`
            SELECT SeatID, SeatNumber, SeatType, Status
            FROM view_show_seats
            WHERE ShowID = ?
        `, [showId]);

        if (seats.length === 0) {
            return res.status(404).json({ error: 'Not Found', message: 'Show or seats not found' });
        }

        // 2. Run algorithm
        const bestSeats = findBestContiguousSeats(seats, groupSize, preferredType);

        if (!bestSeats) {
            return res.status(404).json({ 
                error: 'NO_CONTIGUOUS_SEATS', 
                message: 'Could not find the requested number of contiguous available seats.' 
            });
        }

        res.status(200).json({
            message: 'Best contiguous seats found.',
            recommendedSeats: bestSeats
        });

    } catch (error) {
        next(error);
    }
};
