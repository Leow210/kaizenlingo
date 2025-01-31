// app/api/vocabulary/route.ts
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '../../../lib/prisma';
import { verify } from 'jsonwebtoken';

// GET all vocabulary with filters
export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const search = searchParams.get('search');
        const jlptLevel = searchParams.get('jlptLevel');
        const tag = searchParams.get('tag');

        // Build where clause
        const where: any = {};

        if (search) {
            where.OR = [
                { word: { contains: search } },
                { reading: { contains: search } },
                { meaning: { has: search } }
            ];
        }

        if (jlptLevel && jlptLevel !== 'all') {
            where.jlptLevel = jlptLevel;
        }

        if (tag) {
            where.tags = { has: tag };
        }

        const vocabulary = await prisma.vocabulary.findMany({
            where,
            include: {
                examples: true
            },
            orderBy: [
                { commonness: 'desc' },
                { word: 'asc' }
            ]
        });

        return NextResponse.json(vocabulary);
    } catch (error) {
        console.error('Failed to fetch vocabulary:', error);
        return NextResponse.json(
            { error: 'Failed to fetch vocabulary' },
            { status: 500 }
        );
    }
}

// POST new vocabulary
export async function POST(request: Request) {
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
        if (!decoded || typeof decoded === 'string') {
            return NextResponse.json(
                { error: 'Invalid token' },
                { status: 401 }
            );
        }

        const userId = decoded.sub as string;
        const body = await request.json();

        const vocabulary = await prisma.vocabulary.create({
            data: {
                ...body,
                userId,
                examples: {
                    create: body.examples || []
                }
            },
            include: {
                examples: true
            }
        });

        return NextResponse.json(vocabulary);
    } catch (error) {
        console.error('Failed to create vocabulary:', error);
        return NextResponse.json(
            { error: 'Failed to create vocabulary' },
            { status: 500 }
        );
    }
}