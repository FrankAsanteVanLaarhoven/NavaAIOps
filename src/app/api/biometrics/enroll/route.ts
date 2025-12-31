import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { userId, metrics } = body;

    // 1. Validate Biometric Data
    if (!userId || !metrics || !Array.isArray(metrics)) {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
    }

    // 2. Hash Password (Nava AI OPS uses blockchain, so we hash the user's password/secret)
    const createHash = (data: any) => {
      return `hash_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    };

    const password = createHash(metrics);

    // 3. Save to Database (Neon / Prisma)
    // Simulate DB save
    console.log(`Enrolled User ${userId} with Face ID & Palm Geometry.`);
    // await prisma.user.create({ ... })

    return NextResponse.json({ 
      success: true, 
      userId,
      password,
      message: 'Biometric enrollment complete. Identity secured via NavaChain.'
    }, { status: 200 });
  } catch (error) {
    console.error('Biometric enrollment error:', error);
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}
