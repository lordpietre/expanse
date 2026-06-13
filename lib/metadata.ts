import { Compose } from "expanse-docker-lib";
import { NodeData } from "@/components/playground/playground";
import usePositionMap from "@/store/metadataMap";

export type nameId = {
    id: string;
    name: string;
}
type PositionMap = {
    id: string,
    position: {
        x: number,
        y: number
    }
}
type ConnectionMapEntry = {
    key: string, // "sourceId:targetId"
    targetHandle: string
}

export type composeMetadata = {
    Ids: {
        servicesIds: nameId[];
        networksIds: nameId[];
        volumesIds: nameId[];
        bindingsIds: nameId[];
        envsIds: nameId[];
        labelsIds: nameId[];
    }
    positionMap: PositionMap[]
    connectionMap?: ConnectionMapEntry[]
    resources?: Record<string, { cpus?: string, memory?: string }>
}

export function extractMetadata(compose: Compose, positionMap: Map<string, NodeData>): composeMetadata {
    const result: composeMetadata = {
        Ids: {
            servicesIds: [],
            networksIds: [],
            volumesIds: [],
            bindingsIds: [],
            envsIds: [],
            labelsIds: []
        },
        positionMap: [],
        connectionMap: [],
        resources: Object.fromEntries(usePositionMap.getState().resourceMeta)
    }
    const connectionMapState = usePositionMap.getState().connectionMap;
    compose.services.forEach(service => {
        result.Ids.servicesIds.push({ name: service?.name, id: service.id })
        service.bindings.forEach(bin => {
            if (typeof bin.source === "string") {
                result.Ids.bindingsIds.push({ name: bin.source, id: bin.id })
            }
        })
        service.labels?.forEach(label => {
            result.Ids.labelsIds.push({ name: `${service.id}___${label.key}`, id: label.id })
        })
    })
    compose.networks.forEach(network => result.Ids.networksIds.push({ name: network.name, id: network.id }))
    compose.volumes.forEach(volume => result.Ids.volumesIds.push({ name: volume.name, id: volume.id }))
    compose.envs.forEach(env => result.Ids.envsIds.push({ name: env.key, id: env.id }))
    positionMap.forEach((val, id) => result.positionMap.push({
        id: id,
        position: {
            x: val.position.x,
            y: val.position.y
        }
    }))
    connectionMapState.forEach((targetHandle: string, key: string) => result.connectionMap?.push({
        key,
        targetHandle
    }))
    return result
}

export function reHydrateComposeIds(compose: Compose, metadata: composeMetadata) {
    metadata.Ids.servicesIds.forEach(({ name, id }) => {
        const service = Array.from(compose.services).find(s => s.name === name)
        if (service) {
            service.id = id
        }
        service?.bindings.forEach((bin) => {
            const found = metadata.Ids.bindingsIds.find(b => b.name === bin.source)
            if (found) {
                bin.id = found.id
            }
        })
    })
    metadata.Ids.networksIds.forEach(({ name, id }) => {
        const network = Array.from(compose.networks).find(n => n.name === name)
        if (network) {
            network.id = id
        }
    })
    metadata.Ids.envsIds.forEach(({ name, id }) => {
        const env = Array.from(compose.envs).find(n => n.key === name)
        if (env) {
            env.id = id
        }
    })
    metadata.Ids.volumesIds.forEach(({ name, id }) => {
        const vol = Array.from(compose.volumes).find(n => n.name === name)
        if (vol) {
            vol.id = id
        }
    })
    metadata.Ids.labelsIds.forEach(({ name, id }) => {
        const [serviceId, labelKey] = name.split('___');
        if (serviceId && labelKey) {
            const service = Array.from(compose.services).find(s => s.id === serviceId);
            if (service) {
                const label = service.labels?.find(l => l.key === labelKey);
                if (label) {
                    label.id = id;
                }
            }
        }
    })

    if (metadata.resources) {
        const resourceMap = new Map();
        Object.entries(metadata.resources).forEach(([name, limits]) => {
            resourceMap.set(name, limits);
        });
        usePositionMap.setState({ resourceMeta: resourceMap });
    }
}

export function recreatePositionMap(input: PositionMap[]): Map<string, NodeData> {
    const result = new Map()
    input?.forEach((v) => {
        result.set(v.id, {
            position: v.position
        })
    })
    return result
}

export function recreateConnectionMap(input: ConnectionMapEntry[] | undefined): Map<string, string> {
    const result = new Map()
    input?.forEach((v) => {
        result.set(v.key, v.targetHandle)
    })
    return result
}

import type { LoadBalancerConfig, ReplicasConfig, DatabaseHaConfig } from "@/types/library";

export interface HaConfig {
    loadBalancer?: LoadBalancerConfig;
    replicas?: ReplicasConfig;
    databaseHa?: DatabaseHaConfig;
}

export function extractHaConfig(template: { loadBalancer?: LoadBalancerConfig; replicas?: ReplicasConfig; databaseHa?: DatabaseHaConfig; haEnabled?: boolean }): HaConfig {
    if (!template.haEnabled) {
        return {};
    }
    return {
        loadBalancer: template.loadBalancer,
        replicas: template.replicas,
        databaseHa: template.databaseHa,
    };
}

export function generateHaproxyConfig(
    lbConfig: LoadBalancerConfig,
    servers: Array<{ name: string; host: string; port: number }>
): string {
    const serversLines = servers
        .map(s => `    server ${s.name} ${s.host}:${s.port} check inter 5s fall 2 rise 1`)
        .join('\n');

    return `global
    log stdout format raw local0
    maxconn 4096

defaults
    log     global
    mode    http
    option  httplog
    timeout connect 5000ms
    timeout client  50000ms
    timeout server  50000ms

frontend postgrest_ha
    bind :${lbConfig.port}
    default_backend postgrest_nodes

backend postgrest_nodes
    balance ${lbConfig.algorithm}
    option httpchk GET ${lbConfig.healthCheckPath}
    http-check expect status 200
${serversLines}
`;
}

export function generatePgbouncerConfig(
    dbConfig: DatabaseHaConfig,
    dbHost: string,
    dbPort: number,
    dbName: string
): string {
    const poolMode = dbConfig.poolMode || 'transaction';
    const maxConnections = dbConfig.maxConnections || 100;
    const poolSize = dbConfig.poolSize || 20;

    return `[databases]
${dbName} = host=${dbHost} port=${dbPort} dbname=${dbName} pool_size=${poolSize}

[pgbouncer]
pool_mode = ${poolMode}
max_client_conn = ${maxConnections}
default_pool_size = ${poolSize}
min_pool_size = 5
reserve_pool_size = 5
reserve_pool_timeout = 5
server_lifetime = 3600
server_idle_timeout = 600
log_connections = 0
log_disconnections = 0
`;
}
