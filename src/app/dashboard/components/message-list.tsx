'use client';

import { cn } from '@/lib/utils';
import { useTheme } from '@/hooks/use-theme';

export function MessageList() {
  const { theme } = useTheme();

  return (
    <div className="flex-1 overflow-y-auto p-4">
      <div className={cn("space-y-4", {
        "text-slate-900": theme === 'light',
        "text-slate-100": theme === 'dark-plus'
      })}>
        <div className="p-4 rounded-lg bg-slate-100">
          <p className="text-sm">No messages yet. Start a conversation!</p>
        </div>
      </div>
    </div>
  );
}
