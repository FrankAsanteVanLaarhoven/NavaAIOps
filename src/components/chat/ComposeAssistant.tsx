'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Sparkles, X, Loader2 } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { markdownToJson } from '@/lib/markdown';

interface ComposeAssistantProps {
  draft: any; // TipTap JSON
  onAccept: (improved: any) => void;
  channelId?: string;
}

export function ComposeAssistant({ draft, onAccept, channelId }: ComposeAssistantProps) {
  const [open, setOpen] = useState(false);
  const [content, setContent] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [abortController, setAbortController] = useState<AbortController | null>(null);

  const handleGenerate = async () => {
    if (isLoading) {
      abortController?.abort();
      setIsLoading(false);
      setAbortController(null);
      return;
    }

    setIsLoading(true);
    setContent('');
    const controller = new AbortController();
    setAbortController(controller);

    try {
      const response = await fetch('/api/ai/compose', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ draft, channelId }),
        signal: controller.signal,
      });

      if (!response.body) throw new Error('No response body');

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              if (data.content) {
                setContent((prev) => prev + data.content);
              }
            } catch (e) {
              // Ignore parse errors
            }
          }
        }
      }
    } catch (error: any) {
      if (error.name !== 'AbortError') {
        setContent(`Error: ${error.message || 'Failed to improve text'}`);
      }
    } finally {
      setIsLoading(false);
      setAbortController(null);
    }
  };

  const handleAccept = () => {
    if (content) {
      const improvedJson = markdownToJson(content);
      onAccept(improvedJson);
      setOpen(false);
      setContent('');
    }
  };

  const handleCancel = () => {
    setOpen(false);
    setContent('');
  };

  const hasContent = content.length > 0;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="sm">
          <Sparkles className="w-4 h-4 mr-2" />
          Compose Assistant
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-96" align="end">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-violet-500" />
            <h3 className="font-semibold">Compose Assistant</h3>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setOpen(false)}
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
        
        <div className="max-h-64 overflow-y-auto mb-4">
          <div className="text-xs text-muted-foreground mb-2">Draft:</div>
          <div className="text-sm bg-muted p-2 rounded">
            {typeof draft === 'string' ? draft : JSON.stringify(draft)}
          </div>
          
          {isLoading && !hasContent && (
            <div className="space-y-2 mt-4">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-5/6" />
            </div>
          )}
          
          {hasContent && (
            <>
              <div className="text-xs text-muted-foreground mb-2 mt-4">Improved:</div>
              <div className="text-sm bg-primary/10 p-2 rounded">
                {content}
              </div>
            </>
          )}
        </div>
        
        <div className="flex justify-end gap-2">
          <Button
            onClick={handleCancel}
            variant="outline"
            size="sm"
          >
            Cancel
          </Button>
          <Button
            onClick={handleGenerate}
            disabled={isLoading && !hasContent}
            size="sm"
            variant={isLoading ? 'outline' : 'default'}
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Generating...
              </>
            ) : hasContent ? (
              'Regenerate'
            ) : (
              'Generate'
            )}
          </Button>
          {hasContent && (
            <Button
              onClick={handleAccept}
              size="sm"
            >
              Accept
            </Button>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
