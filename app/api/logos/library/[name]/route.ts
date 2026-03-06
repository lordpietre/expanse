import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ name: string }> }
) {
    const { name } = await params;

    // We expect 'name' to be the normalized slug (e.g. 'mariadb')
    const logosDir = path.resolve(process.cwd(), 'public/logos/library');

    const extensions = ['svg', 'png', 'jpg', 'jpeg', 'webp', 'ico'];

    for (const ext of extensions) {
        const filePath = path.join(logosDir, `${name}.${ext}`);
        if (fs.existsSync(filePath)) {
            const fileBuffer = fs.readFileSync(filePath);
            const contentType = ext === 'svg' ? 'image/svg+xml' : `image/${ext}`;

            return new NextResponse(fileBuffer, {
                headers: {
                    'Content-Type': contentType,
                    'Cache-Control': 'public, max-age=86400, stale-while-revalidate=3600',
                },
            });
        }
    }

    // Final fallback: redirect to a generic placeholder or 404
    return new NextResponse('Not Found', { status: 404 });
}
