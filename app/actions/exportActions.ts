import { createHash } from 'crypto';
import sharp from 'sharp';
import path from 'path';

/**
 * Remove yellow background from PNG and make it transparent using sharp
 * @param pngBuffer - PNG buffer with yellow background
 * @returns PNG buffer with transparent background
 */
async function removeYellowBackground(pngBuffer: Buffer): Promise<Buffer> {
    // Convert PNG to raw RGBA data for pixel manipulation
    const { data, info } = await sharp(pngBuffer)
        .ensureAlpha()
        .raw()
        .toBuffer({ resolveWithObject: true });

    // Process pixels to remove yellow and make transparent
    for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];

        // Check if pixel is close to yellow (#FFFF00)
        // Yellow is R=255, G=255, B=0 with tolerance
        if (
            r > 240 &&
            g > 240 &&
            b < 15
        ) {
            // Make it fully transparent
            data[i + 3] = 0;
        }
    }

    // Convert back to PNG
    let result = await sharp(data, {
        raw: {
            width: info.width,
            height: info.height,
            channels: 4,
        },
    }).png().toBuffer();

    // Add watermark in top right corner
    try {
        const watermarkPath = path.join(process.cwd(), 'assets', 'watermark.png');

        // Resize watermark to small size (100px wide)
        const watermarkBuffer = await sharp(watermarkPath)
            .resize(300, 300, {
                fit: 'inside',
                withoutEnlargement: true,
            })
            .toBuffer();

        // Get the dimensions of the main image
        const metadata = await sharp(result).metadata();
        const imgWidth = metadata.width || 0;

        // Position: top-right with 10px padding
        const watermarkX = imgWidth - 300 - 10;
        const watermarkY = 10;

        // Composite the watermark onto the main image
        result = await sharp(result)
            .composite([
                {
                    input: watermarkBuffer,
                    left: watermarkX,
                    top: watermarkY,
                    blend: 'over',
                },
            ])
            .png()
            .toBuffer();
    } catch (error) {
        console.warn('Failed to add watermark:', error);
        // Continue without watermark if it fails
    }

    return result;
}

/**
 * Save an exported image from the client
 * @param composeId - The ID of the compose
 * @param imageBase64 - The base64 string of the image (PNG)
 * @returns PNG image as buffer after processing
 */
export async function processAndSaveClientExport(
    composeId: string,
    imageBase64: string
): Promise<Buffer> {
    // Remove the data:image/png;base64, prefix if it exists
    const base64Data = imageBase64.replace(/^data:image\/png;base64,/, "");
    let buffer = Buffer.from(base64Data, 'base64');

    // Remove yellow background and make it transparent (if needed, 
    // though the client might already handle transparency)
    buffer = await removeYellowBackground(buffer) as any;

    return buffer;
}

/**
 * Export playground and save to file with checksum-based naming
 * @param composeId - The ID of the compose to export
 * @param composeId - The ID of the compose to export
 * @returns File path where the PNG was saved
 */
export async function exportPlaygroundAsPNGToFile(
    composeId: string
): Promise<string> {
    const fs = await import('fs').then(m => m.promises);
    const path = await import('path');
    const mongodb = await import('@/lib/mongodb');
    const client = await mongodb.getMongoClient();

    try {
        const db = client.db('compose_craft');
        const collection = db.collection('composes');
        const { ObjectId } = await import('bson');

        const compose = await collection.findOne({
            _id: new ObjectId(composeId)
        });

        if (!compose) {
            throw new Error('Compose not found');
        }

        // Create checksum from compose data and metadata
        const dataString = JSON.stringify(compose.data) + JSON.stringify(compose.metadata);
        const checksum = createHash('sha256').update(dataString).digest('hex').substring(0, 16);

        // Create exports directory if it doesn't exist
        const exportsDir = path.join(process.cwd(), 'public', 'exports');
        await fs.mkdir(exportsDir, { recursive: true });

        // Generate filename based on checksum
        const filename = `playground-${checksum}.png`;
        const filepath = path.join(exportsDir, filename);

        console.log(filepath);

        // Check if file already exists - if so, return it without regenerating
        try {
            await fs.access(filepath);
            console.log(`Export file already exists: ${filename}`);
            return `/exports/${filename}`;
        } catch {
            // File doesn't exist, proceed with generation
        }

        // With Puppeteer removed, we can no longer generate images on the fly on the server.
        // Images must be provided by the client during save.
        throw new Error('Image not found in cache and server-side generation is disabled.');
    } catch (error) {
        console.error('Error saving PNG to file:', error);
        throw error;
    }
}
