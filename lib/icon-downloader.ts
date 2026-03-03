import fs from 'fs';
import path from 'path';
import https from 'https';

// Known logos that should never be deleted
const PROTECTED_LOGOS = [
    'expanse.png',
    'expanse-dark.png',
    'og.png',
    'favicon.ico',
    'cgu.pdf'
];

// Folders in public that should be ignored
const PROTECTED_FOLDERS = [
    'image',
    'logos',
    '_next'
];

export class IconDownloader {
    private libraryDir: string;
    private logosDir: string;
    private publicDir: string;

    constructor() {
        this.libraryDir = path.resolve(process.cwd(), 'data/library');
        // We target public/logos/library to keep downloaded icons isolated
        this.logosDir = path.resolve(process.cwd(), 'public/logos/library');
        this.publicDir = path.resolve(process.cwd(), 'public');
    }

    /**
     * Run the sync process: clean old files and download missing ones.
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

            this.cleanupPublicRoot();

            // We'll clean up icons that are no longer in the neededIcons list
            const neededSlugs = neededIcons.map(i => i.slug);
            this.cleanupOldIcons(neededSlugs);

            for (const { slug, source } of neededIcons) {
                const existing = fs.readdirSync(this.logosDir).find(f => f.startsWith(`${slug}.`));
                if (existing) continue;

                process.stdout.write(`[IconDownloader] Syncing: ${slug}\n`);
                await this.syncOneIcon(slug, source);
            }

            process.stdout.write('[IconDownloader] Icon sync completed.\n');
        } catch (error) {
            process.stderr.write(`[IconDownloader] Sync failed: ${error}\n`);
        }
    }

    private async syncOneIcon(slug: string, source: string) {
        // If it's a full URL, try to download it directly
        if (source.startsWith('http')) {
            const ext = source.split('.').pop()?.split('?')[0].toLowerCase() || 'png';
            const validExts = ['svg', 'png', 'jpg', 'jpeg', 'webp'];
            const finalExt = validExts.includes(ext) ? ext : 'png';

            const success = await this.downloadFile(source, path.join(this.logosDir, `${slug}.${finalExt}`));
            if (success) return;
        }

        // Otherwise (or if direct download failed), try our standard CDNs
        await this.tryDownload(slug);
    }

    private getNeededIcons(): { slug: string; source: string }[] {
        const files = fs.readdirSync(this.libraryDir);
        const needed = new Map<string, string>();

        const visit = (obj: any) => {
            if (Array.isArray(obj)) {
                obj.forEach(visit);
            } else if (obj && typeof obj === 'object') {
                const name = obj.name || '';
                const logo = obj.logo || '';

                if (name) {
                    const slug = this.normalizeName(name);
                    if (slug && !needed.has(slug)) {
                        needed.set(slug, logo || slug);
                    }
                }

                // Recursively check related_services etc.
                Object.values(obj).forEach(visit);
            }
        };

        for (const file of files) {
            if (!file.endsWith('.json')) continue;
            try {
                const content = JSON.parse(fs.readFileSync(path.join(this.libraryDir, file), 'utf-8'));
                visit(content);
            } catch (e) { }
        }

        return Array.from(needed.entries()).map(([slug, source]) => ({ slug, source }));
    }

    private cleanupOldIcons(neededSlugs: string[]) {
        const files = fs.readdirSync(this.logosDir);
        for (const file of files) {
            if (PROTECTED_LOGOS.includes(file)) continue;
            const slug = file.replace(/\.[^/.]+$/, "");
            if (!neededSlugs.includes(slug)) {
                try { fs.unlinkSync(path.join(this.logosDir, file)); } catch (e) { }
            }
        }
    }

    private async tryDownload(slug: string): Promise<boolean> {
        const urls = [
            { url: `https://cdn.jsdelivr.net/gh/homarr-labs/dashboard-icons/svg/${slug}.svg`, ext: 'svg' },
            { url: `https://cdn.jsdelivr.net/gh/homarr-labs/dashboard-icons/png/${slug}.png`, ext: 'png' },
            { url: `https://raw.githubusercontent.com/IceWhaleTech/AppIcon/main/${slug.replace(/-/g, '')}.png`, ext: 'png' },
            { url: `https://raw.githubusercontent.com/IceWhaleTech/CasaOS-AppStore/main/Apps/${slug}/icon.png`, ext: 'png' },
            { url: `https://cdn.simpleicons.org/${slug}`, ext: 'svg' }
        ];

        for (const { url, ext } of urls) {
            const destPath = path.join(this.logosDir, `${slug}.${ext}`);
            if (await this.downloadFile(url, destPath)) return true;
        }
        return false;
    }


    /**
     * Cleans loose .png/.svg files from public/ that aren't protected.
     */
    private cleanupPublicRoot() {
        const files = fs.readdirSync(this.publicDir);
        for (const file of files) {
            const fullPath = path.join(this.publicDir, file);
            const stat = fs.statSync(fullPath);

            if (stat.isDirectory()) {
                if (PROTECTED_FOLDERS.includes(file)) continue;
                continue;
            }
            if (PROTECTED_LOGOS.includes(file)) continue;

            const ext = path.extname(file).toLowerCase();
            if (ext === '.png' || ext === '.svg') {
                process.stdout.write(`[IconDownloader] Removing legacy logo from public/: ${file}\n`);
                fs.unlinkSync(fullPath);
            }
        }
    }

    /**
     * Helper to execute GET request and save to disk
     */
    private downloadFile(url: string, dest: string): Promise<boolean> {
        return new Promise((resolve) => {
            https.get(url, (response: any) => {
                if (response.statusCode === 200) {
                    const file = fs.createWriteStream(dest);
                    response.pipe(file);
                    file.on('finish', () => {
                        file.close();
                        resolve(true);
                    });
                    file.on('error', (err: any) => {
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
            }).on('error', (err: any) => {
                fs.unlink(dest, () => { });
                resolve(false);
            });
        });
    }

    /**
     * Normalize a name to kebab-case
     */
    private normalizeName(name: string): string {
        return name
            .toLowerCase()
            .replace(/[\s\-_]+/g, '-')
            .replace(/[^a-z0-9\-]/g, '')
            .replace(/^-|-$/g, '');
    }
}

