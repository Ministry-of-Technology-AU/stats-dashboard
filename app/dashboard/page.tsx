import SportsDashboard from '@/components/SportsDashboard';
import { auth } from '@/auth';
import { redirect } from 'next/navigation';

async function getStats() {
  try {
    const res = await fetch('http://localhost:3000/api/stats', {
      cache: 'no-store',
      headers: { 'Content-Type': 'application/json' },
    });
    
    if (!res.ok) {
      throw new Error('Failed to fetch stats');
    }
    
    return res.json();
  } catch (error) {
    console.error('Error in getStats:', error);
    throw error;
  }
}

export default async function DashboardPage() {
  const session = await auth();

  if (!session?.user) {
    redirect('/');
  }

  const data = await getStats();
  
  return <SportsDashboard data={data} user={session.user} />;
}

export const dynamic = 'force-dynamic';
export const revalidate = 0;