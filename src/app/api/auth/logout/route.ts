import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST() {
    try {
        const cookieStore = await cookies();

        // Remove the auth token
        cookieStore.delete('auth-token');

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Logout failed:', error);
        return NextResponse.json(
            { error: 'Failed to logout' },
            { status: 500 }
        );
    }
}