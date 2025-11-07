import SportsDashboard from '@/components/SportsDashboard';
import { getStats } from '@/lib/get-stats';

export default async function DashboardPage() {
  try {
    console.log('📊 Dashboard page - Fetching stats...');
    const data = await getStats();
    console.log('✅ Dashboard page - Stats loaded successfully');
    return <SportsDashboard data={data} />;
  } catch (error: any) {
    console.error('❌ Dashboard page - Error loading stats:', error.message);
    
    // Return error UI
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-4 max-w-md">
          <div className="text-red-500 text-6xl">⚠️</div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Failed to Load Dashboard
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            {error.message || 'An error occurred while fetching statistics'}
          </p>
          <div className="pt-4">
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Retry
            </button>
          </div>
          {process.env.NODE_ENV === 'development' && (
            <pre className="mt-4 p-4 bg-gray-100 dark:bg-gray-800 rounded text-left text-xs overflow-auto">
              {error.stack}
            </pre>
          )}
        </div>
      </div>
    );
  }
}

// Force dynamic rendering
export const dynamic = 'force-dynamic';
export const revalidate = 0;