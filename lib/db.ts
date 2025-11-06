import mysql from 'mysql2/promise';

// Validate required environment variables
const requiredEnvVars = ['DB_HOST', 'DB_USER', 'DB_PASSWORD', 'DB_NAME'];
const missingEnvVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingEnvVars.length > 0) {
  console.error('❌ Missing required environment variables:', missingEnvVars.join(', '));
  throw new Error(`Missing required environment variables: ${missingEnvVars.join(', ')}`);
}

console.log('🔧 Database configuration:', {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  database: process.env.DB_NAME || 'sportsinventory',
  port: process.env.DB_PORT || 3306,
});

export const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME || 'sportsinventory',
  port: parseInt(process.env.DB_PORT || '3306'),
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  connectTimeout: 10000, // 10 seconds
  enableKeepAlive: true,
  keepAliveInitialDelay: 0,
});

// Test connection on startup
pool.getConnection()
  .then(connection => {
    console.log('✅ Database pool connection test successful');
    connection.release();
  })
  .catch(error => {
    console.error('❌ Database pool connection test failed:', error.message);
  });

// Inventory levels for each equipment
export const INVENTORY_LEVELS = {
  'badminton racket': 13,
  'squash': 8,
  'tennis': 6,
  'TT': 12,
  'chess': 2,
  'carrom coin': 1,
  'basketball': 8,
  'football': 8,
  'volleyball': 4,
  'yoga mat': 10,
  'pickleball racket + ball': 8,
  'cycle': 10,
  'cricket bat + ball': 2,
  'weight machine': 1,
  'boxing gloves': 1,
  'washroom locker key': 18,
  'frisbee': 2,
  'foosball': 2,
  'daateball': 1,
  'pool sticks': 5
};