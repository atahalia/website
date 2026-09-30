const mysql = require('mysql2');
require('dotenv').config();

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,        // cukup untuk 16 parallel queries di home
  queueLimit: 50,
  connectTimeout: 10000,
  enableKeepAlive: true,
  keepAliveInitialDelay: 10000,
  timezone: '+07:00',
  dateStrings: true,          // Kembalikan DATE/DATETIME sebagai string, bukan Date object
  charset: 'utf8mb4'
});

// Validasi koneksi saat startup
pool.getConnection((err, conn) => {
  if (err) {
    console.error('❌ Database connection failed:', err.message);
  } else {
    console.log('✅ Database connected');
    conn.release();
  }
});

module.exports = pool.promise();
