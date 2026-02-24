"use client"

import { create } from 'zustand';
import { NodeData } from "@/components/playground/playground";

// Define the type for the store's state
interface metadataState {
    positionMap: Map<string, NodeData>;
    connectionMap: Map<string, string>; // Key: "sourceId:targetId", Value: "targetHandle"
    setPositionMap: (newMap: Map<string, NodeData>) => void;
    setConnectionMap: (newMap: Map<string, string>) => void;
}

// Create the Zustand store
const usePositionMap = create<metadataState>((set) => ({
    positionMap: new Map(),
    connectionMap: new Map(),
    setPositionMap: (newMap: Map<string, NodeData>) => set({ positionMap: newMap }),
    setConnectionMap: (newMap: Map<string, string>) => set({ connectionMap: newMap }),
}));

export default usePositionMap;