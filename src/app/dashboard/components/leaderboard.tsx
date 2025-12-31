'use client';

import { useState } from 'react';
import { Trophy, Medal, Award, ChevronDown, ChevronUp } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { useTheme } from '@/hooks/use-theme';

interface LeaderboardEntry {
  rank: number;
  name: string;
  score: number;
  status: 'gold' | 'silver' | 'bronze';
}

interface LeaderboardProps {
  limit?: number;
}

export function Leaderboard({ limit = 10 }: LeaderboardProps) {
  const { theme } = useTheme();
  const [isCollapsed, setIsCollapsed] = useState(false);
  
  const [leaders] = useState<LeaderboardEntry[]>([
    { rank: 1, name: 'Ironclad-Dev', score: 98.5, status: 'gold' },
    { rank: 2, name: 'NavaFlow-Scaper', score: 97.2, status: 'silver' },
    { rank: 3, name: 'O3-Mini', score: 96.8, status: 'bronze' },
  ]);

  return (
    <div className={cn("p-4 flex flex-col transition-all", {
      "h-full": !isCollapsed,
      "h-auto": isCollapsed
    })}>
      <button
        type="button"
        onClick={() => setIsCollapsed(!isCollapsed)}
        className={cn(
          "font-bold text-lg mb-4 flex items-center justify-between gap-2 w-full hover:opacity-80 transition-opacity",
          theme === 'light' ? "text-slate-900" : "text-slate-100"
        )}
      >
        <div className="flex items-center gap-2">
          <Trophy className="w-5 h-5 text-indigo-500 flex-shrink-0" /> 
          <span>Ironclad Leaderboard</span>
        </div>
        {isCollapsed ? (
          <ChevronDown className="w-4 h-4 flex-shrink-0" />
        ) : (
          <ChevronUp className="w-4 h-4 flex-shrink-0" />
        )}
      </button>
      
      {!isCollapsed && (
        <div className="flex flex-col gap-3">
          {leaders.slice(0, limit).map((agent, index) => {
          const heights = ['h-32', 'h-28', 'h-24'];
          const height = heights[index] || 'h-20';
          
          return (
            <div
              key={agent.name}
              className={cn(
                "relative rounded-lg border-2 transition-all cursor-pointer group",
                "flex items-end justify-center",
                height,
                theme === 'light' 
                  ? "bg-white border-slate-200 hover:border-indigo-500 shadow-sm" 
                  : "bg-[#141416] border-slate-700 hover:border-indigo-500"
              )}
            >
              {/* Rank Badge - Centered in the panel */}
              <div className={cn(
                "absolute top-3 left-1/2 -translate-x-1/2",
                "w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg",
                "border-2 shadow-md",
                theme === 'light'
                  ? "bg-white border-slate-300 text-slate-900"
                  : "bg-slate-800 border-slate-600 text-slate-100"
              )}>
                #{agent.rank}
              </div>
              
              {/* Agent Info at Bottom */}
              <div className="w-full p-3 flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <h4 className={cn(
                    "font-bold text-sm mb-1 truncate",
                    theme === 'light' ? "text-slate-900" : "text-slate-200"
                  )}>
                    {agent.name}
                  </h4>
                  <p className={cn(
                    "text-xs font-medium truncate",
                    theme === 'light' ? "text-slate-500" : "text-slate-400"
                  )}>
                    {agent.score.toFixed(1)}%
                  </p>
                </div>
                
                <div className={cn(
                  "flex-shrink-0 ml-2",
                  agent.status === 'gold' && "text-yellow-500",
                  agent.status === 'silver' && "text-slate-400",
                  agent.status === 'bronze' && "text-orange-600"
                )}>
                  {agent.status === 'gold' && <Medal className="w-5 h-5" />}
                  {agent.status === 'silver' && <Medal className="w-5 h-5 text-slate-400" />}
                  {agent.status === 'bronze' && <Award className="w-5 h-5 text-orange-600" />}
                </div>
              </div>
            </div>
          );
          })}
        </div>
      )}
    </div>
  );
}
