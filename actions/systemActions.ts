'use server'

import { networkInterfaces } from 'os';

/**
 * Detects the primary local IP address of the server
 */
export async function getLocalSystemInfo() {
    try {
        const nets = networkInterfaces();
        const results: Record<string, string[]> = {};

        for (const name of Object.keys(nets)) {
            for (const net of nets[name]!) {
                // Skip over non-IPv4 and internal (i.e. 127.0.0.1) addresses
                // 'IPv4' is for Node < 18, family === 4 is for Node >= 18
                const familyV4Value = typeof net.family === 'string' ? 'IPv4' : 4
                if (net.family === familyV4Value && !net.internal) {
                    if (!results[name]) {
                        results[name] = [];
                    }
                    results[name].push(net.address);
                }
            }
        }

        // Return the first valid external IP found, or a default message
        const primaryInterface = Object.keys(results)[0];
        const primaryIp = primaryInterface ? results[primaryInterface][0] : "127.0.0.1 (Local)";

        return {
            success: true,
            localIp: primaryIp,
            interfaces: results,
            os: process.platform,
            nodeVersion: process.version
        };
    } catch (error) {
        console.error("Failed to detect system info:", error);
        return { success: false, error: "System detection failed" };
    }
}

/**
 * Saves remote Docker node credentials
 * For now, we'll store them in the database associated with the user
 */
export async function saveRemoteNodeConfig(config: { host: string; port: string; ca?: string; cert?: string; key?: string }) {
    // This will be implemented to allow managing external Docker endpoints
    // For now, let's just mock the save
    console.log("Saving remote node config:", config.host);
    return { success: true, error: undefined as string | undefined };
}
