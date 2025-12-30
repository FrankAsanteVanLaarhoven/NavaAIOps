'use client';

import { useState } from 'react';
import { useChat } from '@ai-sdk/react';
import { AlertTriangle, CheckCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

interface IncidentResolutionProps {
  incidentId: string;
}

export function IncidentResolution({ incidentId }: IncidentResolutionProps) {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [resolution, setResolution] = useState<string>('');

  const { messages, append, isLoading } = useChat({
    api: '/api/ai/incidents/resolve',
    body: {
      incidentId,
      modelId: process.env.NEXT_PUBLIC_FINETUNED_MODEL_ID,
    },
    onFinish: (message) => {
      setResolution(message.content);
      setIsAnalyzing(false);
    },
  });

  const handleAnalyze = async () => {
    setIsAnalyzing(true);
    setResolution('');
    await append({
      role: 'user',
      content: 'Analyze this incident and provide a resolution plan.',
    });
  };

  const latestMessage = messages[messages.length - 1];

  return (
    <Card className="mt-4">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-orange-500" />
            <CardTitle>Incident Resolution (Fine-Tuned Model)</CardTitle>
          </div>
          {!resolution && (
            <Button
              onClick={handleAnalyze}
              disabled={isAnalyzing || isLoading}
              size="sm"
            >
              {isAnalyzing || isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Analyzing...
                </>
              ) : (
                'Analyze with DevOps Model'
              )}
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {isAnalyzing || isLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-5/6" />
          </div>
        ) : resolution || latestMessage?.content ? (
          <div className="prose dark:prose-invert max-w-none">
            <div className="space-y-4">
              {(resolution || latestMessage?.content || '').split('\n').map((line, i) => {
                if (line.trim().startsWith('1.') || line.trim().startsWith('2.') || line.trim().startsWith('3.')) {
                  return (
                    <div key={i} className="flex items-start gap-2">
                      <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                      <p className="text-sm">{line.trim()}</p>
                    </div>
                  );
                }
                if (line.trim().startsWith('##') || line.trim().startsWith('#')) {
                  return (
                    <h3 key={i} className="text-lg font-semibold mt-4 mb-2">
                      {line.replace(/^#+\s*/, '')}
                    </h3>
                  );
                }
                return (
                  <p key={i} className="text-sm text-muted-foreground">
                    {line}
                  </p>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="text-sm text-muted-foreground">
            Click "Analyze with DevOps Model" to get AI-powered incident resolution using the fine-tuned DevOps-specialized model.
          </div>
        )}
      </CardContent>
    </Card>
  );
}
