'use client';

import { useState, useEffect } from 'react';
import { Users, Circle, Eye, Edit } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTheme } from '@/hooks/use-theme';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';

interface Collaborator {
  id: string;
  name: string;
  avatar?: string;
  status: 'viewing' | 'editing' | 'typing';
  lastSeen: Date;
}

interface CollaborationIndicatorsProps {
  resourceId: string;
  resourceType: 'thread' | 'incident' | 'dashboard';
  className?: string;
}

export function CollaborationIndicators({ 
  resourceId, 
  resourceType,
  className 
}: CollaborationIndicatorsProps) {
  const { theme } = useTheme();
  const [collaborators, setCollaborators] = useState<Collaborator[]>([
    {
      id: '1',
      name: 'John Doe',
      status: 'editing',
      lastSeen: new Date(),
    },
    {
      id: '2',
      name: 'Jane Smith',
      status: 'viewing',
      lastSeen: new Date(Date.now() - 30000),
    },
    {
      id: '3',
      name: 'Bob Wilson',
      status: 'typing',
      lastSeen: new Date(),
    },
  ]);

  const getStatusIcon = (status: Collaborator['status']) => {
    switch (status) {
      case 'editing':
        return <Edit className="w-3 h-3 text-green-500" />;
      case 'typing':
        return <Circle className="w-2 h-2 text-blue-500 animate-pulse" />;
      case 'viewing':
        return <Eye className="w-3 h-3 text-slate-500" />;
    }
  };

  const getStatusColor = (status: Collaborator['status']) => {
    switch (status) {
      case 'editing':
        return 'bg-green-500';
      case 'typing':
        return 'bg-blue-500';
      case 'viewing':
        return 'bg-slate-400';
    }
  };

  if (collaborators.length === 0) return null;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={cn("flex items-center gap-2 px-2 py-1 rounded-lg border transition-colors", {
            "bg-white border-slate-200 hover:bg-slate-50": theme === 'light',
            "bg-slate-800 border-slate-700 hover:bg-slate-700": theme === 'dark-plus'
          }, className)}
        >
          <Users className={cn("w-4 h-4", {
            "text-slate-600": theme === 'light',
            "text-slate-300": theme === 'dark-plus'
          })} />
          <span className={cn("text-xs font-medium", {
            "text-slate-700": theme === 'light',
            "text-slate-200": theme === 'dark-plus'
          })}>
            {collaborators.length}
          </span>
          <div className="flex -space-x-1">
            {collaborators.slice(0, 3).map((collab) => (
              <div
                key={collab.id}
                className={cn("w-5 h-5 rounded-full border-2 flex items-center justify-center", {
                  "bg-slate-200 border-white": theme === 'light',
                  "bg-slate-700 border-slate-800": theme === 'dark-plus'
                })}
                title={collab.name}
              >
                <span className={cn("text-xs font-bold", {
                  "text-slate-600": theme === 'light',
                  "text-slate-300": theme === 'dark-plus'
                })}>
                  {collab.name.charAt(0).toUpperCase()}
                </span>
              </div>
            ))}
            {collaborators.length > 3 && (
              <div className={cn("w-5 h-5 rounded-full border-2 flex items-center justify-center", {
                "bg-slate-200 border-white": theme === 'light',
                "bg-slate-700 border-slate-800": theme === 'dark-plus'
              })}>
                <span className={cn("text-xs font-bold", {
                  "text-slate-600": theme === 'light',
                  "text-slate-300": theme === 'dark-plus'
                })}>
                  +{collaborators.length - 3}
                </span>
              </div>
            )}
          </div>
        </button>
      </PopoverTrigger>
      <PopoverContent 
        className={cn("w-64 p-0", {
          "bg-white": theme === 'light',
          "bg-[#141416] border-slate-700": theme === 'dark-plus'
        })}
        align="end"
      >
        <div className={cn("p-3 border-b", {
          "border-slate-200": theme === 'light',
          "border-slate-700": theme === 'dark-plus'
        })}>
          <h4 className={cn("font-semibold text-sm", {
            "text-slate-900": theme === 'light',
            "text-slate-100": theme === 'dark-plus'
          })}>
            Active Collaborators
          </h4>
        </div>
        <div className="p-2 space-y-1">
          {collaborators.map((collab) => (
            <div
              key={collab.id}
              className={cn("flex items-center gap-2 p-2 rounded-lg", {
                "hover:bg-slate-50": theme === 'light',
                "hover:bg-slate-800": theme === 'dark-plus'
              })}
            >
              <div className={cn("w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0", {
                "bg-slate-200": theme === 'light',
                "bg-slate-700": theme === 'dark-plus'
              })}>
                <span className={cn("text-xs font-bold", {
                  "text-slate-600": theme === 'light',
                  "text-slate-300": theme === 'dark-plus'
                })}>
                  {collab.name.charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className={cn("text-sm font-medium truncate", {
                    "text-slate-900": theme === 'light',
                    "text-slate-100": theme === 'dark-plus'
                  })}>
                    {collab.name}
                  </p>
                  {getStatusIcon(collab.status)}
                </div>
                <p className={cn("text-xs truncate", {
                  "text-slate-500": theme === 'light',
                  "text-slate-400": theme === 'dark-plus'
                })}>
                  {collab.status === 'editing' && 'Editing...'}
                  {collab.status === 'typing' && 'Typing...'}
                  {collab.status === 'viewing' && 'Viewing'}
                </p>
              </div>
              <div className={cn("w-2 h-2 rounded-full", getStatusColor(collab.status))} />
            </div>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}
