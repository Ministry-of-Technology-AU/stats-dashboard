import SportsDashboard from '@/components/SportsDashboard';

async function getStats() {
  try {
    // Use absolute URL for server-side fetch
    const res = await fetch('http://localhost:3000/api/stats', {
      cache: 'no-store',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!res.ok) {
      throw new Error('Failed to fetch stats');
    }

    const data = await res.json();
    return data;
  } catch {
    throw new Error('Error fetching stats');
  }
}

export default async function DashboardPage() {
  const data = await getStats();
  return <SportsDashboard data={data} />;
}

// Force dynamic rendering
export const dynamic = 'force-dynamic';
export const revalidate = 0;