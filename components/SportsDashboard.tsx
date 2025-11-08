'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Clock, TrendingUp, AlertTriangle } from 'lucide-react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useDashboard } from '@/components/DashboardWrapper';

export default function SportsDashboard({ data: initialData }: { data: any }) {
  const [peakTimeView, setPeakTimeView] = useState('aggregate');
  const [timeRangeView, setTimeRangeView] = useState<'hour' | 'day' | 'week' | 'month'>('hour');
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

  const formatHourData = (hourlyData: any[], equipment: string, timeRange: 'hour' | 'day' | 'week' | 'month') => {
    if (!hourlyData || hourlyData.length === 0) return [];
    
    // Special handling for aggregate view
    if (equipment === 'aggregate') {
      return hourlyData.map((d: any) => {
        let timeLabel = '';
        const borrowed = Number(d.count) || 0;
        const availabilityPercent = Number(d.availabilityPercent) || 100;
        const totalInventory = Number(d.totalInventory) || 119;
        const available = totalInventory - borrowed;
        
        // Generate time label based on range
        if (timeRange === 'hour') {
          const hour = Number(d.hour);
          timeLabel = `${hour === 0 ? 12 : hour > 12 ? hour - 12 : hour}${hour >= 12 ? 'PM' : 'AM'}`;
        } else if (timeRange === 'day') {
          const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
          timeLabel = dayNames[d.day - 1] || `Day ${d.day}`;
        } else if (timeRange === 'week') {
          timeLabel = `Week ${4 - d.week}`;
        } else if (timeRange === 'month') {
          const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
          const currentMonth = new Date().getMonth();
          const monthIndex = (currentMonth - (11 - d.month) + 12) % 12;
          timeLabel = monthNames[monthIndex];
        }
        
        // Determine health status
        let status = 'Healthy';
        let statusColor = '#22c55e';
        if (availabilityPercent < 30) {
          status = 'Critical';
          statusColor = '#ef4444';
        } else if (availabilityPercent < 75) {
          status = 'Moderate';
          statusColor = '#eab308';
        }
        
        return {
          time: timeLabel,
          borrowed,
          available,
          availabilityPercent: availabilityPercent.toFixed(1),
          status,
          color: statusColor,
          rawIndex: d.hour || d.day || d.week || d.month,
        };
      });
    }
    
    // Regular equipment view
    return hourlyData.map((d: any) => {
      let timeLabel = '';
      const borrowed = Number(d.count) || 0;
      const inventoryLevel = INVENTORY_LEVELS[equipment] || 10;
      const available = inventoryLevel - borrowed;
      const availabilityPercent = (available / inventoryLevel) * 100;
      
      // Generate time label based on range
      if (timeRange === 'hour') {
        const hour = Number(d.hour);
        timeLabel = `${hour === 0 ? 12 : hour > 12 ? hour - 12 : hour}${hour >= 12 ? 'PM' : 'AM'}`;
      } else if (timeRange === 'day') {
        const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        timeLabel = dayNames[d.day - 1] || `Day ${d.day}`;
      } else if (timeRange === 'week') {
        timeLabel = `Week ${4 - d.week}`;
      } else if (timeRange === 'month') {
        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const currentMonth = new Date().getMonth();
        const monthIndex = (currentMonth - (11 - d.month) + 12) % 12;
        timeLabel = monthNames[monthIndex];
      }
      
      // Determine health status
      let status = 'Healthy';
      let statusColor = '#22c55e';
      if (availabilityPercent < 30) {
        status = 'Critical';
        statusColor = '#ef4444';
      } else if (availabilityPercent < 75) {
        status = 'Moderate';
        statusColor = '#eab308';
      }
      
      return {
        time: timeLabel,
        borrowed,
        available,
        availabilityPercent: availabilityPercent.toFixed(1),
        status,
        color: statusColor,
        rawIndex: d.hour || d.day || d.week || d.month,
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
    peakTimesData[eq] = formatHourData(
      data.peakBorrowingTimes?.[timeRangeView]?.[eq] || [], 
      eq, 
      timeRangeView
    );
  });

  // Custom tooltip to show inventory status
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const dataPoint = payload[0].payload;
      
      return (
        <div className="bg-white dark:bg-gray-800 p-3 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
          <p className="font-semibold text-gray-900 dark:text-white mb-2">{dataPoint.time}</p>
          <div className="space-y-1">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Borrowed: <span className="font-semibold text-gray-900 dark:text-white">{dataPoint.borrowed}</span>
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Available: <span className="font-semibold text-gray-900 dark:text-white">{dataPoint.available}</span>
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Availability: <span className="font-semibold text-gray-900 dark:text-white">{dataPoint.availabilityPercent}%</span>
            </p>
            <div className="pt-1 mt-1 border-t border-gray-200 dark:border-gray-600">
              <p className="text-sm font-semibold flex items-center gap-2">
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: dataPoint.color }}></span>
                <span style={{ color: dataPoint.color }}>{dataPoint.status}</span>
              </p>
            </div>
          </div>
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
        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <CardTitle>Peak Borrowing Times</CardTitle>
                <CardDescription>Monitor equipment usage patterns and availability</CardDescription>
              </div>
              <Tabs value={timeRangeView} onValueChange={(v) => setTimeRangeView(v as any)} className="w-auto">
                <TabsList>
                  <TabsTrigger value="hour">Hour</TabsTrigger>
                  <TabsTrigger value="day">Day</TabsTrigger>
                  <TabsTrigger value="week">Week</TabsTrigger>
                  <TabsTrigger value="month">Month</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="aggregate" onValueChange={setPeakTimeView}>
              <TabsList className="mb-4 flex-wrap h-auto">
                {allEquipment.map((eq) => (
                  <TabsTrigger key={eq} value={eq} className="capitalize text-xs">
                    {eq === 'aggregate' ? 'All Equipment' : eq}
                  </TabsTrigger>
                ))}
              </TabsList>

              {peakTimesData[peakTimeView]?.length > 0 ? (
                <>
                  <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                    <div className="flex flex-wrap items-center gap-4 text-xs">
                      <div className="flex items-center gap-1.5">
                        <div className="w-3 h-3 rounded-full bg-green-500"></div>
                        <span className="text-gray-600 dark:text-gray-400">Healthy (≥75%)</span>
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
                    {peakTimesData[peakTimeView][0] && (
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        Current: <span className="font-semibold" style={{ color: peakTimesData[peakTimeView][0].color }}>
                          {peakTimesData[peakTimeView][0].status}
                        </span> • {peakTimesData[peakTimeView][0].availabilityPercent}% available
                      </div>
                    )}
                  </div>
                  <ResponsiveContainer width="100%" height={320}>
                    <LineChart data={peakTimesData[peakTimeView]} margin={{ top: 5, right: 10, bottom: 5, left: 0 }}>
                      <defs>
                        {/* Create gradients for each health status */}
                        <linearGradient id="healthyGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#22c55e" stopOpacity={0.6}/>
                          <stop offset="95%" stopColor="#22c55e" stopOpacity={0.05}/>
                        </linearGradient>
                        <linearGradient id="moderateGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#eab308" stopOpacity={0.6}/>
                          <stop offset="95%" stopColor="#eab308" stopOpacity={0.05}/>
                        </linearGradient>
                        <linearGradient id="criticalGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#ef4444" stopOpacity={0.6}/>
                          <stop offset="95%" stopColor="#ef4444" stopOpacity={0.05}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" className="dark:stroke-gray-700" />
                      <XAxis 
                        dataKey="time" 
                        tick={{ fontSize: 11, fill: '#6b7280' }}
                        stroke="#9ca3af"
                      />
                      <YAxis 
                        tick={{ fontSize: 11, fill: '#6b7280' }}
                        stroke="#9ca3af"
                        label={{ 
                          value: 'Borrowed', 
                          angle: -90, 
                          position: 'insideLeft',
                          style: { fontSize: 12, fill: '#6b7280' }
                        }}
                      />
                      <Tooltip content={<CustomTooltip />} />
                      {/* Draw a line segment for each status change */}
                      {peakTimesData[peakTimeView].map((dataPoint: any, index: number) => {
                        if (index === peakTimesData[peakTimeView].length - 1) return null;
                        
                        const nextPoint = peakTimesData[peakTimeView][index + 1];
                        const segmentData = [dataPoint, nextPoint];
                        
                        return (
                          <Line
                            key={`segment-${index}`}
                            data={segmentData}
                            type="monotone"
                            dataKey="borrowed"
                            stroke={dataPoint.color}
                            strokeWidth={3}
                            dot={false}
                            activeDot={false}
                            isAnimationActive={false}
                          />
                        );
                      })}
                      {/* Add dots on top */}
                      <Line
                        type="monotone"
                        dataKey="borrowed"
                        stroke="transparent"
                        strokeWidth={0}
                        dot={(props: any) => {
                          const { cx, cy, payload } = props;
                          return (
                            <circle
                              cx={cx}
                              cy={cy}
                              r={5}
                              fill={payload.color}
                              stroke="#fff"
                              strokeWidth={2}
                            />
                          );
                        }}
                        activeDot={{ r: 7, strokeWidth: 2 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </>
              ) : (
                <div className="h-[320px] flex items-center justify-center text-gray-500 dark:text-gray-400">
                  <div className="text-center">
                    <p className="text-sm font-medium">No borrowing data available</p>
                    <p className="text-xs mt-1">Data will appear once equipment is borrowed</p>
                  </div>
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
              <ResponsiveContainer width="100%" height={320}>
                <BarChart data={data.runOutFrequency} margin={{ top: 10, right: 20, bottom: 60, left: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-700" />
                  <XAxis 
                    dataKey="equipment" 
                    angle={-45} 
                    textAnchor="end" 
                    height={70}
                    tick={{ fontSize: 10 }}
                    interval={0}
                  />
                  <YAxis 
                    tick={{ fontSize: 10 }}
                    label={{ 
                      value: 'Days', 
                      angle: -90, 
                      position: 'insideLeft',
                      style: { 
                        textAnchor: 'middle',
                        fontSize: 11,
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