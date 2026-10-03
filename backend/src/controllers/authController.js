const pool = require('../config/db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const register = async (req, res) => {
    try {
        const { name, email, phone, password } = req.body;
        if (!name || !email || !password) {
            return res.status(400).json({ error: 'Name, email, and password are required' });
        }
        
        const [existing] = await pool.query('SELECT CustomerID FROM CUSTOMER WHERE Email = ?', [email]);
        if (existing.length > 0) {
            return res.status(400).json({ error: 'Email already registered' });
        }
        
        const hash = await bcrypt.hash(password, 10);
        // Force role to USER
        const [result] = await pool.query(
            'INSERT INTO CUSTOMER (Name, Email, Phone, Password, Role) VALUES (?, ?, ?, ?, ?)',
            [name, email, phone || null, hash, 'USER']
        );
        
        res.status(201).json({ message: 'Registration successful', customerId: result.insertId });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

const login = async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required' });
        }
        
        const [users] = await pool.query('SELECT CustomerID, Name, Email, Password, Role FROM CUSTOMER WHERE Email = ?', [email]);
        if (users.length === 0) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }
        
        const user = users[0];
        const match = await bcrypt.compare(password, user.Password);
        if (!match) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }
        
        const token = jwt.sign(
            { id: user.CustomerID, role: user.Role, email: user.Email, name: user.Name },
            process.env.JWT_SECRET || 'fallback_secret_cineticket',
            { expiresIn: '24h' }
        );
        
        res.json({
            message: 'Login successful',
            token,
            user: {
                id: user.CustomerID,
                name: user.Name,
                email: user.Email,
                role: user.Role
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

const getProfile = async (req, res) => {
    try {
        const [users] = await pool.query('SELECT CustomerID, Name, Email, Phone, Role FROM CUSTOMER WHERE CustomerID = ?', [req.user.id]);
        if (users.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }
        res.json(users[0]);
    } catch (error) {
        console.error('Profile error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

module.exports = { register, login, getProfile };
