import fs from 'fs';
import path from 'path';
import https from 'https';

const libraryDir = path.resolve(process.cwd(), 'data/library');
const logosDir = path.resolve(process.cwd(), 'public/logos/library');

function normalizeName(name) {
    return name
        .toLowerCase()
        .replace(/[\s\-_]+/g, '-')
        .replace(/[^a-z0-9\-]/g, '')
        .replace(/^-|-$/g, '');
}

function downloadFile(url, dest) {
    return new Promise((resolve) => {
        https.get(url, (response) => {
            if (response.statusCode === 200) {
                const file = fs.createWriteStream(dest);
                response.pipe(file);
                file.on('finish', () => {
                    file.close();
                    resolve(true);
                });
                file.on('error', (err) => {
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
        }).on('error', (err) => {
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
        process.exit(0); // Don't fail the build if library is missing, but log it
    }

    if (!fs.existsSync(logosDir)) {
        fs.mkdirSync(logosDir, { recursive: true });
    }

    const files = fs.readdirSync(libraryDir);
    const needed = new Map();

    const visit = (obj) => {
        if (Array.isArray(obj)) {
            obj.forEach(visit);
        } else if (obj && typeof obj === 'object') {
            const name = obj.name || '';
            const logo = obj.logo || '';
            if (name) {
                const slug = normalizeName(name);
                if (slug && !needed.has(slug)) {
                    needed.set(slug, logo || slug);
                }
            }
            Object.values(obj).forEach(visit);
        }
    };

    for (const file of files) {
        if (!file.endsWith('.json')) continue;
        try {
            const content = JSON.parse(fs.readFileSync(path.join(libraryDir, file), 'utf-8'));
            visit(content);
        } catch (e) {
            console.warn(`[SyncIcons] Failed to parse ${file}: ${e.message}`);
        }
    }

    console.log(`[SyncIcons] Found ${needed.size} required icons.`);
    const neededList = Array.from(needed.entries());

    let count = 0;
    for (const [slug, source] of neededList) {
        const exists = fs.readdirSync(logosDir).some(f => f.startsWith(slug + '.'));
        if (exists) continue;

        let success = false;
        if (source.startsWith('http')) {
            const urlParts = source.split('?')[0].split('.');
            const ext = urlParts.length > 1 ? urlParts.pop().toLowerCase() : 'png';
            const validExts = ['svg', 'png', 'jpg', 'jpeg', 'webp', 'ico'];
            const finalExt = validExts.includes(ext) ? ext : 'png';
            success = await downloadFile(source, path.join(logosDir, `${slug}.${finalExt}`));
        }

        if (!success) {
            success = await tryDownload(slug);
        }

        if (success) count++;
    }

    console.log(`[SyncIcons] Successfully synced ${count} new icons.`);
    process.exit(0);
}

run().catch(err => {
    console.error('[SyncIcons] Fatal error:', err);
    process.exit(0); // We don't want to break the entire build if icons fail, but we log it
});
