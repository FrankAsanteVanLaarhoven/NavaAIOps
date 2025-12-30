'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { AlertTriangle, CheckCircle2, Clock, Search } from 'lucide-react';
import { useState } from 'react';
import { IncidentResolution } from './IncidentResolution';
import { SREPanel } from '@/components/agent/SREPanel';
import { ComplianceBadge } from './ComplianceBadge';

interface IncidentPanelProps {
  threadId: string;
}

async function getIncident(threadId: string) {
  const response = await fetch(`/api/incidents/${threadId}`);
  if (!response.ok) {
    if (response.status === 404) return null;
    throw new Error('Failed to fetch incident');
  }
  return response.json();
}

async function updateIncident(threadId: string, data: any) {
  const response = await fetch(`/api/incidents/${threadId}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!response.ok) throw new Error('Failed to update incident');
  return response.json();
}

const statusConfig = {
  investigating: { label: 'Investigating', icon: Search, color: 'bg-yellow-500' },
  identified: { label: 'Identified', icon: AlertTriangle, color: 'bg-orange-500' },
  monitoring: { label: 'Monitoring', icon: Clock, color: 'bg-blue-500' },
  resolved: { label: 'Resolved', icon: CheckCircle2, color: 'bg-green-500' },
};

const severityConfig = {
  'sev-0': { label: 'SEV-0', color: 'bg-red-500', description: 'Critical - Service Down' },
  'sev-1': { label: 'SEV-1', color: 'bg-orange-500', description: 'High - Major Impact' },
  'sev-2': { label: 'SEV-2', color: 'bg-yellow-500', description: 'Medium - Partial Impact' },
  'sev-3': { label: 'SEV-3', color: 'bg-blue-500', description: 'Low - Minor Impact' },
};

export function IncidentPanel({ threadId }: IncidentPanelProps) {
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [status, setStatus] = useState<string>('investigating');
  const [severity, setSeverity] = useState<string>('sev-2');
  const [impact, setImpact] = useState('');
  const [rootCause, setRootCause] = useState('');
  const [fix, setFix] = useState('');

  const { data: incident, isLoading } = useQuery({
    queryKey: ['incident', threadId],
    queryFn: () => getIncident(threadId),
  });

  const updateMutation = useMutation({
    mutationFn: (data: any) => updateIncident(threadId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['incident', threadId] });
      setIsEditing(false);
    },
  });

  if (isLoading) {
    return <div className="p-4 text-sm text-muted-foreground">Loading incident data...</div>;
  }

  if (!incident && !isEditing) {
    return (
      <Card className="p-4">
        <div className="text-center space-y-2">
          <AlertTriangle className="w-8 h-8 mx-auto text-muted-foreground" />
          <p className="text-sm font-medium">No Incident Data</p>
          <p className="text-xs text-muted-foreground">
            This thread is not associated with an incident
          </p>
          <Button size="sm" onClick={() => setIsEditing(true)}>
            Create Incident
          </Button>
        </div>
      </Card>
    );
  }

  const currentStatus = incident?.status || status;
  const currentSeverity = incident?.severity || severity;
  const StatusIcon = statusConfig[currentStatus as keyof typeof statusConfig]?.icon || AlertTriangle;
  const severityInfo = severityConfig[currentSeverity as keyof typeof severityConfig];

  return (
    <Card className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold flex items-center gap-2">
          <AlertTriangle className="w-4 h-4" />
          Incident Management
        </h3>
        {!isEditing && (
          <Button size="sm" variant="outline" onClick={() => setIsEditing(true)}>
            Edit
          </Button>
        )}
      </div>

      {isEditing ? (
        <div className="space-y-4">
          <div>
            <Label>Status</Label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(statusConfig).map(([key, config]) => (
                  <SelectItem key={key} value={key}>
                    {config.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Severity</Label>
            <Select value={severity} onValueChange={setSeverity}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(severityConfig).map(([key, config]) => (
                  <SelectItem key={key} value={key}>
                    {config.label} - {config.description}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Impact</Label>
            <Textarea
              value={impact}
              onChange={(e) => setImpact(e.target.value)}
              placeholder="Describe the impact on users/services..."
              rows={3}
            />
          </div>

          <div>
            <Label>Root Cause</Label>
            <Textarea
              value={rootCause}
              onChange={(e) => setRootCause(e.target.value)}
              placeholder="What caused this incident?"
              rows={3}
            />
          </div>

          <div>
            <Label>Fix Applied</Label>
            <Textarea
              value={fix}
              onChange={(e) => setFix(e.target.value)}
              placeholder="How was this resolved?"
              rows={3}
            />
          </div>

          <div className="flex gap-2">
            <Button
              onClick={() => {
                updateMutation.mutate({
                  status,
                  severity,
                  impact,
                  rootCause,
                  fix,
                });
              }}
              className="flex-1"
            >
              Save
            </Button>
            <Button variant="outline" onClick={() => setIsEditing(false)}>
              Cancel
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <StatusIcon className="w-4 h-4" />
            <Badge variant="outline">{statusConfig[currentStatus as keyof typeof statusConfig]?.label}</Badge>
            <Badge className={severityInfo?.color}>{severityInfo?.label}</Badge>
          </div>

          {incident?.impact && (
            <div>
              <Label className="text-xs text-muted-foreground">Impact</Label>
              <p className="text-sm mt-1">{incident.impact}</p>
            </div>
          )}

          {incident?.rootCause && (
            <div>
              <Label className="text-xs text-muted-foreground">Root Cause</Label>
              <p className="text-sm mt-1">{incident.rootCause}</p>
            </div>
          )}

          {incident?.fix && (
            <div>
              <Label className="text-xs text-muted-foreground">Fix Applied</Label>
              <p className="text-sm mt-1">{incident.fix}</p>
            </div>
          )}

          {incident?.resolvedAt && (
            <div className="text-xs text-muted-foreground">
              Resolved: {new Date(incident.resolvedAt).toLocaleString()}
            </div>
          )}

          {/* Fine-Tuned Model Incident Resolution */}
          {incident && (
            <IncidentResolution incidentId={threadId} />
          )}

          {/* Compliance Badge */}
          {incident && (
            <div className="mt-4 pt-4 border-t">
              <ComplianceBadge incidentId={threadId} workspaceId={undefined} />
            </div>
          )}

          {/* AI SRE Agent - Autonomous Remediation (CMDP) */}
          {incident && incident.status !== 'resolved' && (
            <div className="mt-4 pt-4 border-t space-y-4">
              <SREPanel workspaceId={undefined} userId={undefined} />
              {/* Verified Action Panel will be shown after execution */}
            </div>
          )}
        </div>
      )}
    </Card>
  );
}
