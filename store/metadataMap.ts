"use client"

import { create } from 'zustand';
import { NodeData } from "@/components/playground/playground";

export type NetworkNodeType = 'switch' | 'gateway-l7' | 'router-l3';
export type GatewayImpl = 'nginx' | 'traefik';

export interface NetworkNodeMeta {
    type: NetworkNodeType;
    gatewayImpl?: GatewayImpl;
}

export interface DbNodeMeta {
    overwriteEnvVars?: boolean;
}

interface metadataState {
    positionMap: Map<string, NodeData>;
    connectionMap: Map<string, string>; // Key: "sourceId:targetId", Value: "targetHandle"
    networkNodeMeta: Map<string, NetworkNodeMeta>; // Key: networkId
    dbNodeMeta: Map<string, DbNodeMeta>; // Key: serviceId
    resourceMeta: Map<string, { cpus?: string, memory?: string }>; // Key: serviceName
    setPositionMap: (newMap: Map<string, NodeData>) => void;
    setConnectionMap: (newMap: Map<string, string>) => void;
    setNetworkNodeMeta: (networkId: string, meta: Partial<NetworkNodeMeta>) => void;
    setDbNodeMeta: (serviceId: string, meta: Partial<DbNodeMeta>) => void;
    setResourceMeta: (serviceName: string, meta: { cpus?: string, memory?: string }) => void;
}

// Create the Zustand store
const usePositionMap = create<metadataState>((set, get) => ({
    positionMap: new Map(),
    connectionMap: new Map(),
    networkNodeMeta: new Map(),
    dbNodeMeta: new Map(),
    resourceMeta: new Map(),
    setPositionMap: (newMap: Map<string, NodeData>) => set({ positionMap: newMap }),
    setConnectionMap: (newMap: Map<string, string>) => set({ connectionMap: newMap }),
    setNetworkNodeMeta: (networkId: string, meta: Partial<NetworkNodeMeta>) => {
        const existing = get().networkNodeMeta.get(networkId) || { type: 'switch' as NetworkNodeType };
        const updated = new Map(get().networkNodeMeta);
        updated.set(networkId, { ...existing, ...meta });
        set({ networkNodeMeta: updated });
    },
    setDbNodeMeta: (serviceId: string, meta: Partial<DbNodeMeta>) => {
        const existing = get().dbNodeMeta.get(serviceId) || {};
        const updated = new Map(get().dbNodeMeta);
        updated.set(serviceId, { ...existing, ...meta });
        set({ dbNodeMeta: updated });
    },
    setResourceMeta: (serviceName: string, meta: { cpus?: string, memory?: string }) => {
        const updated = new Map(get().resourceMeta);
        updated.set(serviceName, meta);
        set({ resourceMeta: updated });
    },
}));

export default usePositionMap;