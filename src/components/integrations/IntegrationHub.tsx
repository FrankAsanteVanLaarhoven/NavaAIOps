'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { X } from 'lucide-react';

interface IntegrationHubProps {
  workspaceId: string;
}

async function getIntegrations(workspaceId: string) {
  const response = await fetch(`/api/integrations?workspaceId=${workspaceId}`);
  if (!response.ok) throw new Error('Failed to fetch integrations');
  return response.json();
}

async function createIntegration(data: any) {
  const response = await fetch('/api/integrations', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!response.ok) throw new Error('Failed to create integration');
  return response.json();
}

const providers = [
  {
    id: 'jira',
    name: 'Jira',
    icon: '🔷',
    description: 'Automate Jira tickets to incidents',
    color: 'text-blue-600',
  },
  {
    id: 'linear',
    name: 'Linear',
    icon: '📋',
    description: 'Sync Linear issues to incidents',
    color: 'text-purple-600',
  },
  {
    id: 'notion',
    name: 'Notion',
    icon: '📝',
    description: 'Embed Notion docs as context modules',
    color: 'text-black',
  },
  {
    id: 'github',
    name: 'GitHub',
    icon: '🐙',
    description: 'Trigger workflows on commits',
    color: 'text-zinc-900',
  },
  {
    id: 'sentry',
    name: 'Sentry',
    icon: '🔥',
    description: 'Auto-create incidents on Sentry alerts',
    color: 'text-purple-600',
  },
];

export function IntegrationHub({ workspaceId }: IntegrationHubProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState<string | null>(null);
  const [apiKey, setApiKey] = useState('');
  const [workspace, setWorkspace] = useState('');

  const queryClient = useQueryClient();

  const { data: integrations, isLoading } = useQuery({
    queryKey: ['integrations', workspaceId],
    queryFn: () => getIntegrations(workspaceId),
  });

  const createMutation = useMutation({
    mutationFn: createIntegration,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['integrations', workspaceId] });
      setIsModalOpen(false);
      setApiKey('');
      setWorkspace('');
      setSelectedProvider(null);
    },
  });

  const handleConnect = (provider: string) => {
    setSelectedProvider(provider);
    setIsModalOpen(true);
  };

  const handleSubmit = () => {
    if (!selectedProvider || !apiKey) return;

    createMutation.mutate({
      workspaceId,
      provider: selectedProvider,
      config: {
        apiKey,
        workspace,
      },
    });
  };

  if (isLoading) {
    return <div className="p-4 text-sm text-muted-foreground">Loading integrations...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold mb-2">Integration Hub</h1>
        <p className="text-muted-foreground">
          Connect your tools to automate workflows
        </p>
      </div>

      {/* Available Integrations */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {providers.map((provider) => {
          const isConnected = integrations?.some(
            (i: any) => i.provider === provider.id && i.enabled
          );

          return (
            <Card
              key={provider.id}
              className={`hover:border-primary/50 transition-all ${
                isConnected ? 'border-green-500/50 bg-green-500/5' : ''
              }`}
            >
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <span className="text-2xl">{provider.icon}</span>
                  <span>{provider.name}</span>
                  {isConnected && (
                    <span className="ml-auto text-xs text-green-500">Connected</span>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  {provider.description}
                </p>
                <Button
                  type="button"
                  variant={isConnected ? 'outline' : 'default'}
                  size="sm"
                  onClick={() => handleConnect(provider.id)}
                  className="w-full"
                >
                  {isConnected ? 'Reconfigure' : 'Connect'}
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Connected Integrations List */}
      {integrations && integrations.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold mb-4">Connected Integrations</h2>
          <div className="space-y-2">
            {integrations.map((integration: any) => (
              <Card key={integration.id} className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">
                      {providers.find((p) => p.id === integration.provider)?.icon}
                    </span>
                    <div>
                      <p className="font-medium capitalize">{integration.provider}</p>
                      <p className="text-xs text-muted-foreground">
                        {integration.enabled ? 'Active' : 'Disabled'}
                      </p>
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      // Toggle integration
                    }}
                  >
                    {integration.enabled ? 'Disable' : 'Enable'}
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Add Integration Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Connect {selectedProvider && providers.find((p) => p.id === selectedProvider)?.name}
            </DialogTitle>
            <DialogDescription>
              Enter your API credentials to connect
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>API Key / Token</Label>
              <Input
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="Enter API key"
              />
            </div>
            <div>
              <Label>Workspace / Project ID</Label>
              <Input
                value={workspace}
                onChange={(e) => setWorkspace(e.target.value)}
                placeholder="Enter workspace ID (optional)"
              />
            </div>
            <div className="flex gap-2">
              <Button
                type="button"
                onClick={handleSubmit}
                disabled={!apiKey || createMutation.isPending}
                className="flex-1"
              >
                {createMutation.isPending ? 'Connecting...' : 'Connect'}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsModalOpen(false)}
              >
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
