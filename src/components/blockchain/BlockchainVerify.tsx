'use client';

import { useState, useEffect } from 'react';
import { CheckCircle2, XCircle, Loader2, Link2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface BlockchainVerifyProps {
  logId: string; // The UUID from the Audit Log
  autoVerify?: boolean; // Automatically verify on mount
}

interface VerificationResult {
  verified: boolean;
  exists: boolean;
  metadataHash: string;
  ipfsCid: string;
  timestamp: number;
  contractAddress: string;
}

export function BlockchainVerify({ logId, autoVerify = false }: BlockchainVerifyProps) {
  const [result, setResult] = useState<VerificationResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const verifyLog = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/blockchain/verify?logId=${logId}`);
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Verification failed');
      }

      const data = await response.json();
      setResult(data);
    } catch (err: any) {
      setError(err.message || 'Failed to verify log');
      setResult(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (autoVerify) {
      verifyLog();
    }
  }, [autoVerify, logId]);

  const formatTimestamp = (timestamp: number) => {
    if (!timestamp) return 'N/A';
    return new Date(timestamp * 1000).toISOString();
  };

  const truncateHash = (hash: string, length: number = 10) => {
    if (!hash) return '';
    if (hash.length <= length * 2 + 2) return hash;
    return `${hash.slice(0, length + 2)}...${hash.slice(-length)}`;
  };

  return (
    <Card className="w-full border-l-4 border-l-blue-500 bg-zinc-950/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg font-bold">
          <div className="h-8 w-8 rounded-full bg-blue-500/20 flex items-center justify-center">
            <Link2 className="h-4 w-4 text-blue-400" />
          </div>
          NavaChain Verification
        </CardTitle>
        <CardDescription className="text-sm text-zinc-400">
          Verify audit log integrity against Polygon L2 blockchain ledger
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Log ID Display */}
        <div className="p-3 bg-zinc-900/50 rounded-lg border border-zinc-800">
          <div className="text-xs text-zinc-400 uppercase font-bold mb-1">Log ID</div>
          <code className="text-sm font-mono text-zinc-100 break-all">{logId}</code>
        </div>

        {/* Error Display */}
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Status Indicator */}
        <div className="flex items-center gap-4">
          {isLoading && (
            <div className="flex items-center gap-2 text-yellow-500">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="text-sm font-medium">Verifying on Polygon L2...</span>
            </div>
          )}

          {!isLoading && !result && !error && (
            <Button onClick={verifyLog} disabled={isLoading} size="sm">
              Verify Now
            </Button>
          )}

          {!isLoading && result && result.verified && (
            <div className="flex items-center gap-2 text-green-500 bg-green-500/10 px-4 py-2 rounded-lg border border-green-500/20">
              <CheckCircle2 className="h-5 w-5" />
              <span className="text-sm font-bold">Immutable Verified</span>
            </div>
          )}

          {!isLoading && result && !result.verified && (
            <div className="flex items-center gap-2 text-red-500 bg-red-500/10 px-4 py-2 rounded-lg border border-red-500/20">
              <XCircle className="h-5 w-5" />
              <span className="text-sm font-bold">
                {result.exists ? 'Tamper Detected' : 'Not Anchored'}
              </span>
            </div>
          )}
        </div>

        {/* Detailed Info (if verified) */}
        {result && result.verified && (
          <div className="mt-4 p-4 bg-zinc-900/50 rounded-lg border border-zinc-800 space-y-3">
            <div className="grid grid-cols-1 gap-3">
              <div>
                <div className="text-xs text-zinc-400 uppercase font-bold mb-1">
                  On-Chain Hash
                </div>
                <code className="text-xs font-mono bg-zinc-800 text-zinc-100 px-2 py-1 rounded block break-all">
                  {truncateHash(result.metadataHash, 12)}
                </code>
              </div>
              
              <div>
                <div className="text-xs text-zinc-400 uppercase font-bold mb-1">
                  IPFS Content ID
                </div>
                <code className="text-xs font-mono bg-zinc-800 text-blue-400 px-2 py-1 rounded block break-all">
                  {result.ipfsCid}
                </code>
              </div>
              
              <div>
                <div className="text-xs text-zinc-400 uppercase font-bold mb-1">
                  Anchored At
                </div>
                <div className="text-sm text-zinc-300">
                  {formatTimestamp(result.timestamp)}
                </div>
              </div>
              
              <div>
                <div className="text-xs text-zinc-400 uppercase font-bold mb-1">
                  Contract Address
                </div>
                <code className="text-xs font-mono bg-zinc-800 text-zinc-100 px-2 py-1 rounded block break-all">
                  {truncateHash(result.contractAddress, 8)}
                </code>
              </div>
            </div>

            {/* Badges */}
            <div className="flex gap-2 pt-2">
              <Badge variant="outline" className="bg-green-500/10 text-green-400 border-green-500/20">
                Immutable
              </Badge>
              <Badge variant="outline" className="bg-blue-500/10 text-blue-400 border-blue-500/20">
                Polygon L2
              </Badge>
              <Badge variant="outline" className="bg-purple-500/10 text-purple-400 border-purple-500/20">
                IPFS Stored
              </Badge>
            </div>
          </div>
        )}

        {/* Not Anchored Message */}
        {result && !result.exists && (
          <Alert>
            <AlertDescription className="text-zinc-400">
              This log has not been anchored to the blockchain yet. It may still be in the sync queue.
              The NavaChain bridge syncs logs every 30 seconds.
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}
