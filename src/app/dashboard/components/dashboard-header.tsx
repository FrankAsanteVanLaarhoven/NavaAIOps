'use client';

import { Search } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTheme } from '@/hooks/use-theme';
import { SystemHealthChecker } from './system-health-checker';
import { NotificationsCenter } from './notifications-center';
import { AdvancedSearch } from './advanced-search';
import { NavaLogo } from '@/components/branding/nava-logo';

export function DashboardHeader() {
  const { theme } = useTheme();

  return (
    <div className={cn("h-14 border-b border-slate-200 bg-slate-50 flex items-center px-6 shadow-sm z-20 flex-shrink-0", {
      "bg-[#141416] border-slate-700": theme === 'dark-plus'
    })}>
      <div className="flex-shrink-0 w-48 flex items-center">
        <div className="flex items-center gap-2 font-bold text-lg tracking-tight">
          <NavaLogo 
            size="sm" 
            gradient={false} 
            theme={theme === 'dark-plus' ? 'dark' : 'light'}
            className={cn({
              "text-slate-900": theme === 'light',
              "text-white": theme === 'dark-plus'
            })}
          />
          <span className={cn({
            "text-slate-600": theme === 'light',
            "text-slate-300": theme === 'dark-plus'
          })}>
            FLOW
          </span>
        </div>
      </div>

      <div className="flex-1 max-w-2xl mx-4 relative">
        <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
          <Search className={cn("w-4 h-4", {
            "text-slate-400": theme === 'light',
            "text-slate-500": theme === 'dark-plus'
          })} />
        </div>
        <input 
          type="text" 
          placeholder="Search messages, logs, threads..." 
          className={cn("w-full h-10 pl-10 pr-4 rounded-full border text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all", {
            "bg-white border-slate-300 text-slate-900": theme === 'light',
            "bg-slate-800 border-slate-700 text-slate-100": theme === 'dark-plus'
          })}
        />
      </div>

      <div className="flex-shrink-0 flex items-center gap-3">
        <AdvancedSearch />
        <NotificationsCenter />
        <SystemHealthChecker status="healthy" />
      </div>
    </div>
  );
}
