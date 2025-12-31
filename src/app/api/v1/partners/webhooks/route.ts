import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

const webhookSchema = z.object({
  event: z.enum(['threat_detected', 'incident_resolved', 'cmdp_decision', 'audit_log']),
  url: z.string().url(),
  secret: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Unauthorized. Missing or invalid API key.' },
        { status: 401 }
      );
    }

    const apiKey = authHeader.replace('Bearer ', '');
    // TODO: Validate API key against database
    
    const body = await request.json();
    const validated = webhookSchema.parse(body);

    // TODO: Store webhook in database
    // await db.webhook.create({
    //   data: {
    //     partnerId: partner.id,
    //     event: validated.event,
    //     url: validated.url,
    //     secret: validated.secret,
    //   }
    // });

    return NextResponse.json({
      success: true,
      message: 'Webhook registered successfully',
      webhookId: `wh_${Date.now()}`,
      event: validated.event,
      url: validated.url,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request body', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Webhook registration error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // TODO: Fetch webhooks from database
    return NextResponse.json({
      webhooks: [],
      message: 'List of registered webhooks',
    });
  } catch (error) {
    console.error('Webhook fetch error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
