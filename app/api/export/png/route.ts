import { NextRequest, NextResponse } from 'next/server';
import { createHash } from 'crypto';
import { promises as fs } from 'fs';
import path from 'path';
import client from '@/lib/mongodb';
import { ObjectId } from 'bson';


export async function GET(request: NextRequest) {
    try {
        const shareId = request.nextUrl.searchParams.get('shareId');

        if (!shareId) {
            return NextResponse.json(
                { error: 'Share ID is required' },
                { status: 400 }
            );
        }

        // Get compose data and metadata from database via share
        const mongodb = await client;
        const db = mongodb.db('compose_craft');
        const sharesCollection = db.collection('shares');

        // First, find the share to get the composeId
        const share = await sharesCollection.findOne({
            _id: new ObjectId(shareId)
        });

        if (!share) {
            return NextResponse.json(
                { error: 'Share not found' },
                { status: 404 }
            );
        }

        // Verify share is public
        if (share.access !== 'public') {
            return NextResponse.json(
                { error: 'Share is not public' },
                { status: 403 }
            );
        }

        const composeId = share.composeId;
        const collection = db.collection('composes');

        const compose = await collection.findOne({
            _id: new ObjectId(composeId)
        });

        if (!compose) {
            return NextResponse.json(
                { error: 'Compose not found' },
                { status: 404 }
            );
        }

        // Create checksum from compose data and metadata
        const dataString = JSON.stringify(compose.data) + JSON.stringify(compose.metadata);
        const checksum = createHash('sha256').update(dataString).digest('hex').substring(0, 16);
        const filename = `playground-${checksum}.png`;
        const filepath = path.join(process.cwd(), 'public', 'exports', filename);

        // Check if file already exists
        let fileBuffer: Buffer | null = null;
        try {
            fileBuffer = await fs.readFile(filepath);
            console.log(`Using cached export file: ${filename}`);
        } catch {
            // File doesn't exist, and we can no longer generate it on the server
            return NextResponse.json(
                { error: 'Thumbnail not available. Please save the project in the playground to generate it.' },
                { status: 404 }
            );
        }

        return new NextResponse(fileBuffer as any, {
            headers: {
                'Content-Type': 'image/png',
                'Content-Disposition': `attachment; filename="${filename}"`,
            },
        });
    } catch (error) {
        console.error('Error exporting playground as PNG via API:', error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Failed to export playground' },
            { status: 500 }
        );
    }
}
