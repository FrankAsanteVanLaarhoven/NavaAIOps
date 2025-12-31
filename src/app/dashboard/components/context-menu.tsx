'use client';

import { useState, useEffect, useRef } from 'react';
import { Copy, Edit, Trash2, Share2, Archive, MoreVertical, ExternalLink, Download } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTheme } from '@/hooks/use-theme';
import {
  ContextMenu as ContextMenuPrimitive,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from '@/components/ui/context-menu';

interface ContextMenuAction {
  label: string;
  icon?: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  variant?: 'default' | 'destructive';
}

interface ContextMenuProps {
  children: React.ReactNode;
  actions: ContextMenuAction[];
  onOpenChange?: (open: boolean) => void;
}

export function ContextMenu({ children, actions, onOpenChange }: ContextMenuProps) {
  return (
    <ContextMenuPrimitive onOpenChange={onOpenChange}>
      <ContextMenuTrigger asChild>
        {children}
      </ContextMenuTrigger>
      <ContextMenuContent>
        {actions.map((action, index) => {
          if (action.label === 'Separator') {
            return <ContextMenuSeparator key={index} />;
          }
          return (
            <ContextMenuItem
              key={index}
              onClick={action.onClick}
              disabled={action.disabled}
              variant={action.variant}
            >
              {action.icon && <span className="mr-2">{action.icon}</span>}
              {action.label}
            </ContextMenuItem>
          );
        })}
      </ContextMenuContent>
    </ContextMenuPrimitive>
  );
}

// Pre-built context menus for common use cases
export function IncidentContextMenu({ children, incidentId, onAction }: { 
  children: React.ReactNode; 
  incidentId: string;
  onAction?: (action: string) => void;
}) {
  const actions: ContextMenuAction[] = [
    {
      label: 'Copy Incident ID',
      icon: <Copy className="w-4 h-4" />,
      onClick: () => {
        navigator.clipboard.writeText(incidentId);
        onAction?.('copy');
      },
    },
    {
      label: 'Edit Incident',
      icon: <Edit className="w-4 h-4" />,
      onClick: () => {
        console.log('Editing incident:', incidentId);
        onAction?.('edit');
      },
    },
    {
      label: 'Share',
      icon: <Share2 className="w-4 h-4" />,
      onClick: () => {
        console.log('Sharing incident:', incidentId);
        onAction?.('share');
      },
    },
    {
      label: 'Export',
      icon: <Download className="w-4 h-4" />,
      onClick: () => {
        console.log('Exporting incident:', incidentId);
        onAction?.('export');
      },
    },
    {
      label: 'Open in New Tab',
      icon: <ExternalLink className="w-4 h-4" />,
      onClick: () => {
        window.open(`/incidents/${incidentId}`, '_blank');
        onAction?.('open-new-tab');
      },
    },
    {
      label: 'Separator',
      onClick: () => {},
    },
    {
      label: 'Archive',
      icon: <Archive className="w-4 h-4" />,
      onClick: () => {
        console.log('Archiving incident:', incidentId);
        onAction?.('archive');
      },
    },
    {
      label: 'Delete',
      icon: <Trash2 className="w-4 h-4" />,
      onClick: () => {
        if (confirm('Are you sure you want to delete this incident?')) {
          console.log('Deleting incident:', incidentId);
          onAction?.('delete');
        }
      },
      variant: 'destructive',
    },
  ];

  return <ContextMenu children={children} actions={actions} />;
}

export function ThreadContextMenu({ children, threadId, onAction }: { 
  children: React.ReactNode; 
  threadId: string;
  onAction?: (action: string) => void;
}) {
  const actions: ContextMenuAction[] = [
    {
      label: 'Copy Thread ID',
      icon: <Copy className="w-4 h-4" />,
      onClick: () => {
        navigator.clipboard.writeText(threadId);
        onAction?.('copy');
      },
    },
    {
      label: 'Edit Thread',
      icon: <Edit className="w-4 h-4" />,
      onClick: () => {
        console.log('Editing thread:', threadId);
        onAction?.('edit');
      },
    },
    {
      label: 'Share',
      icon: <Share2 className="w-4 h-4" />,
      onClick: () => {
        console.log('Sharing thread:', threadId);
        onAction?.('share');
      },
    },
    {
      label: 'Export',
      icon: <Download className="w-4 h-4" />,
      onClick: () => {
        console.log('Exporting thread:', threadId);
        onAction?.('export');
      },
    },
    {
      label: 'Archive',
      icon: <Archive className="w-4 h-4" />,
      onClick: () => {
        console.log('Archiving thread:', threadId);
        onAction?.('archive');
      },
    },
  ];

  return <ContextMenu children={children} actions={actions} />;
}
