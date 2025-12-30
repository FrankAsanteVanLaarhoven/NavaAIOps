'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Trophy, Zap, Target } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

interface LeaderboardProps {
  workspaceId: string;
}

async function getLeaderboard() {
  const response = await fetch('/api/xp/leaderboard?limit=10');
  if (!response.ok) throw new Error('Failed to fetch leaderboard');
  return response.json();
}

async function addXP(userId: string, xp: number, reason?: string) {
  const response = await fetch('/api/xp/add', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId, xp, reason }),
  });
  if (!response.ok) throw new Error('Failed to add XP');
  return response.json();
}

export function Leaderboard({ workspaceId }: LeaderboardProps) {
  const queryClient = useQueryClient();

  const { data: leaderboard, isLoading } = useQuery({
    queryKey: ['leaderboard', workspaceId],
    queryFn: getLeaderboard,
  });

  const addXPMutation = useMutation({
    mutationFn: ({ userId, xp }: { userId: string; xp: number }) =>
      addXP(userId, xp, 'Manual boost'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leaderboard'] });
    },
  });

  if (isLoading) {
    return <div className="p-4 text-sm text-muted-foreground">Loading leaderboard...</div>;
  }

  return (
    <div className="bg-gradient-to-br from-zinc-900/95 via-purple-900/95 p-6 rounded-xl border border-white/10">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-blue-500">
          NavaFlow Ops Leaderboard
        </h2>
      </div>

      <div className="space-y-3">
        {leaderboard?.slice(0, 10).map((user: any, index: number) => (
          <Card
            key={user.userId}
            className={`p-4 border ${
              index < 3
                ? 'bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border-yellow-500/20'
                : 'bg-card'
            }`}
          >
            <div className="flex items-center gap-4">
              <div className="text-2xl font-bold text-muted-foreground w-8">
                #{user.rank}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                    <span className="text-lg">
                      {user.name?.[0]?.toUpperCase() || '?'}
                    </span>
                  </div>
                  <div>
                    <p className="font-medium">{user.name}</p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      {user.achievements?.slice(0, 3).map((achievement: any) => (
                        <span key={achievement.id} className="flex items-center gap-1">
                          {achievement.icon}
                          <span>{achievement.name}</span>
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-yellow-400 to-orange-500">
                  {user.xp.toLocaleString()} XP
                </div>
                <div className="text-xs text-muted-foreground">
                  Level {user.level}
                  {user.streak >= 7 && (
                    <span className="text-green-500 flex items-center gap-1 ml-2">
                      🔥 {user.streak} Day Streak
                    </span>
                  )}
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {leaderboard?.some((u: any) => u.streak >= 7) && (
        <div className="mt-4 p-4 bg-gradient-to-r from-purple-500/20 to-purple-500/40 rounded-lg flex items-center justify-center border border-purple-500/30">
          <Zap className="w-5 h-5 text-white mr-2 animate-pulse" />
          <span className="text-sm font-bold text-white">
            7-Day Streak Active!
          </span>
        </div>
      )}
    </div>
  );
}
