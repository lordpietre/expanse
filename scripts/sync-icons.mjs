import fs from 'fs';
import path from 'path';
import https from 'https';

const libraryDir = path.resolve(process.cwd(), 'data/library');
const logosDir = path.resolve(process.cwd(), 'public/logos/library');

// Must match the normalization used by resolveLogoPath() in lib/utils.ts
// so that downloaded filenames always match the slugs the UI requests.
function logoSlug(logo) {
    const clean = logo.startsWith('/') ? logo.slice(1) : logo;
    const inputFilename = clean.split('/').pop() || clean;
    const baseName = inputFilename.replace(/\.[^/.]+$/, "");
    return baseName
        .toLowerCase()
        .replace(/[\s_-]+/g, '-')
        .replace(/[^a-z0-9-]/g, '')
        .replace(/^-|-$/g, '');
}

function detectExt(url) {
    const pathname = url.split('?')[0];
    const lastSeg = pathname.split('/').pop() || '';
    const m = lastSeg.match(/\.([a-zA-Z0-9]{2,5})$/);
    const ext = m ? m[1].toLowerCase() : 'png';
    const validExts = ['svg', 'png', 'jpg', 'jpeg', 'webp', 'ico'];
    return validExts.includes(ext) ? ext : 'png';
}

function downloadFile(url, dest) {
    return new Promise((resolve) => {
        // Some CDNs (e.g. Wikimedia) reject Node's default User-Agent with 403.
        const options = { headers: { 'User-Agent': 'expanse-sync-icons/1.0' } };
        https.get(url, options, (response) => {
            if (response.statusCode === 200) {
                const file = fs.createWriteStream(dest);
                response.pipe(file);
                file.on('finish', () => {
                    file.close();
                    resolve(true);
                });
                file.on('error', () => {
                    fs.unlink(dest, () => { });
                    resolve(false);
                });
            } else if (response.statusCode === 301 || response.statusCode === 302) {
                if (response.headers.location) {
                    resolve(downloadFile(response.headers.location, dest));
                } else {
                    resolve(false);
                }
            } else {
                resolve(false);
            }
        }).on('error', () => {
            fs.unlink(dest, () => { });
            resolve(false);
        });
    });
}

async function tryDownload(slug) {
    const urls = [
        { url: `https://cdn.jsdelivr.net/gh/homarr-labs/dashboard-icons/svg/${slug}.svg`, ext: 'svg' },
        { url: `https://cdn.jsdelivr.net/gh/homarr-labs/dashboard-icons/png/${slug}.png`, ext: 'png' },
        { url: `https://raw.githubusercontent.com/IceWhaleTech/AppIcon/main/${slug.replace(/-/g, '')}.png`, ext: 'png' },
        { url: `https://raw.githubusercontent.com/IceWhaleTech/CasaOS-AppStore/main/Apps/${slug}/icon.png`, ext: 'png' },
        { url: `https://cdn.jsdelivr.net/gh/selfhst/icons/svg/${slug}.svg`, ext: 'svg' },
        { url: `https://cdn.simpleicons.org/${slug}`, ext: 'svg' }
    ];

    for (const { url, ext } of urls) {
        const destPath = path.join(logosDir, `${slug}.${ext}`);
        if (await downloadFile(url, destPath)) return true;
    }
    return false;
}

async function run() {
    console.log('[SyncIcons] Checking library directory:', libraryDir);
    if (!fs.existsSync(libraryDir)) {
        console.error('[SyncIcons] Library directory NOT FOUND');
        process.exit(0);
    }

    if (!fs.existsSync(logosDir)) {
        fs.mkdirSync(logosDir, { recursive: true });
    }

    const files = fs.readdirSync(libraryDir);
    const needed = new Map();

    for (const file of files) {
        if (!file.endsWith('.json')) continue;
        try {
            const content = JSON.parse(fs.readFileSync(path.join(libraryDir, file), 'utf-8'));
            // Only top-level templates carry a logo the UI will resolve.
            if (content && content.name && content.logo) {
                const slug = logoSlug(content.logo);
                if (slug && !needed.has(slug)) {
                    needed.set(slug, content.logo);
                }
            }
        } catch (e) {
            console.warn(`[SyncIcons] Failed to parse ${file}: ${e.message}`);
        }
    }

    console.log(`[SyncIcons] Found ${needed.size} required icons.`);

    let count = 0;
    const stillMissing = [];
    const existing = fs.readdirSync(logosDir);

    for (const [slug, source] of needed) {
        const exists = existing.some(f => f.startsWith(slug + '.'));
        if (exists) continue;

        let success = false;
        if (source.startsWith('http')) {
            const ext = detectExt(source);
            success = await downloadFile(source, path.join(logosDir, `${slug}.${ext}`));
        }

        if (!success) {
            success = await tryDownload(slug);
        }

        if (success) {
            count++;
            existing.push(`${slug}.${'x'}`);
        } else {
            stillMissing.push(slug);
        }
    }

    console.log(`[SyncIcons] Successfully synced ${count} new icons.`);
    if (stillMissing.length > 0) {
        console.log(`[SyncIcons] WARNING - ${stillMissing.length} icons could not be fetched:`);
        stillMissing.forEach(s => console.log(`  - ${s}`));
    }
    process.exit(0);
}

run().catch(err => {
    console.error('[SyncIcons] Fatal error:', err);
    process.exit(0);
});