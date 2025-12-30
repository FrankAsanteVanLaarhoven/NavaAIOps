'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, AlertTriangle, FileCheck, ShieldCheck, Download } from 'lucide-react';
import type { ExecutionLogEntry } from '@/lib/ai/cmdp-loop';

interface VerifiedActionPanelProps {
  executionLogs: ExecutionLogEntry[];
  planId?: string;
  workspaceId?: string;
}

export function VerifiedActionPanel({
  executionLogs,
  planId = 'default',
  workspaceId = 'default',
}: VerifiedActionPanelProps) {
  const [isGenerating, setIsGenerating] = useState(false);

  const allStepsApproved = executionLogs.every(
    (log) => log.validationRuleBased.allowed && log.verificationAgent.approved
  );
  const hasWarnings = executionLogs.some((log) => log.verificationAgent.warning);

  const handleDownloadCertificate = async () => {
    setIsGenerating(true);
    try {
      const response = await fetch('/api/certs/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          executionLogs,
          planId,
          workspaceId,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate certificate');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `navaflow-certificate-${planId}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error: any) {
      console.error('Certificate generation error:', error);
      alert(`Failed to generate certificate: ${error.message}`);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Card className="border border-zinc-800 bg-zinc-950 text-zinc-100">
      <CardHeader className="flex items-center justify-between border-b border-zinc-800">
        <div className="flex items-center gap-3">
          {allStepsApproved ? (
            <ShieldCheck className="h-6 w-6 text-green-500" />
          ) : (
            <XCircle className="h-6 w-6 text-red-500" />
          )}
          <div>
            <CardTitle className="text-xl font-bold text-zinc-100">
              {allStepsApproved ? 'Execution Verified' : 'Verification Failed'}
            </CardTitle>
            <p className="text-xs text-zinc-500">
              {executionLogs.length} step(s) executed
            </p>
          </div>
        </div>
        <Button
          onClick={handleDownloadCertificate}
          disabled={!allStepsApproved || isGenerating}
          size="sm"
          variant="outline"
        >
          <Download className="w-4 h-4 mr-2" />
          {isGenerating ? 'Generating...' : 'Download Certificate'}
        </Button>
      </CardHeader>

      <CardContent className="p-4">
        <div className="space-y-4">
          {executionLogs.map((log, i) => (
            <div key={i} className="p-4 rounded-lg border border-zinc-800 bg-zinc-900/50">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-bold text-zinc-200">STEP {i + 1}</span>
                <Badge
                  variant="outline"
                  className={
                    log.action.type === 'ROLLBACK_DB'
                      ? 'bg-red-500/20 border-red-500 text-red-400'
                      : 'bg-blue-500/20 border-blue-500 text-blue-400'
                  }
                >
                  {log.action.type}
                </Badge>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Rule-Based Check */}
                <div className="bg-zinc-800/50 p-3 rounded border border-zinc-700">
                  <div className="flex items-center gap-2 mb-2">
                    <FileCheck
                      className={`h-4 w-4 ${
                        log.validationRuleBased.allowed ? 'text-green-500' : 'text-red-500'
                      }`}
                    />
                    <span className="text-xs font-semibold text-zinc-300">Rule Engine</span>
                  </div>
                  <div className="text-xs space-y-1">
                    <span
                      className={
                        log.validationRuleBased.allowed ? 'text-green-400' : 'text-red-400'
                      }
                    >
                      {log.validationRuleBased.allowed ? 'Allowed' : 'Blocked'}
                    </span>
                    {!log.validationRuleBased.allowed &&
                      log.validationRuleBased.violations.map((v, idx) => (
                        <div key={idx} className="flex items-start gap-2 text-red-400">
                          <span>•</span>
                          <span>{v}</span>
                        </div>
                      ))}
                  </div>
                </div>

                {/* LLM Verification Agent Check */}
                <div className="bg-zinc-800/50 p-3 rounded border border-zinc-700">
                  <div className="flex items-center gap-2 mb-2">
                    {log.verificationAgent.approved ? (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    ) : (
                      <XCircle className="h-4 w-4 text-red-500" />
                    )}
                    <span className="text-xs font-semibold text-zinc-300">
                      Verification Agent (LLM)
                    </span>
                  </div>
                  <div className="text-xs space-y-1">
                    {log.verificationAgent.approved ? (
                      <span className="text-green-400">Approved</span>
                    ) : (
                      <span className="text-red-400">
                        Rejected: {log.verificationAgent.reason || 'No reason provided'}
                      </span>
                    )}
                    {log.verificationAgent.warning && (
                      <div className="flex items-start gap-2 text-yellow-400">
                        <AlertTriangle className="h-3 w-3 mt-0.5" />
                        <span>Warning: {log.verificationAgent.warning}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Execution Status */}
              {log.executionStatus && (
                <div className="mt-3 pt-3 border-t border-zinc-700">
                  <Badge
                    variant="outline"
                    className={
                      log.executionStatus === 'SUCCESS'
                        ? 'bg-green-500/20 border-green-500 text-green-400'
                        : log.executionStatus === 'FAILED'
                        ? 'bg-red-500/20 border-red-500 text-red-400'
                        : 'bg-zinc-500/20 border-zinc-500 text-zinc-400'
                    }
                  >
                    Execution: {log.executionStatus}
                  </Badge>
                </div>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
