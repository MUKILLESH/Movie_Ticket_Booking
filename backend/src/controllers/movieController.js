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
