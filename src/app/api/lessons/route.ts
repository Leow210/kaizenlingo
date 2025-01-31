// app/api/lessons/route.ts
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '../../../lib/prisma';
import { verify } from 'jsonwebtoken';

export async function GET(request: Request) {
    try {
        const cookieStore = cookies();
        const token = cookieStore.get('auth-token');
        const { searchParams } = new URL(request.url);

        const where: any = {
            OR: [
                { isAiGenerated: false }, // System lessons
                { isAiGenerated: true } // AI-generated lessons
            ]
        };

        if (token) {
            const decoded = verify(token.value, process.env.JWT_SECRET!);
            if (decoded && typeof decoded !== 'string') {
                const userId = decoded.sub as string;
                // For authenticated users, include their AI-generated lessons
                where.OR[1].userId = userId;
            }
        }

        // Rest of your existing filters
        const level = searchParams.get('level');
        const category = searchParams.get('category');
        const search = searchParams.get('search');

        if (level) where.level = level;
        if (category) where.category = category;
        if (search) {
            where.OR = [
                { title: { contains: search, mode: 'insensitive' } },
                { topic: { contains: search, mode: 'insensitive' } },
                { tags: { hasSome: [search] } }
            ];
        }

        const lessons = await prisma.lesson.findMany({
            where,
            orderBy: [{ createdAt: 'desc' }],
            include: {
                progress: {
                    select: { completed: true, score: true }
                }
            }
        });

        return NextResponse.json({ lessons });
    } catch (error) {
        return NextResponse.json(
            { error: 'Failed to fetch lessons' },
            { status: 500 }
        );
    }
}