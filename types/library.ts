export type LoadBalancerType = 'haproxy' | 'nginx' | 'traefik';
export type LoadBalancerAlgorithm = 'round-robin' | 'least-connections' | 'ip-hash';
export type PoolMode = 'transaction' | 'session' | 'statement';
export type DatabaseHaType = 'single' | 'pgbouncer';

export interface LoadBalancerConfig {
    type: LoadBalancerType;
    port: number;
    targetPort: number;
    algorithm: LoadBalancerAlgorithm;
    healthCheckPath: string;
    healthCheckInterval?: string;
}

export interface ReplicasConfig {
    enabled: boolean;
    minReplicas: number;
    maxReplicas: number;
    scaleTarget?: string;
    targetCPUUtilization?: number;
    targetMemoryUtilization?: number;
}

export interface DatabaseHaConfig {
    type: DatabaseHaType;
    poolMode?: PoolMode;
    maxConnections?: number;
    poolSize?: number;
}

export interface TemplateService {
    name: string;
    image: string;
    category: 'Database' | 'Web Server' | 'Cache' | 'Queue' | 'Other' | 'Applications' | 'Monitoring' | 'OS' | 'Development' | 'Messaging' | 'Network' | 'Cloud' | 'CMS' | 'Social' | 'AI' | 'Automation' | 'Utilities';
    logo?: string;
    description?: string;
    default_ports?: string[];
    env_vars?: Record<string, string>;
    volumes?: string[];
    command?: string | string[];
    isStack?: boolean;
    related_services?: TemplateService[];
    loadBalancer?: LoadBalancerConfig;
    replicas?: ReplicasConfig;
    databaseHa?: DatabaseHaConfig;
    haEnabled?: boolean;
}