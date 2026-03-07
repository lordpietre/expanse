'use server'

import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';
import net from 'net';
import YAML from 'yaml';
import { ensureAuth } from "@/lib/auth";
import { getDb } from "@/lib/mongodb";
import { ObjectId } from "bson";
import { composeMetadata } from "@/lib/metadata";

const execAsync = promisify(exec);

/** DB healthcheck templates keyed by image substring */
const DB_HEALTHCHECKS: Record<string, object> = {
    mariadb: { test: ["CMD-SHELL", "mysqladmin ping -h localhost -u root -p\"$${MYSQL_ROOT_PASSWORD:-$${MARIADB_ROOT_PASSWORD:-}}\""], interval: "10s", timeout: "5s", retries: 5, start_period: "30s" },
    mysql: { test: ["CMD", "mysqladmin", "ping", "-h", "localhost", "--silent"], interval: "10s", timeout: "5s", retries: 5, start_period: "30s" },
    postgres: { test: ["CMD-SHELL", "pg_isready -h localhost -U $${POSTGRES_USER:-postgres}"], interval: "10s", timeout: "5s", retries: 5, start_period: "20s" },
    mongo: { test: ["CMD", "mongosh", "--eval", "db.adminCommand('ping')"], interval: "10s", timeout: "5s", retries: 5, start_period: "20s" },
    redis: { test: ["CMD", "redis-cli", "ping"], interval: "5s", timeout: "3s", retries: 5 },
}

function isDbImage(image: string): string | null {
    const img = image.toLowerCase()
    for (const key of Object.keys(DB_HEALTHCHECKS)) {
        if (img.includes(key)) return key
    }
    return null
}

/**
 * Patch the generated YAML:
 * 3. Inject resource limits from metadata
 */
function patchComposeYaml(yamlText: string, metadata?: composeMetadata): string {
    const doc = YAML.parse(yamlText)
    if (!doc?.services) return yamlText

    // Identify DB service names
    const dbServiceNames = new Set<string>()
    for (const [name, svc] of Object.entries<any>(doc.services)) {
        const img: string = (svc.image || "").toLowerCase()
        const key = isDbImage(img)
        if (key) {
            dbServiceNames.add(name)
            // Inject healthcheck only if not already defined
            if (!svc.healthcheck) {
                svc.healthcheck = DB_HEALTHCHECKS[key]
            }
        }
    }

    // Upgrade depends_on for services that depend on a DB
    for (const svc of Object.values<any>(doc.services)) {
        if (!svc.depends_on) continue
        // depends_on can be array or object
        if (Array.isArray(svc.depends_on)) {
            const obj: Record<string, any> = {}
            for (const dep of svc.depends_on) {
                obj[dep] = dbServiceNames.has(dep)
                    ? { condition: "service_healthy" }
                    : { condition: "service_started" }
            }
            svc.depends_on = obj
        } else if (typeof svc.depends_on === 'object') {
            for (const [dep, conf] of Object.entries<any>(svc.depends_on)) {
                if (dbServiceNames.has(dep) && conf.condition !== "service_healthy") {
                    conf.condition = "service_healthy"
                }
            }
        }
    }

    // Inject resource limits
    if (metadata?.resources) {
        for (const [serviceName, limits] of Object.entries(metadata.resources)) {
            if (doc.services[serviceName]) {
                const svc = doc.services[serviceName];
                if (!svc.deploy) svc.deploy = {};
                if (!svc.deploy.resources) svc.deploy.resources = {};
                svc.deploy.resources.limits = {
                    cpus: limits.cpus,
                    memory: limits.memory
                };
            }
        }
    }

    return YAML.stringify(doc)
}

/** Expose the generated YAML for debugging */
export async function getComposeYaml(composeId: string): Promise<string | null> {
    await ensureAuth();
    const yamlPath = path.join(os.tmpdir(), `expanse-${composeId}`, 'docker-compose.yaml')
    try {
        return await fs.readFile(yamlPath, 'utf-8')
    } catch {
        return null
    }
}

