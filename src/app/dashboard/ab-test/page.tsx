'use client';

import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

async function getABTestResults(feature: string, days: number = 7) {
  const response = await fetch(`/api/ab-test/results?feature=${feature}&days=${days}`);
  if (!response.ok) throw new Error('Failed to fetch results');
  return response.json();
}

export default function ABTestDashboard() {
  const { data: incidentResults } = useQuery({
    queryKey: ['ab-test', 'incident', 7],
    queryFn: () => getABTestResults('incident', 7),
  });

  const { data: auditResults } = useQuery({
    queryKey: ['ab-test', 'audit', 7],
    queryFn: () => getABTestResults('audit', 7),
  });

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold mb-8">A/B Test Dashboard</h1>
        <p className="text-muted-foreground mb-8">
          Compare Fine-Tuned DevOps Model vs Base Model performance
        </p>

        <Tabs defaultValue="incident" className="space-y-6">
          <TabsList>
            <TabsTrigger value="incident">Incident Resolution</TabsTrigger>
            <TabsTrigger value="audit">Audit Log Analysis</TabsTrigger>
            <TabsTrigger value="code">Code Context</TabsTrigger>
          </TabsList>

          <TabsContent value="incident">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Response Time</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={incidentResults?.variants || []}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="avgResponseTime" fill="#8884d8" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Accuracy Rating</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={incidentResults?.variants || []}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="avgAccuracy" fill="#82ca9d" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="audit">
            <Card>
              <CardHeader>
                <CardTitle>Audit Log Analysis Performance</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  A/B test results for audit log analysis will appear here.
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="code">
            <Card>
              <CardHeader>
                <CardTitle>Code Context Review Performance</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  A/B test results for code context review will appear here.
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
