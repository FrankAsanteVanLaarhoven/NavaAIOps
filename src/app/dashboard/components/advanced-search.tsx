'use client';

import { useState, useEffect } from 'react';
import { Search, Filter, X, Clock, FileText, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTheme } from '@/hooks/use-theme';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface SearchResult {
  id: string;
  type: 'thread' | 'incident' | 'message' | 'user';
  title: string;
  snippet: string;
  timestamp: Date;
}

export function AdvancedSearch() {
  const { theme } = useTheme();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [results, setResults] = useState<SearchResult[]>([]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === 'F') {
        e.preventDefault();
        setOpen(true);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleSearch = () => {
    if (!query.trim()) return;
    
    // Mock search results
    const mockResults: SearchResult[] = [
      {
        id: '1',
        type: 'incident',
        title: 'Database Latency Spike',
        snippet: 'P99 latency increased to 1200ms...',
        timestamp: new Date(),
      },
      {
        id: '2',
        type: 'thread',
        title: 'Discussion about performance',
        snippet: `Found ${query} in the codebase...`,
        timestamp: new Date(Date.now() - 3600000),
      },
    ];
    
    setResults(mockResults);
  };

  const getIcon = (type: SearchResult['type']) => {
    switch (type) {
      case 'incident':
        return <AlertTriangle className="w-4 h-4 text-red-500" />;
      case 'thread':
        return <FileText className="w-4 h-4 text-blue-500" />;
      case 'message':
        return <Search className="w-4 h-4 text-green-500" />;
      case 'user':
        return <Clock className="w-4 h-4 text-indigo-500" />;
    }
  };

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
            <Search className="w-5 h-5" />
            Advanced Search
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder="Search messages, threads, incidents..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleSearch();
                }
              }}
              className="flex-1"
            />
            <Button onClick={handleSearch}>
              <Search className="w-4 h-4" />
            </Button>
          </div>
          <div className="flex items-center gap-2">
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-32">
                <Filter className="w-3 h-3 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="thread">Threads</SelectItem>
                <SelectItem value="incident">Incidents</SelectItem>
                <SelectItem value="message">Messages</SelectItem>
                <SelectItem value="user">Users</SelectItem>
              </SelectContent>
            </Select>
            <Badge variant="secondary" className="text-xs">
              {results.length} results
            </Badge>
          </div>
          <div className="max-h-[400px] overflow-y-auto space-y-2">
            {results.length === 0 ? (
              <div className="text-center py-8">
                <Search className={cn("w-12 h-12 mx-auto mb-2", {
                  "text-slate-400": theme === 'light',
                  "text-slate-600": theme === 'dark-plus'
                })} />
                <p className={cn("text-sm", {
                  "text-slate-500": theme === 'light',
                  "text-slate-400": theme === 'dark-plus'
                })}>
                  {query ? 'No results found' : 'Start typing to search...'}
                </p>
              </div>
            ) : (
              results.map((result) => (
                <div
                  key={result.id}
                  className={cn("p-3 rounded-lg border cursor-pointer hover:bg-slate-50 transition-colors", {
                    "border-slate-200": theme === 'light',
                    "border-slate-700 hover:bg-slate-800": theme === 'dark-plus'
                  })}
                  onClick={() => {
                    console.log('Selected result:', result);
                    setOpen(false);
                  }}
                >
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 mt-0.5">
                      {getIcon(result.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className={cn("font-semibold text-sm mb-1", {
                        "text-slate-900": theme === 'light',
                        "text-slate-100": theme === 'dark-plus'
                      })}>
                        {result.title}
                      </h4>
                      <p className={cn("text-xs mb-2", {
                        "text-slate-600": theme === 'light',
                        "text-slate-300": theme === 'dark-plus'
                      })}>
                        {result.snippet}
                      </p>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">
                          {result.type}
                        </Badge>
                        <span className={cn("text-xs", {
                          "text-slate-500": theme === 'light',
                          "text-slate-400": theme === 'dark-plus'
                        })}>
                          {result.timestamp.toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
