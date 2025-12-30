import { db } from '@/lib/db';

interface StatusPageProps {
  params: {
    workspaceId: string;
  };
}

export default async function StatusPage({ params }: StatusPageProps) {
  const { workspaceId } = params;

  // Get all incident channels and their threads
  const incidents = await db.incidentData.findMany({
    where: {
      thread: {
        channel: {
          type: 'incident',
        },
      },
    },
    include: {
      thread: {
        include: {
          channel: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
    take: 50,
  });

  return (
    <main className="bg-zinc-950 text-zinc-100 min-h-screen">
      <div className="container mx-auto py-10 px-4">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">
            System Status - {workspaceId}
          </h1>
          <p className="text-zinc-400">
            Real-time incident monitoring and status updates
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {incidents.length === 0 ? (
            <div className="col-span-full text-center py-12">
              <div className="text-green-500 text-6xl mb-4">✓</div>
              <h2 className="text-2xl font-semibold mb-2">All Systems Operational</h2>
              <p className="text-zinc-400">No active incidents</p>
            </div>
          ) : (
            incidents.map((incident) => {
              const severityColors = {
                'sev-0': 'border-red-500 bg-red-500/10 text-red-400',
                'sev-1': 'border-orange-500 bg-orange-500/10 text-orange-400',
                'sev-2': 'border-yellow-500 bg-yellow-500/10 text-yellow-400',
                'sev-3': 'border-blue-500 bg-blue-500/10 text-blue-400',
              };

              const statusColors = {
                investigating: 'bg-yellow-600',
                identified: 'bg-orange-600',
                monitoring: 'bg-blue-600',
                resolved: 'bg-green-600',
              };

              const severityColor = severityColors[incident.severity as keyof typeof severityColors] || severityColors['sev-2'];
              const statusColor = statusColors[incident.status as keyof typeof statusColors] || statusColors.investigating;

              return (
                <div
                  key={incident.id}
                  className={`p-6 rounded-lg border-2 ${severityColor} transition-all hover:scale-105`}
                >
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="font-semibold text-lg mb-1">
                        {incident.thread.channel.name}
                      </h3>
                      <p className="text-sm text-zinc-400">
                        {incident.thread.title || 'Incident'}
                      </p>
                    </div>
                    <span
                      className={`px-3 py-1 rounded text-xs font-bold ${statusColor} text-white`}
                    >
                      {incident.status.toUpperCase()}
                    </span>
                  </div>

                  <div className="mb-4">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xs font-semibold text-zinc-400">SEVERITY</span>
                      <span className="text-sm font-bold">{incident.severity.toUpperCase()}</span>
                    </div>
                    {incident.impact && (
                      <p className="text-sm text-zinc-300 mb-2">{incident.impact}</p>
                    )}
                  </div>

                  <div className="text-xs text-zinc-500">
                    Created: {new Date(incident.createdAt).toLocaleString()}
                    {incident.resolvedAt && (
                      <span className="block mt-1">
                        Resolved: {new Date(incident.resolvedAt).toLocaleString()}
                      </span>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        <div className="mt-8 text-center text-sm text-zinc-500">
          <p>Last updated: {new Date().toLocaleString()}</p>
        </div>
      </div>
    </main>
  );
}