export async function runCompose(composeId: string, yamlContent: string) {
    await ensureAuth();
    const tempDir = path.join(os.tmpdir(), `expanse-${composeId}`);
    await fs.mkdir(tempDir, { recursive: true });
    const yamlPath = path.join(tempDir, 'docker-compose.yaml');

    // Fetch metadata for resource limits
    const db = await getDb();
    const collection = db.collection("composes");
    const doc = await collection.findOne({ _id: new ObjectId(composeId) });
    const metadata = doc?.metadata as composeMetadata | undefined;

    // Patch YAML: inject DB healthchecks + depends_on service_healthy + resource limits
    const patchedYaml = patchComposeYaml(yamlContent, metadata);
    await fs.writeFile(yamlPath, patchedYaml);

    try {
        // We use -p to specify a project name based on the ID to avoid collisions
        const { stdout, stderr } = await execAsync(`docker compose -f ${yamlPath} -p expanse-project_${composeId} up -d`);
        console.log('Docker Compose Up:', stdout);
        if (stderr) console.error('Docker Compose Up Stderr:', stderr);
        return { success: true, message: 'Services started successfully' };
    } catch (error: any) {
        console.error('Docker Compose Up Error:', error);
        const errText = error.message || error.stderr || "";
        const regex = /:(\d+)(?:\/tcp)?.*(?:already in use|already allocated)/i;
        const match = errText.match(regex) || errText.match(/Bind for.*:(\d+) failed/i);
        if (match) {
            return { success: false, error: errText, collisionPort: parseInt(match[1]) };
        }
        return { success: false, error: error.message };
    }
}

export async function stopCompose(composeId: string) {
    await ensureAuth();
    const tempDir = path.join(os.tmpdir(), `expanse-${composeId}`);
    const yamlPath = path.join(tempDir, 'docker-compose.yaml');

    try {
        const fileExists = await fs.access(yamlPath).then(() => true).catch(() => false);
        const cmd = fileExists
            ? `docker compose -f ${yamlPath} -p expanse-project_${composeId} down`
            : `docker compose -p expanse-project_${composeId} down`;

        const { stdout, stderr } = await execAsync(cmd);
        console.log('Docker Compose Down:', stdout);
        if (stderr) console.error('Docker Compose Down Stderr:', stderr);
        return { success: true, message: 'Services stopped successfully' };
    } catch (error: any) {
        console.error('Docker Compose Down Error:', error);
        return { success: false, error: error.message };
    }
}

export async function restartCompose(composeId: string, yamlContent: string) {
    await ensureAuth();
    const tempDir = path.join(os.tmpdir(), `expanse-${composeId}`);
    await fs.mkdir(tempDir, { recursive: true });
    const yamlPath = path.join(tempDir, 'docker-compose.yaml');

    // Fetch metadata for resource limits
    const db = await getDb();
    const collection = db.collection("composes");
    const doc = await collection.findOne({ _id: new ObjectId(composeId) });
    const metadata = doc?.metadata as composeMetadata | undefined;

    // Patch YAML: inject DB healthchecks + depends_on service_healthy + resource limits
    const patchedYaml = patchComposeYaml(yamlContent, metadata);
    await fs.writeFile(yamlPath, patchedYaml);

    try {
        await execAsync(`docker compose -f ${yamlPath} -p expanse-project_${composeId} down --remove-orphans`);
        const { stdout, stderr } = await execAsync(`docker compose -f ${yamlPath} -p expanse-project_${composeId} up -d --build --force-recreate`);

        console.log('Docker Compose Restart:', stdout);
        if (stderr) console.error('Docker Compose Restart Stderr:', stderr);
        return { success: true, message: 'Services restarted successfully' };
    } catch (error: any) {
        console.error('Docker Compose Restart Error:', error);
        const errText = error.message || error.stderr || "";
        const regex = /:(\d+)(?:\/tcp)?.*(?:already in use|already allocated)/i;
        const match = errText.match(regex) || errText.match(/Bind for.*:(\d+) failed/i);
        if (match) {
            return { success: false, error: errText, collisionPort: parseInt(match[1]) };
        }
        return { success: false, error: error.message };
    }
}

export async function getComposeStatus(composeId: string) {
    await ensureAuth();
    const tempDir = path.join(os.tmpdir(), `expanse-${composeId}`);
    const yamlPath = path.join(tempDir, 'docker-compose.yaml');

    try {
        const fileExists = await fs.access(yamlPath).then(() => true).catch(() => false);
        const cmd = fileExists
            ? `docker compose -f ${yamlPath} -p expanse-project_${composeId} ps --format json`
            : `docker compose -p expanse-project_${composeId} ps --format json`;

        const { stdout } = await execAsync(cmd);
        if (!stdout.trim()) return [];

        // The output can be multiple JSON objects or a list depending on version
        try {
            const res = JSON.parse(stdout);
            return Array.isArray(res) ? res : [res];
        } catch {
            // If it's line-delimited JSON
            return stdout.trim().split('\n').map(line => {
                try {
                    return JSON.parse(line);
                } catch {
                    return null;
                }
            }).filter(Boolean);
        }
    } catch (error: any) {
        console.error('Docker Compose PS Error:', error);
        return [];
    }
}

