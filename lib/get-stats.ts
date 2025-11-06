import mysql from 'mysql2/promise';

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
    console.log('🔄 Establishing database connection...');
    
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME || 'sportsinventory',
      port: parseInt(process.env.DB_PORT || '3306'),
      connectTimeout: 10000, // 10 seconds
    });

    console.log('✅ Database connection established');

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

    // Calculate aggregate view (overall availability percentage across all equipment)
    const aggregateData: any = Array.from({ length: 24 }, (_, hour) => ({
      hour,
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

      // Get all transactions for this equipment from today
      const [transactions]: any = await connection.query(`
        SELECT 
          HOUR(outTime) as outHour,
          outNum,
          HOUR(inTime) as inHour,
          inNum,
          status
        FROM sports 
        WHERE LOWER(equipment) = LOWER(?) 
          AND DATE(outTime) = CURDATE()
        ORDER BY outTime, inTime
      `, [equipment]);

      // Also get currently pending items from previous days
      const [previousPending]: any = await connection.query(`
        SELECT 
          COALESCE(SUM(outNum), 0) as totalBorrowed
        FROM sports 
        WHERE LOWER(equipment) = LOWER(?) 
          AND status = 'PENDING'
          AND DATE(outTime) < CURDATE()
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
        aggregateData[hour].totalBorrowed += Math.max(0, netBorrowed);
      }

      peakBorrowingTimes[equipment] = fullDayData;
    }
    
    // Convert aggregate to percentage-based for availability ratio
    aggregateData.forEach((hourData: any) => {
      const borrowed = hourData.totalBorrowed;
      const available = totalInventory - borrowed;
      const availabilityPercent = (available / totalInventory) * 100;
      
      // Store as "usage percent" for color coding (inverse of availability)
      hourData.count = borrowed; // Keep borrowed count for display
      hourData.availabilityPercent = availabilityPercent;
    });
    
    // Add aggregate view
    peakBorrowingTimes['aggregate'] = aggregateData;
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

    await connection.end();
    console.log('🔒 Database connection closed');

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
        await connection.end();
        console.log('🔒 Database connection closed after error');
      } catch (closeError: any) {
        console.error("❌ Error closing connection:", closeError.message);
      }
    }
    
    // Throw with more context
    throw new Error(`Database error: ${error.message} ${error.sqlMessage || ''}`);
  }
}
