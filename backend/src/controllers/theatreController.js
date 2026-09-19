const pool = require('../config/db');

exports.getAllTheatres = async (req, res, next) => {
    try {
        const [theatres] = await pool.query('SELECT * FROM THEATRE');
        res.status(200).json(theatres);
    } catch (error) {
        next(error);
    }
};

exports.getTheatreById = async (req, res, next) => {
    try {
        const theatreId = req.params.id;
        const [theatres] = await pool.query('SELECT * FROM THEATRE WHERE TheatreID = ?', [theatreId]);
        if (theatres.length === 0) {
            return res.status(404).json({ error: 'Not Found', message: 'Theatre not found' });
        }
        res.status(200).json(theatres[0]);
    } catch (error) {
        next(error);
    }
};
