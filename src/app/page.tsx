'use client';

import { lazy, Suspense } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ViewProvider, useView } from '@/app/state/view-context';
import { UserProvider } from '@/app/state/user-context';
import { AICommandPalette } from '@/app/hooks/use-ai-command';
import { Skeleton } from '@/components/ui/skeleton';

// Lazy load views for code splitting
const MainChatView = lazy(() => import('@/app/views/main-chat').then(m => ({ default: m.MainChatView })));
const OnboardingView = lazy(() => import('@/app/views/onboarding').then(m => ({ default: m.OnboardingView })));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60, // 1 minute
      refetchOnWindowFocus: false,
    },
  },
});

function ViewSkeleton() {
  return (
    <div className="h-screen flex items-center justify-center">
      <div className="space-y-4 w-full max-w-md">
        <Skeleton className="h-8 w-3/4" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
      </div>
    </div>
  );
}

function AppContent() {
  const { viewState } = useView();

  return (
    <>
      <Suspense fallback={<ViewSkeleton />}>
        {viewState.view === 'onboarding' && <OnboardingView />}
        {viewState.view === 'main-chat' && <MainChatView />}
        {viewState.view === 'settings' && (
          <div className="h-screen flex items-center justify-center">
            <p className="text-muted-foreground">Settings view coming soon</p>
          </div>
        )}
      </Suspense>
      {/* Global AI Command Palette */}
      <AICommandPalette />
    </>
  );
}

export default function Home() {
  return (
    <QueryClientProvider client={queryClient}>
      <UserProvider>
        <ViewProvider>
          <AppContent />
        </ViewProvider>
      </UserProvider>
    </QueryClientProvider>
  );
}
