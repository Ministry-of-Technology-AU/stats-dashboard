import { NextResponse } from 'next/server';
import { getStats } from '@/lib/get-stats';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  try {
    console.log("🟢 Fetching stats via API route...");
    const data = await getStats();
    console.log("✅ All stats fetched successfully!\n");
    
    return NextResponse.json(data, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    });
  } catch (error: any) {
    console.error("❌ Error in /api/stats route:", error.message);
    return NextResponse.json(
      { error: "Failed to fetch statistics", details: error.message },
      { status: 500 }
    );
  }
}