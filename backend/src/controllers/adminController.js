const pool = require('../config/db');

exports.getStats = async (req, res, next) => {
    try {
        const queries = {
            movies: 'SELECT COUNT(*) as count FROM MOVIE',
            theatres: 'SELECT COUNT(*) as count FROM THEATRE',
            screens: 'SELECT COUNT(*) as count FROM SCREEN',
            seats: 'SELECT COUNT(*) as count FROM SEAT',
            customers: 'SELECT COUNT(*) as count FROM CUSTOMER',
            totalBookings: 'SELECT COUNT(*) as count FROM BOOKING',
            confirmedBookings: "SELECT COUNT(*) as count FROM BOOKING WHERE Status = 'CONFIRMED'",
            revenue: "SELECT SUM(TotalAmount) as total FROM BOOKING WHERE Status = 'CONFIRMED'"
        };

        const stats = {};
        for (const [key, query] of Object.entries(queries)) {
            const [rows] = await pool.query(query);
            stats[key] = rows[0].count !== undefined ? rows[0].count : (rows[0].total || 0);
        }

        res.status(200).json(stats);
    } catch (error) {
        next(error);
    }
};

exports.runDemoQuery = async (req, res, next) => {
    try {
        const { queryId } = req.body;
        let sql = '';
        let description = '';

        switch (queryId) {
            case 'most-booked-movies':
                sql = `
                    SELECT m.Title, COUNT(bs.SeatID) AS TicketsSold
                    FROM MOVIE m
                    JOIN \`SHOW\` s ON m.MovieID = s.MovieID
                    JOIN BOOKING b ON s.ShowID = b.ShowID
                    JOIN BOOKING_SEAT bs ON b.BookingID = bs.BookingID
                    WHERE b.Status = 'CONFIRMED'
                    GROUP BY m.MovieID
                    ORDER BY TicketsSold DESC
                `;
                description = "Shows the most popular movies by counting individual seats booked, demonstrating JOIN, GROUP BY, and Aggregate functions.";
                break;
            case 'revenue-by-theatre':
                sql = `
                    SELECT t.Name AS Theatre, SUM(b.TotalAmount) AS Revenue
                    FROM BOOKING b
                    JOIN \`SHOW\` s ON b.ShowID = s.ShowID
                    JOIN SCREEN sc ON s.ScreenID = sc.ScreenID
                    JOIN THEATRE t ON sc.TheatreID = t.TheatreID
                    WHERE b.Status = 'CONFIRMED'
                    GROUP BY t.TheatreID
                `;
                description = "Calculates total revenue generated per theatre, demonstrating multi-table JOINs and SUM().";
                break;
            case 'available-seats-count':
                sql = `
                    SELECT m.Title, sh.ShowDate, sh.ShowTime, 
                           sc.SeatCapacity - COUNT(bs.SeatID) AS AvailableSeats
                    FROM \`SHOW\` sh
                    JOIN MOVIE m ON sh.MovieID = m.MovieID
                    JOIN SCREEN sc ON sh.ScreenID = sc.ScreenID
                    LEFT JOIN BOOKING_SEAT bs ON sh.ShowID = bs.ShowID
                    GROUP BY sh.ShowID
                `;
                description = "Shows available seats for each show using LEFT JOIN and capacity subtraction.";
                break;
            case 'high-value-customers':
                sql = `
                    SELECT c.Name, c.Email, COUNT(b.BookingID) AS TotalBookings, SUM(b.TotalAmount) AS TotalSpent
                    FROM CUSTOMER c
                    JOIN BOOKING b ON c.CustomerID = b.CustomerID
                    WHERE b.Status = 'CONFIRMED'
                    GROUP BY c.CustomerID
                    HAVING TotalSpent > 0
                    ORDER BY TotalSpent DESC
                `;
                description = "Identifies top customers using GROUP BY, SUM(), and the HAVING clause.";
                break;
            case 'occupancy-rate':
                sql = `
                    SELECT 
                        m.Title, 
                        sh.ShowDate,
                        sc.SeatCapacity AS TotalCapacity,
                        COUNT(bs.SeatID) AS BookedSeats,
                        ROUND((COUNT(bs.SeatID) / sc.SeatCapacity) * 100, 2) AS OccupancyPercentage
                    FROM \`SHOW\` sh
                    JOIN MOVIE m ON sh.MovieID = m.MovieID
                    JOIN SCREEN sc ON sh.ScreenID = sc.ScreenID
                    LEFT JOIN BOOKING_SEAT bs ON sh.ShowID = bs.ShowID
                    GROUP BY sh.ShowID
                `;
                description = "Calculates theatre occupancy percentage per show using aggregate arithmetic.";
                break;
            case 'unique-constraint-check':
                sql = `
                    SELECT TABLE_NAME, CONSTRAINT_NAME, CONSTRAINT_TYPE 
                    FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS 
                    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'BOOKING_SEAT'
                `;
                description = "Verifies the database schema integrity: shows Foreign Keys and the UNIQUE(ShowID, SeatID) constraint in BOOKING_SEAT.";
                break;
            default:
                return res.status(400).json({ error: 'Bad Request', message: 'Invalid queryId' });
        }

        const [rows] = await pool.query(sql);
        res.status(200).json({ description, sql, data: rows });
    } catch (error) {
        next(error);
    }
};
