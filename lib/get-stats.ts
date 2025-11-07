import { pool } from './db';

const INVENTORY_LEVELS: Record<string, number> = {
  'Badminton Racquet': 20,
  'Table Tennis Racquet': 15,
  'Squash Racquet': 10,
  'Tennis Racquet': 12,
  'Pickleball Racquet': 8,
  'Pool Stick': 5,
  'Cycle': 7,
  'Football': 10,
  'Volleyball': 6,
  'Basketball': 8,
  'Fooseball': 2,
  'Yoga Mat': 5,
  'Chess': 3,
  'Cricket Bat': 4,
  'Frisbee': 4,
};

export async function getStats() {
  let connection;

  try {
    console.log('🔄 Getting connection from pool...');
    
    connection = await pool.getConnection();

    console.log('✅ Database connection established from pool');

    console.log('📊 Fetching average borrowing duration...');
    const [avgResult]: any = await connection.query(`
      SELECT 
        COALESCE(AVG(TIMESTAMPDIFF(DAY, outTime, inTime)), 0) as avgDuration
      FROM sports 
      WHERE status = 'RETURNED' AND inTime IS NOT NULL AND outTime IS NOT NULL
    `);
    const avgBorrowingDuration = Number(avgResult[0]?.avgDuration) || 0;
    console.log('✅ Average duration:', avgBorrowingDuration.toFixed(2), 'days');

    console.log('📊 Fetching late return rate...');
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
    console.log('✅ Late return rate:', lateReturnRate.toFixed(2), '%');

    const equipmentList = Object.keys(INVENTORY_LEVELS);
    const peakBorrowingTimes: any = {};

    // Calculate total inventory across all equipment
    const totalInventory = Object.values(INVENTORY_LEVELS).reduce((sum, val) => sum + val, 0);
    console.log('📦 Total inventory capacity:', totalInventory);

    console.log('🔄 Processing borrowing patterns...');
    
    // HOUR VIEW: Last 24 hours
    console.log('⏰ Calculating hourly patterns (last 24 hours)...');
    const hourlyData: any = {};
    const aggregateHourly: any = Array.from({ length: 24 }, (_, hour) => ({
      period: hour,
      borrowed: 0,
      returned: 0,
      totalBorrowed: 0,
      totalCapacity: totalInventory,
      availabilityPercent: 100,
    }));

    for (const equipment of equipmentList) {
      const hourData = Array.from({ length: 24 }, (_, hour) => ({
        period: hour,
        borrowed: 0,
        returned: 0,
      }));

      // Get hourly borrow/return counts
      const [hourlyTxns]: any = await connection.query(`
        SELECT 
          HOUR(outTime) as hour,
          COALESCE(SUM(outNum), 0) as borrowed
        FROM sports 
        WHERE LOWER(equipment) = LOWER(?) 
          AND outTime >= DATE_SUB(NOW(), INTERVAL 24 HOUR)
        GROUP BY HOUR(outTime)
      `, [equipment]);

      const [hourlyReturns]: any = await connection.query(`
        SELECT 
          HOUR(inTime) as hour,
          COALESCE(SUM(inNum), 0) as returned
        FROM sports 
        WHERE LOWER(equipment) = LOWER(?) 
          AND inTime >= DATE_SUB(NOW(), INTERVAL 24 HOUR)
        GROUP BY HOUR(inTime)
      `, [equipment]);

      hourlyTxns.forEach((txn: any) => {
        const hour = Number(txn.hour);
        hourData[hour].borrowed = Number(txn.borrowed) || 0;
      });

      hourlyReturns.forEach((txn: any) => {
        const hour = Number(txn.hour);
        hourData[hour].returned = Number(txn.returned) || 0;
      });

      hourlyData[equipment] = hourData;

      // Aggregate
      hourData.forEach((data, hour) => {
        aggregateHourly[hour].borrowed += data.borrowed;
        aggregateHourly[hour].returned += data.returned;
      });
    }

    hourlyData['aggregate'] = aggregateHourly.map((d: any) => ({
      ...d,
      totalBorrowed: d.borrowed,
      availabilityPercent: ((totalInventory - d.borrowed) / totalInventory) * 100,
      totalInventory,
    }));

    // DAY VIEW: Last 7 days
    console.log('📅 Calculating daily patterns (last 7 days)...');
    const dailyData: any = {};
    const aggregateDaily: any = Array.from({ length: 7 }, (_, day) => ({
      period: day,
      borrowed: 0,
      returned: 0,
      totalBorrowed: 0,
      totalCapacity: totalInventory,
      availabilityPercent: 100,
    }));

    for (const equipment of equipmentList) {
      const dayData = Array.from({ length: 7 }, (_, day) => ({
        period: day,
        borrowed: 0,
        returned: 0,
      }));

      const [dailyTxns]: any = await connection.query(`
        SELECT 
          DATEDIFF(CURDATE(), DATE(outTime)) as daysAgo,
          COALESCE(SUM(outNum), 0) as borrowed
        FROM sports 
        WHERE LOWER(equipment) = LOWER(?) 
          AND outTime >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
        GROUP BY DATE(outTime)
      `, [equipment]);

      const [dailyReturns]: any = await connection.query(`
        SELECT 
          DATEDIFF(CURDATE(), DATE(inTime)) as daysAgo,
          COALESCE(SUM(inNum), 0) as returned
        FROM sports 
        WHERE LOWER(equipment) = LOWER(?) 
          AND inTime >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
        GROUP BY DATE(inTime)
      `, [equipment]);

      dailyTxns.forEach((txn: any) => {
        const daysAgo = Number(txn.daysAgo);
        if (daysAgo >= 0 && daysAgo < 7) {
          dayData[6 - daysAgo].borrowed = Number(txn.borrowed) || 0;
        }
      });

      dailyReturns.forEach((txn: any) => {
        const daysAgo = Number(txn.daysAgo);
        if (daysAgo >= 0 && daysAgo < 7) {
          dayData[6 - daysAgo].returned = Number(txn.returned) || 0;
        }
      });

      dailyData[equipment] = dayData;

      dayData.forEach((data, day) => {
        aggregateDaily[day].borrowed += data.borrowed;
        aggregateDaily[day].returned += data.returned;
      });
    }

    dailyData['aggregate'] = aggregateDaily.map((d: any) => ({
      ...d,
      totalBorrowed: d.borrowed,
      availabilityPercent: ((totalInventory - d.borrowed) / totalInventory) * 100,
      totalInventory,
    }));

    // WEEK VIEW: Last 4 weeks
    console.log('🗓️ Calculating weekly patterns (last 4 weeks)...');
    const weeklyData: any = {};
    const aggregateWeekly: any = Array.from({ length: 4 }, (_, week) => ({
      period: week,
      borrowed: 0,
      returned: 0,
      totalBorrowed: 0,
      totalCapacity: totalInventory,
      availabilityPercent: 100,
    }));

    for (const equipment of equipmentList) {
      const weekData = Array.from({ length: 4 }, (_, week) => ({
        period: week,
        borrowed: 0,
        returned: 0,
      }));

      const [weeklyTxns]: any = await connection.query(`
        SELECT 
          FLOOR(DATEDIFF(CURDATE(), DATE(outTime)) / 7) as weeksAgo,
          COALESCE(SUM(outNum), 0) as borrowed
        FROM sports 
        WHERE LOWER(equipment) = LOWER(?) 
          AND outTime >= DATE_SUB(CURDATE(), INTERVAL 28 DAY)
        GROUP BY FLOOR(DATEDIFF(CURDATE(), DATE(outTime)) / 7)
      `, [equipment]);

      const [weeklyReturns]: any = await connection.query(`
        SELECT 
          FLOOR(DATEDIFF(CURDATE(), DATE(inTime)) / 7) as weeksAgo,
          COALESCE(SUM(inNum), 0) as returned
        FROM sports 
        WHERE LOWER(equipment) = LOWER(?) 
          AND inTime >= DATE_SUB(CURDATE(), INTERVAL 28 DAY)
        GROUP BY FLOOR(DATEDIFF(CURDATE(), DATE(inTime)) / 7)
      `, [equipment]);

      weeklyTxns.forEach((txn: any) => {
        const weeksAgo = Number(txn.weeksAgo);
        if (weeksAgo >= 0 && weeksAgo < 4) {
          weekData[3 - weeksAgo].borrowed = Number(txn.borrowed) || 0;
        }
      });

      weeklyReturns.forEach((txn: any) => {
        const weeksAgo = Number(txn.weeksAgo);
        if (weeksAgo >= 0 && weeksAgo < 4) {
          weekData[3 - weeksAgo].returned = Number(txn.returned) || 0;
        }
      });

      weeklyData[equipment] = weekData;

      weekData.forEach((data, week) => {
        aggregateWeekly[week].borrowed += data.borrowed;
        aggregateWeekly[week].returned += data.returned;
      });
    }

    weeklyData['aggregate'] = aggregateWeekly.map((d: any) => ({
      ...d,
      totalBorrowed: d.borrowed,
      availabilityPercent: ((totalInventory - d.borrowed) / totalInventory) * 100,
      totalInventory,
    }));

    // MONTH VIEW: Last 12 months
    console.log('📆 Calculating monthly patterns (last 12 months)...');
    const monthlyData: any = {};
    const aggregateMonthly: any = Array.from({ length: 12 }, (_, month) => ({
      period: month,
      borrowed: 0,
      returned: 0,
      totalBorrowed: 0,
      totalCapacity: totalInventory,
      availabilityPercent: 100,
    }));

    for (const equipment of equipmentList) {
      const monthData = Array.from({ length: 12 }, (_, month) => ({
        period: month,
        borrowed: 0,
        returned: 0,
      }));

      const [monthlyTxns]: any = await connection.query(`
        SELECT 
          PERIOD_DIFF(DATE_FORMAT(CURDATE(), '%Y%m'), DATE_FORMAT(outTime, '%Y%m')) as monthsAgo,
          COALESCE(SUM(outNum), 0) as borrowed
        FROM sports 
        WHERE LOWER(equipment) = LOWER(?) 
          AND outTime >= DATE_SUB(CURDATE(), INTERVAL 12 MONTH)
        GROUP BY DATE_FORMAT(outTime, '%Y%m')
      `, [equipment]);

      const [monthlyReturns]: any = await connection.query(`
        SELECT 
          PERIOD_DIFF(DATE_FORMAT(CURDATE(), '%Y%m'), DATE_FORMAT(inTime, '%Y%m')) as monthsAgo,
          COALESCE(SUM(inNum), 0) as returned
        FROM sports 
        WHERE LOWER(equipment) = LOWER(?) 
          AND inTime >= DATE_SUB(CURDATE(), INTERVAL 12 MONTH)
        GROUP BY DATE_FORMAT(inTime, '%Y%m')
      `, [equipment]);

      monthlyTxns.forEach((txn: any) => {
        const monthsAgo = Number(txn.monthsAgo);
        if (monthsAgo >= 0 && monthsAgo < 12) {
          monthData[11 - monthsAgo].borrowed = Number(txn.borrowed) || 0;
        }
      });

      monthlyReturns.forEach((txn: any) => {
        const monthsAgo = Number(txn.monthsAgo);
        if (monthsAgo >= 0 && monthsAgo < 12) {
          monthData[11 - monthsAgo].returned = Number(txn.returned) || 0;
        }
      });

      monthlyData[equipment] = monthData;

      monthData.forEach((data, month) => {
        aggregateMonthly[month].borrowed += data.borrowed;
        aggregateMonthly[month].returned += data.returned;
      });
    }

    monthlyData['aggregate'] = aggregateMonthly.map((d: any) => ({
      ...d,
      totalBorrowed: d.borrowed,
      availabilityPercent: ((totalInventory - d.borrowed) / totalInventory) * 100,
      totalInventory,
    }));

    // Package all time periods
    peakBorrowingTimes.hourly = hourlyData;
    peakBorrowingTimes.daily = dailyData;
    peakBorrowingTimes.weekly = weeklyData;
    peakBorrowingTimes.monthly = monthlyData;

    console.log('✅ Peak borrowing times calculated for all periods');

    console.log('📊 Fetching most borrowed equipment...');
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
    console.log('✅ Top 5 most borrowed items found');

    console.log('📊 Fetching least borrowed equipment...');
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
    console.log('✅ Least borrowed items found');

    // Calculate run-out frequency: days when equipment availability reached 0% in past 90 days
    console.log('📊 Calculating run-out frequency (past 90 days)...');
    const [runOutData]: any = await connection.query(`
      SELECT 
        equipment,
        DATE(outTime) as borrowDate,
        SUM(outNum) as totalBorrowedOnDay
      FROM sports 
      WHERE outTime >= DATE_SUB(NOW(), INTERVAL 90 DAY)
      GROUP BY equipment, DATE(outTime)
    `);

    const runOutFrequency: any = {};
    
    // Initialize all equipment
    equipmentList.forEach(eq => {
      runOutFrequency[eq] = {
        equipment: eq,
        runOutCount: 0,
        capacity: INVENTORY_LEVELS[eq] || 5
      };
    });

    // Count days when borrowed items >= total inventory (0% available)
    runOutData.forEach((row: any) => {
      const equipment = row.equipment;
      const inventoryLevel = INVENTORY_LEVELS[equipment] || 5;
      const totalBorrowedOnDay = Number(row.totalBorrowedOnDay) || 0;

      if (runOutFrequency[equipment]) {
        // If borrowed >= total inventory, it ran out (0% available)
        if (totalBorrowedOnDay >= inventoryLevel) {
          runOutFrequency[equipment].runOutCount++;
        }
      }
    });

    // Get current borrowing status for utilization rate
    console.log('📊 Fetching current borrowing status...');
    const [currentBorrowings]: any = await connection.query(`
      SELECT 
        equipment,
        SUM(outNum) as currentlyBorrowed
      FROM sports 
      WHERE status = 'PENDING'
      GROUP BY equipment
    `);

    const runOutFrequencyArray = Object.values(runOutFrequency)
      .map((item: any) => {
        const borrowed = currentBorrowings.find((b: any) => 
          b.equipment === item.equipment
        );
        const currentlyBorrowed = borrowed ? Number(borrowed.currentlyBorrowed) : 0;
        const utilizationRate = (currentlyBorrowed / item.capacity) * 100;
        
        return {
          ...item,
          percentage: (item.runOutCount / 90) * 100,
          currentlyBorrowed,
          utilizationRate,
        };
      })
      .sort((a: any, b: any) => b.runOutCount - a.runOutCount)
      .slice(0, 5);
    console.log('✅ Run-out frequency calculated');

    // Get recent transactions (last 50)
    console.log('📊 Fetching recent transactions...');
    const [recentTransactions]: any = await connection.query(`
      SELECT 
        s.id,
        s.studentId,
        s.name,
        s.equipment,
        s.outNum,
        s.inNum,
        s.outTime,
        s.inTime,
        s.status
      FROM sports s
      ORDER BY 
        CASE 
          WHEN s.inTime IS NOT NULL THEN s.inTime 
          ELSE s.outTime 
        END DESC
      LIMIT 50
    `);
    console.log('✅ Recent transactions fetched:', recentTransactions.length, 'records');

    connection.release();
    console.log('🔒 Database connection returned to pool');

    return {
      avgBorrowingDuration,
      lateReturnRate,
      peakBorrowingTimes,
      mostBorrowed,
      leastBorrowed,
      runOutFrequency: runOutFrequencyArray,
      recentTransactions,
    };

  } catch (error: any) {
    console.error("❌ Error fetching stats:", {
      message: error.message,
      code: error.code,
      errno: error.errno,
      sqlState: error.sqlState,
      sqlMessage: error.sqlMessage,
    });
    
    if (connection) {
      try {
        connection.release();
        console.log('🔒 Database connection returned to pool after error');
      } catch (closeError: any) {
        console.error("❌ Error releasing connection:", closeError.message);
      }
    }
    
    // Throw with more context
    throw new Error(`Database error: ${error.message} ${error.sqlMessage || ''}`);
  }
}
