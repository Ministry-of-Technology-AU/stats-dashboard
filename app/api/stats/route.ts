import { NextResponse } from 'next/server';
import { getStats } from '@/lib/get-stats';

export async function GET() {
  try {
    console.log("🟢 Fetching stats via API route...");
    const data = await getStats();
    console.log("✅ All stats fetched successfully!\n");
    return NextResponse.json(data);
  } catch (error: any) {
    console.error("❌ Error in /api/stats route:", error.message);
    return NextResponse.json(
      { error: "Failed to fetch statistics", details: error.message },
      { status: 500 }
    );
  }
}