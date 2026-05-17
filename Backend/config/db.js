const mysql = require('mysql2');
require('dotenv').config();

// Establish a database connection pool
const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT || 3306,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// Test the connection to the cloud database to ensure the server remains active
pool.getConnection((err, connection) => {
    if (err) {
        console.error('Cloud database connection failed. Error:', err.message);
    } else {
        console.log('Remote connection successful! Backend successfully linked to Railway cloud MySQL.');
        connection.release();
    }
});

module.exports = pool.promise();