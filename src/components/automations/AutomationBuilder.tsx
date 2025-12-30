'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Plus, Trash2, Zap } from 'lucide-react';
import { useView } from '@/app/state/view-context';

async function getAutomations(channelId?: string, threadId?: string) {
  const params = new URLSearchParams();
  if (channelId) params.append('channelId', channelId);
  if (threadId) params.append('threadId', threadId);
  
  const response = await fetch(`/api/automations?${params}`);
  if (!response.ok) throw new Error('Failed to fetch automations');
  return response.json();
}

async function createAutomation(data: any) {
  const response = await fetch('/api/automations', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!response.ok) throw new Error('Failed to create automation');
  return response.json();
}

export function AutomationBuilder() {
  const { viewState } = useView();
  const queryClient = useQueryClient();
  const [isCreating, setIsCreating] = useState(false);
  const [name, setName] = useState('');
  const [triggerType, setTriggerType] = useState<string>('keyword');
  const [triggerConfig, setTriggerConfig] = useState<any>({});
  const [actions, setActions] = useState<Array<{ type: string; config: any }>>([]);

  const { data: automations, isLoading } = useQuery({
    queryKey: ['automations', viewState.channelId, viewState.threadId],
    queryFn: () => getAutomations(viewState.channelId || undefined, viewState.threadId || undefined),
  });

  const createMutation = useMutation({
    mutationFn: createAutomation,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['automations'] });
      setIsCreating(false);
      setName('');
      setTriggerType('keyword');
      setTriggerConfig({});
      setActions([]);
    },
  });

  const handleCreate = () => {
    createMutation.mutate({
      name,
      channelId: viewState.channelId || undefined,
      threadId: viewState.threadId || undefined,
      trigger: {
        type: triggerType,
        config: triggerConfig,
      },
      actions,
      enabled: true,
    });
  };

  const addAction = () => {
    setActions([...actions, { type: 'send_message', config: {} }]);
  };

  const removeAction = (index: number) => {
    setActions(actions.filter((_, i) => i !== index));
  };

  if (isLoading) {
    return <div className="p-4 text-sm text-muted-foreground">Loading automations...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold flex items-center gap-2">
          <Zap className="w-4 h-4" />
          Automations
        </h3>
        <Button size="sm" onClick={() => setIsCreating(!isCreating)}>
          <Plus className="w-4 h-4 mr-2" />
          New
        </Button>
      </div>

      {isCreating && (
        <Card className="p-4 space-y-4">
          <div>
            <Label>Automation Name</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Auto-create incident on deploy failure"
            />
          </div>

          <div>
            <Label>Trigger</Label>
            <Select value={triggerType} onValueChange={setTriggerType}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="keyword">Keyword in Message</SelectItem>
                <SelectItem value="message">Any Message</SelectItem>
                <SelectItem value="webhook">Webhook</SelectItem>
                <SelectItem value="incident">Incident Status Change</SelectItem>
              </SelectContent>
            </Select>
            {triggerType === 'keyword' && (
              <Input
                className="mt-2"
                placeholder="Keywords (comma-separated)"
                onChange={(e) =>
                  setTriggerConfig({
                    keywords: e.target.value.split(',').map((k) => k.trim()),
                  })
                }
              />
            )}
          </div>

          <div>
            <Label>Actions</Label>
            <div className="space-y-2 mt-2">
              {actions.map((action, index) => (
                <div key={index} className="flex items-center gap-2 p-2 border rounded">
                  <Select
                    value={action.type}
                    onValueChange={(value) => {
                      const newActions = [...actions];
                      newActions[index].type = value;
                      setActions(newActions);
                    }}
                  >
                    <SelectTrigger className="flex-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="send_message">Send Message</SelectItem>
                      <SelectItem value="create_thread">Create Thread</SelectItem>
                      <SelectItem value="create_incident">Create Incident</SelectItem>
                      <SelectItem value="webhook">Call Webhook</SelectItem>
                    </SelectContent>
                  </Select>
                  {action.type === 'send_message' && (
                    <Input
                      placeholder="Message text"
                      onChange={(e) => {
                        const newActions = [...actions];
                        newActions[index].config.message = e.target.value;
                        setActions(newActions);
                      }}
                    />
                  )}
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => removeAction(index)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}
              <Button size="sm" variant="outline" onClick={addAction}>
                <Plus className="w-4 h-4 mr-2" />
                Add Action
              </Button>
            </div>
          </div>

          <div className="flex gap-2">
            <Button onClick={handleCreate} className="flex-1" disabled={!name || actions.length === 0}>
              Create Automation
            </Button>
            <Button variant="outline" onClick={() => setIsCreating(false)}>
              Cancel
            </Button>
          </div>
        </Card>
      )}

      <div className="space-y-2">
        {automations?.map((automation: any) => {
          const trigger = typeof automation.trigger === 'string' 
            ? JSON.parse(automation.trigger) 
            : automation.trigger;
          const actions = typeof automation.actions === 'string'
            ? JSON.parse(automation.actions)
            : automation.actions;

          return (
            <Card key={automation.id} className="p-3">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h4 className="font-medium text-sm">{automation.name}</h4>
                    <span className="text-xs text-muted-foreground">
                      {automation.enabled ? 'Enabled' : 'Disabled'}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Trigger: {trigger.type} → {actions.length} action(s)
                  </p>
                </div>
              </div>
            </Card>
          );
        })}

        {(!automations || automations.length === 0) && !isCreating && (
          <div className="text-center py-8 text-sm text-muted-foreground">
            <p>No automations configured</p>
            <p className="text-xs mt-1">Create automations to automate workflows</p>
          </div>
        )}
      </div>
    </div>
  );
}
