"use client"

import { create } from 'zustand';
import { NodeData } from "@/components/playground/playground";

export type NetworkNodeType = 'switch' | 'gateway-l7' | 'router-l3';
export type GatewayImpl = 'nginx' | 'traefik';

export interface NetworkNodeMeta {
    type: NetworkNodeType;
    gatewayImpl?: GatewayImpl;
}

// Define the type for the store's state
interface metadataState {
    positionMap: Map<string, NodeData>;
    connectionMap: Map<string, string>; // Key: "sourceId:targetId", Value: "targetHandle"
    networkNodeMeta: Map<string, NetworkNodeMeta>; // Key: networkId
    setPositionMap: (newMap: Map<string, NodeData>) => void;
    setConnectionMap: (newMap: Map<string, string>) => void;
    setNetworkNodeMeta: (networkId: string, meta: Partial<NetworkNodeMeta>) => void;
}

// Create the Zustand store
const usePositionMap = create<metadataState>((set, get) => ({
    positionMap: new Map(),
    connectionMap: new Map(),
    networkNodeMeta: new Map(),
    setPositionMap: (newMap: Map<string, NodeData>) => set({ positionMap: newMap }),
    setConnectionMap: (newMap: Map<string, string>) => set({ connectionMap: newMap }),
    setNetworkNodeMeta: (networkId: string, meta: Partial<NetworkNodeMeta>) => {
        const existing = get().networkNodeMeta.get(networkId) || { type: 'switch' as NetworkNodeType };
        const updated = new Map(get().networkNodeMeta);
        updated.set(networkId, { ...existing, ...meta });
        set({ networkNodeMeta: updated });
    },
}));

export default usePositionMap;