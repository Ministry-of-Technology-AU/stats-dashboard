'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Clock, TrendingUp, AlertTriangle } from 'lucide-react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export default function SportsDashboard({ data }: { data: any }) {
  const [peakTimeView, setPeakTimeView] = useState('aggregate');

  const formatHourData = (hourlyData: any[]) => {
    if (!hourlyData || hourlyData.length === 0) return [];
    return hourlyData.map((d: any) => {
      const hour = Number(d.hour);
      return {
        time: `${hour === 0 ? 12 : hour > 12 ? hour - 12 : hour}:00 ${hour >= 12 ? 'PM' : 'AM'}`,
        count: Number(d.count) || 0
      };
    });
  };

  const peakTimesData: Record<string, any[]> = {
    aggregate: formatHourData(data.peakBorrowingTimes?.aggregate || []),
    basketball: formatHourData(data.peakBorrowingTimes?.basketball || []),
    football: formatHourData(data.peakBorrowingTimes?.football || []),
    tennis: formatHourData(data.peakBorrowingTimes?.tennis || []),
    'badminton racket': formatHourData(data.peakBorrowingTimes?.['badminton racket'] || []),
    volleyball: formatHourData(data.peakBorrowingTimes?.volleyball || []),
    TT: formatHourData(data.peakBorrowingTimes?.TT || []),
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Sports Inventory Dashboard</h1>
            <p className="text-gray-500 mt-1">Monitor equipment usage and borrowing patterns</p>
          </div>
        </div>

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

        <Card>
          <CardHeader>
            <CardTitle>Peak Borrowing Times</CardTitle>
            <CardDescription>Hourly borrowing patterns across equipment</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="aggregate" onValueChange={setPeakTimeView}>
              <TabsList className="mb-4 flex-wrap h-auto">
                <TabsTrigger value="aggregate">All Equipment</TabsTrigger>
                <TabsTrigger value="basketball">Basketball</TabsTrigger>
                <TabsTrigger value="football">Football</TabsTrigger>
                <TabsTrigger value="tennis">Tennis</TabsTrigger>
                <TabsTrigger value="badminton racket">Badminton</TabsTrigger>
                <TabsTrigger value="volleyball">Volleyball</TabsTrigger>
                <TabsTrigger value="TT">Table Tennis</TabsTrigger>
              </TabsList>
              
              {peakTimesData[peakTimeView]?.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={peakTimesData[peakTimeView]}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="time" angle={-45} textAnchor="end" height={80} />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="count" stroke="#2563eb" strokeWidth={2} name="Borrowings" />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[300px] flex items-center justify-center text-gray-500">
                  No borrowing data for this equipment
                </div>
              )}
            </Tabs>
          </CardContent>
        </Card>

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
                      <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-sm font-semibold text-blue-700 mr-3">
                        {idx + 1}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium">{item.equipment}</span>
                          <span className="text-sm text-gray-500">{item.borrowCount} borrows</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-blue-600 h-2 rounded-full"
                            style={{ width: `${Math.min(Number(item.percentage) || 0, 100)}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">No data</div>
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
                      <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center text-sm font-semibold text-orange-700 mr-3">
                        {idx + 1}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium">{item.equipment}</span>
                          <span className="text-sm text-gray-500">{item.borrowCount} borrows</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-orange-500 h-2 rounded-full"
                            style={{ width: `${Math.min((Number(item.percentage) || 0) * 3, 100)}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">No data</div>
              )}
            </CardContent>
          </Card>
        </div>

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
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="runOutCount" fill="#ef4444" name="Times Out of Stock" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-center py-8 text-gray-500">
                No run out incidents in last 90 days
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}