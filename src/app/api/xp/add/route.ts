import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { z } from 'zod';

const schema = z.object({
  userId: z.string(),
  xp: z.number().min(1),
  reason: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { userId, xp, reason } = schema.parse(body);

    // Get or create user XP
    const userXP = await db.userXP.upsert({
      where: { userId },
      create: {
        userId,
        xp,
        level: Math.floor(xp / 100) + 1,
        lastActive: new Date(),
      },
      update: {
        xp: {
          increment: xp,
        },
        level: {
          set: Math.floor((await db.userXP.findUnique({ where: { userId } }))?.xp || 0 + xp) / 100 + 1,
        },
        lastActive: new Date(),
      },
    });

    // Check for achievements
    const achievements = await db.achievement.findMany({
      where: {
        xpReward: {
          lte: userXP.xp,
        },
      },
    });

    // Unlock achievements
    for (const achievement of achievements) {
      await db.userAchievement.upsert({
        where: {
          userId_achievementId: {
            userId,
            achievementId: achievement.id,
          },
        },
        create: {
          userId,
          achievementId: achievement.id,
        },
        update: {},
      });
    }

    return NextResponse.json({
      success: true,
      xp: userXP.xp,
      level: userXP.level,
      achievements: achievements.length,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to add XP' },
      { status: 500 }
    );
  }
}
