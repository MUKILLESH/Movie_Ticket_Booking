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

// CRUD for Demo Lab
exports.createTheatre = async (req, res, next) => {
    try {
        const { Name, Location, City } = req.body;
        const sql = 'INSERT INTO THEATRE (Name, Location, City) VALUES (?, ?, ?)';
        const params = [Name, Location, City];
        const [result] = await pool.query(sql, params);
        
        const executedSql = `INSERT INTO THEATRE (Name, Location, City) VALUES ('${Name}', '${Location}', '${City}');`;

        res.status(201).json({ message: 'Theatre created successfully', sql: executedSql, insertId: result.insertId });
    } catch (error) {
        next(error);
    }
};

exports.updateTheatre = async (req, res, next) => {
    try {
        const theatreId = req.params.id;
        const { Name, Location, City } = req.body;
        const sql = 'UPDATE THEATRE SET Name = ?, Location = ?, City = ? WHERE TheatreID = ?';
        const params = [Name, Location, City, theatreId];
        await pool.query(sql, params);

        const executedSql = `UPDATE THEATRE SET Name = '${Name}', Location = '${Location}', City = '${City}' WHERE TheatreID = ${theatreId};`;

        res.status(200).json({ message: 'Theatre updated successfully', sql: executedSql });
    } catch (error) {
        next(error);
    }
};

exports.deleteTheatre = async (req, res, next) => {
    try {
        const theatreId = req.params.id;
        const sql = 'DELETE FROM THEATRE WHERE TheatreID = ?';
        await pool.query(sql, [theatreId]);

        const executedSql = `DELETE FROM THEATRE WHERE TheatreID = ${theatreId};`;

        res.status(200).json({ message: 'Theatre deleted successfully', sql: executedSql });
    } catch (error) {
        next(error);
    }
};
