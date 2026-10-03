const pool = require('./src/config/db');
const bcrypt = require('bcrypt');

async function run() {
    try {
        console.log('Adding Role column...');
        await pool.query("ALTER TABLE CUSTOMER ADD COLUMN Role ENUM('USER', 'ADMIN') DEFAULT 'USER' NOT NULL");
        console.log('Role column added.');
    } catch (e) {
        if (e.code === 'ER_DUP_FIELDNAME') {
            console.log('Role column already exists.');
        } else {
            console.error('Error adding role column:', e.message);
        }
    }

    try {
        console.log('Inserting admin user...');
        const hash = await bcrypt.hash('admin123', 10);
        await pool.query(
            "INSERT INTO CUSTOMER (Name, Email, Phone, Password, Role) VALUES (?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE Role = 'ADMIN'",
            ['Admin', 'admin@cineticket.local', '0000000000', hash, 'ADMIN']
        );
        console.log('Admin user inserted.');
    } catch (e) {
        console.error('Error inserting admin user:', e.message);
    }
    
    try {
        console.log('Inserting normal user...');
        const hash2 = await bcrypt.hash('user123', 10);
        await pool.query(
            "INSERT INTO CUSTOMER (Name, Email, Phone, Password, Role) VALUES (?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE Role = 'USER'",
            ['User', 'user@cineticket.local', '1111111111', hash2, 'USER']
        );
        console.log('Normal user inserted.');
    } catch (e) {
        console.error('Error inserting normal user:', e.message);
    }

    process.exit(0);
}
run();
