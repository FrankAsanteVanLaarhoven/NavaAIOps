import { NextRequest, NextResponse } from 'next/server';
import { createPolygonBridge } from '@/lib/services/polygon-bridge';
import { z } from 'zod';

const VerifyRequestSchema = z.object({
  logId: z.string().uuid(),
});

/**
 * API endpoint to verify an audit log against the blockchain
 * 
 * GET /api/blockchain/verify?logId=<uuid>
 */
export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const logId = searchParams.get('logId');

    if (!logId) {
      return NextResponse.json(
        { error: 'logId query parameter is required' },
        { status: 400 }
      );
    }

    // Validate UUID format
    const validation = VerifyRequestSchema.safeParse({ logId });
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid logId format (must be UUID)' },
        { status: 400 }
      );
    }

    // Create bridge and verify
    const bridge = createPolygonBridge();
    const result = await bridge.verifyLog(logId);

    return NextResponse.json({
      logId,
      verified: result.valid,
      exists: result.exists,
      metadataHash: result.metadataHash,
      ipfsCid: result.ipfsCid,
      timestamp: result.timestamp,
      contractAddress: bridge.getContractAddress(),
    });
  } catch (error: any) {
    console.error('Blockchain verification error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to verify log' },
      { status: 500 }
    );
  }
}