export async function getComposeLogs(composeId: string) {
    await ensureAuth();
    const tempDir = path.join(os.tmpdir(), `expanse-${composeId}`);
    const yamlPath = path.join(tempDir, 'docker-compose.yaml');

    try {
        const fileExists = await fs.access(yamlPath).then(() => true).catch(() => false);
        const cmd = fileExists
            ? `docker compose -f ${yamlPath} -p expanse-project_${composeId} logs --tail=50 --no-color`
            : `docker compose -p expanse-project_${composeId} logs --tail=50 --no-color`;

        const { stdout } = await execAsync(cmd);
        return { success: true, logs: stdout };
    } catch (error: any) {
        console.error('Docker Compose Logs Error:', error);
        return { success: false, error: error.message };
    }
}

export async function getComposeStats(composeId: string) {
    await ensureAuth();
    try {
        // Run docker stats with no-stream to get a single snapshot.
        // We filter by project label if possible, or just parse all and filter.
        // The most robust way is to use docker compose ps to get IDs first.
        const containers = await getComposeStatus(composeId);
        if (!containers || containers.length === 0) return [];

        const ids = containers.map((c: any) => c.ID).join(' ');
        const { stdout } = await execAsync(`docker stats ${ids} --no-stream --format json`);

        if (!stdout.trim()) return [];

        try {
            // Line-delimited JSON
            return stdout.trim().split('\n').map(line => {
                try {
                    return JSON.parse(line);
                } catch {
                    return null;
                }
            }).filter(Boolean);
        } catch (e) {
            console.error("Stats parse error:", e);
            return [];
        }
    } catch (error: any) {
        console.error('Docker Stats Error:', error);
        return [];
    }
}

export async function getGlobalDockerStats() {
    await ensureAuth();
    try {
        const [projectsRes, containersRes, volumesRes, networksRes, dfRes] = await Promise.all([
            execAsync('docker compose ls --format json'),
            execAsync('docker ps -a --format json'),
            execAsync('docker volume ls --format json'),
            execAsync('docker network ls --format json'),
            execAsync('docker system df -v').catch(() => ({ stdout: '' }))
        ]);

        const parseJson = (stdout: string) => {
            if (!stdout.trim()) return [];
            try {
                const res = JSON.parse(stdout);
                return Array.isArray(res) ? res : [res];
            } catch {
                return stdout.trim().split('\n').map(line => {
                    try {
                        return JSON.parse(line);
                    } catch {
                        return null;
                    }
                }).filter(Boolean);
            }
        };

        const volumes = parseJson(volumesRes.stdout);
        const networks = parseJson(networksRes.stdout);
        const dfOutput = dfRes.stdout;

        // Simple regex to find volume sizes in 'docker system df -v' output
        // It looks for the "Local Volumes" section and captures name + size
        if (dfOutput) {
            const volumeLines = dfOutput.split('\n');
            let inVolumesSection = false;
            const sizeMap: Record<string, { size: string, links: number }> = {};

            for (const line of volumeLines) {
                if (line.includes('VOLUME NAME') && line.includes('SIZE')) {
                    inVolumesSection = true;
                    continue;
                }
                if (inVolumesSection) {
                    if (line.trim() === '') {
                        if (Object.keys(sizeMap).length > 0) break;
                        continue;
                    }
                    const parts = line.trim().split(/\s+/);
                    if (parts.length >= 3) {
                        const name = parts[0];
                        const links = parseInt(parts[parts.length - 2]) || 0;
                        const size = parts[parts.length - 1];
                        sizeMap[name] = { size, links };
                    }
                }
            }

            // Inject sizes into volume objects
            for (const vol of volumes) {
                if (sizeMap[vol.Name]) {
                    vol.Size = sizeMap[vol.Name].size;
                    vol.Links = sizeMap[vol.Name].links;
                }
            }
        }

        return {
            projects: parseJson(projectsRes.stdout),
            containers: parseJson(containersRes.stdout),
            volumes,
            networks
        };
    } catch (error: any) {
        console.error('Global Docker Stats Error:', error);
        return { error: error.message };
    }
}

export async function getSystemInfo() {
    await ensureAuth();
    try {
        const cpus = os.cpus();
        const totalMemory = os.totalmem();
        const freeMemory = os.freemem();
        const uptime = os.uptime();

        let diskInfo = { total: 'Unknown', used: 'Unknown', free: 'Unknown', usage: '0%' };
        try {
            const { stdout } = await execAsync('df -h / | awk \'NR==2 {print $2, $3, $4, $5}\'');
            const [total, used, free, usage] = stdout.trim().split(/\s+/);
            diskInfo = { total, used, free, usage };
        } catch (e) {
            console.error("Could not fetch disk info:", e);
        }

        return {
            cpuCount: cpus.length,
            cpuModel: cpus[0].model,
            totalMemory,
            freeMemory,
            uptime,
            diskInfo
        };
    } catch (error: any) {
        console.error('System Info Error:', error);
        return { error: error.message };
    }
}

