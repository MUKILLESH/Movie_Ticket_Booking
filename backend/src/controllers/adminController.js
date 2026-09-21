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

exports.executeSql = async (req, res, next) => {
    try {
        const { sql } = req.body;
        if (!sql || typeof sql !== 'string' || !sql.trim()) {
            return res.status(400).json({ success: false, error: 'Please enter a valid SQL query.' });
        }

        const trimmedSql = sql.trim();
        const startTime = process.hrtime();

        let results;
        let fields;
        try {
            [results, fields] = await pool.query(trimmedSql);
        } catch (dbErr) {
            // Provide informative response for the teacher demo
            return res.status(400).json({
                success: false,
                error: dbErr.message,
                sqlMessage: dbErr.sqlMessage || dbErr.message,
                code: dbErr.code,
                errno: dbErr.errno,
                sqlState: dbErr.sqlState,
                sql: trimmedSql
            });
        }

        const diff = process.hrtime(startTime);
        const executionTimeMs = Number(((diff[0] * 1e9 + diff[1]) / 1e6).toFixed(2));

        // In mysql2, multiple statements return an array where each element is a statement result
        if (Array.isArray(results) && results.length > 0 && Array.isArray(results[0])) {
            return res.status(200).json({
                success: true,
                isMultiResult: true,
                executionTimeMs,
                results: results.map(r => {
                    if (Array.isArray(r)) {
                        return {
                            type: 'SELECT',
                            rowCount: r.length,
                            columns: r.length > 0 ? Object.keys(r[0]) : [],
                            data: r
                        };
                    } else {
                        return {
                            type: 'DML',
                            affectedRows: r.affectedRows || 0,
                            insertId: r.insertId || 0,
                            changedRows: r.changedRows || 0,
                            message: r.message || ''
                        };
                    }
                })
            });
        }

        if (Array.isArray(results)) {
            // SELECT query
            const columns = fields && Array.isArray(fields) 
                ? fields.map(f => f.name) 
                : (results.length > 0 ? Object.keys(results[0]) : []);
            return res.status(200).json({
                success: true,
                type: 'SELECT',
                executionTimeMs,
                rowCount: results.length,
                columns,
                data: results
            });
        } else {
            // DML query: INSERT, UPDATE, DELETE, ALTER, etc.
            const firstWord = trimmedSql.split(/\s+/)[0].toUpperCase();
            return res.status(200).json({
                success: true,
                type: firstWord,
                executionTimeMs,
                affectedRows: results.affectedRows || 0,
                insertId: results.insertId || 0,
                changedRows: results.changedRows || 0,
                warningStatus: results.warningStatus || 0,
                message: results.message || `${results.affectedRows || 0} row(s) affected.`
            });
        }
    } catch (error) {
        next(error);
    }
};

