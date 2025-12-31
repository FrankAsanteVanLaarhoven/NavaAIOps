'use client';

import { useState, useEffect } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { cn } from '@/lib/utils';
import { useTheme } from '@/hooks/use-theme';

// Mock Data Stream for Live Feel
interface MetricEntry {
  time: string;
  latency: number; // Database Latency (P99)
  errors: number; // Application Errors
  requests: number; // Request Volume
}

export function AnalyticsGrid() {
  const { theme } = useTheme();
  const [activeTab, setActiveTab] = useState<'latency' | 'errors' | 'requests'>('latency');
  
  // Mock Data Generation
  const [data, setData] = useState<MetricEntry[]>([]);

  useEffect(() => {
    const generateData = () => {
      const now = new Date();
      const points: MetricEntry[] = [];
      
      // Simulate 60 seconds of data
      for (let i = 0; i < 60; i++) {
        // Base Latency
        let latency = 50;
        // Spike at second 4 (Minority Report: "Database Spike")
        if (i === 4) latency = 1250; 
        else latency = Math.max(20, latency - Math.random() * 10);
        
        // Error Rate
        const errors = latency > 1000 ? Math.floor(Math.random() * 10) : 0;
        
        // Request Volume (Traffic)
        const requests = Math.floor(Math.random() * 5000);

        const time = new Date(now.getTime() - (59 - i) * 1000).toLocaleTimeString();
        
        points.push({ time, latency, errors, requests });
      }
      
      setData(points);
    };

    // Generate every 5 seconds
    generateData();
    const interval = setInterval(generateData, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="p-4 h-full flex flex-col">
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <h2 className={cn("text-2xl font-bold flex-shrink-0", {
          "text-slate-900": theme === 'light',
          "text-slate-100": theme === 'dark-plus'
        })}>
          Ops Intelligence
        </h2>
        
        {/* TABS */}
        <div className="flex gap-2 flex-shrink-0">
          <button 
            type="button"
            onClick={() => setActiveTab('latency')} 
            className={cn("px-4 py-2 rounded-lg border-b-2 font-medium transition-all whitespace-nowrap", {
              "bg-white text-slate-900 border-cyan-500": activeTab === 'latency' && theme === 'light',
              "bg-[#050505] text-slate-100 border-cyan-500": activeTab === 'latency' && theme === 'dark-plus',
              "text-slate-600 border-transparent hover:border-slate-300": activeTab !== 'latency' && theme === 'light',
              "bg-slate-800/50 text-slate-400 border-transparent hover:border-slate-600": activeTab !== 'latency' && theme === 'dark-plus',
            })}
          >
            Latency
          </button>
          <button 
            type="button"
            onClick={() => setActiveTab('errors')} 
            className={cn("px-4 py-2 rounded-lg border-b-2 font-medium transition-all whitespace-nowrap", {
              "bg-white text-slate-900 border-cyan-500": activeTab === 'errors' && theme === 'light',
              "bg-[#050505] text-slate-100 border-cyan-500": activeTab === 'errors' && theme === 'dark-plus',
              "text-slate-600 border-transparent hover:border-slate-300": activeTab !== 'errors' && theme === 'light',
              "bg-slate-800/50 text-slate-400 border-transparent hover:border-slate-600": activeTab !== 'errors' && theme === 'dark-plus',
            })}
          >
            Errors
          </button>
          <button 
            type="button"
            onClick={() => setActiveTab('requests')} 
            className={cn("px-4 py-2 rounded-lg border-b-2 font-medium transition-all whitespace-nowrap", {
              "bg-white text-slate-900 border-cyan-500": activeTab === 'requests' && theme === 'light',
              "bg-[#050505] text-slate-100 border-cyan-500": activeTab === 'requests' && theme === 'dark-plus',
              "text-slate-600 border-transparent hover:border-slate-300": activeTab !== 'requests' && theme === 'light',
              "bg-slate-800/50 text-slate-400 border-transparent hover:border-slate-600": activeTab !== 'requests' && theme === 'dark-plus',
            })}
          >
            Requests
          </button>
        </div>
      </div>

      {/* CONTENT */}
      <div className="flex-1 min-h-0 overflow-visible p-4 rounded-xl border border-slate-200 bg-white/50 relative">
        {/* CHART CARD */}
        <div className={cn("p-4 rounded-xl border shadow-sm overflow-visible", {
          "border-slate-200 bg-white": theme === 'light',
          "border-slate-700 bg-[#1e1e24]": theme === 'dark-plus'
        })}>
          <div className="flex items-center justify-between mb-4">
            <h3 className={cn("text-lg font-bold truncate", {
              "text-slate-900": theme === 'light',
              "text-slate-100": theme === 'dark-plus'
            })}>
              {activeTab === 'latency' && 'Database Latency (P99)'}
              {activeTab === 'errors' && 'Application Errors'}
              {activeTab === 'requests' && 'Request Volume'}
            </h3>
            <div className={cn("w-2 h-2 rounded-full flex-shrink-0", {
              "bg-green-500 animate-pulse": activeTab === 'latency',
              "bg-red-500 animate-pulse": activeTab === 'errors',
              "bg-blue-500 animate-pulse": activeTab === 'requests',
              "bg-slate-300": theme === 'light',
              "bg-slate-700": theme === 'dark-plus'
            })}></div>
          </div>
          <div className="w-full" style={{ minHeight: '300px', height: '300px' }}>
            <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 10, right: 30, left: 20, bottom: 30 }}>
              <defs>
                <linearGradient id="latencyGradient" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="10%" stopColor="#06b6d4" stopOpacity={0.6} />
                  <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="errorsGradient" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="10%" stopColor="#ef4444" stopOpacity={0.6} />
                  <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="requestsGradient" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="10%" stopColor="#10b981" stopOpacity={0.6} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
              </defs>
              {activeTab === 'latency' && (
                <Area 
                  type="monotone" 
                  dataKey="latency" 
                  stroke="#06b6d4" 
                  fill="url(#latencyGradient)" 
                  animationDuration={1000} 
                />
              )}
              {activeTab === 'errors' && (
                <Area 
                  type="monotone" 
                  dataKey="errors" 
                  stroke="#ef4444" 
                  fill="url(#errorsGradient)" 
                  animationDuration={1000} 
                />
              )}
              {activeTab === 'requests' && (
                <Area 
                  type="monotone" 
                  dataKey="requests" 
                  stroke="#10b981" 
                  fill="url(#requestsGradient)" 
                  animationDuration={1000} 
                />
              )}
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={theme === 'dark-plus' ? '#374151' : '#e5e7eb'} />
              <XAxis 
                dataKey="time" 
                tick={{ fontSize: 10, fill: theme === 'dark-plus' ? '#9ca3af' : '#6b7280' }}
                angle={-45}
                textAnchor="end"
                height={60}
              />
              <YAxis 
                dataKey={activeTab === 'latency' ? 'latency' : activeTab === 'errors' ? 'errors' : 'requests'}
                tick={{ fontSize: 10, fill: theme === 'dark-plus' ? '#9ca3af' : '#6b7280' }}
                width={60}
                label={{ 
                  value: activeTab === 'latency' ? 'ms' : activeTab === 'errors' ? 'count' : 'req/s', 
                  angle: -90, 
                  position: 'insideLeft',
                  style: { textAnchor: 'middle', fill: theme === 'dark-plus' ? '#9ca3af' : '#6b7280', fontSize: 10 }
                }}
              />
              <Tooltip 
                content={({ active, payload }: any) => {
                  if (active && payload && payload[0]) {
                    const value = payload[0].value as number;
                    const label = activeTab === 'latency' ? 'Latency' : activeTab === 'errors' ? 'Errors' : 'Requests';
                    const unit = activeTab === 'latency' ? 'ms' : activeTab === 'errors' ? '' : '/s';
                    return (
                      <div className={cn("p-3 rounded-lg shadow-lg border min-w-[120px]", {
                        "bg-slate-900 text-white border-slate-700": theme === 'dark-plus',
                        "bg-white text-slate-900 border-slate-200": theme === 'light'
                      })}>
                        <p className={cn("text-xs mb-1", {
                          "text-slate-400": theme === 'dark-plus',
                          "text-slate-600": theme === 'light'
                        })}>
                          Time: {payload[0].payload.time}
                        </p>
                        <p className={cn("text-sm font-bold", {
                          "text-red-500": (activeTab === 'latency' && value > 1000) || (activeTab === 'errors' && value > 5),
                          "text-green-500": (activeTab === 'latency' && value <= 100) || (activeTab === 'errors' && value === 0),
                          "text-cyan-500": activeTab === 'requests'
                        })}>
                          {label}: {value}{unit}
                        </p>
                        {activeTab === 'latency' && (
                          <p className={cn("text-xs mt-1", {
                            "text-slate-400": theme === 'dark-plus',
                            "text-slate-600": theme === 'light'
                          })}>
                            Errors: {payload[0].payload.errors}
                          </p>
                        )}
                      </div>
                    );
                  }
                  return null;
                }}
              />
            </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