export async function getUsedDockerPorts(): Promise<number[]> {
    await ensureAuth();
    try {
        const { stdout } = await execAsync('docker ps --format="{{.Ports}}"');
        if (!stdout.trim()) return [];

        const ports = new Set<number>();
        const lines = stdout.trim().split('\n');

        for (const line of lines) {
            if (!line) continue;
            // Example format: 0.0.0.0:8000->8000/tcp, :::8000->8000/tcp, 0.0.0.0:3306->3306/tcp, :::3306->3306/tcp
            const parts = line.split(',');
            for (const part of parts) {
                const match = part.match(/:(\d+)->/);
                if (match && match[1]) {
                    ports.add(parseInt(match[1]));
                }
            }
        }

        return Array.from(ports);
    } catch (error) {
        console.error('Error fetching used docker ports:', error);
        return [];
    }
}

async function checkPort(port: number): Promise<boolean> {
    return new Promise((resolve) => {
        const server = net.createServer();
        server.once('error', (err: any) => {
            if (err.code === 'EADDRINUSE') {
                resolve(false);
            } else {
                resolve(true); // Other errors might mean it's free or restricted, but not in use
            }
        });
        server.once('listening', () => {
            server.close();
            resolve(true);
        });
        server.listen(port, '0.0.0.0');
    });
}

export async function getAvailablePort(preferred: number): Promise<number> {
    await ensureAuth();
    const usedDockerPorts = await getUsedDockerPorts();

    const isPortFree = async (p: number) => {
        if (usedDockerPorts.includes(p)) return false;
        return await checkPort(p);
    };

    const isAvailable = await isPortFree(preferred);
    if (isAvailable) return preferred;

    // Search for a free port starting from a random ephemeral range if possible, 
    // or just try common ranges.
    let port = preferred + 1;
    while (!(await isPortFree(port)) && port < preferred + 1000) {
        port++;
    }
    return port;
}