exports.getPresets = async (req, res) => {
    const presets = [
        {
            category: 'INSERTION',
            title: 'Insert a New Movie',
            description: 'Demonstrates SQL INSERT command adding "Oppenheimer" to the MOVIE table.',
            sql: `INSERT INTO MOVIE (Title, Genre, Language, Duration, ReleaseDate)\nVALUES ('Oppenheimer', 'Biography/Drama', 'English', 180, '2023-07-21');`
        },
        {
            category: 'INSERTION',
            title: 'Insert a New Show',
            description: 'Demonstrates SQL INSERT adding a new screening for Inception (MovieID: 1) on Screen 1.',
            sql: `INSERT INTO \`SHOW\` (ShowDate, ShowTime, Price, MovieID, ScreenID)\nVALUES (CURDATE(), '20:30:00', 270.00, 1, 1);`
        },
        {
            category: 'INSERTION',
            title: 'Insert a New Customer',
            description: 'Demonstrates SQL INSERT adding a new user into the CUSTOMER table.',
            sql: `INSERT INTO CUSTOMER (Name, Email, Phone, Password)\nVALUES ('Suresh Kumar', 'suresh.kumar@example.com', '9876543299', 'securepass123');`
        },
        {
            category: 'MANIPULATION',
            title: 'Update Movie Name & Duration',
            description: 'Demonstrates SQL UPDATE command modifying the title of "Oppenheimer" to IMAX Edition.',
            sql: `UPDATE MOVIE\nSET Title = 'Oppenheimer (IMAX 70mm Special)', Duration = 185\nWHERE Title = 'Oppenheimer';`
        },
        {
            category: 'MANIPULATION',
            title: 'Update Show Ticket Price',
            description: 'Demonstrates SQL UPDATE changing show price for Screen 1 shows.',
            sql: `UPDATE \`SHOW\`\nSET Price = 320.00\nWHERE ShowID = 1;`
        },
        {
            category: 'MANIPULATION',
            title: 'Update Customer Phone Number',
            description: 'Demonstrates SQL UPDATE modifying existing customer records.',
            sql: `UPDATE CUSTOMER\nSET Phone = '9112233445'\nWHERE Email = 'suresh.kumar@example.com';`
        },
        {
            category: 'DELETION',
            title: 'Delete a Specific Show',
            description: 'Demonstrates SQL DELETE command removing the most recently added show.',
            sql: `DELETE FROM \`SHOW\`\nWHERE ShowID = (SELECT max_id FROM (SELECT MAX(ShowID) as max_id FROM \`SHOW\`) AS tmp);`
        },
        {
            category: 'DELETION',
            title: 'Delete Inserted Movie',
            description: 'Demonstrates SQL DELETE removing "Oppenheimer" movie entries.',
            sql: `DELETE FROM MOVIE\nWHERE Title LIKE 'Oppenheimer%';`
        },
        {
            category: 'DELETION',
            title: 'Delete Expired / Failed Bookings',
            description: 'Demonstrates SQL DELETE removing cancelled or failed booking transactions.',
            sql: `DELETE FROM BOOKING\nWHERE Status = 'FAILED';`
        },
        {
            category: 'SELECTION',
            title: 'View All Movies (Ordered by Recent)',
            description: 'Demonstrates SQL SELECT to inspect all movie records and verify insertions/updates.',
            sql: `SELECT MovieID, Title, Genre, Language, Duration, ReleaseDate\nFROM MOVIE\nORDER BY MovieID DESC;`
        },
        {
            category: 'SELECTION',
            title: 'View All Shows with Theatres & Screens',
            description: 'Demonstrates SQL multi-table JOIN showing all active shows.',
            sql: `SELECT s.ShowID, m.Title, sc.ScreenNumber, t.Name AS Theatre, t.City, s.ShowDate, s.ShowTime, s.Price\nFROM \`SHOW\` s\nJOIN MOVIE m ON s.MovieID = m.MovieID\nJOIN SCREEN sc ON s.ScreenID = sc.ScreenID\nJOIN THEATRE t ON sc.TheatreID = t.TheatreID\nORDER BY s.ShowID DESC;`
        },
        {
            category: 'SELECTION',
            title: 'View Total Revenue by Movie',
            description: 'Demonstrates SQL GROUP BY, SUM(), and ORDER BY aggregate analytics.',
            sql: `SELECT m.Title, COUNT(bs.SeatID) AS TicketsSold, COALESCE(SUM(b.TotalAmount), 0) AS TotalRevenue\nFROM MOVIE m\nLEFT JOIN \`SHOW\` s ON m.MovieID = s.MovieID\nLEFT JOIN BOOKING b ON s.ShowID = b.ShowID AND b.Status = 'CONFIRMED'\nLEFT JOIN BOOKING_SEAT bs ON b.BookingID = bs.BookingID\nGROUP BY m.MovieID\nORDER BY TotalRevenue DESC;`
        }
    ];

    res.status(200).json({ presets });
};

exports.resetSeed = async (req, res, next) => {
    try {
        const { exec } = require('child_process');
        const path = require('path');
        const seedPath = path.resolve(__dirname, '../../sql/seed.sql');

        // Use docker exec or mysql command to re-seed cleanly
        exec(`docker exec -i movie_ticket_mysql mysql -uroot -prootpassword movie_ticket_booking < "${seedPath}"`, (err, stdout, stderr) => {
            if (err) {
                console.error('Seed reset error:', stderr || err.message);
                return res.status(500).json({ 
                    success: false, 
                    error: 'Failed to reset seed data via Docker.', 
                    details: stderr || err.message 
                });
            }
            return res.status(200).json({ 
                success: true, 
                message: 'Database successfully restored to original seed state!' 
            });
        });
    } catch (error) {
        next(error);
    }
};

