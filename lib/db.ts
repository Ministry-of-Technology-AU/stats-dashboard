import mysql from 'mysql2/promise';

export const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME || 'sportsinventory',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
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