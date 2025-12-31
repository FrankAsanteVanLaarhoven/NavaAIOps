'use client';

import { useState, useEffect } from 'react';
import { Keyboard, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTheme } from '@/hooks/use-theme';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface Shortcut {
  keys: string[];
  description: string;
  category: string;
}

const SHORTCUTS: Shortcut[] = [
  // Navigation
  { keys: ['⌘', 'K'], description: 'Open command palette', category: 'Navigation' },
  { keys: ['⌘', 'Shift', 'F'], description: 'Global search', category: 'Navigation' },
  { keys: ['⌘', 'B'], description: 'Toggle left sidebar', category: 'Navigation' },
  { keys: ['⌘', 'Shift', 'B'], description: 'Toggle right sidebar', category: 'Navigation' },
  { keys: ['?'], description: 'Show keyboard shortcuts', category: 'Navigation' },
  
  // Actions
  { keys: ['⌘', 'N'], description: 'New thread', category: 'Actions' },
  { keys: ['⌘', 'I'], description: 'New incident', category: 'Actions' },
  { keys: ['⌘', 'Enter'], description: 'Send message', category: 'Actions' },
  { keys: ['⌘', 'S'], description: 'Save', category: 'Actions' },
  { keys: ['Esc'], description: 'Close dialog', category: 'Actions' },
  
  // View
  { keys: ['⌘', 'T'], description: 'Toggle theme', category: 'View' },
  { keys: ['⌘', 'H'], description: 'Toggle holographic mode', category: 'View' },
  { keys: ['⌘', '1'], description: 'Go to dashboard', category: 'View' },
  { keys: ['⌘', '2'], description: 'Go to incidents', category: 'View' },
  { keys: ['⌘', '3'], description: 'Go to analytics', category: 'View' },
  
  // AI
  { keys: ['⌘', 'J'], description: 'AI compose assistant', category: 'AI' },
  { keys: ['⌘', 'Shift', 'S'], description: 'Summarize thread', category: 'AI' },
  { keys: ['⌘', 'Shift', 'A'], description: 'Open RAG assistant', category: 'AI' },
];

export function KeyboardShortcuts() {
  const { theme } = useTheme();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === '?' && !e.metaKey && !e.ctrlKey) {
        setOpen(true);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  const groupedShortcuts = SHORTCUTS.reduce((acc, shortcut) => {
    if (!acc[shortcut.category]) {
      acc[shortcut.category] = [];
    }
    acc[shortcut.category].push(shortcut);
    return acc;
  }, {} as Record<string, Shortcut[]>);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className={cn("max-w-2xl", {
        "bg-white": theme === 'light',
        "bg-[#141416] border-slate-700": theme === 'dark-plus'
      })}>
        <DialogHeader>
          <DialogTitle className={cn("flex items-center gap-2", {
            "text-slate-900": theme === 'light',
            "text-slate-100": theme === 'dark-plus'
          })}>
            <Keyboard className="w-5 h-5" />
            Keyboard Shortcuts
          </DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-h-[60vh] overflow-y-auto">
          {Object.entries(groupedShortcuts).map(([category, shortcuts]) => (
            <div key={category}>
              <h3 className={cn("font-semibold text-sm mb-3", {
                "text-slate-700": theme === 'light',
                "text-slate-300": theme === 'dark-plus'
              })}>
                {category}
              </h3>
              <div className="space-y-2">
                {shortcuts.map((shortcut, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between py-2"
                  >
                    <span className={cn("text-sm", {
                      "text-slate-600": theme === 'light',
                      "text-slate-400": theme === 'dark-plus'
                    })}>
                      {shortcut.description}
                    </span>
                    <div className="flex items-center gap-1">
                      {shortcut.keys.map((key, keyIndex) => (
                        <kbd
                          key={keyIndex}
                          className={cn(
                            "px-2 py-1 rounded text-xs font-mono border",
                            theme === 'light'
                              ? "bg-slate-100 border-slate-300 text-slate-700"
                              : "bg-slate-800 border-slate-600 text-slate-300"
                          )}
                        >
                          {key}
                        </kbd>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
        <div className={cn("mt-4 pt-4 border-t text-xs text-center", {
          "border-slate-200 text-slate-500": theme === 'light',
          "border-slate-700 text-slate-400": theme === 'dark-plus'
        })}>
          Press <kbd className="px-1.5 py-0.5 rounded border bg-slate-100 text-xs">?</kbd> to open this dialog
        </div>
      </DialogContent>
    </Dialog>
  );
}
