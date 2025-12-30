'use client';

import { useView } from '@/app/state/view-context';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';
import { MessageView } from './message-view';

interface ThreadOverlayProps {
  threadId: string;
}

export function ThreadOverlay({ threadId }: ThreadOverlayProps) {
  const { closeThread } = useView();

  return (
    <Sheet open={true} onOpenChange={(open) => !open && closeThread()}>
      <SheetContent side="right" className="w-full sm:w-[540px] p-0">
        <SheetHeader className="p-4 border-b">
          <div className="flex items-center justify-between">
            <SheetTitle>Thread</SheetTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={closeThread}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </SheetHeader>
        <div className="h-[calc(100vh-73px)]">
          <MessageView threadId={threadId} />
        </div>
      </SheetContent>
    </Sheet>
  );
}
