"use server"

import fs from "fs";
import path from "path";
import { TemplateService } from "@/types/library";

export async function getLibraryServices(): Promise<TemplateService[]> {
    const libraryDir = path.resolve(process.cwd(), "data/library");

    try {
        if (!fs.existsSync(libraryDir)) {
            console.warn(`[Library] Directory not found: ${libraryDir}`);
            const fallbackDir = path.resolve(__dirname, "../../../data/library");
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
    'Web Server': 1,
    'Cache': 2,
    'Social': 3,
    'CMS': 4,
    'Network': 5,
    'Monitoring': 6,
    'Automation': 7,
    'Cloud': 8,
    'AI': 9,
    'Utilities': 10,
    'Development': 11,
    'Messaging': 12,
    'Queue': 13,
    'Applications': 14,
    'OS': 15,
    'Other': 16,
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
    'Ghost (Full Stack)': 1,
    'WordPress (Full Stack)': 2,
    'WordPress': 3,
    'Drupal': 4,
    'Joomla': 5,
    'Ghost': 6,
    'Strapi': 7,
    'Directus': 8,
    'Payload CMS': 9,
    'October CMS': 10,
    'TYPO3': 11,
    'Plone': 12,
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
    'Nextcloud Enterprise (Optimized)': 1,
    'Elasticsearch': 2,
    'Nextcloud': 3,
    'FileBrowser': 4,
    'Seafile': 5,
    'Cloudreve': 6,
    'OpenCloud': 7,
    'Ocis': 8,
    'Cozy': 9,
    'Syncthing': 10,
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
    'n8n (Full Stack)': 1,
    'n8n': 2,
    'Activepieces': 3,
    'Node-RED': 4,
    'Windmill': 5,
    'Automatisch': 6,
    'Kestra': 7,
    'Huginn': 8,
    'Flowise': 9,
    'Apache Airflow': 10,
    'Budibase': 11,
};

const webServerPopularity: Record<string, number> = {
    'Nginx': 1,
    'Apache': 2,
    'Caddy': 3,
    'Traefik': 4,
};

const cachePopularity: Record<string, number> = {
    'Redis': 1,
    'Memcached': 2,
    'Dragonfly': 3,
};

const queuePopularity: Record<string, number> = {
    'RabbitMQ': 1,
    'Kafka': 2,
    'Beanstalkd': 3,
};

const messagingPopularity: Record<string, number> = {
    'Rocket.Chat': 1,
    'Mattermost': 2,
    'Zulip': 3,
    'Matrix': 4,
    'Element': 5,
};

const monitoringPopularity: Record<string, number> = {
    'Monitoring Stack (Prometheus + Grafana)': 1,
    'ELK Stack (Observability)': 2,
    'PLG Stack (Modern Logging)': 3,
    'Grafana + PostgreSQL (Full Stack)': 4,
    'Grafana': 5,
    'Prometheus': 6,
    'Uptime Kuma': 7,
    'Netdata': 8,
    'Zabbix': 9,
};

const developmentPopularity: Record<string, number> = {
    'Appwrite (Full Stack)': 1,
    'Gitea (Full Stack)': 2,
    'Gitea': 3,
    'VS Code Server': 4,
    'Postman': 5,
    'Jenkins': 6,
};

const utilitiesPopularity: Record<string, number> = {
    'Vaultwarden (Full Stack)': 1,
    'Vaultwarden': 2,
    'CyberChef': 3,
    'IT-Tools': 4,
};

const applicationsPopularity: Record<string, number> = {
    'Media Center (Jellyfin + Arrs)': 1,
    'Portainer': 2,
    'Watchtower': 3,
    'Duplicati': 4,
};

const osPopularity: Record<string, number> = {
    'Ubuntu': 1,
    'Debian': 2,
    'Alpine': 3,
    'CentOS': 4,
};

function readFromDir(dir: string): TemplateService[] {
    const files = fs.readdirSync(dir);
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
    console.log(`[Library] Loaded ${services.length} services`);

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

        if (a.category === 'Web Server' && b.category === 'Web Server') {
            const popA = webServerPopularity[a.name] ?? 99;
            const popB = webServerPopularity[b.name] ?? 99;
            return popA - popB;
        }

        if (a.category === 'Cache' && b.category === 'Cache') {
            const popA = cachePopularity[a.name] ?? 99;
            const popB = cachePopularity[b.name] ?? 99;
            return popA - popB;
        }

        if (a.category === 'Queue' && b.category === 'Queue') {
            const popA = queuePopularity[a.name] ?? 99;
            const popB = queuePopularity[b.name] ?? 99;
            return popA - popB;
        }

        if (a.category === 'Messaging' && b.category === 'Messaging') {
            const popA = messagingPopularity[a.name] ?? 99;
            const popB = messagingPopularity[b.name] ?? 99;
            return popA - popB;
        }

        if (a.category === 'Monitoring' && b.category === 'Monitoring') {
            const popA = monitoringPopularity[a.name] ?? 99;
            const popB = monitoringPopularity[b.name] ?? 99;
            return popA - popB;
        }

        if (a.category === 'Utilities' && b.category === 'Utilities') {
            const popA = utilitiesPopularity[a.name] ?? 99;
            const popB = utilitiesPopularity[b.name] ?? 99;
            return popA - popB;
        }

        if (a.category === 'Development' && b.category === 'Development') {
            const popA = developmentPopularity[a.name] ?? 99;
            const popB = developmentPopularity[b.name] ?? 99;
            return popA - popB;
        }

        if (a.category === 'Applications' && b.category === 'Applications') {
            const popA = applicationsPopularity[a.name] ?? 99;
            const popB = applicationsPopularity[b.name] ?? 99;
            return popA - popB;
        }

        if (a.category === 'OS' && b.category === 'OS') {
            const popA = osPopularity[a.name] ?? 99;
            const popB = osPopularity[b.name] ?? 99;
            return popA - popB;
        }

        return a.name.localeCompare(b.name);
    });

    return services;
}
