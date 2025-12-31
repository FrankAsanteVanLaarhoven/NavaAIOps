'use client';

import { useState, useEffect } from 'react';
import { CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList, CommandSeparator } from '@/components/ui/command';
import { Sparkles, MessageSquare, FileText, Plus, AlertTriangle, Search, Settings, Zap, LayoutDashboard } from 'lucide-react';
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
      <CommandInput placeholder="Search commands, actions, or ask AI..." />
      <CommandList>
        <CommandEmpty>No results found. Try a different search.</CommandEmpty>
        
        <CommandGroup heading="Quick Actions">
          <CommandItem
            onSelect={() => {
              console.log('Creating new thread...');
              alert('Creating new thread...');
              setOpen(false);
            }}
          >
            <Plus className="mr-2 h-4 w-4" />
            <span>New Thread</span>
            <kbd className="ml-auto pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">
              <span className="text-xs">⌘</span>N
            </kbd>
          </CommandItem>
          <CommandItem
            onSelect={() => {
              console.log('Creating new incident...');
              alert('Creating new incident...');
              setOpen(false);
            }}
          >
            <AlertTriangle className="mr-2 h-4 w-4" />
            <span>New Incident</span>
            <kbd className="ml-auto pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">
              <span className="text-xs">⌘</span>I
            </kbd>
          </CommandItem>
          <CommandItem
            onSelect={() => {
              console.log('Opening global search...');
              // Trigger advanced search
              setOpen(false);
            }}
          >
            <Search className="mr-2 h-4 w-4" />
            <span>Global Search</span>
            <kbd className="ml-auto pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">
              <span className="text-xs">⌘</span>⇧<span className="text-xs">F</span>
            </kbd>
          </CommandItem>
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="AI Actions">
          <CommandItem
            onSelect={() => {
              console.log('Opening AI compose assistant...');
              alert('Opening AI Compose Assistant...');
              setOpen(false);
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
                console.log('Summarizing thread...');
                alert('Summarizing thread...');
                setOpen(false);
              }
            }}
            disabled={!viewState.threadId}
          >
            <FileText className="mr-2 h-4 w-4" />
            <span>Summarize Thread</span>
            <kbd className="ml-auto pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">
              <span className="text-xs">⌘</span>⇧<span className="text-xs">S</span>
            </kbd>
          </CommandItem>
          <CommandItem
            onSelect={() => {
              console.log('Opening RAG assistant...');
              alert('Opening RAG Assistant...');
              setOpen(false);
            }}
          >
            <Zap className="mr-2 h-4 w-4" />
            <span>RAG Assistant</span>
            <kbd className="ml-auto pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">
              <span className="text-xs">⌘</span>⇧<span className="text-xs">A</span>
            </kbd>
          </CommandItem>
        </CommandGroup>

        <CommandSeparator />

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
          <CommandItem
            onSelect={() => {
              console.log('Opening dashboard...');
              alert('Opening Dashboard...');
              setOpen(false);
            }}
          >
            <LayoutDashboard className="mr-2 h-4 w-4" />
            <span>Go to Dashboard</span>
            <kbd className="ml-auto pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">
              <span className="text-xs">⌘</span>1
            </kbd>
          </CommandItem>
          <CommandItem
            onSelect={() => {
              console.log('Opening settings...');
              alert('Opening Settings...');
              setOpen(false);
            }}
          >
            <Settings className="mr-2 h-4 w-4" />
            <span>Settings</span>
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
