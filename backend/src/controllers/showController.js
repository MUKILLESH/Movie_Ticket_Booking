const pool = require('../config/db');

exports.getAllShows = async (req, res, next) => {
    try {
        const [shows] = await pool.query(`
            SELECT s.ShowID, s.ShowDate, s.ShowTime, s.Price, m.Title AS MovieTitle, sc.ScreenNumber, t.Name AS Theatre
            FROM \`SHOW\` s
            JOIN MOVIE m ON s.MovieID = m.MovieID
            JOIN SCREEN sc ON s.ScreenID = sc.ScreenID
            JOIN THEATRE t ON sc.TheatreID = t.TheatreID
        `);
        res.status(200).json(shows);
    } catch (error) {
        next(error);
    }
};

exports.getShowById = async (req, res, next) => {
    try {
        const showId = req.params.id;
        const [shows] = await pool.query(`
            SELECT s.ShowID, s.ShowDate, s.ShowTime, s.Price, m.Title AS MovieTitle, sc.ScreenNumber, t.Name AS Theatre
            FROM \`SHOW\` s
            JOIN MOVIE m ON s.MovieID = m.MovieID
            JOIN SCREEN sc ON s.ScreenID = sc.ScreenID
            JOIN THEATRE t ON sc.TheatreID = t.TheatreID
            WHERE s.ShowID = ?
        `, [showId]);
        
        if (shows.length === 0) {
            return res.status(404).json({ error: 'Not Found', message: 'Show not found' });
        }
        res.status(200).json(shows[0]);
    } catch (error) {
        next(error);
    }
};
