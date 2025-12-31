'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useTheme } from '@/hooks/use-theme';
import { LayoutDashboard, Settings, Zap, Github, Link2 } from 'lucide-react';

interface CommandCenterProps {
  onConnectIntegration?: (id: string) => void;
  onCreateAutomation?: () => void;
  onEditAutomation?: () => void;
}

export function CommandCenter({ onConnectIntegration, onCreateAutomation, onEditAutomation }: CommandCenterProps) {
  const { theme } = useTheme();
  const [activeTool, setActiveTool] = useState<'jira' | 'linear' | 'github' | 'automate'>('automate');

  return (
    <div className="p-4 h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <h3 className={cn("font-bold text-lg", {
          "text-slate-900": theme === 'light',
          "text-slate-100": theme === 'dark-plus'
        })}>
          Command Center
        </h3>
        <div className="flex gap-2">
          <Link href="/integrations">
            <Button 
              size="sm" 
              variant="outline"
              title="Integration Guide"
              type="button"
            >
              <Link2 className="w-4 h-4" />
            </Button>
          </Link>
          <Button 
            size="sm" 
            variant="outline"
            onClick={() => {
              console.log('Opening dashboard...');
              alert('Opening dashboard view...');
            }}
            title="Dashboard View"
            type="button"
          >
            <LayoutDashboard className="w-4 h-4" />
          </Button>
          <Button 
            size="sm" 
            variant="outline"
            onClick={() => {
              console.log('Opening settings...');
              alert('Opening settings...');
            }}
            title="Settings"
            type="button"
          >
            <Settings className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <Tabs defaultValue="automate">
        <TabsList className="grid grid-cols-4 w-full h-auto">
          <TabsTrigger value="jira" className="flex flex-col items-center justify-center gap-1 p-2 text-xs">
            <span className="font-medium text-xs truncate w-full text-center">Jira</span>
          </TabsTrigger>
          
          <TabsTrigger value="linear" className="flex flex-col items-center justify-center gap-1 p-2 text-xs">
            <span className="font-medium text-xs truncate w-full text-center">Linear</span>
          </TabsTrigger>

          <TabsTrigger value="github" className="flex flex-col items-center justify-center gap-1 p-2 text-xs">
            <Github className="w-4 h-4 flex-shrink-0" />
            <span className="font-medium text-xs truncate w-full text-center">GitHub</span>
          </TabsTrigger>

          <TabsTrigger value="automate" className="flex flex-col items-center justify-center gap-1 p-2 text-xs">
            <Zap className="w-4 h-4 flex-shrink-0" />
            <span className="font-medium text-xs truncate w-full text-center">Automate</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="jira">
          <div className={cn("p-6 border border-slate-200 bg-slate-50/50 rounded-xl", {
            "bg-slate-800/50 border-slate-700": theme === 'dark-plus'
          })}>
            <h4 className={cn("font-bold text-lg mb-4", {
              "text-slate-900": theme === 'light',
              "text-slate-200": theme === 'dark-plus'
            })}>
              Jira Integration
            </h4>
            <p className={cn("text-sm mb-6", {
              "text-slate-600": theme === 'light',
              "text-slate-300": theme === 'dark-plus'
            })}>
              Connect to Jira to auto-create tickets from NavaFlow incidents.
            </p>
            <div className="flex items-center gap-4">
              <Button 
                className={cn("w-full bg-indigo-600 hover:bg-indigo-700", theme === 'dark-plus' && "text-white")}
                onClick={() => onConnectIntegration?.('jira')}
              >
                Connect
              </Button>
              <Button 
                variant="outline" 
                className="w-full"
                onClick={() => {
                  console.log('Configuring Jira...');
                  alert('Opening Jira configuration...');
                }}
              >
                Configure
              </Button>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="linear">
          <div className={cn("p-6 border border-slate-200 bg-slate-50/50 rounded-xl", {
            "bg-slate-800/50 border-slate-700": theme === 'dark-plus'
          })}>
            <h4 className={cn("font-bold text-lg mb-4", {
              "text-slate-900": theme === 'light',
              "text-slate-200": theme === 'dark-plus'
            })}>
              Linear Integration
            </h4>
            <p className={cn("text-sm mb-6", {
              "text-slate-600": theme === 'light',
              "text-slate-300": theme === 'dark-plus'
            })}>
              Sync Linear issues to NavaFlow incidents.
            </p>
            <Button 
              className={cn("w-full bg-indigo-600 hover:bg-indigo-700", theme === 'dark-plus' && "text-white")}
              onClick={() => onConnectIntegration?.('linear')}
            >
              Sync Now
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="github">
          <div className={cn("p-6 border border-slate-200 bg-slate-50/50 rounded-xl", {
            "bg-slate-800/50 border-slate-700": theme === 'dark-plus'
          })}>
            <h4 className={cn("font-bold text-lg mb-4", {
              "text-slate-900": theme === 'light',
              "text-slate-200": theme === 'dark-plus'
            })}>
              GitHub Integration
            </h4>
            <p className={cn("text-sm mb-6", {
              "text-slate-600": theme === 'light',
              "text-slate-300": theme === 'dark-plus'
            })}>
              Trigger workflows on GitHub commits.
            </p>
            <Button 
              className={cn("w-full bg-indigo-600 hover:bg-indigo-700", theme === 'dark-plus' && "text-white")}
              onClick={() => onConnectIntegration?.('github')}
            >
              Link Repo
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="automate">
          <div className={cn("p-6 border border-slate-200 bg-slate-50/50 rounded-xl", {
            "bg-slate-800/50 border-slate-700": theme === 'dark-plus'
          })}>
            <h4 className={cn("font-bold text-lg mb-4", {
              "text-slate-900": theme === 'light',
              "text-slate-200": theme === 'dark-plus'
            })}>
              Automation Hub
            </h4>
            <p className={cn("text-sm mb-6", {
              "text-slate-600": theme === 'light',
              "text-slate-300": theme === 'dark-plus'
            })}>
              Design workflows to automate repetitive tasks.
            </p>
            <div className="grid grid-cols-2 gap-4 mt-4">
              <button
                type="button"
                onClick={() => onCreateAutomation?.()}
                className={cn("p-4 border border-slate-200 bg-slate-50 rounded-lg flex flex-col items-center justify-center hover:border-indigo-500 transition-all cursor-pointer", {
                  "bg-slate-800 border-slate-700": theme === 'dark-plus'
                })}
              >
                <Zap className={cn("w-10 h-10", {
                  "text-slate-900": theme === 'light',
                  "text-slate-100": theme === 'dark-plus'
                })} />
                <span className="text-sm font-bold mt-2">Create</span>
              </button>
              <button
                type="button"
                onClick={() => onEditAutomation?.()}
                className={cn("p-4 border border-slate-200 bg-slate-50 rounded-lg flex flex-col items-center justify-center hover:border-indigo-500 transition-all cursor-pointer", {
                  "bg-slate-800 border-slate-700": theme === 'dark-plus'
                })}
              >
                <LayoutDashboard className={cn("w-10 h-10", {
                  "text-slate-900": theme === 'light',
                  "text-slate-100": theme === 'dark-plus'
                })} />
                <span className="text-sm font-bold mt-2">Edit</span>
              </button>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
