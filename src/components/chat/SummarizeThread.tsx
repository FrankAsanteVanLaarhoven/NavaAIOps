'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Sparkles, Loader2 } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import ReactMarkdown from 'react-markdown';

interface SummarizeThreadProps {
  threadId: string;
  channelId?: string;
  standalone?: boolean; // If true, renders without popover wrapper
}

export function SummarizeThread({ threadId, channelId, standalone = false }: SummarizeThreadProps) {
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
      const response = await fetch('/api/ai/summarize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ threadId, channelId }),
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
        setContent(`Error: ${error.message || 'Failed to generate summary'}`);
      }
    } finally {
      setIsLoading(false);
      setAbortController(null);
    }
  };

  const hasContent = content.length > 0;

  if (standalone) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-violet-500" />
          <h3 className="font-semibold">AI Summary</h3>
        </div>
        
        <div className="max-h-96 overflow-y-auto">
          {!hasContent && !isLoading && (
            <div className="text-sm text-muted-foreground mb-4">
              Click Generate Summary to create an AI-powered summary of this thread.
            </div>
          )}
          
          {isLoading && !hasContent && (
            <div className="space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-5/6" />
            </div>
          )}
          
          {hasContent && (
            <div className="prose prose-sm dark:prose-invert max-w-none">
              <ReactMarkdown>{content}</ReactMarkdown>
            </div>
          )}
        </div>
        
        <div className="flex justify-end">
          <Button
            onClick={handleGenerate}
            disabled={isLoading && !hasContent}
            size="sm"
            variant={isLoading ? 'outline' : 'default'}
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Stop
              </>
            ) : (
              'Generate'
            )}
          </Button>
        </div>
      </div>
    );
  }

  // Original popover version (for backward compatibility)
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Sparkles className="w-4 h-4 text-violet-500" />
        <h3 className="font-semibold">AI Summary</h3>
      </div>
      
      <div className="max-h-96 overflow-y-auto">
        {!hasContent && !isLoading && (
          <div className="text-sm text-muted-foreground mb-4">
            Click Generate Summary to create an AI-powered summary of this thread.
          </div>
        )}
        
        {isLoading && !hasContent && (
          <div className="space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-5/6" />
          </div>
        )}
        
        {hasContent && (
          <div className="prose prose-sm dark:prose-invert max-w-none">
            <ReactMarkdown>{content}</ReactMarkdown>
          </div>
        )}
      </div>
      
      <div className="flex justify-end">
        <Button
          onClick={handleGenerate}
          disabled={isLoading && !hasContent}
          size="sm"
          variant={isLoading ? 'outline' : 'default'}
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Stop
            </>
          ) : (
            'Generate'
          )}
        </Button>
      </div>
    </div>
  );
}
