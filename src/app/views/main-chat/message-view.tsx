'use client';

import dynamic from 'next/dynamic';
import { useQueryClient } from '@tanstack/react-query';
import { MessageList } from '@/components/chat/MessageList';
// Lazy load MessageEditor to avoid unicode-font-resolver bundling issues
const MessageEditor = dynamic(() => import('@/components/chat/MessageEditor').then(m => ({ default: m.MessageEditor })), {
  ssr: false,
  loading: () => <div className="p-4 text-sm text-muted-foreground">Loading editor...</div>,
});
import { SummarizeThread } from '@/components/chat/SummarizeThread';
import { FloatingAIPanel } from '@/components/ai/floating-ai-panel';
import { ThreadModules } from '@/components/thread/ThreadModules';
import { IncidentPanel } from '@/components/incidents/IncidentPanel';
import { RAGAssistant } from '@/components/rag/RAGAssistant';
import { AutomationBuilder } from '@/components/automations/AutomationBuilder';
// Lazy load CanvasEditor to avoid unicode-font-resolver bundling issues
const CanvasEditor = dynamic(() => import('@/components/canvas/CanvasEditor').then(m => ({ default: m.CanvasEditor })), {
  ssr: false,
  loading: () => <div className="p-4 text-sm text-muted-foreground">Loading editor...</div>,
});
import { Button } from '@/components/ui/button';
import { Sparkles, FileText, Code, Zap } from 'lucide-react';
import { useView } from '@/app/state/view-context';
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@/components/ui/resizable';
import { useQuery } from '@tanstack/react-query';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useMutation } from '@tanstack/react-query';

interface MessageViewProps {
  threadId: string;
}

async function getChannel(threadId: string) {
  const response = await fetch(`/api/threads/${threadId}/channel`);
  if (!response.ok) return null;
  return response.json();
}

async function getThread(threadId: string) {
  const response = await fetch(`/api/threads/${threadId}`);
  if (!response.ok) return null;
  return response.json();
}

