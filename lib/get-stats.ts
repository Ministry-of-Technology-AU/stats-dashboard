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
    const peakBorrowingTimes: any = {
      hour: {},
      day: {},
      week: {},
      month: {},
    };

    // Calculate total inventory across all equipment
    const totalInventory = Object.values(INVENTORY_LEVELS).reduce((sum, val) => sum + val, 0);
    console.log('📦 Total inventory capacity:', totalInventory);

    // Calculate aggregate view (overall availability percentage across all equipment)
    const aggregateHourData: any = Array.from({ length: 24 }, (_, hour) => ({
      hour,
      count: 0,
      totalBorrowed: 0,
      totalCapacity: totalInventory,
      availabilityPercent: 100,
    }));

    const aggregateDayData: any = Array.from({ length: 7 }, (_, day) => ({
      day,
      count: 0,
      totalBorrowed: 0,
      totalCapacity: totalInventory,
      availabilityPercent: 100,
    }));

    const aggregateWeekData: any = Array.from({ length: 4 }, (_, week) => ({
      week,
      count: 0,
      totalBorrowed: 0,
      totalCapacity: totalInventory,
      availabilityPercent: 100,
    }));

    const aggregateMonthData: any = Array.from({ length: 12 }, (_, month) => ({
      month,
      count: 0,
      totalBorrowed: 0,
      totalCapacity: totalInventory,
      availabilityPercent: 100,
    }));

    console.log('🔄 Processing', equipmentList.length, 'equipment types...');
    for (const equipment of equipmentList) {
      // Calculate borrowed count at each hour by tracking borrows and returns
      const fullDayData = Array.from({ length: 24 }, (_, hour) => ({
        hour,
        count: 0,
      }));

      const dayData = Array.from({ length: 7 }, (_, day) => ({
        day,
        count: 0,
      }));

      const weekData = Array.from({ length: 4 }, (_, week) => ({
        week,
        count: 0,
      }));

      const monthData = Array.from({ length: 12 }, (_, month) => ({
        month,
        count: 0,
      }));

      // Get hourly transactions (last 2 days)
      const [transactions]: any = await connection.query(`
        SELECT 
          HOUR(outTime) as outHour,
          outNum,
          HOUR(inTime) as inHour,
          inNum,
          status,
          DATE(outTime) as txnDate
        FROM sports 
        WHERE LOWER(equipment) = LOWER(?) 
          AND DATE(outTime) >= DATE_SUB(CURDATE(), INTERVAL 1 DAY)
        ORDER BY outTime, inTime
      `, [equipment]);

      // Get daily transactions (last 7 days)
      const [dailyTransactions]: any = await connection.query(`
        SELECT 
          DAYOFWEEK(outTime) as dayOfWeek,
          outNum,
          DAYOFWEEK(inTime) as returnDayOfWeek,
          inNum,
          status
        FROM sports 
        WHERE LOWER(equipment) = LOWER(?) 
          AND DATE(outTime) >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
        ORDER BY outTime
      `, [equipment]);

      // Get weekly transactions (last 4 weeks by actual dates)
      const [weeklyTransactions]: any = await connection.query(`
        SELECT 
          outTime,
          outNum,
          inTime,
          inNum,
          status
        FROM sports 
        WHERE LOWER(equipment) = LOWER(?) 
          AND DATE(outTime) >= DATE_SUB(CURDATE(), INTERVAL 28 DAY)
        ORDER BY outTime
      `, [equipment]);

      // Get monthly transactions (last 12 months with year)
      const [monthlyTransactions]: any = await connection.query(`
        SELECT 
          MONTH(outTime) as monthNum,
          YEAR(outTime) as yearNum,
          outNum,
          MONTH(inTime) as returnMonthNum,
          inNum,
          status
        FROM sports 
        WHERE LOWER(equipment) = LOWER(?) 
          AND DATE(outTime) >= DATE_SUB(CURDATE(), INTERVAL 365 DAY)
        ORDER BY outTime
      `, [equipment]);

      // Also get currently pending items from before the 2-day window
      const [previousPending]: any = await connection.query(`
        SELECT 
          COALESCE(SUM(outNum), 0) as totalBorrowed
        FROM sports 
        WHERE LOWER(equipment) = LOWER(?) 
          AND status = 'PENDING'
          AND DATE(outTime) < DATE_SUB(CURDATE(), INTERVAL 1 DAY)
      `, [equipment]);

      const startingBorrowed = Number(previousPending[0]?.totalBorrowed) || 0;

      // Calculate net borrowed at each hour
      for (let hour = 0; hour < 24; hour++) {
        let netBorrowed = startingBorrowed;

        transactions.forEach((txn: any) => {
          const outHour = txn.outHour !== null ? Number(txn.outHour) : null;
          const inHour = txn.inHour !== null ? Number(txn.inHour) : null;
          const outNum = Number(txn.outNum) || 0;
          const inNum = Number(txn.inNum) || 0;

          // Add borrows that happened at or before this hour
          if (outHour !== null && outHour <= hour) {
            netBorrowed += outNum;
          }

          // Subtract returns that happened at or before this hour
          if (inHour !== null && inHour <= hour) {
            netBorrowed -= inNum;
          }
        });

        fullDayData[hour].count = Math.max(0, netBorrowed);
        
        // Add to aggregate view (sum of all equipment borrowed at this hour)
        aggregateHourData[hour].totalBorrowed += Math.max(0, netBorrowed);
      }

      // Calculate daily data (by day of week)
      for (let day = 1; day <= 7; day++) {
        let avgBorrowed = 0;
        const dayTransactions = dailyTransactions.filter((txn: any) => 
          txn.dayOfWeek === day
        );
        
        if (dayTransactions.length > 0) {
          const totalBorrowed = dayTransactions.reduce((sum: number, txn: any) => 
            sum + (Number(txn.outNum) || 0), 0
          );
          avgBorrowed = Math.round(totalBorrowed / dayTransactions.length);
        }
        
        dayData[day - 1].count = avgBorrowed;
        aggregateDayData[day - 1].totalBorrowed += avgBorrowed;
      }

      // Calculate weekly data (last 4 weeks with actual date ranges)
      const nowForWeek = new Date();
      
      for (let i = 0; i < 4; i++) {
        // Calculate the start of each week going backwards (Sunday as first day)
        const weeksAgo = i;
        const weekStart = new Date(nowForWeek);
        // Go back to the start of the week (Sunday)
        const daysToSunday = weekStart.getDay(); // 0 = Sunday, 1 = Monday, etc.
        weekStart.setDate(weekStart.getDate() - daysToSunday - (weeksAgo * 7));
        weekStart.setHours(0, 0, 0, 0); // Start of day
        
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekEnd.getDate() + 6); // End of week (Saturday)
        weekEnd.setHours(23, 59, 59, 999); // End of day
        
        const weekTransactions = weeklyTransactions.filter((txn: any) => {
          const txnDate = new Date(txn.outTime);
          return txnDate >= weekStart && txnDate <= weekEnd;
        });
        
        let avgBorrowed = 0;
        if (weekTransactions.length > 0) {
          const totalBorrowed = weekTransactions.reduce((sum: number, txn: any) => 
            sum + (Number(txn.outNum) || 0), 0
          );
          avgBorrowed = Math.round(totalBorrowed / 7); // Daily average over the week
        }
        
        // Store week metadata
        weekData[3 - i].count = avgBorrowed;
        weekData[3 - i].week = 3 - i;
        (weekData[3 - i] as any).weekStart = weekStart.toISOString().split('T')[0];
        (weekData[3 - i] as any).weekEnd = weekEnd.toISOString().split('T')[0];
        aggregateWeekData[3 - i].totalBorrowed += avgBorrowed;
        (aggregateWeekData[3 - i] as any).weekStart = weekStart.toISOString().split('T')[0];
        (aggregateWeekData[3 - i] as any).weekEnd = weekEnd.toISOString().split('T')[0];
      }

      // Calculate monthly data (last 12 months)
      const nowForMonth = new Date();
      const currentYear = nowForMonth.getFullYear();
      const currentMonth = nowForMonth.getMonth() + 1; // 1-12
      
      for (let i = 0; i < 12; i++) {
        // Calculate target month and year going backwards from current
        let targetYear = currentYear;
        let targetMonth = currentMonth - i;
        
        if (targetMonth <= 0) {
          targetMonth += 12;
          targetYear -= 1;
        }
        
        const monthTransactions = monthlyTransactions.filter((txn: any) => 
          txn.monthNum === targetMonth && txn.yearNum === targetYear
        );
        
        let avgBorrowed = 0;
        if (monthTransactions.length > 0) {
          const totalBorrowed = monthTransactions.reduce((sum: number, txn: any) => 
            sum + (Number(txn.outNum) || 0), 0
          );
          const daysInMonth = new Date(targetYear, targetMonth, 0).getDate();
          avgBorrowed = Math.round(totalBorrowed / daysInMonth); // Daily average
        }
        
        monthData[11 - i].count = avgBorrowed;
        monthData[11 - i].month = 11 - i; // Store the index for proper ordering
        aggregateMonthData[11 - i].totalBorrowed += avgBorrowed;
      }

      peakBorrowingTimes.hour[equipment] = fullDayData;
      peakBorrowingTimes.day[equipment] = dayData;
      peakBorrowingTimes.week[equipment] = weekData;
      peakBorrowingTimes.month[equipment] = monthData;
    }
    
    // Convert aggregate data to percentage-based for availability ratio
    aggregateHourData.forEach((hourData: any) => {
      const borrowed = hourData.totalBorrowed;
      const available = totalInventory - borrowed;
      const availabilityPercent = (available / totalInventory) * 100;
      
      hourData.count = borrowed;
      hourData.availabilityPercent = availabilityPercent;
      hourData.totalInventory = totalInventory;
    });

    aggregateDayData.forEach((dayData: any) => {
      const borrowed = dayData.totalBorrowed;
      const available = totalInventory - borrowed;
      const availabilityPercent = (available / totalInventory) * 100;
      
      dayData.count = borrowed;
      dayData.availabilityPercent = availabilityPercent;
      dayData.totalInventory = totalInventory;
    });

    aggregateWeekData.forEach((weekData: any) => {
      const borrowed = weekData.totalBorrowed;
      const available = totalInventory - borrowed;
      const availabilityPercent = (available / totalInventory) * 100;
      
      weekData.count = borrowed;
      weekData.availabilityPercent = availabilityPercent;
      weekData.totalInventory = totalInventory;
    });

    aggregateMonthData.forEach((monthData: any) => {
      const borrowed = monthData.totalBorrowed;
      const available = totalInventory - borrowed;
      const availabilityPercent = (available / totalInventory) * 100;
      
      monthData.count = borrowed;
      monthData.availabilityPercent = availabilityPercent;
      monthData.totalInventory = totalInventory;
    });
    
    // Add aggregate views
    peakBorrowingTimes.hour['aggregate'] = aggregateHourData;
    peakBorrowingTimes.day['aggregate'] = aggregateDayData;
    peakBorrowingTimes.week['aggregate'] = aggregateWeekData;
    peakBorrowingTimes.month['aggregate'] = aggregateMonthData;
    console.log('✅ Peak borrowing times calculated');

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

    // Get list of most borrowed equipment names to exclude from least borrowed
    const mostBorrowedNames = mostBorrowed.map((item: any) => item.equipment);
    const excludeList = mostBorrowedNames.length > 0 
      ? mostBorrowedNames.map(() => '?').join(',')
      : '';

    console.log('📊 Fetching least borrowed equipment (excluding top 5)...');
    const [leastBorrowed]: any = excludeList 
      ? await connection.query(`
          SELECT 
            equipment,
            COUNT(*) as borrowCount,
            (COUNT(*) * 100.0 / (SELECT COUNT(*) FROM sports)) as percentage
          FROM sports 
          WHERE equipment NOT IN (${excludeList})
          GROUP BY equipment
          ORDER BY borrowCount ASC
          LIMIT 5
        `, mostBorrowedNames)
      : await connection.query(`
          SELECT 
            equipment,
            COUNT(*) as borrowCount,
            (COUNT(*) * 100.0 / (SELECT COUNT(*) FROM sports)) as percentage
          FROM sports 
          GROUP BY equipment
          ORDER BY borrowCount ASC
          LIMIT 5
        `);
    console.log('✅ Least borrowed items found (excluding most borrowed)');

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
