import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get('limit') || '10', 10);

    const leaderboard = await db.userXP.findMany({
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
        achievements: {
          include: {
            achievement: true,
          },
        },
      },
      orderBy: {
        xp: 'desc',
      },
      take: limit,
    });

    // Format leaderboard with achievements
    const formatted = leaderboard.map((entry, index) => ({
      rank: index + 1,
      userId: entry.userId,
      name: entry.user.name || entry.user.email,
      xp: entry.xp,
      level: entry.level,
      streak: entry.streak,
      achievements: entry.achievements.map((ua) => ({
        id: ua.achievement.id,
        name: ua.achievement.name,
        icon: ua.achievement.icon,
      })),
    }));

    return NextResponse.json(formatted);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to fetch leaderboard' },
      { status: 500 }
    );
  }
}