export function MessageView({ threadId }: MessageViewProps) {
  const queryClient = useQueryClient();
  const { viewState } = useView();
  const channelId = viewState.channelId;

  const { data: channel } = useQuery({
    queryKey: ['thread-channel', threadId],
    queryFn: () => getChannel(threadId),
    enabled: !!threadId,
  });

  const { data: thread } = useQuery({
    queryKey: ['thread', threadId],
    queryFn: () => getThread(threadId),
    enabled: !!threadId,
  });

  const isIncidentChannel = channel?.type === 'incident';
  const isCanvasMode = thread?.isCanvas;

  const handleSend = async (content: any) => {
    await fetch(`/api/threads/${threadId}/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content }),
    });
    queryClient.invalidateQueries({ queryKey: ['messages', threadId] });
  };

  const handleCanvasSave = async (content: any) => {
    await fetch(`/api/threads/${threadId}/canvas`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content, isCanvas: true }),
    });
    queryClient.invalidateQueries({ queryKey: ['thread', threadId] });
  };

  const toggleCanvasMutation = useMutation({
    mutationFn: async (isCanvas: boolean) => {
      const response = await fetch(`/api/threads/${threadId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isCanvas }),
      });
      if (!response.ok) throw new Error('Failed to toggle canvas mode');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['thread', threadId] });
    },
  });

  // Canvas Mode View
  if (isCanvasMode) {
    return (
      <div className="flex-1 flex flex-col h-full relative">
        {/* Canvas Mode Header */}
        <div className="border-b p-2 flex items-center justify-between bg-muted/30">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm font-medium">Canvas Mode</span>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={() => toggleCanvasMutation.mutate(false)}
          >
            Switch to Messages
          </Button>
        </div>

        <ResizablePanelGroup direction="horizontal" className="flex-1">
          <ResizablePanel defaultSize={70} minSize={50}>
            <CanvasEditor
              threadId={threadId}
              initialContent={thread?.canvasContent ? JSON.parse(thread.canvasContent) : null}
              onSave={handleCanvasSave}
            />
          </ResizablePanel>
          <ResizableHandle />
          <ResizablePanel defaultSize={30} minSize={20}>
            <div className="h-full overflow-y-auto border-l bg-muted/30 p-4">
              <Tabs defaultValue="modules" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="modules">
                    <FileText className="w-4 h-4" />
                  </TabsTrigger>
                  <TabsTrigger value="rag">
                    <Code className="w-4 h-4" />
                  </TabsTrigger>
                  <TabsTrigger value="automations">
                    <Zap className="w-4 h-4" />
                  </TabsTrigger>
                </TabsList>
                <TabsContent value="modules" className="mt-4">
                  <ThreadModules threadId={threadId} />
                </TabsContent>
                <TabsContent value="rag" className="mt-4">
                  <RAGAssistant />
                </TabsContent>
                <TabsContent value="automations" className="mt-4">
                  <AutomationBuilder />
                </TabsContent>
              </Tabs>
            </div>
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
    );
  }

  // Standard Message View
  return (
    <div className="flex-1 flex flex-col h-full relative">
      {/* Canvas Mode Toggle */}
      <div className="border-b p-2 flex items-center justify-between bg-muted/30">
        <div className="flex items-center gap-2">
          <FileText className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm font-medium">Messages</span>
        </div>
        <Button
          size="sm"
          variant="outline"
          onClick={() => toggleCanvasMutation.mutate(!isCanvasMode)}
        >
          {isCanvasMode ? 'Switch to Messages' : 'Switch to Canvas'}
        </Button>
      </div>

      <ResizablePanelGroup direction="horizontal" className="flex-1">
        {/* Main Message Area */}
        <ResizablePanel defaultSize={isIncidentChannel ? 60 : 100} minSize={50}>
          <div className="flex-1 flex flex-col h-full">
            <MessageList threadId={threadId} channelId={channelId} />
            <MessageEditor onSend={handleSend} threadId={threadId} channelId={channelId} />
          </div>
        </ResizablePanel>

        {/* Dynamic Sidebar (Modules + Incidents + RAG + Automations) */}
        <ResizableHandle />
        <ResizablePanel defaultSize={40} minSize={30}>
          <div className="h-full overflow-y-auto border-l bg-muted/30">
            <Tabs defaultValue="modules" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="modules">
                  <FileText className="w-4 h-4" />
                </TabsTrigger>
                {isIncidentChannel && (
                  <TabsTrigger value="incident">
                    <Sparkles className="w-4 h-4" />
                  </TabsTrigger>
                )}
                <TabsTrigger value="rag">
                  <Code className="w-4 h-4" />
                </TabsTrigger>
                <TabsTrigger value="automations">
                  <Zap className="w-4 h-4" />
                </TabsTrigger>
              </TabsList>
              <TabsContent value="modules" className="p-4">
                <ThreadModules threadId={threadId} />
              </TabsContent>
              {isIncidentChannel && (
                <TabsContent value="incident" className="p-4">
                  <IncidentPanel threadId={threadId} />
                </TabsContent>
              )}
              <TabsContent value="rag" className="p-4">
                <RAGAssistant />
              </TabsContent>
              <TabsContent value="automations" className="p-4">
                <AutomationBuilder />
              </TabsContent>
            </Tabs>
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>

      {/* Floating AI Summarizer Panel */}
      <FloatingAIPanel
        title="AI Thread Summary"
        position="top-right"
        trigger={
          <Button
            size="sm"
            className="bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white border-0 hover:from-violet-600 hover:to-fuchsia-600 shadow-lg"
          >
            <Sparkles className="w-4 h-4 mr-2" />
            AI Summary
          </Button>
        }
      >
        <SummarizeThread threadId={threadId} channelId={channelId} standalone />
      </FloatingAIPanel>
    </div>
  );
}
