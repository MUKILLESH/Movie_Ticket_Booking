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

exports.createShow = async (req, res, next) => {
    try {
        const { ShowDate, ShowTime, Price, MovieID, ScreenID } = req.body;
        const sql = 'INSERT INTO `SHOW` (ShowDate, ShowTime, Price, MovieID, ScreenID) VALUES (?, ?, ?, ?, ?)';
        const params = [ShowDate, ShowTime, Price, MovieID, ScreenID];
        const [result] = await pool.query(sql, params);
        
        const executedSql = `INSERT INTO \`SHOW\` (ShowDate, ShowTime, Price, MovieID, ScreenID) VALUES ('${ShowDate}', '${ShowTime}', ${Price}, ${MovieID}, ${ScreenID});`;

        res.status(201).json({ message: 'Show created successfully', sql: executedSql, insertId: result.insertId });
    } catch (error) {
        next(error);
    }
};

exports.updateShow = async (req, res, next) => {
    try {
        const showId = req.params.id;
        const { ShowDate, ShowTime, Price, MovieID, ScreenID } = req.body;
        const sql = 'UPDATE `SHOW` SET ShowDate = ?, ShowTime = ?, Price = ?, MovieID = ?, ScreenID = ? WHERE ShowID = ?';
        const params = [ShowDate, ShowTime, Price, MovieID, ScreenID, showId];
        await pool.query(sql, params);

        const executedSql = `UPDATE \`SHOW\` SET ShowDate = '${ShowDate}', ShowTime = '${ShowTime}', Price = ${Price}, MovieID = ${MovieID}, ScreenID = ${ScreenID} WHERE ShowID = ${showId};`;

        res.status(200).json({ message: 'Show updated successfully', sql: executedSql });
    } catch (error) {
        next(error);
    }
};

exports.deleteShow = async (req, res, next) => {
    try {
        const showId = req.params.id;
        const sql = 'DELETE FROM `SHOW` WHERE ShowID = ?';
        await pool.query(sql, [showId]);

        const executedSql = `DELETE FROM \`SHOW\` WHERE ShowID = ${showId};`;

        res.status(200).json({ message: 'Show deleted successfully', sql: executedSql });
    } catch (error) {
        next(error);
    }
};
