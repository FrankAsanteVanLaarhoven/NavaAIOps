import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  try {
    const channels = await db.channel.findMany({
      include: {
        threads: {
          take: 1,
          orderBy: { updatedAt: 'desc' },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });
    
    return NextResponse.json(channels);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to fetch channels' },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const { name } = await req.json();
    
    const channel = await db.channel.create({
      data: { name },
    });
    
    return NextResponse.json(channel);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to create channel' },
      { status: 500 }
    );
  }
}
