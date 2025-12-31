'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { useTheme } from '@/hooks/use-theme';
import { Github, AlertCircle, FileText, Zap } from 'lucide-react';

const INTEGRATIONS = [
  { id: 'jira', name: 'Jira', icon: AlertCircle, connected: false, description: 'Ticket Management' },
  { id: 'linear', name: 'Linear', icon: FileText, connected: false, description: 'Issue Tracking' },
  { id: 'github', name: 'GitHub', icon: Github, connected: true, description: 'Version Control' },
  { id: 'sentry', name: 'Sentry', icon: AlertCircle, connected: true, description: 'Error Logging' },
];

interface IntegrationHubSimpleProps {
  onConnect?: (id: string) => void;
}

export function IntegrationHubSimple({ onConnect }: IntegrationHubSimpleProps) {
  const { theme } = useTheme();
  const [integrations, setIntegrations] = useState(INTEGRATIONS);

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className={cn("font-bold text-sm", {
          "text-slate-900": theme === 'light',
          "text-slate-100": theme === 'dark-plus'
        })}>
          Connect Tools
        </h3>
        <Button 
          size="sm" 
          className="bg-indigo-600 hover:bg-indigo-700 text-white"
          onClick={() => {
            console.log('Opening automation hub...');
            alert('Opening Automation Hub...');
          }}
        >
          Automate
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-2">
        {integrations.map((tool) => (
          <Card 
            key={tool.id} 
            className={cn("border-slate-200 hover:border-indigo-500 transition-all cursor-pointer min-w-0", {
              "bg-[#141416] border-slate-700": theme === 'dark-plus'
            })}
          >
            <CardHeader className="p-3 pb-2">
              <div className="flex items-center justify-between gap-2">
                <tool.icon className={cn("w-5 h-5 flex-shrink-0", {
                  "text-slate-900": theme === 'light',
                  "text-slate-100": theme === 'dark-plus'
                })} />
                {tool.connected && (
                  <span className={cn("text-xs font-bold px-1.5 py-0.5 rounded-full flex-shrink-0", {
                    "text-green-600 bg-green-100": theme === 'light',
                    "text-green-400 bg-green-900/30": theme === 'dark-plus'
                  })}>
                    ACTIVE
                  </span>
                )}
              </div>
            </CardHeader>
            <CardContent className="p-3 pt-0 space-y-2">
              <CardTitle className="text-xs font-semibold truncate">{tool.name}</CardTitle>
              <p className={cn("text-xs line-clamp-2", {
                "text-slate-500": theme === 'light',
                "text-slate-400": theme === 'dark-plus'
              })}>
                {tool.description}
              </p>
              <Button 
                size="sm" 
                className={cn("w-full text-xs h-7", {
                  "bg-slate-200 text-slate-600 hover:bg-slate-300": tool.connected && theme === 'light',
                  "bg-slate-700 text-slate-300 hover:bg-slate-600": tool.connected && theme === 'dark-plus',
                  "bg-indigo-600 text-white hover:bg-indigo-700": !tool.connected
                })}
                onClick={() => {
                  if (tool.connected) {
                    console.log(`Managing ${tool.name}...`);
                    alert(`Opening ${tool.name} management...`);
                  } else {
                    onConnect?.(tool.id);
                    setIntegrations(prev => prev.map(i => 
                      i.id === tool.id ? { ...i, connected: true } : i
                    ));
                  }
                }}
              >
                {tool.connected ? 'Manage' : 'Connect'}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
