const net = require('net');
const { execSync } = require('child_process');

async function checkPort(port) {
    return new Promise((resolve) => {
        const server = net.createServer();
        server.once('error', (err) => {
            if (err.code === 'EADDRINUSE') {
                resolve(false);
            } else {
                resolve(true);
            }
        });
        server.once('listening', () => {
            server.close();
            resolve(true);
        });
        server.listen(port, '0.0.0.0');
    });
}
async function getUsedDockerPorts() {
    try {
        const stdout = execSync('docker ps --format="{{.Ports}}"').toString();
        if (!stdout.trim()) return [];
        const ports = new Set();
        const lines = stdout.trim().split('\n');
        for (const line of lines) {
            if (!line) continue;
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
        return [];
    }
}
async function test() {
    console.log("Used docker ports:", await getUsedDockerPorts());
    console.log("Is 5432 free?", await checkPort(5432));
    console.log("Is 80 free?", await checkPort(80));
}
test();
