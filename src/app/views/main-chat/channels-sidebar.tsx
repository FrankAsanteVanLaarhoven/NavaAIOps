'use client';

import { useQuery } from '@tanstack/react-query';
import { useView } from '@/app/state/view-context';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Hash } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

async function getChannels() {
  const response = await fetch('/api/channels');
  if (!response.ok) throw new Error('Failed to fetch channels');
  return response.json();
}

export function ChannelsSidebar() {
  const { viewState, setChannel } = useView();
  const { data: channels, isLoading } = useQuery({
    queryKey: ['channels'],
    queryFn: getChannels,
  });

  if (isLoading) {
    return (
      <div className="w-full h-full flex flex-col">
        <div className="p-4 border-b">
          <Skeleton className="h-6 w-24" />
        </div>
        <ScrollArea className="flex-1">
          <div className="p-2 space-y-1">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        </ScrollArea>
      </div>
    );
  }

  return (
    <div className="w-full h-full flex flex-col border-r">
      <div className="p-4 border-b">
        <h2 className="font-semibold">Channels</h2>
      </div>
      <ScrollArea className="flex-1">
        <div className="p-2 space-y-1">
          {channels?.map((channel: any) => (
            <Button
              key={channel.id}
              variant={viewState.channelId === channel.id ? 'secondary' : 'ghost'}
              className="w-full justify-start"
              onClick={() => setChannel(channel.id)}
            >
              <Hash className="w-4 h-4 mr-2" />
              {channel.name}
            </Button>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}
