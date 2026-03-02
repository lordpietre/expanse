import { create } from 'zustand';

export interface ServiceStatus {
    id: string;
    name: string;
    status: 'running' | 'exited' | 'restarting' | 'created' | 'dead' | 'paused' | 'unknown';
    health?: string;
    ports?: string;
}

interface ExecutionState {
    isExecuting: boolean;
    serviceStatuses: Record<string, ServiceStatus>;
    logs: string;
    setExecuting: (executing: boolean) => void;
    updateStatuses: (statuses: any[]) => void;
    setLogs: (logs: string) => void;
    clearStatuses: () => void;
}

export const useExecutionStore = create<ExecutionState>((set) => ({
    isExecuting: false,
    serviceStatuses: {},
    logs: '',
    setExecuting: (executing) => set({ isExecuting: executing }),
    updateStatuses: (statuses) => {
        const newStatuses: Record<string, ServiceStatus> = {};
        statuses.forEach((s: any) => {
            // Docker Compose project name is prefixed (cc-{composeId}), 
            // and container name usually has index suffix too.
            // We need to map this back to our service names.
            // s.Service is the original service name in the yaml.
            if (s.Service) {
                newStatuses[s.Service] = {
                    id: s.ID,
                    name: s.Name,
                    status: s.State.toLowerCase() as any,
                    health: s.Health,
                    ports: s.Ports
                };
            }
        });
        set({ serviceStatuses: newStatuses });
    },
    setLogs: (logs) => set({ logs }),
    clearStatuses: () => set({ serviceStatuses: {}, logs: '' })
}));
