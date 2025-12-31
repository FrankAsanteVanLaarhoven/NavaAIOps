'use client';

import { ReactNode, useEffect, useState } from 'react';
import { Search, Moon, Sun, Mic, X, ChevronLeft, ChevronRight, PanelLeftClose, PanelRightClose } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTheme } from '@/hooks/use-theme';
import { DashboardHeader } from './components/dashboard-header';
import { AnalyticsGrid } from './components/analytics-grid';
import { IncidentThreadList } from './components/incident-thread-list';
import { MessageList } from './components/message-list';
import { MessageInput } from './components/message-input';
import { CommandCenter } from './components/command-center';
import { Leaderboard } from './components/leaderboard';
import { SystemHealthChecker } from './components/system-health-checker';
import { IntegrationHubSimple } from './components/integration-hub-simple';
import { HolographicOverlay } from './components/holographic-overlay';
import { KeyboardShortcuts } from './components/keyboard-shortcuts';
import { ActivityFeed } from './components/activity-feed';
import { Breadcrumbs } from './components/breadcrumbs';
import { CollaborationIndicators } from './components/collaboration-indicators';
import { ExportMenu } from './components/export-menu';
import { MinorityReportDashboard } from './components/minority-report-dashboard';

export default function DashboardLayout() {
  const { theme, toggleTheme } = useTheme();
  const [sidebarOpen, setSidebarOpen] = useState<'tools' | 'info' | false>(false);
  const [holographicMode, setHolographicMode] = useState(false);
  const [minorityReportMode, setMinorityReportMode] = useState(false);
  const [systemStatus, setSystemStatus] = useState<'healthy' | 'degraded' | 'down'>('checking');
  const [leftSidebarCollapsed, setLeftSidebarCollapsed] = useState(false);
  const [rightSidebarCollapsed, setRightSidebarCollapsed] = useState(false);
  const [selectedThreadId, setSelectedThreadId] = useState<string | null>(null);

  useEffect(() => {
    const checkHealth = async () => {
      const isHealthy = true;
      setSystemStatus(isHealthy ? 'healthy' : 'down');
    };

    checkHealth();
    const interval = setInterval(checkHealth, 30000);

    return () => clearInterval(interval);
  }, []);

  const handleSelectThread = (threadId: string) => {
    setSelectedThreadId(threadId);
    setSidebarOpen('info');
  };

  const handleConnectIntegration = (integrationId: string) => {
    console.log('Connecting integration:', integrationId);
    // TODO: Implement actual integration connection
    alert(`Connecting ${integrationId}...`);
  };

  const handleCreateAutomation = () => {
    console.log('Creating automation...');
    alert('Opening Automation Builder...');
  };

  const handleEditAutomation = () => {
    console.log('Editing automation...');
    alert('Opening Automation Editor...');
  };

  // Show Minority Report mode if enabled
  if (minorityReportMode) {
    return <MinorityReportDashboard />;
  }

  return (
    <div className={cn("h-screen w-full flex flex-col overflow-hidden transition-colors duration-500", {
      "bg-white text-slate-900": theme === 'light',
      "bg-[#141416] text-slate-100": theme === 'dark-plus'
    })}>
      
      {/* --- ZONE 1: TOP BAR (Search, Nav, Health) --- */}
      <DashboardHeader />

      {/* --- ZONE 2: CENTER STAGE (DASHBOARD) --- */}
      <main className="flex-1 relative flex min-w-0 overflow-hidden">
        {/* LEFT SIDEBAR (TOOLS) */}
        <div className={cn("relative flex flex-col border-r border-slate-200 transition-all duration-300 overflow-hidden flex-shrink-0", {
          "w-80": !leftSidebarCollapsed,
          "w-0": leftSidebarCollapsed,
          "bg-slate-50": theme === 'light',
          "bg-[#141416] border-slate-700": theme === 'dark-plus'
        })}>
          {!leftSidebarCollapsed && (
            <div className="flex-1 flex flex-col gap-4 p-4 overflow-y-auto min-h-0">
              <div className="flex-shrink-0">
                <CommandCenter 
                  onConnectIntegration={handleConnectIntegration}
                  onCreateAutomation={handleCreateAutomation}
                  onEditAutomation={handleEditAutomation}
                />
              </div>
              
              <div className={cn("flex-shrink-0 border-t pt-4", {
                "border-slate-200": theme === 'light',
                "border-slate-700": theme === 'dark-plus'
              })}>
                <IntegrationHubSimple onConnect={handleConnectIntegration} />
              </div>

              <div className={cn("flex-shrink-0 border-t pt-4", {
                "border-slate-200": theme === 'light',
                "border-slate-700": theme === 'dark-plus'
              })}>
                <SystemHealthChecker status={systemStatus} detailed />
              </div>

              <div className="flex-1 min-h-0 overflow-y-auto">
                <Leaderboard limit={5} />
              </div>
              
              {/* Activity Feed */}
              <div className={cn("mt-4 border-t pt-4", {
                "border-slate-200": theme === 'light',
                "border-slate-700": theme === 'dark-plus'
              })}>
                <ActivityFeed />
              </div>
            </div>
          )}
          {/* Collapse Toggle Button */}
          <button
            type="button"
            onClick={() => setLeftSidebarCollapsed(!leftSidebarCollapsed)}
            className={cn("absolute top-4 -right-3 z-10 w-6 h-6 rounded-full border flex items-center justify-center transition-all", {
              "bg-white border-slate-300 hover:bg-slate-50": theme === 'light',
              "bg-slate-800 border-slate-600 hover:bg-slate-700": theme === 'dark-plus',
              "right-2": leftSidebarCollapsed
            })}
            title={leftSidebarCollapsed ? "Expand Left Sidebar" : "Collapse Left Sidebar"}
          >
            {leftSidebarCollapsed ? (
              <ChevronRight className="w-4 h-4" />
            ) : (
              <ChevronLeft className="w-4 h-4" />
            )}
          </button>
        </div>

        {/* CENTER (ANALYTICS GRID) */}
        <div className={cn("flex-1 min-w-0 h-full overflow-y-auto p-6 border-r border-slate-200", {
          "bg-slate-50/50": theme === 'light',
          "bg-[#141416] border-slate-700": theme === 'dark-plus'
        })}>
          <div className="mb-4">
            <Breadcrumbs 
              items={[
                { label: 'Dashboard', href: '/dashboard' },
                { label: 'Ops Intelligence' }
              ]}
            />
          </div>
          <div className="flex items-center justify-between mb-6">
            <h2 className={cn("text-2xl font-bold", {
              "text-slate-900": theme === 'light',
              "text-slate-100": theme === 'dark-plus'
            })}>
              Ops Intelligence
            </h2>
            <div className="flex items-center gap-2">
              <CollaborationIndicators 
                resourceId="dashboard-main"
                resourceType="dashboard"
              />
              <ExportMenu
                data={{
                  title: 'Ops Intelligence Dashboard',
                  headers: ['Metric', 'Value', 'Status'],
                  rows: [
                    ['Database Latency (P99)', '1200ms', 'Critical'],
                    ['Application Errors', '5', 'Warning'],
                    ['Request Volume', '1.2k', 'Normal'],
                  ],
                  metadata: {
                    'Exported At': new Date().toLocaleString(),
                    'Dashboard': 'Ops Intelligence',
                  },
                }}
              />
              <button
                type="button"
                onClick={() => setHolographicMode(!holographicMode)}
                className={cn("px-4 py-2 rounded-lg border text-xs font-medium transition-all flex items-center gap-2", {
                  "border-slate-300 hover:bg-slate-100": theme === 'light' && !holographicMode,
                  "border-slate-700 hover:bg-slate-800": theme === 'dark-plus' && !holographicMode,
                  "bg-indigo-600 text-white border-indigo-600 hover:bg-indigo-700": holographicMode
                })}
              >
                {holographicMode && <span className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse"></span>}
                {holographicMode ? 'HOLO ON' : '3D OFF'}
              </button>
              <button
                type="button"
                onClick={() => setMinorityReportMode(!minorityReportMode)}
                className={cn("px-3 py-2 rounded-lg border text-xs font-medium transition-all flex items-center gap-2 font-sci-fi", {
                  "border-slate-300 hover:bg-slate-100": theme === 'light' && !minorityReportMode,
                  "border-slate-700 hover:bg-slate-800": theme === 'dark-plus' && !minorityReportMode,
                  "bg-cyan-600 text-white border-cyan-600 hover:bg-cyan-700": minorityReportMode
                })}
                title="Toggle Minority Report Gesture Control Mode"
              >
                {minorityReportMode && <span className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse"></span>}
                {minorityReportMode ? 'MR ON' : 'MR'}
              </button>
            </div>
          </div>
          <div className="relative overflow-visible">
            <AnalyticsGrid />
            <HolographicOverlay isActive={holographicMode} onClose={() => setHolographicMode(false)} />
          </div>
        </div>

        {/* RIGHT SIDEBAR (THREADS LIST) */}
        <div className={cn("relative flex flex-col border-l border-slate-200 transition-all duration-300 overflow-hidden flex-shrink-0", {
          "w-80": !rightSidebarCollapsed,
          "w-0": rightSidebarCollapsed,
          "bg-slate-50/50": theme === 'light',
          "bg-[#141416] border-slate-700": theme === 'dark-plus'
        })}>
          {!rightSidebarCollapsed && (
            <div className="p-4 overflow-y-auto h-full min-h-0">
              <div className="flex items-center justify-between mb-4">
                <h3 className={cn("font-bold text-sm", {
                  "text-slate-900": theme === 'light',
                  "text-slate-100": theme === 'dark-plus'
                })}>
                  Incidents ASDF
                </h3>
                <button 
                  type="button"
                  onClick={() => {
                    console.log('Searching incidents...');
                    alert('Opening incident search...');
                  }}
                  className={cn("p-2 rounded-lg border hover:bg-slate-100 text-xs font-medium flex items-center gap-1 transition-colors", {
                    "bg-white border-slate-300": theme === 'light',
                    "bg-slate-800 border-slate-700 hover:bg-slate-700": theme === 'dark-plus'
                  })}
                >
                  <Search className="w-3 h-3" />
                  Search
                </button>
              </div>
              <IncidentThreadList onSelect={handleSelectThread} />
            </div>
          )}
          {/* Collapse Toggle Button */}
          <button
            type="button"
            onClick={() => setRightSidebarCollapsed(!rightSidebarCollapsed)}
            className={cn("absolute top-4 -left-3 z-10 w-6 h-6 rounded-full border flex items-center justify-center transition-all", {
              "bg-white border-slate-300 hover:bg-slate-50": theme === 'light',
              "bg-slate-800 border-slate-600 hover:bg-slate-700": theme === 'dark-plus',
              "left-2": rightSidebarCollapsed
            })}
            title={rightSidebarCollapsed ? "Expand Right Sidebar" : "Collapse Right Sidebar"}
          >
            {rightSidebarCollapsed ? (
              <ChevronLeft className="w-4 h-4" />
            ) : (
              <ChevronRight className="w-4 h-4" />
            )}
          </button>
        </div>
      </main>

      {/* --- ZONE 3: BOTTOM BAR (INPUT) --- */}
      <div className={cn("h-auto min-h-[120px] border-t border-slate-200 bg-slate-50 flex items-center px-6 py-4 shadow-md z-20 flex-shrink-0", {
        "bg-[#141416] border-slate-700": theme === 'dark-plus'
      })}>
        <div className="flex-1 flex items-end gap-4 w-full max-w-full">
          <div className="flex-1 min-w-0">
            <MessageInput />
          </div>
          
          <button 
            type="button"
            onClick={toggleTheme} 
            className={cn("p-3 rounded-full border border-slate-300 hover:bg-slate-100 transition-colors", {
              "bg-white": theme === 'light',
              "bg-slate-800 border-slate-700": theme === 'dark-plus'
            })}
            title="Toggle Theme"
          >
            {theme === 'light' ? (
              <Moon className="h-4 w-4 text-slate-500" />
            ) : (
              <Sun className="h-4 w-4 text-slate-300" />
            )}
          </button>
        </div>
      </div>

      {/* --- FLOATING UI (MESSAGE LIST) --- */}
      {sidebarOpen === 'info' && (
        <div className={cn("absolute top-14 right-0 w-[400px] h-[calc(100vh-3.5rem)] border-l border-slate-200 bg-slate-50 shadow-2xl rounded-2xl overflow-hidden flex flex-col transition-all z-30", {
          "bg-white text-slate-900": theme === 'light',
          "bg-[#1e1e24] text-slate-100 border-slate-700": theme === 'dark-plus'
        })}>
          <div className={cn("flex items-center justify-between p-4 border-b border-slate-200 bg-slate-100/50", {
            "bg-slate-800/50 border-slate-700": theme === 'dark-plus'
          })}>
            <h2 className={cn("font-bold text-sm", {
              "text-slate-800": theme === 'light',
              "text-slate-200": theme === 'dark-plus'
            })}>
              Thread: #12345 (Simulation)
            </h2>
            <button 
              type="button"
              onClick={() => setSidebarOpen(false)}
              className={cn("text-slate-400 hover:text-slate-200")}
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <MessageList />
        </div>
      )}

      {/* Keyboard Shortcuts Overlay */}
      <KeyboardShortcuts />
    </div>
  );
}
