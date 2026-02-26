export interface TemplateService {
    name: string;
    image: string;
    category: 'Database' | 'Web Server' | 'Cache' | 'Queue' | 'Other' | 'Applications' | 'Monitoring' | 'OS' | 'Development' | 'Messaging' | 'Network' | 'Cloud' | 'CMS' | 'Social' | 'AI' | 'Automation';
    logo?: string;
    description?: string;
    default_ports?: string[];
    env_vars?: Record<string, string>;
    volumes?: string[];
    command?: string;
}
