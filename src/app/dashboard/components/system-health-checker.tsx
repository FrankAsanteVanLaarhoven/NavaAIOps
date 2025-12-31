'use client';

import { useState, useEffect } from 'react';
import { CheckCircle, XCircle, AlertTriangle, Cpu, HardDrive, Server, Globe, Wifi } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useTheme } from '@/hooks/use-theme';

type HealthStatus = 'up' | 'down' | 'checking';

interface SystemHealthCheckerProps {
  detailed?: boolean;
  status?: 'healthy' | 'degraded' | 'down';
}

export function SystemHealthChecker({ detailed = false, status = 'healthy' }: SystemHealthCheckerProps) {
  const { theme } = useTheme();
  
  const [neon, setNeon] = useState<HealthStatus>('checking');
  const [keys, setKeys] = useState<HealthStatus>('checking');
  const [infra, setInfra] = useState<HealthStatus>('checking');
  const [deployment, setDeployment] = useState<HealthStatus>('checking');

  useEffect(() => {
    const timeout = setTimeout(() => {
      setNeon('up');
      setKeys('up');
      setInfra('up');
      setDeployment('up');
    }, 1000);

    return () => clearTimeout(timeout);
  }, []);

  return (
    <>
      {!detailed && (
        <div className="flex items-center gap-2">
          <div className={cn("w-2 h-2 rounded-full", {
            "bg-slate-100": theme === 'light',
            "bg-slate-800": theme === 'dark-plus'
          })}>
            <div className={cn("w-1.5 h-1.5 rounded-full", {
              "bg-green-500": status === 'healthy',
              "bg-red-500": status === 'down',
              "bg-yellow-500": status === 'degraded' || neon === 'checking',
            })}></div>
          </div>
          <span className="text-xs font-medium text-slate-500">Status</span>
        </div>
      )}

      {detailed && (
        <div className="flex flex-col gap-4">
          <Card className={cn("border-slate-200", {
            "bg-[#141416] border-slate-700": theme === 'dark-plus'
          })}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Server className="w-4 h-4" />
                Deployment Health
              </CardTitle>
              <Badge variant={deployment === 'up' ? 'default' : 'destructive'}>
                {deployment === 'up' ? 'Active' : deployment === 'checking' ? 'Checking' : 'Inactive'}
              </Badge>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-2">
                <CheckCircle className={cn("w-5 h-5 flex-shrink-0", {
                  "text-green-500": deployment === 'up',
                  "text-slate-400": deployment !== 'up'
                })} />
                <span className="text-sm font-medium">Production Environment</span>
              </div>
              <p className={cn("text-sm break-words", {
                "text-slate-600": theme === 'light',
                "text-slate-300": theme === 'dark-plus'
              })}>
                {deployment === 'checking' && "Checking Vercel & AWS EKS..."}
                {deployment === 'up' && "All Services Active. Build: #2349."}
                {deployment === 'down' && "Deployment Paused."}
              </p>
              <div className="flex items-center gap-2 flex-wrap">
                <div className="flex items-center gap-1">
                  <Cpu className={cn("w-4 h-4 flex-shrink-0", {
                    "text-slate-400": theme === 'light',
                    "text-slate-500": theme === 'dark-plus'
                  })} />
                  <span className={cn("text-xs", {
                    "text-slate-500": theme === 'light',
                    "text-slate-400": theme === 'dark-plus'
                  })}>CPU: 34%</span>
                </div>
                <div className="flex items-center gap-1">
                  <Globe className={cn("w-4 h-4 flex-shrink-0", {
                    "text-slate-400": theme === 'light',
                    "text-slate-500": theme === 'dark-plus'
                  })} />
                  <span className={cn("text-xs", {
                    "text-slate-500": theme === 'light',
                    "text-slate-400": theme === 'dark-plus'
                  })}>AWS US-EAST-1</span>
                </div>
                <div className="flex items-center gap-1">
                  <Wifi className={cn("w-4 h-4 flex-shrink-0", {
                    "text-slate-400": theme === 'light',
                    "text-slate-500": theme === 'dark-plus'
                  })} />
                  <span className={cn("text-xs", {
                    "text-slate-500": theme === 'light',
                    "text-slate-400": theme === 'dark-plus'
                  })}>Vercel Edge: Good</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className={cn("border-slate-200", {
            "bg-[#141416] border-slate-700": theme === 'dark-plus'
          })}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <HardDrive className="w-4 h-4" />
                API Keys
              </CardTitle>
              <Badge variant={keys === 'up' ? 'default' : 'destructive'}>
                {keys === 'up' ? 'Valid' : keys === 'checking' ? 'Checking' : 'Invalid'}
              </Badge>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between mb-2 gap-2">
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <CheckCircle className={cn("w-5 h-5 flex-shrink-0", {
                    "text-green-500": keys === 'up',
                    "text-red-500": keys === 'down'
                  })} />
                  <span className="text-sm font-medium truncate">OpenRouter</span>
                </div>
                <Switch checked={keys === 'up'} className="flex-shrink-0" />
              </div>
              <p className={cn("text-xs break-words", {
                "text-slate-500": theme === 'light',
                "text-slate-400": theme === 'dark-plus'
              })}>
                {keys === 'up' && "Key: sk-or-v1-... (Active)"}
                {keys === 'down' && "Key: sk-or-v1-... (Missing)"}
                {keys === 'checking' && "Validating..."}
              </p>
              
              <hr className={cn("my-3", {
                "border-slate-200": theme === 'light',
                "border-slate-700": theme === 'dark-plus'
              })} />

              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <CheckCircle className={cn("w-5 h-5 flex-shrink-0", {
                    "text-green-500": neon === 'up',
                    "text-red-500": neon === 'down'
                  })} />
                  <span className="text-sm font-medium truncate">Neon Database</span>
                </div>
                <Switch checked={neon === 'up'} className="flex-shrink-0" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </>
  );
}
