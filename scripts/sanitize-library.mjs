import fs from 'fs';
import path from 'path';

const libraryDir = path.resolve(process.cwd(), 'data/library');

function normalizeName(name) {
    return name
        .toLowerCase()
        .replace(/[\s\-_]+/g, '-')
        .replace(/[^a-z0-9\-]/g, '')
        .replace(/^-|-$/g, '');
}

function recursiveClean(obj) {
    let changed = false;
    if (Array.isArray(obj)) {
        for (let i = 0; i < obj.length; i++) {
            if (recursiveClean(obj[i])) changed = true;
        }
    } else if (obj !== null && typeof obj === 'object') {
        for (const key in obj) {
            if (key === 'logo' && typeof obj[key] === 'string') {
                if (!obj[key].startsWith('http')) {
                    let baseName = obj[key].split('/').pop() || obj[key];
                    baseName = baseName.replace(/\.[^/.]+$/, ""); // Remove extension
                    const normalized = normalizeName(baseName);
                    if (obj[key] !== normalized) {
                        console.log(`  Cleaning logo: ${obj[key]} -> ${normalized}`);
                        obj[key] = normalized;
                        changed = true;
                    }
                }
            } else {
                if (recursiveClean(obj[key])) changed = true;
            }
        }
    }
    return changed;
}

const files = fs.readdirSync(libraryDir);
let updatedCount = 0;

for (const file of files) {
    if (!file.endsWith('.json')) continue;

    const filePath = path.join(libraryDir, file);
    const rawContent = fs.readFileSync(filePath, 'utf-8');

    // Clean trailing commas
    const cleanContent = rawContent.replace(/,(\s*[\]}])/g, '$1');

    let data;
    try {
        data = JSON.parse(cleanContent);
    } catch (e) {
        console.error(`Error parsing ${file}:`, e);
        continue;
    }

    let changed = recursiveClean(data);

    // Also check if logo is altogether missing at top level
    if (!data.logo && data.name) {
        data.logo = normalizeName(data.name);
        console.log(`  Added top-level logo for ${file}: ${data.logo}`);
        changed = true;
    }

    if (changed || rawContent !== cleanContent) {
        console.log(`Updating ${file}`);
        fs.writeFileSync(filePath, JSON.stringify(data, null, 4));
        updatedCount++;
    }
}

console.log(`Successfully processed and sanitized ${updatedCount} library files.`);
