'use client';

import { useState } from 'react';
import { useChat } from '@ai-sdk/react';
import { FileSearch, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

interface AuditLogAnalysisProps {
  logId: string;
  logEntry: {
    tableName: string;
    action: string;
    userId: string;
    timestamp: Date;
    metadata?: any;
  };
}

export function AuditLogAnalysis({ logId, logEntry }: AuditLogAnalysisProps) {
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const { messages, append, isLoading } = useChat({
    api: '/api/ai/audit/analyze',
    body: {
      logId,
      modelId: process.env.NEXT_PUBLIC_FINETUNED_MODEL_ID,
    },
    onFinish: () => {
      setIsAnalyzing(false);
    },
  });

  const handleAnalyze = async () => {
    setIsAnalyzing(true);
    await append({
      role: 'user',
      content: 'Analyze this audit log entry.',
    });
  };

  const latestMessage = messages[messages.length - 1];

  return (
    <Card className="mt-2">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileSearch className="h-4 w-4 text-blue-500" />
            <CardTitle className="text-sm">AI Analysis (Fine-Tuned Model)</CardTitle>
          </div>
          <Button
            onClick={handleAnalyze}
            disabled={isAnalyzing || isLoading}
            size="sm"
            variant="outline"
          >
            {isAnalyzing || isLoading ? (
              <>
                <Loader2 className="w-3 h-3 mr-2 animate-spin" />
                Analyzing...
              </>
            ) : (
              'Analyze'
            )}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {isAnalyzing || isLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-3/4" />
          </div>
        ) : latestMessage?.content ? (
          <div className="text-sm space-y-2">
            {latestMessage.content.split('\n').map((line, i) => (
              <p key={i} className="text-muted-foreground">
                {line}
              </p>
            ))}
          </div>
        ) : (
          <p className="text-xs text-muted-foreground">
            Click "Analyze" to get AI-powered audit log analysis using the fine-tuned DevOps model.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
