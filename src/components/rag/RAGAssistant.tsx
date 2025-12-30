'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { Sparkles, Code, Loader2 } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import ReactMarkdown from 'react-markdown';
import { useView } from '@/app/state/view-context';

interface RAGAssistantProps {
  repository?: string;
}

export function RAGAssistant({ repository }: RAGAssistantProps) {
  const [query, setQuery] = useState('');
  const [response, setResponse] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [abortController, setAbortController] = useState<AbortController | null>(null);
  const { viewState } = useView();

  const handleQuery = async () => {
    if (isLoading) {
      abortController?.abort();
      setIsLoading(false);
      setAbortController(null);
      return;
    }

    setIsLoading(true);
    setResponse('');
    const controller = new AbortController();
    setAbortController(controller);

    try {
      const response = await fetch('/api/rag/assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query,
          repository,
          channelId: viewState.channelId,
          threadId: viewState.threadId,
        }),
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
                setResponse((prev) => prev + data.content);
              }
            } catch (e) {
              // Ignore parse errors
            }
          }
        }
      }
    } catch (error: any) {
      if (error.name !== 'AbortError') {
        setResponse(`Error: ${error.message || 'Failed to get response'}`);
      }
    } finally {
      setIsLoading(false);
      setAbortController(null);
    }
  };

  return (
    <Card className="p-4 space-y-4">
      <div className="flex items-center gap-2">
        <Code className="w-5 h-5 text-violet-500" />
        <h3 className="font-semibold">RAG Assistant</h3>
        <span className="text-xs text-muted-foreground">(Code-Aware AI)</span>
      </div>

      <div className="space-y-2">
        <Textarea
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Ask about code, functions, bugs, or architecture..."
          rows={3}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
              handleQuery();
            }
          }}
        />
        <div className="flex items-center justify-between">
          <p className="text-xs text-muted-foreground">
            {repository ? `Repository: ${repository}` : 'Will search all indexed code'}
          </p>
          <Button
            onClick={handleQuery}
            disabled={!query.trim() || isLoading}
            size="sm"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Thinking...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 mr-2" />
                Ask AI
              </>
            )}
          </Button>
        </div>
      </div>

      {isLoading && !response && (
        <div className="space-y-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-5/6" />
        </div>
      )}

      {response && (
        <div className="prose prose-sm dark:prose-invert max-w-none border-t pt-4">
          <ReactMarkdown>{response}</ReactMarkdown>
        </div>
      )}

      {!response && !isLoading && (
        <div className="text-sm text-muted-foreground text-center py-4">
          <p>Ask questions about your codebase</p>
          <p className="text-xs mt-1">AI will search indexed code and provide context-aware answers</p>
        </div>
      )}
    </Card>
  );
}
