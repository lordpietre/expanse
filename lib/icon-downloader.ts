import fs from 'fs';
import path from 'path';
import https from 'https';

// Must match scripts/sync-icons.mjs so build-time and runtime syncs agree.
// Keyed by the logo basename slug (same algorithm as resolveLogoPath in lib/utils.ts).
function logoSlug(logo: string): string {
    const clean = logo.startsWith('/') ? logo.slice(1) : logo;
    const inputFilename = clean.split('/').pop() || clean;
    const baseName = inputFilename.replace(/\.[^/.]+$/, "");
    return baseName
        .toLowerCase()
        .replace(/[\s_-]+/g, '-')
        .replace(/[^a-z0-9-]/g, '')
        .replace(/^-|-$/g, '');
}

function detectExt(url: string): string {
    const pathname = url.split('?')[0];
    const lastSeg = pathname.split('/').pop() || '';
    const m = lastSeg.match(/\.([a-zA-Z0-9]{2,5})$/);
    const ext = m ? m[1].toLowerCase() : 'png';
    const validExts = ['svg', 'png', 'jpg', 'jpeg', 'webp', 'ico'];
    return validExts.includes(ext) ? ext : 'png';
}

export class IconDownloader {
    private libraryDir: string;
    private logosDir: string;

    constructor() {
        this.libraryDir = path.resolve(process.cwd(), 'data/library');
        this.logosDir = path.resolve(process.cwd(), 'public/logos/library');
    }

    /**
     * Run the sync process: download missing icons.
     * Never deletes existing icons so runtime syncs don't undo build-time results.
     */
    public async syncIcons() {
        process.stdout.write('[IconDownloader] Starting icon sync...\n');

        if (!fs.existsSync(this.libraryDir)) {
            process.stdout.write('[IconDownloader] Library directory not found.\n');
            return;
        }
        if (!fs.existsSync(this.logosDir)) {
            fs.mkdirSync(this.logosDir, { recursive: true });
        }

        try {
            const neededIcons = this.getNeededIcons();
            process.stdout.write(`[IconDownloader] Found ${neededIcons.length} apps to sync.\n`);

            const existing = fs.readdirSync(this.logosDir);

            for (const { slug, source } of neededIcons) {
                const found = existing.some(f => f.startsWith(`${slug}.`));
                if (found) continue;

                process.stdout.write(`[IconDownloader] Syncing: ${slug}\n`);
                await this.syncOneIcon(slug, source);
                existing.push(`${slug}.${'x'}`);
            }

            process.stdout.write('[IconDownloader] Icon sync completed.\n');
        } catch (error) {
            process.stderr.write(`[IconDownloader] Sync failed: ${error}\n`);
        }
    }

    private async syncOneIcon(slug: string, source: string) {
        // If it's a full URL, try to download it directly
        if (source.startsWith('http')) {
            const ext = detectExt(source);
            const success = await this.downloadFile(source, path.join(this.logosDir, `${slug}.${ext}`));
            if (success) return;
        }

        // Otherwise (or if direct download failed), try our standard CDNs
        await this.tryDownload(slug);
    }

    private getNeededIcons(): { slug: string; source: string }[] {
        const files = fs.readdirSync(this.libraryDir);
        const needed = new Map<string, string>();

        for (const file of files) {
            if (!file.endsWith('.json')) continue;
            try {
                const content = JSON.parse(fs.readFileSync(path.join(this.libraryDir, file), 'utf-8'));
                // Only top-level templates carry a logo the UI will resolve.
                if (content && content.name && content.logo) {
                    const slug = logoSlug(content.logo);
                    if (slug && !needed.has(slug)) {
                        needed.set(slug, content.logo);
                    }
                }
            } catch { /* ignore error */ }
        }

        return Array.from(needed.entries()).map(([slug, source]) => ({ slug, source }));
    }

    private async tryDownload(slug: string): Promise<boolean> {
        const urls = [
            { url: `https://cdn.jsdelivr.net/gh/homarr-labs/dashboard-icons/svg/${slug}.svg`, ext: 'svg' },
            { url: `https://cdn.jsdelivr.net/gh/homarr-labs/dashboard-icons/png/${slug}.png`, ext: 'png' },
            { url: `https://raw.githubusercontent.com/IceWhaleTech/AppIcon/main/${slug.replace(/-/g, '')}.png`, ext: 'png' },
            { url: `https://raw.githubusercontent.com/IceWhaleTech/CasaOS-AppStore/main/Apps/${slug}/icon.png`, ext: 'png' },
            { url: `https://cdn.jsdelivr.net/gh/selfhst/icons/svg/${slug}.svg`, ext: 'svg' },
            { url: `https://cdn.simpleicons.org/${slug}`, ext: 'svg' }
        ];

        for (const { url, ext } of urls) {
            const destPath = path.join(this.logosDir, `${slug}.${ext}`);
            if (await this.downloadFile(url, destPath)) return true;
        }
        return false;
    }

    /**
     * Helper to execute GET request and save to disk
     */
    private downloadFile(url: string, dest: string): Promise<boolean> {
        return new Promise((resolve) => {
            // Some CDNs (e.g. Wikimedia) reject Node's default User-Agent with 403.
            const options = { headers: { 'User-Agent': 'expanse-sync-icons/1.0' } };
            https.get(url, options, (response: any) => {
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
                        resolve(this.downloadFile(response.headers.location, dest));
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
}