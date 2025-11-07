'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Clock, TrendingUp, AlertTriangle } from 'lucide-react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useDashboard } from '@/components/DashboardWrapper';

export default function SportsDashboard({ data: initialData }: { data: any }) {
  const [peakTimeView, setPeakTimeView] = useState('aggregate');
  const [data, setData] = useState(initialData);
  const { setRefreshCallback, setIsRefreshing, setLastUpdate } = useDashboard();

  // Fetch data function - shared by manual and auto refresh
  const fetchData = useCallback(async () => {
    setIsRefreshing(true);
    try {
      console.log('🔄 Refreshing dashboard data...');
      const response = await fetch('/api/stats', {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache',
        },
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
      }
      
      const newData = await response.json();
      setData(newData);
      setLastUpdate(new Date());
      console.log('✅ Dashboard data refreshed successfully');
    } catch (error: any) {
      console.error('❌ Failed to refresh dashboard data:', error.message);
      // Show error notification to user
      if (typeof window !== 'undefined') {
        const event = new CustomEvent('dashboard-error', { 
          detail: { message: error.message } 
        });
        window.dispatchEvent(event);
      }
    } finally {
      setIsRefreshing(false);
    }
  }, [setIsRefreshing, setLastUpdate]);

  // Register refresh callback
  useEffect(() => {
    setRefreshCallback(fetchData);
  }, [setRefreshCallback, fetchData]);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, [fetchData]);


    // Inventory levels for each equipment (matches app5.js exactly)
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

  const getColorForUsage = (count: number, equipment: string) => {
    const inventoryLevel = INVENTORY_LEVELS[equipment] || 10;
    const usagePercent = (count / inventoryLevel) * 100;
    
    if (usagePercent <= 25) return '#22c55e'; // green - healthy (0-25% used = 75%+ available)
    if (usagePercent <= 70) return '#eab308'; // yellow - moderate (25-70% used = 30-75% available)
    return '#ef4444'; // red - critical (70%+ used = 30% or less available)
  };

  const getColorForAvailability = (availabilityPercent: number) => {
    if (availabilityPercent >= 75) return '#22c55e'; // green - healthy
    if (availabilityPercent >= 30) return '#eab308'; // yellow - moderate
    return '#ef4444'; // red - critical
  };

  const formatHourData = (hourlyData: any[], equipment: string) => {
    if (!hourlyData || hourlyData.length === 0) return [];
    
    // Special handling for aggregate view
    if (equipment === 'aggregate') {
      return hourlyData.map((d: any) => {
        const hour = Number(d.hour);
        const borrowed = Number(d.count) || 0;
        const availabilityPercent = Number(d.availabilityPercent) || 100;
        const totalInventory = Number(d.totalInventory) || 119; // Fallback to default
        // Invert: show available items instead of borrowed items
        const available = totalInventory - borrowed;
        return {
          time: `${hour === 0 ? 12 : hour > 12 ? hour - 12 : hour}:00 ${hour >= 12 ? 'PM' : 'AM'}`,
          count: available,  // Now represents available items
          borrowed,          // Keep borrowed for tooltip
          availabilityPercent,
          color: getColorForAvailability(availabilityPercent),
          hour,
        };
      });
    }
    
    // Regular equipment view
    return hourlyData.map((d: any) => {
      const hour = Number(d.hour);
      const borrowed = Number(d.count) || 0;
      const inventoryLevel = INVENTORY_LEVELS[equipment] || 10;
      // Invert: show available items instead of borrowed items
      const available = inventoryLevel - borrowed;
      return {
        time: `${hour === 0 ? 12 : hour > 12 ? hour - 12 : hour}:00 ${hour >= 12 ? 'PM' : 'AM'}`,
        count: available,  // Now represents available items
        borrowed,          // Keep borrowed for tooltip
        color: getColorForUsage(borrowed, equipment),
        hour,
      };
    });
  };

  // 🟢 Include ALL equipment
  const peakTimesData: Record<string, any[]> = {};
  const allEquipment = [
    'aggregate',
    'Badminton Racquet',
    'Table Tennis Racquet',
    'Squash Racquet',
    'Tennis Racquet',
    'Pickleball Racquet',
    'Pool Stick',
    'Cycle',
    'Football',
    'Volleyball',
    'Basketball',
    'Fooseball',
    'Yoga Mat',
    'Chess',
    'Cricket Bat',
    'Frisbee',
  ];

  allEquipment.forEach((eq) => {
    peakTimesData[eq] = formatHourData(data.peakBorrowingTimes?.[eq] || [], eq);
  });

  // Custom tooltip to show inventory status
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const dataPoint = payload[0].payload;
      
      // Special handling for aggregate view
      if (peakTimeView === 'aggregate') {
        const availabilityPercent = Number(dataPoint.availabilityPercent || 100).toFixed(1);
        let status = 'Healthy';
        if (Number(availabilityPercent) < 30) status = 'Critical';
        else if (Number(availabilityPercent) < 75) status = 'Moderate';

        return (
          <div className="bg-white dark:bg-gray-800 p-3 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
            <p className="font-semibold text-gray-900 dark:text-white">{dataPoint.time}</p>
            <p className="text-sm text-gray-600 dark:text-gray-400">Available: {dataPoint.count} items</p>
            <p className="text-sm text-gray-600 dark:text-gray-400">Borrowed: {dataPoint.borrowed} items</p>
            <p className="text-sm text-gray-600 dark:text-gray-400">Overall Availability: {availabilityPercent}%</p>
            <p className="text-sm font-semibold" style={{ color: dataPoint.color }}>
              {status}
            </p>
          </div>
        );
      }
      
      // Regular equipment view
      const inventoryLevel = INVENTORY_LEVELS[peakTimeView] || 10;
      const usagePercent = ((dataPoint.count / inventoryLevel) * 100).toFixed(0);
      const availablePercent = (100 - Number(usagePercent)).toFixed(0);
      
      let status = 'Healthy';
      if (Number(availablePercent) < 30) status = 'Critical';
      else if (Number(availablePercent) < 75) status = 'Moderate';

      return (
        <div className="bg-white dark:bg-gray-800 p-3 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
          <p className="font-semibold text-gray-900 dark:text-white">{dataPoint.time}</p>
          <p className="text-sm text-gray-600 dark:text-gray-400">Available: {dataPoint.count}</p>
          <p className="text-sm text-gray-600 dark:text-gray-400">Borrowed: {dataPoint.borrowed}</p>
          <p className="text-sm text-gray-600 dark:text-gray-400">Available: {availablePercent}%</p>
          <p className="text-sm font-semibold" style={{ color: dataPoint.color }}>
            {status}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-3 sm:p-4 md:p-6">
      <div className="max-w-7xl mx-auto space-y-4 sm:space-y-6">
        {/* Page Title */}
        <div>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
            Sports Inventory Dashboard
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1">
            Monitor equipment usage and borrowing patterns • Auto-refreshes every 30s
          </p>
        </div>

        {/* Summary Cards */}
        <div id="overview" className="grid gap-3 sm:gap-4 md:grid-cols-2 lg:grid-cols-3 scroll-mt-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs sm:text-sm font-medium">Avg Borrowing Duration</CardTitle>
              <Clock className="h-3 w-3 sm:h-4 sm:w-4 text-gray-500" />
            </CardHeader>
            <CardContent>
              <div className="text-xl sm:text-2xl font-bold">
                {data.avgBorrowingDuration?.toFixed(1) || '0'} days
              </div>
              <p className="text-[10px] sm:text-xs text-gray-500 mt-1">Per equipment checkout</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs sm:text-sm font-medium">Late Return Rate</CardTitle>
              <AlertTriangle className="h-3 w-3 sm:h-4 sm:w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-xl sm:text-2xl font-bold">
                {data.lateReturnRate?.toFixed(1) || '0'}%
              </div>
              <p className="text-[10px] sm:text-xs text-gray-500 mt-1">Of all borrowings</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs sm:text-sm font-medium">Most Borrowed</CardTitle>
              <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-xl sm:text-2xl font-bold">
                {data.mostBorrowed?.[0]?.equipment || 'N/A'}
              </div>
              <p className="text-[10px] sm:text-xs text-gray-500 mt-1">
                {data.mostBorrowed?.[0]?.borrowCount || 0} total borrows
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Peak Borrowing Times */}
        <Card id="peak-times" className="scroll-mt-6">
          <CardHeader>
            <CardTitle className="text-base sm:text-lg md:text-xl">Peak Borrowing Times</CardTitle>
            <CardDescription className="text-xs sm:text-sm">Hourly borrowing patterns across equipment</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="aggregate" onValueChange={setPeakTimeView}>
              <TabsList className="mb-4 grid grid-cols-3 md:grid-cols-5 lg:grid-cols-8 xl:grid-cols-9 h-auto gap-1">
                {allEquipment.map((eq) => (
                  <TabsTrigger 
                    key={eq} 
                    value={eq} 
                    className="capitalize text-[10px] sm:text-xs px-1 sm:px-2 py-1.5 whitespace-nowrap overflow-hidden text-ellipsis"
                    title={eq === 'aggregate' ? 'All Equipment' : eq}
                  >
                    {eq === 'aggregate' ? 'All' : eq.length > 15 ? eq.substring(0, 13) + '...' : eq}
                  </TabsTrigger>
                ))}
              </TabsList>

              {peakTimesData[peakTimeView]?.length > 0 ? (
                <>
                  <div className="mb-4 flex flex-wrap items-center gap-3 text-xs sm:text-sm">
                    <div className="flex items-center gap-1.5">
                      <div className="w-3 h-3 rounded-full bg-green-500"></div>
                      <span className="text-gray-600 dark:text-gray-400">Healthy (75%+)</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                      <span className="text-gray-600 dark:text-gray-400">Moderate (30-75%)</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="w-3 h-3 rounded-full bg-red-500"></div>
                      <span className="text-gray-600 dark:text-gray-400">Critical (&lt;30%)</span>
                    </div>
                  </div>
                  <ResponsiveContainer width="100%" height={320}>
                    <BarChart data={peakTimesData[peakTimeView]} margin={{ top: 5, right: 20, bottom: 60, left: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-700" />
                      <XAxis 
                        dataKey="time" 
                        angle={-45} 
                        textAnchor="end" 
                        height={80}
                        tick={{ fontSize: 11 }}
                      />
                      <YAxis 
                        label={{ value: 'Available Count', angle: -90, position: 'insideLeft', style: { fontSize: 12 } }}
                        tick={{ fontSize: 11 }}
                      />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar
                        dataKey="count"
                        name="Available"
                        radius={[4, 4, 0, 0]}
                        shape={(props: any) => {
                          const { x, y, width, height, payload } = props;
                          return (
                            <rect
                              x={x}
                              y={y}
                              width={width}
                              height={height}
                              fill={payload.color}
                              rx={4}
                              ry={4}
                            />
                          );
                        }}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </>
              ) : (
                <div className="h-[300px] flex items-center justify-center text-gray-500 dark:text-gray-400">
                  No borrowing data for this equipment
                </div>
              )}
            </Tabs>
          </CardContent>
        </Card>

        {/* Most/Least Borrowed */}
        <div id="utilization" className="grid gap-3 sm:gap-4 md:grid-cols-2 scroll-mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base sm:text-lg md:text-xl">Most Borrowed Equipment</CardTitle>
              <CardDescription className="text-xs sm:text-sm">Top items</CardDescription>
            </CardHeader>
            <CardContent>
              {data.mostBorrowed?.length > 0 ? (
                <div className="space-y-3 sm:space-y-4">
                  {data.mostBorrowed.map((item: any, idx: number) => (
                    <div key={item.equipment} className="flex items-center">
                      <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center text-xs sm:text-sm font-semibold text-blue-700 dark:text-blue-300 mr-2 sm:mr-3">
                        {idx + 1}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs sm:text-sm font-medium text-gray-900 dark:text-gray-100">{item.equipment}</span>
                          <span className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">{item.borrowCount} borrows</span>
                        </div>
                        <div className="w-full bg-gray-200 dark:bg-black rounded-full h-1.5 sm:h-2 overflow-hidden">
                          <div
                            className="bg-blue-600 dark:bg-blue-500 h-1.5 sm:h-2 rounded-full"
                            style={{ width: `${Math.min(Number(item.percentage) || 0, 100)}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-xs sm:text-sm text-gray-500 dark:text-gray-400">No data</div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base sm:text-lg md:text-xl">Least Borrowed Equipment</CardTitle>
              <CardDescription className="text-xs sm:text-sm">Items needing attention</CardDescription>
            </CardHeader>
            <CardContent>
              {data.leastBorrowed?.length > 0 ? (
                <div className="space-y-3 sm:space-y-4">
                  {data.leastBorrowed.map((item: any, idx: number) => (
                    <div key={item.equipment} className="flex items-center">
                      <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-orange-100 dark:bg-orange-900 flex items-center justify-center text-xs sm:text-sm font-semibold text-orange-700 dark:text-orange-300 mr-2 sm:mr-3">
                        {idx + 1}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs sm:text-sm font-medium text-gray-900 dark:text-gray-100">{item.equipment}</span>
                          <span className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">{item.borrowCount} borrows</span>
                        </div>
                        <div className="w-full bg-gray-200 dark:bg-black rounded-full h-1.5 sm:h-2 overflow-hidden">
                          <div
                            className="bg-orange-500 dark:bg-orange-400 h-1.5 sm:h-2 rounded-full"
                            style={{ width: `${Math.min((Number(item.percentage) || 0) * 3, 100)}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-xs sm:text-sm text-gray-500 dark:text-gray-400">No data</div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Run-Out Frequency */}
        <Card id="stock-outs" className="scroll-mt-6">
          <CardHeader>
            <CardTitle className="text-base sm:text-lg md:text-xl">Equipment Stock-Out Analysis</CardTitle>
            <CardDescription className="text-xs sm:text-sm">Days equipment reached 0% availability in the past 90 days</CardDescription>
          </CardHeader>
          <CardContent>
            {data.runOutFrequency?.length > 0 ? (
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={data.runOutFrequency} margin={{ top: 20, right: 30, bottom: 100, left: 60 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-700" />
                  <XAxis 
                    dataKey="equipment" 
                    angle={-45} 
                    textAnchor="end" 
                    height={100}
                    tick={{ fontSize: 11 }}
                    interval={0}
                  />
                  <YAxis 
                    tick={{ fontSize: 11 }}
                    label={{ 
                      value: 'Days at 0% Availability', 
                      angle: -90, 
                      position: 'insideLeft',
                      style: { 
                        textAnchor: 'middle',
                        fontSize: 12,
                        fill: 'var(--color-foreground)'
                      }
                    }} 
                  />
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: 'var(--color-card)',
                      border: '1px solid var(--color-border)',
                      borderRadius: '0.5rem',
                      color: 'var(--color-card-foreground)'
                    }}
                    labelStyle={{
                      color: 'var(--color-card-foreground)'
                    }}
                    formatter={(value: any) => [`${value} days`, 'Stock-Outs']}
                  />
                  <Legend 
                    verticalAlign="top" 
                    height={36}
                    wrapperStyle={{ paddingBottom: '10px' }}
                  />
                  <Bar 
                    dataKey="runOutCount" 
                    fill="#ef4444" 
                    name="Days at 0% Availability"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-center py-8 text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                No equipment data available
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Transactions */}
        <Card id="transactions" className="scroll-mt-6">
          <CardHeader>
            <CardTitle className="text-base sm:text-lg md:text-xl">Recent Transactions</CardTitle>
            <CardDescription className="text-xs sm:text-sm">Live log of equipment borrowing and returns</CardDescription>
          </CardHeader>
          <CardContent>
            {data.recentTransactions?.length > 0 ? (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {data.recentTransactions.map((txn: any) => {
                  const isBorrow = !txn.inTime || new Date(txn.outTime) > new Date(txn.inTime || 0);
                  const displayTime = isBorrow ? txn.outTime : txn.inTime;
                  const time = new Date(displayTime).toLocaleString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    hour: 'numeric',
                    minute: '2-digit',
                    hour12: true
                  });
                  
                  return (
                    <div
                      key={`${txn.id}-${isBorrow ? 'out' : 'in'}`}
                      className="flex items-center justify-between p-2 sm:p-3 rounded-lg bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    >
                      <div className="flex items-center gap-2 sm:gap-4">
                        <div className={`w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full ${isBorrow ? 'bg-red-500' : 'bg-green-500'}`} />
                        <div>
                          <p className="text-xs sm:text-sm font-medium text-gray-900 dark:text-white">
                            {isBorrow ? 'Borrowed' : 'Returned'} {isBorrow ? txn.outNum : txn.inNum}x {txn.equipment}
                          </p>
                          <p className="text-[10px] sm:text-xs text-gray-600 dark:text-gray-400">
                            {txn.name} • ID: {txn.studentId}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] sm:text-xs font-medium text-gray-900 dark:text-white">{time}</p>
                        <p className={`text-[9px] sm:text-[10px] ${
                          txn.status === 'LATE' ? 'text-red-500' : 
                          txn.status === 'PENDING' ? 'text-yellow-500' : 
                          'text-green-500'
                        }`}>
                          {txn.status}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8 text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                No recent transactions
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}