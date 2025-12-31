'use client';

import { useState, useEffect } from 'react';
import { Bell, X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTheme } from '@/hooks/use-theme';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';

interface Notification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export function NotificationsCenter() {
  const { theme } = useTheme();
  const [notifications, setNotifications] = useState<Notification[]>([
    {
      id: '1',
      type: 'success',
      title: 'Incident Resolved',
      message: 'Database latency spike has been resolved automatically',
      timestamp: new Date(),
      read: false,
      action: {
        label: 'View Details',
        onClick: () => console.log('View details'),
      },
    },
    {
      id: '2',
      type: 'warning',
      title: 'High Error Rate',
      message: 'Application errors increased by 45% in the last 5 minutes',
      timestamp: new Date(Date.now() - 300000),
      read: false,
    },
    {
      id: '3',
      type: 'info',
      title: 'Integration Connected',
      message: 'GitHub integration has been successfully connected',
      timestamp: new Date(Date.now() - 600000),
      read: true,
    },
  ]);
  const [open, setOpen] = useState(false);

  const unreadCount = notifications.filter(n => !n.read).length;

  const markAsRead = (id: string) => {
    setNotifications(prev => prev.map(n => 
      n.id === id ? { ...n, read: true } : n
    ));
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const deleteNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const getIcon = (type: Notification['type']) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'error':
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      case 'warning':
        return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
      case 'info':
        return <Info className="w-4 h-4 text-blue-500" />;
    }
  };

  const formatTime = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className={cn("relative", {
            "hover:bg-slate-100": theme === 'light',
            "hover:bg-slate-800": theme === 'dark-plus'
          })}
        >
          <Bell className="w-5 h-5" />
          {unreadCount > 0 && (
            <Badge 
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 bg-red-500 text-white text-xs"
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent 
        className={cn("w-96 p-0", {
          "bg-white": theme === 'light',
          "bg-[#141416] border-slate-700": theme === 'dark-plus'
        })}
        align="end"
      >
        <div className={cn("flex items-center justify-between p-4 border-b", {
          "border-slate-200": theme === 'light',
          "border-slate-700": theme === 'dark-plus'
        })}>
          <h3 className={cn("font-bold text-lg", {
            "text-slate-900": theme === 'light',
            "text-slate-100": theme === 'dark-plus'
          })}>
            Notifications
          </h3>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={markAllAsRead}
              className="text-xs"
            >
              Mark all read
            </Button>
          )}
        </div>
        <ScrollArea className="h-[400px]">
          {notifications.length === 0 ? (
            <div className="p-8 text-center">
              <Bell className={cn("w-12 h-12 mx-auto mb-2", {
                "text-slate-400": theme === 'light',
                "text-slate-600": theme === 'dark-plus'
              })} />
              <p className={cn("text-sm", {
                "text-slate-500": theme === 'light',
                "text-slate-400": theme === 'dark-plus'
              })}>
                No notifications
              </p>
            </div>
          ) : (
            <div className="divide-y">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={cn("p-4 hover:bg-slate-50 transition-colors cursor-pointer relative group", {
                    "bg-slate-50/50": !notification.read && theme === 'light',
                    "bg-slate-800/30": !notification.read && theme === 'dark-plus',
                    "hover:bg-slate-100": theme === 'light',
                    "hover:bg-slate-800": theme === 'dark-plus'
                  })}
                  onClick={() => markAsRead(notification.id)}
                >
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 mt-0.5">
                      {getIcon(notification.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <h4 className={cn("font-semibold text-sm mb-1", {
                          "text-slate-900": theme === 'light',
                          "text-slate-100": theme === 'dark-plus'
                        })}>
                          {notification.title}
                        </h4>
                        {!notification.read && (
                          <div className="w-2 h-2 rounded-full bg-indigo-500 flex-shrink-0 mt-1.5" />
                        )}
                      </div>
                      <p className={cn("text-sm mb-2", {
                        "text-slate-600": theme === 'light',
                        "text-slate-300": theme === 'dark-plus'
                      })}>
                        {notification.message}
                      </p>
                      <div className="flex items-center justify-between">
                        <span className={cn("text-xs", {
                          "text-slate-500": theme === 'light',
                          "text-slate-400": theme === 'dark-plus'
                        })}>
                          {formatTime(notification.timestamp)}
                        </span>
                        {notification.action && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-xs h-6"
                            onClick={(e) => {
                              e.stopPropagation();
                              notification.action?.onClick();
                            }}
                          >
                            {notification.action.label}
                          </Button>
                        )}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteNotification(notification.id);
                      }}
                      className={cn("opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-slate-200", {
                        "hover:bg-slate-700": theme === 'dark-plus'
                      })}
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
