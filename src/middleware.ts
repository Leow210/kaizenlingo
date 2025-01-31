// middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// This function can be marked `async` if using `await` inside
export function middleware(request: NextRequest) {
    const authToken = request.cookies.get('auth-token');
    const { pathname } = request.nextUrl;

    // Define public paths that don't require authentication
    const publicPaths = ['/', '/login', '/register'];

    // Auth paths that should redirect to dashboard if already logged in
    const authPaths = ['/login', '/register'];

    // Check if the path is public
    const isPublicPath = publicPaths.includes(pathname);

    // If user is logged in and tries to access login/register, redirect to dashboard
    if (authToken && authPaths.includes(pathname)) {
        return NextResponse.redirect(new URL('/dashboard', request.url));
    }

    // If path requires auth and user isn't logged in, redirect to login
    if (!authToken && !isPublicPath) {
        const loginUrl = new URL('/login', request.url);
        loginUrl.searchParams.set('callbackUrl', pathname);
        return NextResponse.redirect(loginUrl);
    }

    return NextResponse.next();
}

// Configure the paths that middleware should run on
export const config = {
    matcher: [
        /*
         * Match all request paths except:
         * - api (API routes)
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         * - public folder
         */
        '/((?!api|_next/static|_next/image|favicon.ico|public).*)',
    ],
};