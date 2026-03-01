"use server"

import fs from "fs";
import path from "path";
import { TemplateService } from "@/types/library";

export async function getLibraryServices(): Promise<TemplateService[]> {
    const libraryDir = path.resolve(process.cwd(), "data/library");
    console.log(`[Library] process.cwd(): ${process.cwd()}`);
    console.log(`[Library] libraryDir: ${libraryDir}`);

    try {
        if (!fs.existsSync(libraryDir)) {
            console.warn(`[Library] NOT FOUND: ${libraryDir}`);
            // Fallback: try relative to __dirname in case we are in a different context
            const fallbackDir = path.resolve(__dirname, "../../../data/library");
            console.log(`[Library] Trying fallback: ${fallbackDir}`);
            if (fs.existsSync(fallbackDir)) {
                return readFromDir(fallbackDir);
            }
            return [];
        }
        return readFromDir(libraryDir);
    } catch (error) {
        console.error("[Library] FATAL:", error);
        return [];
    }
}

const categoryOrder: Record<string, number> = {
    'Database': 0,
    'CMS': 1,
    'Social': 2,
    'AI': 3,
    'Automation': 4,
    'Web Server': 5,
    'Cache': 6,
    'Queue': 7,
    'Messaging': 8,
    'Network': 9,
    'Monitoring': 10,
    'Development': 11,
    'Cloud': 12,
    'Applications': 13,
    'Other': 14,
    'OS': 15,
};

const dbPopularity: Record<string, number> = {
    'PostgreSQL': 1,
    'MySQL': 2,
    'MongoDB': 3,
    'MariaDB': 4,
    'Redis': 5,
    'Neo4j': 6,
    'SQLite': 7,
    'CouchDB': 8,
    'ClickHouse': 9,
    'InfluxDB': 10,
    'TimescaleDB': 11,
    'CockroachDB': 12,
    'SurrealDB': 13,
    'ScyllaDB': 14,
    'Cassandra': 15,
};

const cmsPopularity: Record<string, number> = {
    'WordPress': 1,
    'Drupal': 2,
    'Joomla': 3,
    'Ghost': 4,
    'Strapi': 5,
    'Directus': 6,
    'Payload CMS': 7,
    'October CMS': 8,
    'TYPO3': 9,
    'Plone': 10,
};

const networkPopularity: Record<string, number> = {
    'Traefik': 1,
    'Nginx': 2,
    'Nginx Proxy Manager': 3,
    'WireGuard': 4,
    'WireGuard UI': 5,
    'NetBird': 6,
    'Headscale': 7,
    'Gluetun': 8,
    'OpenVPN AS': 9,
    'AmneziaVPN': 10,
    'Pi-hole': 11,
    'AdGuard Home': 12,
};

const cloudPopularity: Record<string, number> = {
    'Nextcloud': 1,
    'FileBrowser': 2,
    'Seafile': 3,
    'Cloudreve': 4,
    'OpenCloud': 5,
    'Ocis': 6,
    'Cozy': 7,
    'Syncthing': 8,
};

const socialPopularity: Record<string, number> = {
    'Mastodon': 1,
    'GoToSocial': 2,
    'Akkoma': 3,
    'Pleroma': 4,
    'Firefish': 5,
    'Misskey': 6,
    'Pixelfed': 7,
    'Lemmy': 8,
    'Friendica': 9,
};

const aiPopularity: Record<string, number> = {
    'Open WebUI': 1,
    'LibreChat': 2,
    'AnythingLLM': 3,
    'LobeChat': 4,
};

const automationPopularity: Record<string, number> = {
    'n8n': 1,
    'Activepieces': 2,
    'Node-RED': 3,
    'Windmill': 4,
    'Automatisch': 5,
    'Kestra': 6,
    'Huginn': 7,
    'Flowise': 8,
    'Apache Airflow': 9,
    'Budibase': 10,
};

function readFromDir(dir: string): TemplateService[] {
    const files = fs.readdirSync(dir);
    console.log(`[Library] Reading ${files.length} files from ${dir}`);
    const services: TemplateService[] = [];

    for (const file of files) {
        if (file.endsWith(".json")) {
            try {
                const filePath = path.join(dir, file);
                const content = fs.readFileSync(filePath, "utf-8");
                const service = JSON.parse(content);
                if (service.name && service.category) {
                    services.push(service);
                } else {
                    console.warn(`[Library] Invalid service in ${file}:`, service);
                }
            } catch (e) {
                console.error(`[Library] Failed to parse ${file}:`, e);
            }
        }
    }
    console.log(`[Library] Success: loaded ${services.length} services`);

    services.sort((a, b) => {
        const catOrderA = categoryOrder[a.category] ?? 99;
        const catOrderB = categoryOrder[b.category] ?? 99;

        if (catOrderA !== catOrderB) {
            return catOrderA - catOrderB;
        }

        if (a.category === 'Database' && b.category === 'Database') {
            const popA = dbPopularity[a.name] ?? 99;
            const popB = dbPopularity[b.name] ?? 99;
            return popA - popB;
        }

        if (a.category === 'CMS' && b.category === 'CMS') {
            const popA = cmsPopularity[a.name] ?? 99;
            const popB = cmsPopularity[b.name] ?? 99;
            return popA - popB;
        }

        if (a.category === 'Network' && b.category === 'Network') {
            const popA = networkPopularity[a.name] ?? 99;
            const popB = networkPopularity[b.name] ?? 99;
            return popA - popB;
        }

        if (a.category === 'Cloud' && b.category === 'Cloud') {
            const popA = cloudPopularity[a.name] ?? 99;
            const popB = cloudPopularity[b.name] ?? 99;
            return popA - popB;
        }

        if (a.category === 'Social' && b.category === 'Social') {
            const popA = socialPopularity[a.name] ?? 99;
            const popB = socialPopularity[b.name] ?? 99;
            return popA - popB;
        }

        if (a.category === 'AI' && b.category === 'AI') {
            const popA = aiPopularity[a.name] ?? 99;
            const popB = aiPopularity[b.name] ?? 99;
            return popA - popB;
        }

        if (a.category === 'Automation' && b.category === 'Automation') {
            const popA = automationPopularity[a.name] ?? 99;
            const popB = automationPopularity[b.name] ?? 99;
            return popA - popB;
        }

        return a.name.localeCompare(b.name);
    });

    return services;
}
