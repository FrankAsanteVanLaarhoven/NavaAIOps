'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ShieldCheck, AlertTriangle, Loader2 } from 'lucide-react';
import { useMutation } from '@tanstack/react-query';

interface ComplianceBadgeProps {
  incidentId: string;
  workspaceId?: string;
}

export function ComplianceBadge({ incidentId, workspaceId }: ComplianceBadgeProps) {
  const [status, setStatus] = useState<'loading' | 'passed' | 'failed' | 'warning' | null>(null);
  const [score, setScore] = useState<number>(0);
  const [certificate, setCertificate] = useState<any>(null);

  const verifyMutation = useMutation({
    mutationFn: async () => {
      // Use CMDP endpoint which includes compliance checking
      const response = await fetch('/api/ai/sre/cmdp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          context: {
            incident: { id: incidentId },
            query: 'Verify compliance for incident',
          },
          workspaceId,
          incidentId,
          execute: true,
        }),
      });
      if (!response.ok) throw new Error('Verification failed');
      return response.json();
    },
    onSuccess: (data) => {
      const result = data.result || data;
      setStatus(result.allApproved ? 'passed' : 'failed');
      setScore(result.executionLog?.[0]?.complianceCheck?.score || 0);
      setCertificate(result);
    },
    onError: () => {
      setStatus('failed');
    },
  });

  const certificateMutation = useMutation({
    mutationFn: async () => {
      // First get the certificate JSON
      const certResponse = await fetch('/api/verifier/certificate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          incidentId,
          workspaceId: workspaceId || 'default',
        }),
      });
      if (!certResponse.ok) throw new Error('Certificate fetch failed');
      const certData = await certResponse.json();

      // Then generate PDF
      const response = await fetch('/api/certs/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          executionLogs: certificate?.executionLog || [],
          planId: `plan-${Date.now()}`,
          workspaceId: workspaceId || 'default',
        }),
      });
      if (!response.ok) throw new Error('Certificate generation failed');
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `compliance-certificate-${incidentId}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    },
  });

  return (
    <div className="flex items-center gap-2">
      <Button
        size="sm"
        variant="outline"
        disabled={verifyMutation.isPending}
        onClick={() => verifyMutation.mutate()}
        className="relative"
      >
        {verifyMutation.isPending ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <ShieldCheck className="h-4 w-4" />
        )}
        <span className="ml-2">
          {verifyMutation.isPending ? 'Verifying...' : 'Verify Compliance'}
        </span>
      </Button>

      {status === 'passed' && (
        <div className="flex items-center gap-2 bg-green-500/10 px-3 py-1 rounded-md border border-green-500/50">
          <ShieldCheck className="h-4 w-4 text-green-600" />
          <div className="flex flex-col">
            <span className="text-xs font-bold uppercase text-green-800">Compliant</span>
            <span className="text-[10px] font-medium text-green-700">
              Score: {score.toFixed(2)}/1.00
            </span>
          </div>
          {certificate && (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => certificateMutation.mutate()}
              disabled={certificateMutation.isPending}
              className="ml-2 h-6 text-xs"
            >
              {certificateMutation.isPending ? 'Generating...' : 'Download Cert'}
            </Button>
          )}
        </div>
      )}

      {(status === 'failed' || status === 'warning') && (
        <div className="flex items-center gap-2 bg-red-500/10 px-3 py-1 rounded-md border border-red-500/50">
          <AlertTriangle className="h-4 w-4 text-red-600" />
          <div className="flex flex-col">
            <span className="text-xs font-bold uppercase text-red-800">
              {status === 'failed' ? 'Violation Detected' : 'Warning'}
            </span>
            <span className="text-[10px] font-medium text-red-700">
              {certificate?.policies_reviewed?.[0]?.name || 'Policy'} violation
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
