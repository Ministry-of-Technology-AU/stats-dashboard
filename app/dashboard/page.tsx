import SportsDashboard from '@/components/SportsDashboard';
import { auth } from '@/auth';
import { getStats } from '@/lib/get-stats';

export default async function DashboardPage() {
  const session = await auth();
  const data = await getStats();
  return <SportsDashboard data={data} userEmail={session?.user?.email} />;
}

// Force dynamic rendering
export const dynamic = 'force-dynamic';
export const revalidate = 0;