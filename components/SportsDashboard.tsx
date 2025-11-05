'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Clock, TrendingUp, AlertTriangle } from 'lucide-react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { SignOutButton } from '@/components/SignOutButton';
import { ThemeToggle } from '@/components/ThemeToggle';

export default function SportsDashboard({ data, userEmail }: { data: any; userEmail?: string | null }) {
  const [peakTimeView, setPeakTimeView] = useState('aggregate');

  // Inventory levels for each equipment
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

  const getColorForUsage = (count: number, equipment: string) => {
    const inventoryLevel = INVENTORY_LEVELS[equipment] || 10;
    const usagePercent = (count / inventoryLevel) * 100;
    
    if (usagePercent <= 25) return '#22c55e'; // green - healthy (0-25% used = 75%+ available)
    if (usagePercent <= 70) return '#eab308'; // yellow - moderate (25-70% used = 30-75% available)
    return '#ef4444'; // red - critical (70%+ used = 30% or less available)
  };

  const formatHourData = (hourlyData: any[], equipment: string) => {
    if (!hourlyData || hourlyData.length === 0) return [];
    return hourlyData.map((d: any) => {
      const hour = Number(d.hour);
      const count = Number(d.count) || 0;
      return {
        time: `${hour === 0 ? 12 : hour > 12 ? hour - 12 : hour}:00 ${hour >= 12 ? 'PM' : 'AM'}`,
        count,
        color: getColorForUsage(count, equipment),
        hour,
      };
    });
  };

  // 🟢 Include ALL equipment
  const peakTimesData: Record<string, any[]> = {};
  const allEquipment = [
    'aggregate',
    'badminton racket',
    'squash',
    'tennis',
    'TT',
    'chess',
    'carrom coin',
    'basketball',
    'football',
    'volleyball',
    'yoga mat',
    'pickleball racket + ball',
    'cycle',
    'cricket bat + ball',
    'weight machine',
    'boxing gloves',
    'washroom locker key',
    'frisbee',
    'foosball',
    'daateball',
    'pool sticks',
  ];

  allEquipment.forEach((eq) => {
    peakTimesData[eq] = formatHourData(data.peakBorrowingTimes?.[eq] || [], eq);
  });

  // Custom tooltip to show inventory status
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const dataPoint = payload[0].payload;
      const inventoryLevel = INVENTORY_LEVELS[peakTimeView] || 10;
      const usagePercent = ((dataPoint.count / inventoryLevel) * 100).toFixed(0);
      const availablePercent = (100 - Number(usagePercent)).toFixed(0);
      
      let status = 'Healthy';
      if (Number(availablePercent) < 30) status = 'Critical';
      else if (Number(availablePercent) < 75) status = 'Moderate';

      return (
        <div className="bg-white dark:bg-gray-800 p-3 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
          <p className="font-semibold text-gray-900 dark:text-white">{dataPoint.time}</p>
          <p className="text-sm text-gray-600 dark:text-gray-400">Borrowed: {dataPoint.count}</p>
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
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">Sports Inventory Dashboard</h1>
            <p className="text-gray-500 dark:text-gray-400 mt-1">Monitor equipment usage and borrowing patterns</p>
            {userEmail && (
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Signed in as {userEmail}</p>
            )}
          </div>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <SignOutButton />
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Borrowing Duration</CardTitle>
              <Clock className="h-4 w-4 text-gray-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {data.avgBorrowingDuration?.toFixed(1) || '0'} days
              </div>
              <p className="text-xs text-gray-500 mt-1">Per equipment checkout</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Late Return Rate</CardTitle>
              <AlertTriangle className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {data.lateReturnRate?.toFixed(1) || '0'}%
              </div>
              <p className="text-xs text-gray-500 mt-1">Of all borrowings</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Most Borrowed</CardTitle>
              <TrendingUp className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {data.mostBorrowed?.[0]?.equipment || 'N/A'}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {data.mostBorrowed?.[0]?.borrowCount || 0} total borrows
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Peak Borrowing Times */}
        <Card>
          <CardHeader>
            <CardTitle>Peak Borrowing Times</CardTitle>
            <CardDescription>Hourly borrowing patterns across equipment</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="aggregate" onValueChange={setPeakTimeView}>
              <TabsList className="mb-4 flex-wrap h-auto">
                {allEquipment.map((eq) => (
                  <TabsTrigger key={eq} value={eq} className="capitalize">
                    {eq === 'aggregate' ? 'All Equipment' : eq}
                  </TabsTrigger>
                ))}
              </TabsList>

              {peakTimesData[peakTimeView]?.length > 0 ? (
                <>
                  <div className="mb-4 flex flex-wrap items-center gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded-full bg-green-500"></div>
                      <span className="text-gray-600 dark:text-gray-400">Healthy (75%+ available)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded-full bg-yellow-500"></div>
                      <span className="text-gray-600 dark:text-gray-400">Moderate (30-75% available)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded-full bg-red-500"></div>
                      <span className="text-gray-600 dark:text-gray-400">Critical (&lt;30% available)</span>
                    </div>
                  </div>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={peakTimesData[peakTimeView]}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="time" angle={-45} textAnchor="end" height={80} />
                      <YAxis label={{ value: 'Borrowed Count', angle: -90, position: 'insideLeft' }} />
                      <Tooltip content={<CustomTooltip />} />
                      <Line
                        type="monotone"
                        dataKey="count"
                        stroke="url(#colorGradient)"
                        strokeWidth={3}
                        name="Borrowings"
                        dot={(props: any) => {
                          const { cx, cy, payload, index } = props;
                          return (
                            <circle
                              key={`dot-${index}-${payload.hour}`}
                              cx={cx}
                              cy={cy}
                              r={5}
                              fill={payload.color}
                              stroke={payload.color}
                              strokeWidth={2}
                            />
                          );
                        }}
                        activeDot={{ r: 7 }}
                      />
                      <defs>
                        <linearGradient id="colorGradient" x1="0" y1="0" x2="1" y2="0">
                          {peakTimesData[peakTimeView].map((item: any, index: number) => {
                            const position = index / (peakTimesData[peakTimeView].length - 1);
                            return (
                              <stop key={index} offset={position} stopColor={item.color} />
                            );
                          })}
                        </linearGradient>
                      </defs>
                    </LineChart>
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
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Most Borrowed Equipment</CardTitle>
              <CardDescription>Top items</CardDescription>
            </CardHeader>
            <CardContent>
              {data.mostBorrowed?.length > 0 ? (
                <div className="space-y-4">
                  {data.mostBorrowed.map((item: any, idx: number) => (
                    <div key={item.equipment} className="flex items-center">
                      <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center text-sm font-semibold text-blue-700 dark:text-blue-300 mr-3">
                        {idx + 1}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{item.equipment}</span>
                          <span className="text-sm text-gray-500 dark:text-gray-400">{item.borrowCount} borrows</span>
                        </div>
                        <div className="w-full bg-gray-200 dark:bg-black rounded-full h-2 overflow-hidden">
                          <div
                            className="bg-blue-600 dark:bg-blue-500 h-2 rounded-full"
                            style={{ width: `${Math.min(Number(item.percentage) || 0, 100)}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">No data</div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Least Borrowed Equipment</CardTitle>
              <CardDescription>Items needing attention</CardDescription>
            </CardHeader>
            <CardContent>
              {data.leastBorrowed?.length > 0 ? (
                <div className="space-y-4">
                  {data.leastBorrowed.map((item: any, idx: number) => (
                    <div key={item.equipment} className="flex items-center">
                      <div className="w-8 h-8 rounded-full bg-orange-100 dark:bg-orange-900 flex items-center justify-center text-sm font-semibold text-orange-700 dark:text-orange-300 mr-3">
                        {idx + 1}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{item.equipment}</span>
                          <span className="text-sm text-gray-500 dark:text-gray-400">{item.borrowCount} borrows</span>
                        </div>
                        <div className="w-full bg-gray-200 dark:bg-black rounded-full h-2 overflow-hidden">
                          <div
                            className="bg-orange-500 dark:bg-orange-400 h-2 rounded-full"
                            style={{ width: `${Math.min((Number(item.percentage) || 0) * 3, 100)}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">No data</div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Run-Out Frequency */}
        <Card>
          <CardHeader>
            <CardTitle>Most Frequently Run Out Equipment</CardTitle>
            <CardDescription>Equipment that runs out of stock most often (last 90 days)</CardDescription>
          </CardHeader>
          <CardContent>
            {data.runOutFrequency?.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={data.runOutFrequency}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="equipment" angle={-45} textAnchor="end" height={100} />
                  <YAxis />
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
                  />
                  <Legend />
                  <Bar dataKey="runOutCount" fill="#ef4444" name="Times Out of Stock" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                No run out incidents in last 90 days
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}