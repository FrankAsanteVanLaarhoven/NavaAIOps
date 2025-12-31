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
    // Ignore "Connection closed" errors from Next.js router - these are often transient
    if (error.message?.includes('Connection closed') || error.message?.includes('connection closed')) {
      console.warn('Router connection error (likely transient):', error.message);
      // Auto-retry after a short delay
      setTimeout(() => {
        try {
          reset();
        } catch (e) {
          // Ignore reset errors
        }
      }, 1000);
      return;
    }
    console.error('Dashboard error:', error);
  }, [error, reset]);

  // Don't show error UI for connection errors - they're usually transient
  if (error.message?.includes('Connection closed') || error.message?.includes('connection closed')) {
    return null; // Let Next.js handle it gracefully
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <h2 className="text-2xl font-bold mb-4">Something went wrong!</h2>
      <button
        type="button"
        onClick={reset}
        className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
      >
        Try again
      </button>
    </div>
  );
}