export async function stopProjectByName(projectName: string) {
    await ensureAuth();
    try {
        const { stdout, stderr } = await execAsync(`docker compose -p ${projectName} stop`);
        console.log('Stop project:', stdout);
        if (stderr) console.error('Stop project stderr:', stderr);
        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function removeProjectByName(projectName: string, deleteVolumes: boolean = true) {
    await ensureAuth();
    try {
        // 1. Try standard compose down first
        const downFlags = deleteVolumes ? "--volumes --remove-orphans" : "--remove-orphans";
        const { stdout, stderr } = await execAsync(`docker compose -p ${projectName} down ${downFlags}`);
        console.log('Remove project standard:', stdout);

        // 2. Robust fallback: Identify any remaining containers with this project label
        const { stdout: containerIds } = await execAsync(`docker ps -a --filter "label=com.docker.compose.project=${projectName}" -q`);
        if (containerIds.trim()) {
            const ids = containerIds.trim().split(/\s+/).join(' ');
            await execAsync(`docker rm -f ${ids}`);
        }

        // Only remove volumes manually if requested
        if (deleteVolumes) {
            const { stdout: volumeNames } = await execAsync(`docker volume ls --filter "label=com.docker.compose.project=${projectName}" -q`);
            if (volumeNames.trim()) {
                const names = volumeNames.trim().split(/\s+/).join(' ');
                await execAsync(`docker volume rm -f ${names}`);
            }
        }

        const { stdout: networkNames } = await execAsync(`docker network ls --filter "label=com.docker.compose.project=${projectName}" -q`);
        if (networkNames.trim()) {
            const names = networkNames.trim().split(/\s+/).join(' ');
            await execAsync(`docker network rm ${names}`);
        }

        if (stderr && !stderr.includes('Network') && !stderr.includes('Volume')) {
            console.error('Remove project stderr:', stderr);
        }

        return {
            success: true,
            message: `Project "${projectName}" deleted${deleteVolumes ? " along with all persistent volumes" : " (volumes preserved)"}.`
        };
    } catch (error: any) {
        console.error('Remove project error:', error);
        return { success: false, error: error.message };
    }
}

export async function stopContainer(containerId: string) {
    await ensureAuth();
    try {
        const { stdout } = await execAsync(`docker stop ${containerId}`);
        console.log('Stop container:', stdout);
        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function removeContainer(containerId: string) {
    await ensureAuth();
    try {
        await execAsync(`docker stop ${containerId}`).catch(() => { });
        const { stdout } = await execAsync(`docker rm -f ${containerId}`);
        console.log('Remove container:', stdout);
        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function removeVolume(volumeName: string) {
    await ensureAuth();
    try {
        const { stdout } = await execAsync(`docker volume rm -f ${volumeName}`);
        console.log('Remove volume:', stdout);
        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}


export async function getProjectContainers(projectName: string) {
    await ensureAuth();
    try {
        const { stdout } = await execAsync(
            `docker ps -a --filter "label=com.docker.compose.project=${projectName}" --format json`
        );
        if (!stdout.trim()) return { containers: [], volumes: [] };

        const parseJson = (s: string) => {
            if (!s.trim()) return [];
            try {
                const res = JSON.parse(s);
                return Array.isArray(res) ? res : [res];
            } catch {
                return s.trim().split('\n').map(l => { try { return JSON.parse(l); } catch { return null; } }).filter(Boolean);
            }
        };

        const containers = parseJson(stdout);

        // fetch volumes for this project
        const { stdout: volOut } = await execAsync(
            `docker volume ls --filter "label=com.docker.compose.project=${projectName}" --format json`
        ).catch(() => ({ stdout: '' }));

        const volumes = volOut.trim() ? parseJson(volOut) : [];

        // Fetch sizes for these volumes
        try {
            const { stdout: dfOut } = await execAsync('docker system df -v');
            const volumeLines = dfOut.split('\n');
            let inVolumesSection = false;
            const sizeMap: Record<string, string> = {};
            for (const line of volumeLines) {
                if (line.includes('VOLUME NAME') && line.includes('SIZE')) {
                    inVolumesSection = true;
                    continue;
                }
                if (inVolumesSection) {
                    if (line.trim() === '') {
                        if (Object.keys(sizeMap).length > 0) break;
                        continue;
                    }
                    const parts = line.trim().split(/\s+/);
                    if (parts.length >= 3) {
                        sizeMap[parts[0]] = parts[parts.length - 1];
                    }
                }
            }
            for (const vol of volumes) {
                if (sizeMap[vol.Name]) vol.Size = sizeMap[vol.Name];
            }
        } catch (e) {
            console.error("Error fetching volume sizes in project containers:", e);
        }

        return { containers, volumes };
    } catch (error: any) {
        return { error: error.message };
    }
}

export async function validateComposePorts(yamlContent: string) {
    await ensureAuth();
    const doc = YAML.parse(yamlContent);
    const reassignments: Record<string, { old: number, new: number }[]> = {};
    const usedInConfig = new Set<number>();
    let hasChanges = false;

    if (doc.services) {
        for (const [serviceName, service] of Object.entries<any>(doc.services)) {
            if (service.ports) {
                const serviceReassignments: { old: number, new: number }[] = [];

                for (let i = 0; i < service.ports.length; i++) {
                    const portStr = String(service.ports[i]);
                    const match = portStr.match(/^(\d+):(\d+)$/);
                    if (match) {
                        const hostPort = parseInt(match[1]);
                        const containerPort = parseInt(match[2]);

                        // Check if this port is already used by another service in this config
                        // OR if it's actually busy in the system
                        let targetPort = hostPort;
                        if (usedInConfig.has(targetPort)) {
                            targetPort = await getAvailablePort(targetPort + 1);
                        } else {
                            const availablePort = await getAvailablePort(targetPort);
                            if (availablePort !== targetPort) {
                                targetPort = availablePort;
                            }
                        }

                        if (targetPort !== hostPort) {
                            service.ports[i] = `${targetPort}:${containerPort}`;
                            serviceReassignments.push({ old: hostPort, new: targetPort });
                            hasChanges = true;
                        }
                        usedInConfig.add(targetPort);
                    }
                }

                if (serviceReassignments.length > 0) {
                    reassignments[serviceName] = serviceReassignments;
                }
            }
        }
    }

    return { hasChanges, reassignments };
}

export async function execDockerCommand(containerId: string, command: string) {
    await ensureAuth();
    try {
        // We wrap the command in sh -c to handle complex strings, spaces, and shell built-ins.
        // We escape double quotes to safely pass the string into the exec command.
        const escapedCommand = command.replace(/"/g, '\\"');
        const { stdout, stderr } = await execAsync(`docker exec ${containerId} sh -c "${escapedCommand}"`);

        return { success: true, output: stdout || stderr || "Command executed" };
    } catch (error: any) {
        console.error('Docker Exec Error:', error);
        return { success: false, error: error.message || error.stderr || "Execution failed" };
    }
}
