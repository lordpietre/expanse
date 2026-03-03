import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

async function verifyToken(token: string | undefined, secretKey: string): Promise<boolean> {
    if (!token) return false;
    try {
        await jwtVerify(token, new TextEncoder().encode(secretKey));
        return true;
    } catch {
        return false;
    }
}

export async function middleware(req: NextRequest) {
    const secretKey = process.env.SECRET_KEY;
    if (!secretKey) {
        console.error("SECRET_KEY environment variable is not configured.");
        return NextResponse.redirect(new URL("/", req.url));
    }

    // Read token directly from the request cookies (works in Edge middleware)
    const rawToken = req.cookies.get("token")?.value;

    const { pathname } = req.nextUrl;

    // Protected routes: redirect to home if not authenticated
    if (pathname.startsWith("/dashboard") || pathname.startsWith("/playground")) {
        const valid = await verifyToken(rawToken, secretKey);
        if (!valid) {
            const response = NextResponse.redirect(new URL("/", req.url));
            response.cookies.delete("token");
            return response;
        }
    }

    // Auth pages: redirect to dashboard if already authenticated
    if (
        (pathname.startsWith("/login") && !pathname.startsWith("/login/cli")) ||
        pathname.startsWith("/signin")
    ) {
        const valid = await verifyToken(rawToken, secretKey);
        if (valid) {
            return NextResponse.redirect(new URL("/dashboard", req.url));
        }
    }

    return NextResponse.next();
}

export const config = {
    matcher: ['/dashboard/:path*', '/playground/:path*', '/login/:path*', '/signin/:path*'],
};
