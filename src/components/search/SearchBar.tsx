'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Input } from '@/components/ui/input';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Search as SearchIcon } from 'lucide-react';
import { useView } from '@/app/state/view-context';
import { format } from 'date-fns';

async function searchMessages(query: string, options: any = {}) {
  const params = new URLSearchParams({ q: query, ...options });
  const response = await fetch(`/api/search?${params}`);
  if (!response.ok) throw new Error('Search failed');
  return response.json();
}

export function SearchBar() {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const { viewState, setThread, setChannel } = useView();

  const { data: results, isLoading } = useQuery({
    queryKey: ['search', query, viewState.channelId],
    queryFn: () =>
      searchMessages(query, {
        channelId: viewState.channelId,
        limit: 10,
      }),
    enabled: query.length > 2 && isOpen,
  });

  const handleSelect = (message: any) => {
    setChannel(message.thread.channel.id);
    setThread(message.thread.id);
    setIsOpen(false);
    setQuery('');
  };

  return (
    <Command className="rounded-lg border shadow-md">
      <div className="flex items-center border-b px-3">
        <SearchIcon className="mr-2 h-4 w-4 shrink-0 opacity-50" />
        <CommandInput
          placeholder="Search messages... (hybrid: keyword + semantic)"
          value={query}
          onValueChange={(value) => {
            setQuery(value);
            setIsOpen(value.length > 0);
          }}
          onFocus={() => setIsOpen(true)}
        />
      </div>
      {isOpen && query.length > 2 && (
        <CommandList>
          {isLoading && (
            <div className="p-4 text-sm text-muted-foreground text-center">
              Searching...
            </div>
          )}
          {!isLoading && results?.results?.length === 0 && (
            <CommandEmpty>No results found.</CommandEmpty>
          )}
          {!isLoading && results?.results?.length > 0 && (
            <CommandGroup heading="Messages">
              {results.results.map((message: any) => (
                <CommandItem
                  key={message.id}
                  onSelect={() => handleSelect(message)}
                  className="flex flex-col items-start gap-1 p-3"
                >
                  <div className="flex items-center gap-2 w-full">
                    <span className="font-medium text-sm">
                      {message.user.name || message.user.email}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      in {message.thread.channel.name}
                    </span>
                    <span className="text-xs text-muted-foreground ml-auto">
                      {format(new Date(message.createdAt), 'MMM d, h:mm a')}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {message.searchText || 'No preview available'}
                  </p>
                </CommandItem>
              ))}
            </CommandGroup>
          )}
          {results && (
            <div className="px-3 py-2 text-xs text-muted-foreground border-t">
              Found {results.total} results
              {results.keywordCount > 0 && ` (${results.keywordCount} keyword, ${results.semanticCount} semantic)`}
            </div>
          )}
        </CommandList>
      )}
    </Command>
  );
}
