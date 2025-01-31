// app/api/user/stats/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';
import { cookies } from 'next/headers';
import { verify } from 'jsonwebtoken';

export async function GET() {
    try {
        const cookieStore = await cookies();
        const token = cookieStore.get('auth-token');

        if (!token) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        const decoded = verify(token.value, process.env.JWT_SECRET!);
        const userId = typeof decoded === 'string' ? decoded : decoded.sub;

        // Fetch user stats from database
        const userProgress = await prisma.progress.findMany({
            where: {
                userId: userId as string
            }
        });

        // Calculate stats
        const stats = {
            totalMinutes: await calculateTotalStudyTime(userId as string),
            wordsLearned: await calculateLearnedWords(userId as string),
            currentStreak: await calculateStreak(userId as string),
            completedLessons: userProgress.filter(p => p.completed).length
        };

        return NextResponse.json(stats);
    } catch (error) {
        console.error('Failed to fetch user stats:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

async function calculateTotalStudyTime(userId: string): Promise<number> {
    // Implement study time calculation logic
    return 120; // Placeholder
}

async function calculateLearnedWords(userId: string): Promise<number> {
    // Implement learned words calculation logic
    return 50; // Placeholder
}

async function calculateStreak(userId: string): Promise<number> {
    // Implement streak calculation logic
    return 5; // Placeholder
}