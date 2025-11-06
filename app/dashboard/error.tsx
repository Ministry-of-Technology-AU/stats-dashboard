'use client';

import { useEffect } from 'react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log error to console in development
    console.error('❌ Dashboard error:', error);
  }, [error]);

  const isNetworkError = error.message.includes('ETIMEDOUT') || 
                         error.message.includes('ECONNREFUSED') ||
                         error.message.includes('connection');
                         
  const isDatabaseError = error.message.includes('Database') ||
                          error.message.includes('ER_');

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6 flex items-center justify-center">
      <div className="max-w-2xl w-full bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8">
        <div className="text-center space-y-6">
          {/* Error Icon */}
          <div className="mx-auto w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/20 flex items-center justify-center">
            <svg
              className="w-8 h-8 text-red-600 dark:text-red-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>

          {/* Error Title */}
          <div>
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              {isNetworkError ? 'Connection Error' : 
               isDatabaseError ? 'Database Error' : 
               'Something Went Wrong'}
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              {isNetworkError ? 
                'Unable to connect to the database. Please check your connection and try again.' :
               isDatabaseError ?
                'There was an issue accessing the database. Please try again in a moment.' :
                'An unexpected error occurred while loading the dashboard.'}
            </p>
          </div>

          {/* Error Details */}
          <div className="bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800 rounded-lg p-4">
            <p className="text-sm font-mono text-red-800 dark:text-red-300 break-all">
              {error.message}
            </p>
            {error.digest && (
              <p className="text-xs text-red-600 dark:text-red-400 mt-2">
                Error ID: {error.digest}
              </p>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4 justify-center">
            <button
              onClick={reset}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium shadow-md hover:shadow-lg"
            >
              Try Again
            </button>
            <button
              onClick={() => window.location.href = '/'}
              className="px-6 py-3 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors font-medium"
            >
              Go Home
            </button>
          </div>

          {/* Troubleshooting Tips */}
          <div className="text-left bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <h3 className="font-semibold text-blue-900 dark:text-blue-300 mb-2">
              💡 Troubleshooting Tips:
            </h3>
            <ul className="text-sm text-blue-800 dark:text-blue-300 space-y-1">
              <li>• Check your internet connection</li>
              <li>• Verify the Railway MySQL database is running</li>
              <li>• Ensure environment variables are set correctly</li>
              <li>• Try refreshing the page</li>
              {process.env.NODE_ENV === 'development' && (
                <li>• Check the console logs for more details</li>
              )}
            </ul>
          </div>

          {/* Stack Trace (Development Only) */}
          {process.env.NODE_ENV === 'development' && error.stack && (
            <details className="text-left">
              <summary className="cursor-pointer text-sm font-semibold text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white">
                View Stack Trace (Development)
              </summary>
              <pre className="mt-2 p-4 bg-gray-100 dark:bg-gray-900 rounded text-xs overflow-auto max-h-64 text-gray-800 dark:text-gray-200">
                {error.stack}
              </pre>
            </details>
          )}
        </div>
      </div>
    </div>
  );
}