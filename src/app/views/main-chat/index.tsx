'use client';

import { useView } from '@/app/state/view-context';
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@/components/ui/resizable';
import { ChannelsSidebar } from './channels-sidebar';
import { ThreadsSidebar } from './threads-sidebar';
import { MessageView } from './message-view';
import { ThreadOverlay } from './thread-overlay';
import { SearchBar } from '@/components/search/SearchBar';
import { Skeleton } from '@/components/ui/skeleton';
import { useMobileGestures } from '@/app/hooks/use-mobile-gestures';
import { useEffect, useState } from 'react';
import { VoiceInput } from '@/components/voice/VoiceInput';
import { GestureController } from '@/components/gestures/GestureController';

export function MainChatView() {
  const { viewState, setChannel, setThread } = useView();
  const { channelId, threadId, isThreadOpen } = viewState;
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Mobile swipe gestures
  useMobileGestures({
    onSwipeRight: () => {
      if (isMobile && threadId) {
        setThread(null);
      }
    },
    onSwipeLeft: () => {
      if (isMobile && channelId && !threadId) {
        // Could open thread list or next channel
      }
    },
  });

  // Mobile layout: show only one panel at a time
  if (isMobile) {
    return (
      <div className="h-screen flex relative overflow-hidden">
        {!channelId ? (
          <div className="w-full">
            <ChannelsSidebar />
          </div>
        ) : !threadId ? (
          <div className="w-full">
            <ThreadsSidebar channelId={channelId} />
          </div>
        ) : (
          <div className="w-full">
            <MessageView threadId={threadId} />
          </div>
        )}
      </div>
    );
  }

  // Desktop layout: resizable panels
  const handleVoiceIntent = (intent: { type: string; params: any }) => {
    if (intent.type === 'navigation') {
      // Handle navigation intents
      if (intent.params.view === 'sidebar') {
        // Open sidebar logic
      }
    } else if (intent.type === 'action') {
      // Handle action intents
      if (intent.params.action === 'createIncident') {
        // Create incident logic
      }
    }
  };

  const handleVoiceText = (text: string) => {
    // Handle transcribed text (e.g., send as message)
    console.log('Voice text:', text);
  };

  const handleGesture = (gesture: { type: string; params: any }) => {
    if (gesture.type === 'swipe') {
      if (gesture.params.direction === 'left') {
        // Navigate to previous message/thread
      } else if (gesture.params.direction === 'right') {
        // Navigate to next message/thread
      }
    } else if (gesture.type === 'push') {
      // Reply to active thread
    } else if (gesture.type === 'pinch') {
      // Delete active message
    }
  };

  return (
    <div className="h-screen flex flex-col relative">
      {/* Global Search Bar with Voice Input */}
      <div className="border-b p-2 space-y-2">
        <SearchBar />
        <VoiceInput
          workspaceId="default"
          channelId={channelId || ''}
          onIntent={handleVoiceIntent}
          onText={handleVoiceText}
          isBiometricEnabled={true}
        />
      </div>

      <div className="flex-1 flex">
        <ResizablePanelGroup direction="horizontal">
          {/* Channels Sidebar */}
          <ResizablePanel defaultSize={20} minSize={15}>
            <ChannelsSidebar />
          </ResizablePanel>
          <ResizableHandle />
          
          {/* Threads Sidebar */}
          <ResizablePanel defaultSize={30} minSize={20}>
            {channelId ? (
              <ThreadsSidebar channelId={channelId} />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                <div className="text-center">
                  <p className="text-sm">Select a channel</p>
                  <p className="text-xs mt-2">Choose a channel from the left to view threads</p>
                </div>
              </div>
            )}
          </ResizablePanel>
          <ResizableHandle />
          
          {/* Main Message View */}
          <ResizablePanel defaultSize={50} minSize={30}>
            {threadId ? (
              <MessageView threadId={threadId} />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                <div className="text-center">
                  <p className="text-sm">Select a thread</p>
                  <p className="text-xs mt-2">Choose a thread to view messages</p>
                </div>
              </div>
            )}
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
      
      {/* Thread Overlay (for mobile/optional desktop view) */}
      {isThreadOpen && threadId && (
        <ThreadOverlay threadId={threadId} />
      )}

      {/* Gesture Controller (floating) */}
      <GestureController
        workspaceId="default"
        onGesture={handleGesture}
      />

      {/* Gamification & Integrations Sidebar (collapsible) */}
      <div className="absolute top-16 right-4 w-80 max-h-[calc(100vh-4rem)] overflow-y-auto bg-background/95 backdrop-blur-sm border rounded-lg shadow-lg z-40 hidden lg:block">
        <Tabs defaultValue="leaderboard" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="leaderboard">Leaderboard</TabsTrigger>
            <TabsTrigger value="integrations">Integrations</TabsTrigger>
          </TabsList>
          <TabsContent value="leaderboard" className="p-4">
            <Leaderboard workspaceId="default" />
          </TabsContent>
          <TabsContent value="integrations" className="p-4">
            <IntegrationHub workspaceId="default" />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
