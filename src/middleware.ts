import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Simple rate limiting middleware
// In production, integrate ArcJet or similar service
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

function getRateLimitKey(request: NextRequest): string {
  const ip = request.headers.get('x-forwarded-for') || 
             request.headers.get('x-real-ip') || 
             'unknown';
  return ip;
}

function checkRateLimit(key: string, limit: number = 10, window: number = 60000): boolean {
  const now = Date.now();
  const record = rateLimitMap.get(key);

  if (!record || now > record.resetAt) {
    rateLimitMap.set(key, { count: 1, resetAt: now + window });
    return true;
  }

  if (record.count >= limit) {
    return false;
  }

  record.count++;
  return true;
}

export async function middleware(request: NextRequest) {
  // Only apply rate limiting to API routes
  if (request.nextUrl.pathname.startsWith('/api/')) {
    const key = getRateLimitKey(request);
    
    // Rate limit: 10 requests per minute
    if (!checkRateLimit(key, 10, 60000)) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Please try again later.' },
        { status: 429 }
      );
    }

    // Basic bot detection (check user agent)
    const userAgent = request.headers.get('user-agent') || '';
    const suspiciousBots = ['bot', 'crawler', 'spider', 'scraper'];
    const isBot = suspiciousBots.some(bot => userAgent.toLowerCase().includes(bot));
    
    // Block known bots on sensitive endpoints
    if (isBot && request.nextUrl.pathname.includes('/api/ai/')) {
      return NextResponse.json(
        { error: 'Bot access denied' },
        { status: 403 }
      );
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/api/:path*',
  ],
};
