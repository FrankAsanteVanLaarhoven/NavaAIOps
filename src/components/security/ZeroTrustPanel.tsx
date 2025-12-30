'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, CheckCircle2, Shield, Zap } from 'lucide-react';

interface ZeroTrustResult {
  is_threat: boolean;
  threat_id: string | null;
  severity: number;
  method: string;
  latency_ms: number;
  recommendation: 'KILL_PROCESS' | 'ALLOW';
  hash: string;
  timestamp: number;
}

export function ZeroTrustPanel() {
  const [payload, setPayload] = useState('');
  const [result, setResult] = useState<ZeroTrustResult | null>(null);
  const [loading, setLoading] = useState(false);

  const handleCheck = async () => {
    if (!payload.trim()) return;

    setLoading(true);
    try {
      const response = await fetch('/api/security/zero-trust', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          payload,
          timestamp: Date.now(),
        }),
      });

      const data = await response.json();
      setResult(data);
    } catch (error) {
      console.error('Zero-Trust check failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const testPayloads = [
    { name: 'Malicious Script', payload: '<script>eval(atob("base64_encoded_payload"))</script>' },
    { name: 'Ransomware', payload: 'cryptolocker encryption key' },
    { name: 'Code Execution', payload: 'exec("rm -rf /")' },
    { name: 'Clean Payload', payload: 'Hello, this is a normal HTTP request.' },
  ];

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-blue-500" />
          <CardTitle>Zero-Trust Interceptor</CardTitle>
        </div>
        <CardDescription>
          Ultra-fast threat detection with &lt;0.1ms latency. Hash-based Virus Graph matching.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Payload to Check</label>
          <Input
            value={payload}
            onChange={(e) => setPayload(e.target.value)}
            placeholder="Enter payload or script to analyze..."
            className="font-mono text-sm"
          />
        </div>

        <div className="flex gap-2">
          <Button onClick={handleCheck} disabled={loading || !payload.trim()}>
            {loading ? 'Checking...' : 'Check Payload'}
          </Button>
          <Button variant="outline" onClick={() => setPayload('')}>
            Clear
          </Button>
        </div>

        {/* Test Payloads */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Quick Test Payloads</label>
          <div className="flex flex-wrap gap-2">
            {testPayloads.map((test, i) => (
              <Button
                key={i}
                variant="outline"
                size="sm"
                onClick={() => setPayload(test.payload)}
                className="text-xs"
              >
                {test.name}
              </Button>
            ))}
          </div>
        </div>

        {/* Results */}
        {result && (
          <div className="mt-4 space-y-3 p-4 border rounded-lg bg-muted/50">
            <div className="flex items-center gap-2">
              {result.is_threat ? (
                <>
                  <AlertCircle className="h-5 w-5 text-red-500" />
                  <span className="font-bold text-red-500">THREAT DETECTED</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                  <span className="font-bold text-green-500">CLEAN</span>
                </>
              )}
            </div>

            {result.is_threat && (
              <>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-muted-foreground">Threat ID:</span>
                    <Badge variant="destructive" className="ml-2">
                      {result.threat_id}
                    </Badge>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Severity:</span>
                    <Badge variant="destructive" className="ml-2">
                      {(result.severity * 100).toFixed(0)}%
                    </Badge>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Method:</span>
                    <Badge variant="outline" className="ml-2">
                      {result.method}
                    </Badge>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Latency:</span>
                    <Badge variant="outline" className="ml-2">
                      {result.latency_ms.toFixed(3)}ms
                    </Badge>
                  </div>
                </div>

                <div className="flex items-center gap-2 p-2 bg-red-500/10 border border-red-500/20 rounded">
                  <Zap className="h-4 w-4 text-red-500" />
                  <span className="text-sm font-medium text-red-500">
                    Recommendation: {result.recommendation}
                  </span>
                </div>
              </>
            )}

            <div className="text-xs text-muted-foreground font-mono break-all">
              <span className="font-semibold">Hash:</span> {result.hash}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
