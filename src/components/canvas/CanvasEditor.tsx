'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { Placeholder } from '@tiptap/extension-placeholder';
import { Button } from '@/components/ui/button';
import { Users, Save } from 'lucide-react';
import { useWebSocket } from '@/app/hooks/use-websocket';
import { useUser } from '@/app/state/user-context';
import { useEffect, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';

interface CanvasEditorProps {
  threadId: string;
  initialContent?: any;
  onSave?: (content: any) => void;
}

export function CanvasEditor({ threadId, initialContent, onSave }: CanvasEditorProps) {
  const { user } = useUser();
  const queryClient = useQueryClient();
  const [collaborators, setCollaborators] = useState<Array<{ userId: string; userName: string }>>([]);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const { socket, isConnected } = useWebSocket({
    threadId,
    onMessage: (data: any) => {
      if (data.type === 'canvas-update' && data.threadId === threadId) {
        // Update canvas content from other users
        if (editor && data.content) {
          try {
            const currentContent = editor.getJSON();
            // Merge updates (simple approach - in production use CRDT like Yjs)
            if (JSON.stringify(currentContent) !== JSON.stringify(data.content)) {
              editor.commands.setContent(data.content, false);
            }
          } catch (error) {
            console.error('Failed to update canvas:', error);
          }
        }
      } else if (data.type === 'canvas-collaborator') {
        setCollaborators((prev) => {
          const exists = prev.find((c) => c.userId === data.userId);
          if (exists) return prev;
          return [...prev, { userId: data.userId, userName: data.userName }];
        });
      }
    },
  });

  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({
        placeholder: 'Start collaborating... Type to see real-time updates.',
      }),
    ],
    content: initialContent || '',
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class: 'prose prose-sm dark:prose-invert max-w-none focus:outline-none min-h-[400px] p-6',
      },
    },
    onUpdate: ({ editor }) => {
      // Debounce canvas updates
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }

      saveTimeoutRef.current = setTimeout(() => {
        const content = editor.getJSON();
        
        // Broadcast to other collaborators
        if (socket && isConnected) {
          socket.emit('canvas-update', {
            threadId,
            content,
            userId: user?.id,
          });
        }

        // Auto-save to server
        if (onSave) {
          onSave(content);
        }
      }, 1000);
    },
  });

  useEffect(() => {
    // Notify others that we're editing
    if (socket && isConnected && user) {
      socket.emit('canvas-collaborate', {
        threadId,
        userId: user.id,
        userName: user.name || user.email,
      });
    }

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [socket, isConnected, threadId, user]);

  if (!editor) {
    return <div className="p-4">Loading canvas editor...</div>;
  }

  return (
    <div className="flex flex-col h-full">
      {/* Canvas Header */}
      <div className="border-b p-3 flex items-center justify-between bg-muted/30">
        <div className="flex items-center gap-2">
          <div className="flex -space-x-2">
            {collaborators.slice(0, 3).map((collab) => (
              <div
                key={collab.userId}
                className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs border-2 border-background"
                title={collab.userName}
              >
                {collab.userName[0]?.toUpperCase() || '?'}
              </div>
            ))}
          </div>
          {collaborators.length > 0 && (
            <span className="text-xs text-muted-foreground">
              {collaborators.length} {collaborators.length === 1 ? 'collaborator' : 'collaborators'}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {isConnected ? (
            <span className="text-xs text-green-500 flex items-center gap-1">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              Live
            </span>
          ) : (
            <span className="text-xs text-muted-foreground">Offline</span>
          )}
          {onSave && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                const content = editor.getJSON();
                onSave(content);
              }}
            >
              <Save className="w-4 h-4 mr-2" />
              Save
            </Button>
          )}
        </div>
      </div>

      {/* Canvas Editor */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto p-6">
          <EditorContent editor={editor} />
        </div>
      </div>
    </div>
  );
}
