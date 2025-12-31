'use client';

import { useState } from 'react';
import { AlertTriangle, MessageSquare, CheckCircle, Clock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useTheme } from '@/hooks/use-theme';
import { IncidentContextMenu } from './context-menu';

interface IncidentThreadListProps {
  onSelect: (id: string) => void;
}

export function IncidentThreadList({ onSelect }: IncidentThreadListProps) {
  const { theme } = useTheme();
  
  const [threads] = useState([
    { id: '1', title: 'Database Spike', severity: 'critical', status: 'active', timestamp: 'Just now' },
    { id: '2', title: 'Latency Drift', severity: 'warning', status: 'active', timestamp: '2 mins ago' },
    { id: '3', title: 'Memory Leak', severity: 'minor', status: 'resolved', timestamp: '1 hour ago' },
    { id: '4', title: 'DDoS Attack', severity: 'critical', status: 'monitoring', timestamp: '10 mins ago' },
  ]);

  return (
    <div className="flex flex-col gap-4">
      <h3 className={cn("font-bold text-lg mb-2", {
        "text-slate-900": theme === 'light',
        "text-slate-100": theme === 'dark-plus'
      })}>
        Incidents ASDF
      </h3>
      
      <div className="flex flex-col gap-3">
        {threads.map((thread) => (
          <IncidentContextMenu
            key={thread.id}
            incidentId={thread.id}
            onAction={(action) => console.log('Action:', action)}
          >
            <Card 
              className={cn("border-slate-200 hover:border-indigo-500 transition-all cursor-pointer group w-full", {
                "bg-[#141416] hover:border-slate-500": theme === 'dark-plus'
              })} 
              onClick={() => onSelect(thread.id)}
            >
            <CardHeader className="p-4 pb-3">
              <div className="flex items-start justify-between gap-2 w-full">
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <div className={cn("p-1.5 rounded-full flex-shrink-0", {
                    "bg-slate-100": theme === 'light',
                    "bg-slate-800": theme === 'dark-plus'
                  })}>
                    {thread.severity === 'critical' && <AlertTriangle className="w-4 h-4 text-red-500" />}
                    {thread.severity === 'warning' && <CheckCircle className="w-4 h-4 text-yellow-500" />}
                    {thread.severity === 'minor' && <CheckCircle className="w-4 h-4 text-blue-500" />}
                    {thread.severity === 'resolved' && <Clock className="w-4 h-4 text-slate-500" />}
                  </div>
                  <CardTitle className="text-sm font-medium truncate">{thread.title}</CardTitle>
                </div>
                <Badge 
                  variant={thread.status === 'active' ? 'destructive' : thread.status === 'resolved' ? 'default' : 'secondary'}
                  className="flex-shrink-0"
                >
                  {thread.status}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <div className="flex items-center gap-2 text-xs mb-2">
                <Clock className={cn("w-3 h-3 flex-shrink-0", {
                  "text-slate-500": theme === 'light',
                  "text-slate-400": theme === 'dark-plus'
                })} />
                <span className={cn({
                  "text-slate-500": theme === 'light',
                  "text-slate-400": theme === 'dark-plus'
                })}>{thread.timestamp}</span>
              </div>
              <p className={cn("text-sm leading-relaxed break-words", {
                "text-slate-700": theme === 'light',
                "text-slate-300": theme === 'dark-plus'
              })}>
                {thread.status === 'monitoring' && "Monitoring..."}
                {thread.status === 'active' && "Investigating root cause..."}
                {thread.status === 'resolved' && "Resolved by Ironclad Bot."}
                  </p>
                </CardContent>
              </Card>
            </IncidentContextMenu>
          ))}
        </div>
      </div>
    );
  }
