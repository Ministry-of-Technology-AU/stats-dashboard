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
  'pool sticks': 5,
};

export async function getStats() {
  let connection;

  try {
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME || 'sportsinventory',
    });

    const [avgResult]: any = await connection.query(`
      SELECT 
        COALESCE(AVG(TIMESTAMPDIFF(DAY, outTime, inTime)), 0) as avgDuration
      FROM sports 
      WHERE status = 'RETURNED' AND inTime IS NOT NULL AND outTime IS NOT NULL
    `);
    const avgBorrowingDuration = Number(avgResult[0]?.avgDuration) || 0;

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

    const [peakTimesAggregate]: any = await connection.query(`
      SELECT 
        HOUR(outTime) as hour,
        COUNT(*) as count
      FROM sports 
      WHERE outTime IS NOT NULL
      GROUP BY HOUR(outTime)
      ORDER BY hour
    `);

    const equipmentList = Object.keys(INVENTORY_LEVELS);
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

      const fullDayData = Array.from({ length: 24 }, (_, hour) => ({
        hour,
        count: 0,
      }));

      equipmentPeakTimes.forEach((row: any) => {
        const idx = fullDayData.findIndex((d) => d.hour === row.hour);
        if (idx !== -1) fullDayData[idx].count = row.count;
      });

      peakBorrowingTimes[equipment] = fullDayData;
    }

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
      const inventoryLevel =
        INVENTORY_LEVELS[equipment?.toLowerCase()] ||
        INVENTORY_LEVELS[equipment] ||
        5;

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
        percentage: (item.runOutCount / 90) * 100,
      }))
      .sort((a: any, b: any) => b.runOutCount - a.runOutCount)
      .slice(0, 5);

    await connection.end();

    return {
      avgBorrowingDuration,
      lateReturnRate,
      peakBorrowingTimes,
      mostBorrowed,
      leastBorrowed,
      runOutFrequency: runOutFrequencyArray,
    };

  } catch (error: any) {
    console.error("❌ Error fetching stats:", error.message);
    if (connection) {
      await connection.end();
    }
    throw error;
  }
}
