import { NextRequest, NextResponse } from 'next/server';
import { planChain, executeCMDPChain } from '@/lib/ai/cmdp-loop';

/**
 * CMDP Loop API
 * Plan -> Retrieve -> Reason -> Constrain -> Execute
 */
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { context, workspaceId, incidentId, execute = false } = body;

    if (!context) {
      return NextResponse.json({ error: 'context is required' }, { status: 400 });
    }

    // Step 1: PLAN
    const plan = await planChain({ context });

    if (!execute) {
      // Return plan only
      return NextResponse.json({ plan });
    }

    // Execute the CMDP chain
    const executionLog = await executeCMDPChain({
      plan,
      context,
      workspaceId,
      incidentId,
    });

    return NextResponse.json({
      plan,
      executionLog,
      allApproved: executionLog.every(
        (log) => log.validationRuleBased.allowed && log.verificationAgent.approved
      ),
    });
  } catch (error: any) {
    console.error('CMDP error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to execute CMDP loop' },
      { status: 500 }
    );
  }
}
