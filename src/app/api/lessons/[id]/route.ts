
// app/api/lessons/[id]/route.ts
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '../../../../lib/prisma';
import { verify } from 'jsonwebtoken';

export async function GET(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const lesson = await prisma.lesson.findUnique({
            where: { id: params.id },
            include: {
                progress: {
                    select: {
                        completed: true,
                        score: true,
                        attempts: true
                    }
                }
            }
        });

        if (!lesson) {
            return NextResponse.json(
                { error: 'Lesson not found' },
                { status: 404 }
            );
        }

        return NextResponse.json(lesson);
    } catch (error) {
        console.error('Failed to fetch lesson:', error);
        return NextResponse.json(
            { error: 'Failed to fetch lesson' },
            { status: 500 }
        );
    }
}

// Update progress after completing a lesson
export async function POST(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const cookieStore = cookies();
        const token = cookieStore.get('auth-token');
        if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const decoded = verify(token.value, process.env.JWT_SECRET!);
        if (!decoded || typeof decoded === 'string') {
            return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
        }
        const userId = decoded.sub as string;

        const { completed, score } = await request.json();

        // Validate lesson exists
        const lesson = await prisma.lesson.findUnique({
            where: { id: params.id }
        });
        if (!lesson) return NextResponse.json({ error: 'Lesson not found' }, { status: 404 });

        const progress = await prisma.progress.upsert({
            where: { userId_lessonId: { userId, lessonId: params.id } },
            update: {
                completed,
                score,
                attempts: { increment: 1 },
                ...(completed && { completedAt: new Date() })
            },
            create: {
                userId,
                lessonId: params.id,
                completed,
                score,
                attempts: 1,
                completedAt: completed ? new Date() : null
            }
        });

        // Update user stats
        if (completed) {
            await prisma.user.update({
                where: { id: userId },
                data: { completedLessons: { increment: 1 } }
            });
        }

        return NextResponse.json(progress);
    } catch (error) {
        return NextResponse.json(
            { error: 'Failed to update progress' },
            { status: 500 }
        );
    }
}

export async function DELETE(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const cookieStore = cookies();
        const token = cookieStore.get('auth-token');
        if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const decoded = verify(token.value, process.env.JWT_SECRET!);
        if (!decoded || typeof decoded === 'string') {
            return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
        }

        // Delete lesson and associated progress
        await prisma.$transaction([
            prisma.progress.deleteMany({
                where: { lessonId: params.id }
            }),
            prisma.lesson.delete({
                where: {
                    id: params.id,
                    userId: decoded.sub as string
                }
            })
        ]);

        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json(
            { error: 'Failed to delete lesson' },
            { status: 500 }
        );
    }
}

