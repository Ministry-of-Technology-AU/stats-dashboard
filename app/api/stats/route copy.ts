// app/api/stats/route.ts
// REPLACE YOUR ENTIRE app/api/stats/route.ts WITH THIS FILE

import { NextResponse } from 'next/server';
import mysql from 'mysql2/promise';

const INVENTORY_LEVELS: Record<string, number> = {
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

export async function GET() {
  let connection;
  
  try {
    console.log('=== API ROUTE CALLED ===');
    console.log('Connecting to database...');
    
    // Create connection
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME || 'sportsinventory',
    });

    console.log('Database connected!');

    // 1. Average Borrowing Duration
    console.log('Fetching avg duration...');
    const [avgResult]: any = await connection.query(`
      SELECT 
        COALESCE(AVG(TIMESTAMPDIFF(DAY, outTime, inTime)), 0) as avgDuration
      FROM sports 
      WHERE status = 'RETURNED' AND inTime IS NOT NULL AND outTime IS NOT NULL
    `);
    const avgBorrowingDuration = Number(avgResult[0]?.avgDuration) || 0;
    console.log('Avg Duration:', avgBorrowingDuration);

    // 2. Late Return Rate
    console.log('Fetching late return rate...');
    const [lateResult]: any = await connection.query(`
      SELECT 
        COALESCE(
          (COUNT(CASE WHEN status = 'LATE' THEN 1 END) * 100.0 / NULLIF(COUNT(*), 0)),
          0
        ) as lateReturnRate
      FROM sports 
      WHERE status IN ('LATE', 'RETURNED', 'PENDING')
    `);
    const lateReturnRate = Number(lateResult[0]?.lateReturnRate) || 0;
    console.log('Late Rate:', lateReturnRate);

    // 3. Peak Borrowing Times - Aggregate
    console.log('Fetching peak times...');
    const [peakTimesAggregate]: any = await connection.query(`
      SELECT 
        HOUR(outTime) as hour,
        COUNT(*) as count
      FROM sports 
      WHERE outTime IS NOT NULL
      GROUP BY HOUR(outTime)
      ORDER BY hour
    `);
    console.log('Peak Times:', peakTimesAggregate.length, 'hours with data');

    // 4. Peak Borrowing Times - By Equipment
    const equipmentList = ['basketball', 'football', 'tennis', 'badminton racket', 'volleyball', 'TT'];
    const peakBorrowingTimes: any = { aggregate: peakTimesAggregate };

    for (const equipment of equipmentList) {
      const [equipmentPeakTimes]: any = await connection.query(`
        SELECT 
          HOUR(outTime) as hour,
          COUNT(*) as count
        FROM sports 
        WHERE LOWER(equipment) = LOWER(?) AND outTime IS NOT NULL
        GROUP BY HOUR(outTime)
        ORDER BY hour
      `, [equipment]);
      peakBorrowingTimes[equipment] = equipmentPeakTimes;
    }

    // 5. Most Borrowed Equipment
    console.log('Fetching most borrowed...');
    const [mostBorrowed]: any = await connection.query(`
      SELECT 
        equipment,
        COUNT(*) as borrowCount,
        (COUNT(*) * 100.0 / (SELECT COUNT(*) FROM sports)) as percentage
      FROM sports 
      GROUP BY equipment
      ORDER BY borrowCount DESC
      LIMIT 5
    `);
    console.log('Most Borrowed:', mostBorrowed);

    // 6. Least Borrowed Equipment
    console.log('Fetching least borrowed...');
    const [leastBorrowed]: any = await connection.query(`
      SELECT 
        equipment,
        COUNT(*) as borrowCount,
        (COUNT(*) * 100.0 / (SELECT COUNT(*) FROM sports)) as percentage
      FROM sports 
      GROUP BY equipment
      ORDER BY borrowCount ASC
      LIMIT 5
    `);
    console.log('Least Borrowed:', leastBorrowed);

    // 7. Run Out Frequency
    console.log('Fetching run out frequency...');
    const [runOutData]: any = await connection.query(`
      SELECT 
        equipment,
        DATE(outTime) as borrowDate,
        COUNT(*) as dailyBorrows
      FROM sports 
      WHERE outTime >= DATE_SUB(NOW(), INTERVAL 90 DAY)
      GROUP BY equipment, DATE(outTime)
    `);

    const runOutFrequency: any = {};
    runOutData.forEach((row: any) => {
      const equipment = row.equipment;
      const inventoryLevel = INVENTORY_LEVELS[equipment?.toLowerCase()] || 
                            INVENTORY_LEVELS[equipment] || 5;
      
      if (!runOutFrequency[equipment]) {
        runOutFrequency[equipment] = { equipment, runOutCount: 0 };
      }
      
      if (row.dailyBorrows >= inventoryLevel * 0.8) {
        runOutFrequency[equipment].runOutCount++;
      }
    });

    const runOutFrequencyArray = Object.values(runOutFrequency)
      .map((item: any) => ({
        ...item,
        percentage: (item.runOutCount / 90) * 100
      }))
      .sort((a: any, b: any) => b.runOutCount - a.runOutCount)
      .slice(0, 5);

    await connection.end();
    console.log('=== DATA FETCH COMPLETE ===');

    const data = {
      avgBorrowingDuration,
      lateReturnRate,
      peakBorrowingTimes,
      mostBorrowed,
      leastBorrowed,
      runOutFrequency: runOutFrequencyArray
    };

    console.log('Returning data:', JSON.stringify(data, null, 2));

    return NextResponse.json(data);
    
  } catch (error: any) {
    console.error('=== DATABASE ERROR ===');
    console.error('Error:', error.message);
    console.error('Stack:', error.stack);
    
    if (connection) {
      await connection.end();
    }
    
    return NextResponse.json(
      { 
        error: 'Failed to fetch statistics',
        details: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}