import { NextResponse } from 'next/server';
import { getStats } from '@/lib/get-stats';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  const startTime = Date.now();
  
  try {
    console.log("🟢 API /stats - Request received");
    console.log("📍 Timestamp:", new Date().toISOString());
    
    const data = await getStats();
    
    const duration = Date.now() - startTime;
    console.log(`✅ Stats fetched successfully in ${duration}ms\n`);
    
    return NextResponse.json(data, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
        'X-Response-Time': `${duration}ms`,
      },
    });
  } catch (error: any) {
    const duration = Date.now() - startTime;
    console.error("❌ Error in /api/stats route:");
    console.error("  Message:", error.message);
    console.error("  Stack:", error.stack);
    console.error(`  Duration: ${duration}ms\n`);
    
    // Check for specific error types
    let errorMessage = "Failed to fetch statistics";
    let statusCode = 500;
    
    if (error.code === 'ETIMEDOUT' || error.code === 'ECONNREFUSED') {
      errorMessage = "Database connection failed";
      statusCode = 503;
    } else if (error.code === 'ER_ACCESS_DENIED_ERROR') {
      errorMessage = "Database authentication failed";
      statusCode = 503;
    } else if (error.code === 'ER_BAD_DB_ERROR') {
      errorMessage = "Database not found";
      statusCode = 503;
    }
    
    return NextResponse.json(
      { 
        error: errorMessage,
        details: process.env.NODE_ENV === 'development' ? error.message : undefined,
        code: error.code,
        timestamp: new Date().toISOString(),
      },
      { 
        status: statusCode,
        headers: {
          'Cache-Control': 'no-store',
        },
      }
    );
  }
}