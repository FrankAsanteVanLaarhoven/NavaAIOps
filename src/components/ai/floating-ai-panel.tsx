'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Sparkles, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FloatingAIPanelProps {
  title: string;
  children: React.ReactNode;
  trigger: React.ReactNode;
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
  className?: string;
}

export function FloatingAIPanel({
  title,
  children,
  trigger,
  position = 'bottom-right',
  className,
}: FloatingAIPanelProps) {
  const [isOpen, setIsOpen] = useState(false);

  const positionClasses = {
    'top-right': 'top-4 right-4',
    'top-left': 'top-4 left-4',
    'bottom-right': 'bottom-4 right-4',
    'bottom-left': 'bottom-4 left-4',
  };

  return (
    <div className={cn('fixed z-50', positionClasses[position], className)}>
      {!isOpen ? (
        <div onClick={() => setIsOpen(true)}>{trigger}</div>
      ) : (
        <Card className="w-96 shadow-2xl border-2 border-violet-500/20">
          <div className="p-4 border-b flex items-center justify-between bg-gradient-to-r from-violet-500/10 to-fuchsia-500/10">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-violet-500" />
              <h3 className="font-semibold">{title}</h3>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsOpen(false)}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
          <div className="p-4 max-h-[600px] overflow-y-auto">
            {children}
          </div>
        </Card>
      )}
    </div>
  );
}
