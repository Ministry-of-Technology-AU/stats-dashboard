import SportsDashboard from '@/components/SportsDashboard';
import { getStats } from '@/lib/get-stats';

export default async function DashboardPage() {
  const data = await getStats();
  return <SportsDashboard data={data} />;
}

// Force dynamic rendering
export const dynamic = 'force-dynamic';
export const revalidate = 0;