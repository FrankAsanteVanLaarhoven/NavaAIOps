'use client';

import { useQuery } from '@tanstack/react-query';
import { useView } from '@/app/state/view-context';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

async function getThreads(channelId: string) {
  const response = await fetch(`/api/channels/${channelId}/threads`);
  if (!response.ok) throw new Error('Failed to fetch threads');
  return response.json();
}

interface ThreadsSidebarProps {
  channelId: string;
}

export function ThreadsSidebar({ channelId }: ThreadsSidebarProps) {
  const { viewState, setThread } = useView();
  const { data: threads, isLoading } = useQuery({
    queryKey: ['threads', channelId],
    queryFn: () => getThreads(channelId),
    enabled: !!channelId,
  });

  if (isLoading) {
    return (
      <div className="w-full h-full flex flex-col">
        <div className="p-4 border-b flex items-center justify-between">
          <Skeleton className="h-6 w-16" />
          <Skeleton className="h-8 w-8" />
        </div>
        <ScrollArea className="flex-1">
          <div className="p-2 space-y-1">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        </ScrollArea>
      </div>
    );
  }

  return (
    <div className="w-full h-full flex flex-col border-r">
      <div className="p-4 border-b flex items-center justify-between">
        <h2 className="font-semibold">Threads</h2>
        <Button size="sm" variant="ghost">
          <Plus className="w-4 h-4" />
        </Button>
      </div>
      <ScrollArea className="flex-1">
        <div className="p-2 space-y-1">
          {threads?.map((thread: any) => (
            <Button
              key={thread.id}
              variant={viewState.threadId === thread.id ? 'secondary' : 'ghost'}
              className="w-full justify-start text-left h-auto py-2"
              onClick={() => setThread(thread.id)}
            >
              <div className="flex-1 min-w-0">
                <div className="truncate text-sm">
                  {thread.title || `Thread ${thread.id.slice(0, 8)}`}
                </div>
                <div className="text-xs text-muted-foreground">
                  {thread._count?.messages || 0} messages
                </div>
              </div>
            </Button>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}
