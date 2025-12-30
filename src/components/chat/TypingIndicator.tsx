'use client';

import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';

interface TypingIndicatorProps {
  users: Array<{ userId: string; userName: string }>;
  className?: string;
}

export function TypingIndicator({ users, className }: TypingIndicatorProps) {
  if (users.length === 0) return null;

  return (
    <div className={cn('flex items-center gap-2 px-4 py-2 text-sm text-muted-foreground', className)}>
      <div className="flex -space-x-2">
        {users.slice(0, 3).map((user) => (
          <Avatar key={user.userId} className="h-6 w-6 border-2 border-background">
            <AvatarFallback className="text-xs">
              {user.userName[0]?.toUpperCase() || '?'}
            </AvatarFallback>
          </Avatar>
        ))}
      </div>
      <span className="flex items-center gap-1">
        {users.length === 1 ? (
          <>
            <span className="font-medium">{users[0].userName}</span>
            <span>is typing</span>
          </>
        ) : users.length === 2 ? (
          <>
            <span className="font-medium">{users[0].userName}</span>
            <span>and</span>
            <span className="font-medium">{users[1].userName}</span>
            <span>are typing</span>
          </>
        ) : (
          <>
            <span className="font-medium">{users[0].userName}</span>
            <span>and {users.length - 1} others are typing</span>
          </>
        )}
        <span className="flex gap-1 ml-1">
          <span className="animate-bounce" style={{ animationDelay: '0ms' }}>.</span>
          <span className="animate-bounce" style={{ animationDelay: '150ms' }}>.</span>
          <span className="animate-bounce" style={{ animationDelay: '300ms' }}>.</span>
        </span>
      </span>
    </div>
  );
}
