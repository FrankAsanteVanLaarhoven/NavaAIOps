'use client';

import { useState, useEffect, useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Text, Sphere } from '@react-three/drei';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';

interface HolographicDashboardProps {
  workspaceId: string;
  channelId?: string;
}

interface Incident3D {
  id: string;
  title: string;
  severity: string;
  status: string;
  position: [number, number, number];
  color: string;
}

async function getIncidents(channelId?: string) {
  const response = await fetch('/api/incidents');
  if (!response.ok) return [];
  return response.json();
}

function IncidentNode({ incident, onSelect }: { incident: Incident3D; onSelect: () => void }) {
  return (
    <group position={incident.position}>
      <mesh onClick={onSelect}>
        <sphereGeometry args={[0.5, 32, 32]} />
        <meshStandardMaterial
          color={incident.color}
          emissive={incident.color}
          emissiveIntensity={0.5}
          transparent
          opacity={0.8}
        />
      </mesh>
      <Text
        position={[0, 1, 0]}
        fontSize={0.3}
        color="white"
        anchorX="center"
        anchorY="middle"
        outlineWidth={0.02}
        outlineColor="#000000"
      >
        {incident.title}
      </Text>
    </group>
  );
}

export function HolographicDashboard({
  workspaceId,
  channelId,
}: HolographicDashboardProps) {
  const [selectedIncident, setSelectedIncident] = useState<any>(null);
  const [incidents3D, setIncidents3D] = useState<Incident3D[]>([]);

  const { data: incidents } = useQuery({
    queryKey: ['incidents', channelId],
    queryFn: () => getIncidents(channelId),
  });

  useEffect(() => {
    if (incidents && incidents.length > 0) {
      const mapped = incidents.map((inc: any, i: number) => {
        const angle = (i / incidents.length) * Math.PI * 2;
        const radius = 5;
        const x = Math.cos(angle) * radius;
        const y = Math.sin(angle * 0.5) * 3;
        const z = Math.sin(angle) * radius;

        const severityColors: Record<string, string> = {
          'sev-0': '#ef4444',
          'sev-1': '#f97316',
          'sev-2': '#fbbf24',
          'sev-3': '#3b82f6',
        };

        return {
          id: inc.id,
          title: inc.thread?.title || `Incident ${i + 1}`,
          severity: inc.severity,
          status: inc.status,
          position: [x, y, z] as [number, number, number],
          color: severityColors[inc.severity] || '#6b7280',
        };
      });
      setIncidents3D(mapped);
    }
  }, [incidents]);

  const handleSelectIncident = (incident: Incident3D) => {
    const fullIncident = incidents?.find((inc: any) => inc.id === incident.id);
    setSelectedIncident(fullIncident);
  };

  return (
    <div className="h-screen w-full bg-gradient-to-br from-zinc-950 via-black to-zinc-900 relative">
      <Canvas shadows camera={{ position: [0, 0, 10], fov: 75 }}>
        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} />
        <OrbitControls
          enablePan={true}
          enableZoom={true}
          enableRotate={true}
          minDistance={5}
          maxDistance={20}
        />

        {incidents3D.map((incident) => (
          <IncidentNode
            key={incident.id}
            incident={incident}
            onSelect={() => handleSelectIncident(incident)}
          />
        ))}
      </Canvas>

      {/* HUD Overlay */}
      <div className="absolute top-4 left-4 z-50 bg-black/50 backdrop-blur-md border border-white/10 p-4 rounded-xl">
        <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-yellow-400 to-orange-500">
          Incident Command Center
        </h1>
        <div className="flex flex-col gap-2 mt-4">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-red-500" />
            <span className="text-sm text-white">
              SEV-0:{' '}
              <span className="text-red-400">
                {incidents3D.filter((i) => i.severity === 'sev-0').length}
              </span>
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-orange-500" />
            <span className="text-sm text-white">
              SEV-1/2:{' '}
              <span className="text-orange-400">
                {incidents3D.filter((i) => i.severity === 'sev-1' || i.severity === 'sev-2').length}
              </span>
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-yellow-500" />
            <span className="text-sm text-white">
              SEV-3:{' '}
              <span className="text-yellow-400">
                {incidents3D.filter((i) => i.severity === 'sev-3').length}
              </span>
            </span>
          </div>
        </div>
      </div>

      {/* Selected Incident Detail */}
      {selectedIncident && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 max-w-2xl w-full bg-black/80 backdrop-blur-xl border border-white/10 p-6 rounded-xl">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-lg bg-zinc-800 border border-white/10 flex items-center justify-center">
              <span className="text-2xl">
                {selectedIncident.severity === 'sev-0' ? '🔴' : '🟠'}
              </span>
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-bold text-white mb-2">
                {selectedIncident.thread?.title || 'Incident'}
              </h2>
              <p className="text-sm text-zinc-300 mb-4">
                {selectedIncident.impact || 'No description'}
              </p>
              <div className="flex gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant="destructive"
                  onClick={() => {
                    // Resolve incident
                    fetch(`/api/incidents/${selectedIncident.threadId}`, {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ status: 'resolved' }),
                    });
                    setSelectedIncident(null);
                  }}
                >
                  Resolve
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => setSelectedIncident(null)}
                >
                  Close
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
