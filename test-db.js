require('dotenv').config();
const mysql = require('mysql2/promise');

async function testConnection() {
  console.log('🔧 Testing database connection...');
  console.log('Host:', process.env.DB_HOST);
  console.log('Port:', process.env.DB_PORT);
  console.log('Database:', process.env.DB_NAME);
  
  try {
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      port: parseInt(process.env.DB_PORT || '3306'),
      connectTimeout: 10000,
    });

    console.log('✅ Connected successfully!');

    // Check if sports table exists
    const [tables] = await connection.query('SHOW TABLES');
    console.log('\n📋 Tables in database:', tables);

    // Count records
    const [count] = await connection.query('SELECT COUNT(*) as total FROM sports');
    console.log('\n📊 Total records in sports table:', count[0].total);

    // Get sample data
    const [sample] = await connection.query('SELECT * FROM sports LIMIT 5');
    console.log('\n📄 Sample data:');
    console.log(sample);

    await connection.end();
    console.log('\n✅ Test complete!');
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Code:', error.code);
    console.error('Errno:', error.errno);
  }
}

testConnection();
