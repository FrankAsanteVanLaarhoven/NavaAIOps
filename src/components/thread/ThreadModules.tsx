'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Plus, X, Github, FileText, AlertTriangle, Link2 } from 'lucide-react';
import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface ThreadModulesProps {
  threadId: string;
}

async function getModules(threadId: string) {
  const response = await fetch(`/api/threads/${threadId}/modules`);
  if (!response.ok) throw new Error('Failed to fetch modules');
  return response.json();
}

async function createModule(threadId: string, module: any) {
  const response = await fetch(`/api/threads/${threadId}/modules`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(module),
  });
  if (!response.ok) throw new Error('Failed to create module');
  return response.json();
}

async function deleteModule(threadId: string, moduleId: string) {
  const response = await fetch(`/api/threads/${threadId}/modules/${moduleId}`, {
    method: 'DELETE',
  });
  if (!response.ok) throw new Error('Failed to delete module');
  return response.json();
}

const moduleIcons = {
  github: Github,
  linear: FileText,
  notion: FileText,
  incident: AlertTriangle,
  custom: Link2,
};

export function ThreadModules({ threadId }: ThreadModulesProps) {
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [moduleType, setModuleType] = useState<string>('github');
  const [moduleTitle, setModuleTitle] = useState('');
  const [moduleUrl, setModuleUrl] = useState('');

  const { data: modules, isLoading } = useQuery({
    queryKey: ['thread-modules', threadId],
    queryFn: () => getModules(threadId),
  });

  const createMutation = useMutation({
    mutationFn: (module: any) => createModule(threadId, module),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['thread-modules', threadId] });
      setIsDialogOpen(false);
      setModuleTitle('');
      setModuleUrl('');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (moduleId: string) => deleteModule(threadId, moduleId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['thread-modules', threadId] });
    },
  });

  const handleCreate = () => {
    createMutation.mutate({
      type: moduleType,
      title: moduleTitle || `New ${moduleType} module`,
      data: {
        url: moduleUrl,
        type: moduleType,
      },
    });
  };

  if (isLoading) {
    return <div className="p-4 text-sm text-muted-foreground">Loading modules...</div>;
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between px-4 py-2 border-b">
        <h3 className="text-sm font-semibold">Context Modules</h3>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm" variant="ghost">
              <Plus className="w-4 h-4" />
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Context Module</DialogTitle>
              <DialogDescription>
                Attach external resources to this thread for quick access.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Module Type</Label>
                <Select value={moduleType} onValueChange={setModuleType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="github">GitHub Repository</SelectItem>
                    <SelectItem value="linear">Linear Ticket</SelectItem>
                    <SelectItem value="notion">Notion Page</SelectItem>
                    <SelectItem value="incident">Incident</SelectItem>
                    <SelectItem value="custom">Custom Link</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Title</Label>
                <Input
                  value={moduleTitle}
                  onChange={(e) => setModuleTitle(e.target.value)}
                  placeholder="Module title"
                />
              </div>
              <div>
                <Label>URL</Label>
                <Input
                  value={moduleUrl}
                  onChange={(e) => setModuleUrl(e.target.value)}
                  placeholder="https://..."
                  type="url"
                />
              </div>
              <Button onClick={handleCreate} className="w-full">
                Add Module
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-2 px-2">
        {modules?.map((module: any) => {
          const Icon = moduleIcons[module.type as keyof typeof moduleIcons] || Link2;
          const moduleData = typeof module.data === 'string' ? JSON.parse(module.data) : module.data;

          return (
            <Card key={module.id} className="p-3 hover:bg-muted/50 transition-colors">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-start gap-2 flex-1 min-w-0">
                  <Icon className="w-4 h-4 mt-0.5 text-muted-foreground flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-medium truncate">{module.title}</h4>
                    {moduleData?.url && (
                      <a
                        href={moduleData.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-muted-foreground hover:text-foreground truncate block"
                      >
                        {moduleData.url}
                      </a>
                    )}
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => deleteMutation.mutate(module.id)}
                  className="flex-shrink-0"
                >
                  <X className="w-3 h-3" />
                </Button>
              </div>
            </Card>
          );
        })}

        {(!modules || modules.length === 0) && (
          <div className="text-center py-8 text-sm text-muted-foreground">
            <p>No modules attached</p>
            <p className="text-xs mt-1">Add GitHub repos, Linear tickets, or other resources</p>
          </div>
        )}
      </div>
    </div>
  );
}
