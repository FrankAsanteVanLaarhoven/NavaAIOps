'use client';

import { useState, useEffect } from 'react';
import { CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Sparkles, MessageSquare, FileText } from 'lucide-react';
import { useView } from '@/app/state/view-context';

export function AICommandPalette() {
  const [open, setOpen] = useState(false);
  const { viewState, navigateToMainChat } = useView();

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };

    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, []);

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="Search channels, threads, or ask AI..." />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
        <CommandGroup heading="AI Actions">
          <CommandItem
            onSelect={() => {
              setOpen(false);
              // TODO: Trigger compose assistant globally
            }}
          >
            <Sparkles className="mr-2 h-4 w-4" />
            <span>AI Compose Assistant</span>
            <kbd className="ml-auto pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">
              <span className="text-xs">⌘</span>J
            </kbd>
          </CommandItem>
          <CommandItem
            onSelect={() => {
              if (viewState.threadId) {
                setOpen(false);
                // TODO: Trigger thread summarizer
              }
            }}
            disabled={!viewState.threadId}
          >
            <FileText className="mr-2 h-4 w-4" />
            <span>Summarize Thread</span>
          </CommandItem>
        </CommandGroup>
        <CommandGroup heading="Navigation">
          <CommandItem
            onSelect={() => {
              navigateToMainChat();
              setOpen(false);
            }}
          >
            <MessageSquare className="mr-2 h-4 w-4" />
            <span>Go to Main Chat</span>
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
