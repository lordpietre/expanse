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
            resolve(false);
        });
    });
}

async function tryDownload(name) {
    const urls = [
        { url: `https://cdn.jsdelivr.net/gh/homarr-labs/dashboard-icons/svg/${name}.svg`, ext: 'svg' },
        { url: `https://cdn.jsdelivr.net/gh/homarr-labs/dashboard-icons/png/${name}.png`, ext: 'png' },
        { url: `https://raw.githubusercontent.com/IceWhaleTech/AppIcon/main/${name.replace(/-/g, '')}.png`, ext: 'png' },
        { url: `https://raw.githubusercontent.com/IceWhaleTech/CasaOS-AppStore/main/Apps/${name}/icon.png`, ext: 'png' }
    ];

    for (const { url, ext } of urls) {
        const destPath = path.join(logosDir, `${name}.${ext}`);
        try {
            const success = await downloadFile(url, destPath);
            if (success) {
                console.log(`  [OK] ${name}.${ext} from CDNs`);
                return true;
            }
        } catch (e) {
            // continue
        }
    }
    return false;
}

async function run() {
    console.log('Checking library directory:', libraryDir);
    if (!fs.existsSync(libraryDir)) {
        console.error('Library directory NOT FOUND');
        return;
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
        const content = JSON.parse(fs.readFileSync(path.join(libraryDir, file), 'utf-8'));
        visit(content);
    }

    console.log(`Found ${needed.size} needed icons.`);
    const neededList = Array.from(needed.entries()).map(([slug, source]) => ({ slug, source }));

    for (const { slug, source } of neededList) {
        const exists = fs.readdirSync(logosDir).some(f => f.startsWith(slug + '.'));
        if (exists) {
            // console.log(`[SKIP] ${slug} already exists`);
            continue;
        }

        console.log(`[SYNC] ${slug} (source: ${source})...`);

        let success = false;
        if (source.startsWith('http')) {
            const ext = source.split('.').pop()?.split('?')[0].toLowerCase() || 'png';
            success = await downloadFile(source, path.join(logosDir, `${slug}.${ext}`));
            if (success) console.log(`  [OK] from direct URL`);
        }

        if (!success) {
            success = await tryDownload(slug);
        }

        if (!success) {
            console.log(`  [FAIL] ${slug}`);
        }
    }

    console.log('Sync finished.');
}
run().catch(console.error);

