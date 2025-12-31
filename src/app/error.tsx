'use client';

import { useEffect } from 'react';

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function Error({ error, reset }: ErrorProps) {
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
    // Log the error to an error reporting service
    console.error('Application error:', error);
  }, [error, reset]);

  // Don't show error UI for connection errors - they're usually transient
  if (error.message?.includes('Connection closed') || error.message?.includes('connection closed')) {
    return null; // Let Next.js handle it gracefully
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-background">
      <div className="max-w-md w-full space-y-4">
        <h2 className="text-2xl font-bold text-foreground">Something went wrong!</h2>
        <p className="text-muted-foreground">{error.message || 'An unexpected error occurred'}</p>
        {error.digest && (
          <p className="text-xs text-muted-foreground">Error ID: {error.digest}</p>
        )}
        <button
          type="button"
          onClick={reset}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
        >
          Try again
        </button>
      </div>
    </div>
  );
}
