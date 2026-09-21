const pool = require('../config/db');

exports.getAllMovies = async (req, res, next) => {
    try {
        const [movies] = await pool.query('SELECT * FROM MOVIE');
        res.status(200).json(movies);
    } catch (error) {
        next(error);
    }
};

exports.getMovieById = async (req, res, next) => {
    try {
        const movieId = req.params.id;
        const [movies] = await pool.query('SELECT * FROM MOVIE WHERE MovieID = ?', [movieId]);
        if (movies.length === 0) {
            return res.status(404).json({ error: 'Not Found', message: 'Movie not found' });
        }
        res.status(200).json(movies[0]);
    } catch (error) {
        next(error);
    }
};

exports.getShowsByMovie = async (req, res, next) => {
    try {
        const movieId = req.params.movieId;
        const [shows] = await pool.query(`
            SELECT s.ShowID, s.ShowDate, s.ShowTime, s.Price, sc.ScreenNumber, t.Name AS Theatre, t.Location
            FROM \`SHOW\` s
            JOIN SCREEN sc ON s.ScreenID = sc.ScreenID
            JOIN THEATRE t ON sc.TheatreID = t.TheatreID
            WHERE s.MovieID = ?
        `, [movieId]);
        res.status(200).json(shows);
    } catch (error) {
        next(error);
    }
};

// CRUD for Demo Lab
exports.createMovie = async (req, res, next) => {
    try {
        const { Title, Genre, Language, Duration, ReleaseDate } = req.body;
        const sql = 'INSERT INTO MOVIE (Title, Genre, Language, Duration, ReleaseDate) VALUES (?, ?, ?, ?, ?)';
        const params = [Title, Genre, Language, Duration, ReleaseDate];
        const [result] = await pool.query(sql, params);
        
        // Construct the literal SQL string for demo purposes
        const executedSql = \`INSERT INTO MOVIE (Title, Genre, Language, Duration, ReleaseDate) 
VALUES ('\${Title}', '\${Genre}', '\${Language}', \${Duration}, '\${ReleaseDate}');\`;

        res.status(201).json({ message: 'Movie created successfully', sql: executedSql, insertId: result.insertId });
    } catch (error) {
        next(error);
    }
};

exports.updateMovie = async (req, res, next) => {
    try {
        const movieId = req.params.id;
        const { Title, Genre, Language, Duration, ReleaseDate } = req.body;
        const sql = 'UPDATE MOVIE SET Title = ?, Genre = ?, Language = ?, Duration = ?, ReleaseDate = ? WHERE MovieID = ?';
        const params = [Title, Genre, Language, Duration, ReleaseDate, movieId];
        await pool.query(sql, params);

        const executedSql = \`UPDATE MOVIE 
SET Title = '\${Title}', Genre = '\${Genre}', Language = '\${Language}', Duration = \${Duration}, ReleaseDate = '\${ReleaseDate}' 
WHERE MovieID = \${movieId};\`;

        res.status(200).json({ message: 'Movie updated successfully', sql: executedSql });
    } catch (error) {
        next(error);
    }
};

exports.deleteMovie = async (req, res, next) => {
    try {
        const movieId = req.params.id;
        const sql = 'DELETE FROM MOVIE WHERE MovieID = ?';
        await pool.query(sql, [movieId]);

        const executedSql = \`DELETE FROM MOVIE WHERE MovieID = \${movieId};\`;

        res.status(200).json({ message: 'Movie deleted successfully', sql: executedSql });
    } catch (error) {
        next(error);
    }
};
