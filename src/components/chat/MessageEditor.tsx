'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { Button } from '@/components/ui/button';
import { Send } from 'lucide-react';
import { ComposeAssistant } from './ComposeAssistant';
import { useWebSocket } from '@/app/hooks/use-websocket';
import { useView } from '@/app/state/view-context';
import { useCallback, useEffect, useRef } from 'react';

interface MessageEditorProps {
  onSend: (content: any) => void;
  threadId: string;
  channelId?: string;
}

export function MessageEditor({ onSend, threadId, channelId }: MessageEditorProps) {
  const { viewState } = useView();
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  const { sendTyping, sendStopTyping } = useWebSocket({
    threadId,
    channelId: channelId || viewState.channelId,
  });

  const editor = useEditor({
    extensions: [StarterKit],
    content: '',
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class: 'prose prose-sm dark:prose-invert max-w-none focus:outline-none min-h-[100px] p-3 border-none',
      },
    },
    onUpdate: () => {
      // Send typing indicator
      sendTyping();
      
      // Clear existing timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      
      // Stop typing after 3 seconds of inactivity
      typingTimeoutRef.current = setTimeout(() => {
        sendStopTyping();
      }, 3000);
    },
  });

  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      sendStopTyping();
    };
  }, [sendStopTyping]);

  const handleSend = () => {
    if (!editor) return;
    const content = editor.getJSON();
    if (content.content && content.content.length > 0) {
      sendStopTyping();
      onSend(content);
      editor.commands.clearContent();
    }
  };

  const handleAcceptImproved = (improved: any) => {
    if (editor) {
      editor.commands.setContent(improved);
    }
  };

  if (!editor) {
    return null;
  }

  return (
    <div className="border-t p-4 space-y-2 bg-background">
      <div className="flex items-start gap-2">
        <div className="flex-1 border rounded-lg bg-background min-h-[100px]">
          <EditorContent editor={editor} />
        </div>
        <div className="flex flex-col gap-2">
          <ComposeAssistant
            draft={editor.getJSON()}
            onAccept={handleAcceptImproved}
            channelId={channelId || viewState.channelId}
          />
          <Button onClick={handleSend} size="sm" disabled={!editor.getText().trim()}>
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
