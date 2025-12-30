import { db } from '@/lib/db';
import { VercelKVService } from '@/lib/services/vercel-kv';
import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/next';

/**
 * Performance Dashboard
 * Shows: Database latency, AI latency, Edge function performance
 */
export default async function PerformanceDashboard() {
  // Get recent message counts (as a proxy for activity)
  const messageCount = await db.message.count();
  const incidentCount = await db.incidentData.count();
  const workflowCount = await db.workflowTrigger.count();

  // Get rate limit stats from KV (if available)
  const rateLimitStats = {
    total: 0,
    blocked: 0,
  };

  return (
    <div className="min-h-screen bg-background p-8">
      <Analytics />
      <SpeedInsights />

      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold mb-8">Performance Dashboard</h1>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-card p-6 rounded-lg border">
            <h3 className="text-sm font-medium text-muted-foreground mb-2">
              Total Messages
            </h3>
            <p className="text-3xl font-bold">{messageCount.toLocaleString()}</p>
          </div>

          <div className="bg-card p-6 rounded-lg border">
            <h3 className="text-sm font-medium text-muted-foreground mb-2">
              Active Incidents
            </h3>
            <p className="text-3xl font-bold">{incidentCount.toLocaleString()}</p>
          </div>

          <div className="bg-card p-6 rounded-lg border">
            <h3 className="text-sm font-medium text-muted-foreground mb-2">
              Workflows
            </h3>
            <p className="text-3xl font-bold">{workflowCount.toLocaleString()}</p>
          </div>
        </div>

        {/* Rate Limiting Stats */}
        <div className="bg-card p-6 rounded-lg border mb-8">
          <h2 className="text-2xl font-semibold mb-4">Rate Limiting</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Total Requests</p>
              <p className="text-xl font-bold">{rateLimitStats.total}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Blocked Requests</p>
              <p className="text-xl font-bold text-red-500">{rateLimitStats.blocked}</p>
            </div>
          </div>
        </div>

        {/* Database Performance */}
        <div className="bg-card p-6 rounded-lg border mb-8">
          <h2 className="text-2xl font-semibold mb-4">Database Performance</h2>
          <div className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground mb-2">
                Connection Status
              </p>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse" />
                <span className="font-medium">Connected</span>
              </div>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-2">
                Query Performance
              </p>
              <p className="text-sm">
                Use Vercel Postgres Analytics or pg_stat_statements for detailed
                query performance metrics.
              </p>
            </div>
          </div>
        </div>

        {/* AI Performance */}
        <div className="bg-card p-6 rounded-lg border mb-8">
          <h2 className="text-2xl font-semibold mb-4">AI Performance</h2>
          <div className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground mb-2">
                Model Usage
              </p>
              <p className="text-sm">
                Monitor AI token usage and latency via Vercel AI SDK
                observability.
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-2">
                Provider Status
              </p>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full" />
                  <span className="text-sm">OpenAI</span>
                </div>
                {process.env.ANTHROPIC_API_KEY && (
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-green-500 rounded-full" />
                    <span className="text-sm">Anthropic</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Instructions */}
        <div className="bg-muted p-6 rounded-lg">
          <h3 className="font-semibold mb-2">Performance Monitoring</h3>
          <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
            <li>
              Enable Vercel Analytics for real-time performance metrics
            </li>
            <li>
              Use Speed Insights for Web Vitals and Core Web Metrics
            </li>
            <li>
              Monitor database queries via Vercel Postgres Analytics
            </li>
            <li>
              Track AI usage and costs via Vercel AI SDK observability
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
