import { NextRequest, NextResponse } from 'next/server';
import { executeCMDPPipeline } from '@/lib/services/cmdp-pipeline';
import { z } from 'zod';

const CMDPRequestSchema = z.object({
  context: z.any(),
  incidentId: z.string(),
  workspaceId: z.string(),
});

/**
 * CMDP Pipeline API Endpoint
 * Executes the full CMDP verification loop:
 * Plan -> Search -> Reason -> Verify -> Constrain -> Execute
 */
export const runtime = 'nodejs'; // Requires database access

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const input = CMDPRequestSchema.parse(body);

    const result = await executeCMDPPipeline({ input });

    return NextResponse.json(result);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: error.message || 'CMDP pipeline execution failed' },
      { status: 500 }
    );
  }
}
