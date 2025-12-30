'use client';

import { ZeroTrustPanel } from '@/components/security/ZeroTrustPanel';
import { HolographicDashboard } from '@/components/holographic/HolographicDashboard';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function SecurityPage() {
  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Security Command Center</h1>
        <p className="text-muted-foreground">
          Zero-Trust Cyber Defense and Holographic Operational View
        </p>
      </div>

      <Tabs defaultValue="zero-trust" className="w-full">
        <TabsList>
          <TabsTrigger value="zero-trust">Zero-Trust Interceptor</TabsTrigger>
          <TabsTrigger value="holographic">Holographic View</TabsTrigger>
        </TabsList>

        <TabsContent value="zero-trust" className="space-y-4">
          <ZeroTrustPanel />
        </TabsContent>

        <TabsContent value="holographic" className="space-y-4">
          <div className="h-[800px] border rounded-lg overflow-hidden">
            <HolographicDashboard workspaceId="default" />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
