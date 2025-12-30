'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, XCircle, Play, Pause, AlertTriangle, Loader2 } from 'lucide-react';
import type { SREAgentEvent } from '@/lib/agent/sre-agent';
import { VerifiedActionPanel } from './VerifiedActionPanel';

// Suppress browser extension errors
if (typeof window !== 'undefined') {
  const originalError = console.error;
  console.error = (...args: any[]) => {
    const message = args[0]?.toString() || '';
    // Filter out browser extension errors
    if (
      message.includes('message channel closed') ||
      message.includes('asynchronous response') ||
      message.includes('Extension context invalidated')
    ) {
      return; // Suppress these errors
    }
    originalError.apply(console, args);
  };
}

interface SREPanelProps {
  workspaceId?: string;
  userId?: string;
}

export function SREPanel({ workspaceId, userId }: SREPanelProps) {
  const [events, setEvents] = useState<SREAgentEvent[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [pendingApproval, setPendingApproval] = useState<SREAgentEvent | null>(null);
  const [isApproving, setIsApproving] = useState(false);
  const [executionLog, setExecutionLog] = useState<any[]>([]);
  const [planId, setPlanId] = useState<string>('');
  const eventsEndRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const scrollToBottom = () => {
    eventsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [events]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // Cancel any ongoing requests
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  const handleStart = async () => {
    setIsRunning(true);
    setEvents([]);
    setPendingApproval(null);

    // Create abort controller for cleanup
    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    let reader: ReadableStreamDefaultReader<Uint8Array> | null = null;

    try {
      const response = await fetch('/api/ai/sre/remediate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ workspaceId, userId }),
        signal: abortController.signal,
      }).catch((err) => {
        // Handle fetch errors gracefully
        if (err.name === 'AbortError') {
          throw new Error('Request cancelled');
        }
        throw err;
      });

      if (!response.ok) {
        const errorText = await response.text().catch(() => 'Unknown error');
        throw new Error(`Failed to start SRE agent: ${errorText}`);
      }

      if (!response.body) {
        throw new Error('No response body');
      }

      reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) {
          // Process any remaining buffer
          if (buffer.trim()) {
            try {
              const event: SREAgentEvent = JSON.parse(buffer.trim());
              setEvents((prev) => [...prev, event]);
            } catch (e) {
              console.error('Failed to parse final buffer:', e);
            }
          }
          break;
        }

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        
        // Keep the last incomplete line in buffer
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (!line.trim()) continue;
          
          try {
            const event: SREAgentEvent = JSON.parse(line);
            setEvents((prev) => [...prev, event]);

            // Check if this is an approval gate
            if (
              event.status === 'PENDING_HUMAN_APPROVAL' &&
              (event.phase === 'EXECUTION_GATE' || event.phase === 'VERIFICATION_GATE')
            ) {
              setPendingApproval(event);
              setIsRunning(false); // Pause execution
            }

            // If we're closing or erroring, stop running
            if (event.phase === 'CLOSED' || event.phase === 'ERROR' || event.phase === 'IDLE') {
              setIsRunning(false);
            }

            // Extract execution log from metadata
            if (event.metadata?.executionLog) {
              setExecutionLog(event.metadata.executionLog);
              if (event.metadata.cmdpPlan) {
                setPlanId(`plan-${Date.now()}`);
              }
            }
          } catch (e) {
            console.error('Failed to parse event:', e, 'Line:', line);
          }
        }
      }
    } catch (error: any) {
      console.error('SRE Agent error:', error);
      setEvents((prev) => [
        ...prev,
        {
          phase: 'ERROR',
          status: 'FAILED',
          content: `Error: ${error.message || 'Unknown error occurred'}`,
          timestamp: new Date(),
        },
      ]);
      setIsRunning(false);
    } finally {
      // Cleanup: release reader if it exists
      if (reader) {
        try {
          await reader.cancel();
          reader.releaseLock();
        } catch (e) {
          // Ignore cleanup errors
        }
      }
      abortControllerRef.current = null;
    }
  };

  const handleApproval = async (approved: boolean, reason?: string) => {
    if (!pendingApproval?.metadata?.updateId) {
      return;
    }

    setIsApproving(true);

    try {
      const response = await fetch('/api/ai/sre/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          updateId: pendingApproval.metadata.updateId,
          approved,
          userId,
          reason,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to process approval');
      }

      setPendingApproval(null);
      setIsRunning(true); // Resume execution
      setIsApproving(false);

      // Continue the agent (it will poll for approval status)
      // In a real implementation, you might want to trigger a resume event
    } catch (error: any) {
      setEvents((prev) => [
        ...prev,
        {
          phase: 'ERROR',
          status: 'FAILED',
          content: `Approval error: ${error.message}`,
          timestamp: new Date(),
        },
      ]);
      setIsApproving(false);
    }
  };

  const getPhaseIcon = (phase: string) => {
    switch (phase) {
      case 'DETECTION':
        return '🔍';
      case 'PROPOSAL_FIX':
        return '🤔';
      case 'EXECUTION_GATE':
      case 'VERIFICATION_GATE':
        return '⏸️';
      case 'EXECUTION':
        return '🛠️';
      case 'VERIFICATION':
        return '🔍';
      case 'CLOSED':
        return '✅';
      case 'ERROR':
        return '❌';
      case 'IDLE':
        return '💤';
      default:
        return '📋';
    }
  };

  const getPhaseColor = (phase: string, status: string) => {
    if (status === 'PENDING_HUMAN_APPROVAL') return 'text-yellow-400';
    if (status === 'FAILED' || status === 'REJECTED') return 'text-red-400';
    if (status === 'SUCCESS') return 'text-green-400';
    if (phase === 'ERROR') return 'text-red-400';
    return 'text-blue-400';
  };

  return (
    <Card className="border border-zinc-800 bg-zinc-950 text-zinc-100">
      <CardHeader className="flex items-center justify-between border-b border-zinc-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-red-500/20 flex items-center justify-center">
            <Play className="w-5 h-5 text-red-400" />
          </div>
          <div>
            <CardTitle className="text-xl font-bold text-zinc-100">AI SRE Agent</CardTitle>
            <p className="text-xs text-zinc-500">Autonomous Site Reliability Engineer</p>
          </div>
        </div>
        <Button
          size="sm"
          variant={isRunning ? 'destructive' : 'default'}
          onClick={handleStart}
          disabled={isRunning || !!pendingApproval}
        >
          {isRunning ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Running...
            </>
          ) : (
            <>
              <Play className="w-4 h-4 mr-2" />
              Start Agent
            </>
          )}
        </Button>
      </CardHeader>

      <CardContent className="p-0">
        {/* Approval Gate UI */}
        {pendingApproval && (
          <div className="border-b border-yellow-500/30 bg-yellow-500/10 p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h3 className="font-semibold text-yellow-400 mb-2">Action Required</h3>
                <div
                  className="text-sm text-zinc-300 whitespace-pre-wrap mb-4"
                  dangerouslySetInnerHTML={{
                    __html: pendingApproval.content.replace(/\n/g, '<br />'),
                  }}
                />
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="default"
                    onClick={() => handleApproval(true)}
                    disabled={isApproving}
                  >
                    <CheckCircle2 className="w-4 h-4 mr-2" />
                    Approve
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => handleApproval(false, 'Rejected by operator')}
                    disabled={isApproving}
                  >
                    <XCircle className="w-4 h-4 mr-2" />
                    Reject
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Job Tail Logs */}
        <div className="h-[500px] overflow-y-auto p-4 space-y-3 font-mono text-sm">
          {events.length === 0 && (
            <div className="text-zinc-600 italic text-center py-8">
              Waiting for agent to start...
            </div>
          )}

          {events.map((event, i) => (
            <div
              key={i}
              className={`border-l-2 pl-3 py-2 ${
                event.status === 'PENDING_HUMAN_APPROVAL'
                  ? 'border-yellow-500 bg-yellow-500/5'
                  : event.status === 'FAILED' || event.status === 'REJECTED'
                  ? 'border-red-500 bg-red-500/5'
                  : event.status === 'SUCCESS'
                  ? 'border-green-500 bg-green-500/5'
                  : 'border-zinc-700 bg-zinc-900/50'
              }`}
            >
              <div className="flex items-start gap-2 mb-1">
                <span className="text-lg">{getPhaseIcon(event.phase)}</span>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge
                      variant="outline"
                      className={`text-xs ${getPhaseColor(event.phase, event.status)}`}
                    >
                      {event.phase}
                    </Badge>
                    <Badge
                      variant="outline"
                      className={`text-xs ${
                        event.status === 'PENDING_HUMAN_APPROVAL'
                          ? 'text-yellow-400'
                          : event.status === 'FAILED'
                          ? 'text-red-400'
                          : event.status === 'SUCCESS'
                          ? 'text-green-400'
                          : 'text-zinc-400'
                      }`}
                    >
                      {event.status}
                    </Badge>
                    <span className="text-xs text-zinc-500">
                      {new Date(event.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                  <div
                    className="text-zinc-300 whitespace-pre-wrap"
                    dangerouslySetInnerHTML={{
                      __html: event.content.replace(/\n/g, '<br />'),
                    }}
                  />
                </div>
              </div>
            </div>
          ))}

          <div ref={eventsEndRef} />
        </div>

        {/* Verified Action Panel - Shows after execution */}
        {executionLog.length > 0 && (
          <div className="border-t border-zinc-800 p-4">
            <VerifiedActionPanel
              executionLogs={executionLog}
              planId={planId || `plan-${Date.now()}`}
              workspaceId={workspaceId || 'default'}
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
