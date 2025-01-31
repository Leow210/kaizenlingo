import { NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';
import { verify } from 'jsonwebtoken';
import { cookies } from 'next/headers';

export async function PATCH(
    request: Request,
    { params }: { params: { lessonId: string } }
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

        const progress = await prisma.progress.update({
            where: { userId_lessonId: { userId, lessonId: params.lessonId } },
            data: {
                completed,
                score,
                ...(completed && { completedAt: new Date() }),
                attempts: { increment: 1 }
            }
        });

        return NextResponse.json(progress);
    } catch (error) {
        return NextResponse.json(
            { error: 'Failed to update progress' },
            { status: 500 }
        );
    }
}