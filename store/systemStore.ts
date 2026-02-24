import { create } from 'zustand';
import { getUsedDockerPorts } from '@/actions/dockerActions';

interface SystemState {
    usedPorts: number[];
    fetchUsedPorts: () => Promise<void>;
}

export const useSystemStore = create<SystemState>((set) => ({
    usedPorts: [],
    fetchUsedPorts: async () => {
        const ports = await getUsedDockerPorts();
        set({ usedPorts: ports });
    }
}));
