'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { format } from 'date-fns';
import { EditorContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { SummarizeThread } from './SummarizeThread';
import { TypingIndicator } from './TypingIndicator';
import { useWebSocket } from '@/app/hooks/use-websocket';
import { useView } from '@/app/state/view-context';
import { useEffect } from 'react';

interface MessageListProps {
  threadId: string;
  channelId?: string;
}

async function getMessages(threadId: string) {
  const response = await fetch(`/api/threads/${threadId}/messages`);
  if (!response.ok) throw new Error('Failed to fetch messages');
  return response.json();
}

export function MessageList({ threadId, channelId }: MessageListProps) {
  const { viewState } = useView();
  const queryClient = useQueryClient();
  const actualChannelId = channelId || viewState.channelId;

  const { typingUsers, onMessage } = useWebSocket({
    threadId,
    channelId: actualChannelId,
    onMessage: (message) => {
      // Invalidate and refetch messages when new message arrives
      queryClient.invalidateQueries({ queryKey: ['messages', threadId] });
    },
  });

  const { data: messages, isLoading } = useQuery({
    queryKey: ['messages', threadId],
    queryFn: () => getMessages(threadId),
    refetchInterval: false, // Disable polling, use WebSocket instead
  });

  if (isLoading) {
    return <div className="flex-1 p-4">Loading messages...</div>;
  }

  if (!messages || messages.length === 0) {
    return (
      <div className="flex-1 p-4 flex items-center justify-center text-muted-foreground">
        No messages yet. Start the conversation!
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">Messages</h2>
        <SummarizeThread threadId={threadId} channelId={actualChannelId} />
      </div>
      {messages.map((message: any) => (
        <MessageItem key={message.id} message={message} />
      ))}
      <TypingIndicator users={typingUsers} />
    </div>
  );
}

function MessageItem({ message }: { message: any }) {
  const editor = useEditor({
    extensions: [StarterKit],
    content: typeof message.content === 'string' 
      ? JSON.parse(message.content) 
      : message.content,
    editable: false,
    immediatelyRender: false,
  });

  if (!editor) return null;

  return (
    <div className="flex gap-3">
      <Avatar>
        <AvatarFallback>
          {message.user.name?.[0] || message.user.email[0].toUpperCase()}
        </AvatarFallback>
      </Avatar>
      <div className="flex-1">
        <div className="flex items-center gap-2 mb-1">
          <span className="font-medium text-sm">
            {message.user.name || message.user.email}
          </span>
          <span className="text-xs text-muted-foreground">
            {format(new Date(message.createdAt), 'MMM d, h:mm a')}
          </span>
        </div>
        <div className="prose prose-sm dark:prose-invert max-w-none">
          <EditorContent editor={editor} />
        </div>
      </div>
    </div>
  );
}
