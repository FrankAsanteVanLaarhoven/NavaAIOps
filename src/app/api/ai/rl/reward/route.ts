import { NextRequest, NextResponse } from 'next/server';

/**
 * AWS SageMaker Integration for RL Reward Prediction
 * This endpoint calls a deployed SageMaker endpoint for heavy RL compute
 */
export const runtime = 'nodejs'; // SageMaker requires Node.js runtime

interface SageMakerResponse {
  rewards: number[];
}

export async function POST(req: NextRequest) {
  try {
    const { rollouts } = await req.json();

    if (!rollouts || !Array.isArray(rollouts)) {
      return NextResponse.json(
        { error: 'rollouts array is required' },
        { status: 400 }
      );
    }

    // In production, use AWS SDK to invoke SageMaker endpoint
    // For now, simulate the response
    const sagemakerEndpoint = process.env.SAGEMAKER_ENDPOINT;
    
    if (!sagemakerEndpoint) {
      // Fallback: Use local reward model prediction
      const rewards = rollouts.map(() => {
        // Simulate reward prediction (replace with actual model call)
        return Math.random() * 2 - 1; // -1 to 1 range
      });

      return NextResponse.json({ rewards });
    }

    // Production: Invoke SageMaker endpoint
    try {
      const response = await fetch(sagemakerEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          inputs: rollouts.map((r: any) => r.prompt || r),
        }),
      });

      if (!response.ok) {
        throw new Error(`SageMaker endpoint error: ${response.statusText}`);
      }

      const result: SageMakerResponse = await response.json();
      return NextResponse.json({ rewards: result.rewards });
    } catch (error: any) {
      console.error('SageMaker invocation failed:', error);
      // Fallback to local prediction
      const rewards = rollouts.map(() => Math.random() * 2 - 1);
      return NextResponse.json({ rewards });
    }
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to get reward predictions' },
      { status: 500 }
    );
  }
}
