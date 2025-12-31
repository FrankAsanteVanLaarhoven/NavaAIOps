'use client';

import { useState, useEffect, useMemo } from 'react';
import { Activity, Filter, Clock, User, Zap, AlertTriangle, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTheme } from '@/hooks/use-theme';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface ActivityItem {
  id: string;
  type: 'incident' | 'automation' | 'integration' | 'system' | 'user';
  action: string;
  user?: string;
  timestamp: number; // Store as timestamp number instead of Date
  details?: string;
}

// Use fixed timestamps relative to a base time to avoid hydration mismatches
const BASE_TIME = typeof window !== 'undefined' ? Date.now() : 0;
const ACTIVITIES: ActivityItem[] = [
  {
    id: '1',
    type: 'incident',
    action: 'Resolved Database Latency Spike',
    user: 'Ironclad Bot',
    timestamp: BASE_TIME,
    details: 'Automatically resolved P99 latency issue',
  },
  {
    id: '2',
    type: 'automation',
    action: 'Created automation workflow',
    user: 'System',
    timestamp: BASE_TIME - 120000,
    details: 'GitHub → Incident automation',
  },
  {
    id: '3',
    type: 'integration',
    action: 'Connected GitHub integration',
    user: 'System',
    timestamp: BASE_TIME - 300000,
  },
  {
    id: '4',
    type: 'system',
    action: 'System health check completed',
    timestamp: BASE_TIME - 600000,
    details: 'All systems operational',
  },
  {
    id: '5',
    type: 'user',
    action: 'Created new incident',
    user: 'John Doe',
    timestamp: BASE_TIME - 900000,
    details: 'DDoS Attack incident',
  },
];

export function ActivityFeed() {
  const { theme } = useTheme();
  const [filter, setFilter] = useState<string>('all');
  const [mounted, setMounted] = useState(false);
  const [currentTime, setCurrentTime] = useState<number>(() => 
    typeof window !== 'undefined' ? Date.now() : 0
  );

  // Initialize activities with client-side timestamp offset
  const activities = useMemo<ActivityItem[]>(() => {
    if (!mounted) return ACTIVITIES;
    const offset = currentTime - (BASE_TIME || currentTime);
    return ACTIVITIES.map(activity => ({
      ...activity,
      timestamp: activity.timestamp + offset,
    }));
  }, [mounted, currentTime]);

  useEffect(() => {
    setMounted(true);
    setCurrentTime(Date.now());
    
    // Update time every minute
    const interval = setInterval(() => {
      setCurrentTime(Date.now());
    }, 60000);
    
    return () => clearInterval(interval);
  }, []);

  const filteredActivities = filter === 'all' 
    ? activities 
    : activities.filter(a => a.type === filter);

  const getIcon = (type: ActivityItem['type']) => {
    switch (type) {
      case 'incident':
        return <AlertTriangle className="w-4 h-4 text-red-500" />;
      case 'automation':
        return <Zap className="w-4 h-4 text-yellow-500" />;
      case 'integration':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'system':
        return <Activity className="w-4 h-4 text-blue-500" />;
      case 'user':
        return <User className="w-4 h-4 text-indigo-500" />;
    }
  };

  const formatTime = (timestamp: number) => {
    if (!mounted) return '—'; // Placeholder during SSR
    const now = currentTime;
    const diff = now - timestamp;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return new Date(timestamp).toLocaleDateString();
  };

  return (
    <div className={cn("p-4 rounded-lg border", {
      "bg-white border-slate-200": theme === 'light',
      "bg-[#141416] border-slate-700": theme === 'dark-plus'
    })}>
      <div className="flex items-center justify-between mb-4">
        <h3 className={cn("font-bold text-lg flex items-center gap-2", {
          "text-slate-900": theme === 'light',
          "text-slate-100": theme === 'dark-plus'
        })}>
          <Activity className="w-5 h-5 text-indigo-500" />
          Activity Feed
        </h3>
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-32 h-8">
            <Filter className="w-3 h-3 mr-2" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="incident">Incidents</SelectItem>
            <SelectItem value="automation">Automations</SelectItem>
            <SelectItem value="integration">Integrations</SelectItem>
            <SelectItem value="system">System</SelectItem>
            <SelectItem value="user">User</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <ScrollArea className="h-[300px]">
        <div className="space-y-3">
          {filteredActivities.map((activity) => (
            <div
              key={activity.id}
              className={cn("flex items-start gap-3 p-3 rounded-lg border transition-colors", {
                "bg-slate-50 border-slate-200 hover:bg-slate-100": theme === 'light',
                "bg-slate-800/30 border-slate-700 hover:bg-slate-800": theme === 'dark-plus'
              })}
            >
              <div className="flex-shrink-0 mt-0.5">
                {getIcon(activity.type)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <p className={cn("text-sm font-medium", {
                    "text-slate-900": theme === 'light',
                    "text-slate-100": theme === 'dark-plus'
                  })}>
                    {activity.action}
                  </p>
                  {activity.user && (
                    <span className={cn("text-xs", {
                      "text-slate-500": theme === 'light',
                      "text-slate-400": theme === 'dark-plus'
                    })}>
                      by {activity.user}
                    </span>
                  )}
                </div>
                {activity.details && (
                  <p className={cn("text-xs mb-1", {
                    "text-slate-600": theme === 'light',
                    "text-slate-300": theme === 'dark-plus'
                  })}>
                    {activity.details}
                  </p>
                )}
                <div className="flex items-center gap-1 text-xs">
                  <Clock className={cn("w-3 h-3", {
                    "text-slate-400": theme === 'light',
                    "text-slate-500": theme === 'dark-plus'
                  })} />
                  <span className={cn({
                    "text-slate-500": theme === 'light',
                    "text-slate-400": theme === 'dark-plus'
                  })}>
                    {formatTime(activity.timestamp)}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}
