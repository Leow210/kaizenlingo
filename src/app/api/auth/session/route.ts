// app/api/auth/session/route.ts
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';
import { verify } from 'jsonwebtoken';

export async function GET() {
    try {
        const cookieStore = await cookies();
        const token = cookieStore.get('auth-token');

        if (!token) {
            return NextResponse.json({ user: null });
        }

        const decoded = verify(token.value, process.env.JWT_SECRET!);
        const userId = typeof decoded === 'string' ? decoded : decoded.sub;

        const user = await prisma.user.findUnique({
            where: { id: userId as string },
            select: {
                id: true,
                email: true,
                name: true,
                nativeLanguage: true,
            },
        });

        if (!user) {
            return NextResponse.json({ user: null });
        }

        return NextResponse.json({ user });
    } catch (error) {
        console.error('Session check failed:', error);
        return NextResponse.json({ user: null });
    }
}