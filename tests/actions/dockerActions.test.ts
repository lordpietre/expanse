import { describe, it, expect } from 'vitest';
import YAML from 'yaml';

const DB_HEALTHCHECKS: Record<string, object> = {
  mariadb: { test: ["CMD-SHELL", "mysqladmin ping -h localhost -u root -p\"${MYSQL_ROOT_PASSWORD:-${MARIADB_ROOT_PASSWORD:-}}\""], interval: "10s", timeout: "5s", retries: 5, start_period: "30s" },
  mysql: { test: ["CMD", "mysqladmin", "ping", "-h", "localhost", "--silent"], interval: "10s", timeout: "5s", retries: 5, start_period: "30s" },
  postgres: { test: ["CMD-SHELL", "pg_isready -h localhost -U ${POSTGRES_USER:-postgres}"], interval: "10s", timeout: "5s", retries: 5, start_period: "20s" },
  mongo: { test: ["CMD", "mongosh", "--eval", "db.adminCommand('ping')"], interval: "10s", timeout: "5s", retries: 5, start_period: "20s" },
  redis: { test: ["CMD", "redis-cli", "ping"], interval: "5s", timeout: "3s", retries: 5 },
};

function isDbImage(image: string): string | null {
  const img = image.toLowerCase();
  for (const key of Object.keys(DB_HEALTHCHECKS)) {
    if (img.includes(key)) return key;
  }
  return null;
}

function patchComposeYaml(yamlText: string, metadata?: any): string {
  const doc = YAML.parse(yamlText);
  if (!doc?.services) return yamlText;

  const dbServiceNames = new Set<string>();
  for (const [name, svc] of Object.entries<any>(doc.services)) {
    const img: string = (svc.image || "").toLowerCase();
    const key = isDbImage(img);
    if (key) {
      dbServiceNames.add(name);
      if (!svc.healthcheck) {
        svc.healthcheck = DB_HEALTHCHECKS[key];
      }
    }
  }

  for (const svc of Object.values<any>(doc.services)) {
    if (!svc.depends_on) continue;
    if (Array.isArray(svc.depends_on)) {
      const obj: Record<string, any> = {};
      for (const dep of svc.depends_on) {
        obj[dep] = dbServiceNames.has(dep)
          ? { condition: "service_healthy" }
          : { condition: "service_started" };
      }
      svc.depends_on = obj;
    } else if (typeof svc.depends_on === 'object') {
      for (const [dep, conf] of Object.entries<any>(svc.depends_on)) {
        if (dbServiceNames.has(dep) && conf.condition !== "service_healthy") {
          conf.condition = "service_healthy";
        }
      }
    }
  }

  if (metadata?.resources) {
    for (const [serviceName, limits] of Object.entries(metadata.resources)) {
      if (doc.services[serviceName]) {
        const svc = doc.services[serviceName];
        if (!svc.deploy) svc.deploy = {};
        if (!svc.deploy.resources) svc.deploy.resources = {};
        svc.deploy.resources.limits = {
          cpus: limits.cpus,
          memory: limits.memory,
        };
      }
    }
  }

  return YAML.stringify(doc);
}

describe('actions/dockerActions patchComposeYaml', () => {
  describe('isDbImage', () => {
    it('should detect mariadb images', () => {
      expect(isDbImage('mariadb:latest')).toBe('mariadb');
      expect(isDbImage('mariadb:10.6')).toBe('mariadb');
    });

    it('should detect mysql images', () => {
      expect(isDbImage('mysql:8.0')).toBe('mysql');
      expect(isDbImage('mysql:latest')).toBe('mysql');
    });

    it('should detect postgres images', () => {
      expect(isDbImage('postgres:15')).toBe('postgres');
      expect(isDbImage('postgres:16-alpine')).toBe('postgres');
    });

    it('should detect mongodb images', () => {
      expect(isDbImage('mongo:8.2-rc-noble')).toBe('mongo');
      expect(isDbImage('mongodb:latest')).toBe('mongo');
    });

    it('should detect redis images', () => {
      expect(isDbImage('redis:7-alpine')).toBe('redis');
      expect(isDbImage('redis:latest')).toBe('redis');
    });

    it('should return null for non-DB images', () => {
      expect(isDbImage('nginx:latest')).toBe(null);
      expect(isDbImage('nginx:1.25')).toBe(null);
      expect(isDbImage('wordpress:latest')).toBe(null);
    });

    it('should be case insensitive', () => {
      expect(isDbImage('POSTGRES:15')).toBe('postgres');
      expect(isDbImage('Redis:7-alpine')).toBe('redis');
    });
  });

  describe('patchComposeYaml - healthcheck injection', () => {
    it('should inject healthcheck for postgres service', () => {
      const yaml = `
services:
  db:
    image: postgres:15
`;
      const result = patchComposeYaml(yaml);
      expect(result).toContain('healthcheck');
      expect(result).toContain('pg_isready');
    });

    it('should inject healthcheck for redis service', () => {
      const yaml = `
services:
  cache:
    image: redis:7-alpine
`;
      const result = patchComposeYaml(yaml);
      expect(result).toContain('healthcheck');
      expect(result).toContain('redis-cli');
    });

    it('should not override existing healthcheck', () => {
      const yaml = `
services:
  db:
    image: postgres:15
    healthcheck:
      test: ["CMD", "pg_isready"]
`;
      const result = patchComposeYaml(yaml);
      const parsed = YAML.parse(result);
      expect(parsed.services.db.healthcheck.test).toEqual(['CMD', 'pg_isready']);
    });
  });

  describe('patchComposeYaml - depends_on upgrade', () => {
    it('should upgrade depends_on array to object with service_healthy', () => {
      const yaml = `
services:
  web:
    image: nginx
    depends_on:
      - db
  db:
    image: postgres:15
`;
      const result = patchComposeYaml(yaml);
      const parsed = YAML.parse(result);
      expect(parsed.services.web.depends_on).toEqual({
        db: { condition: 'service_healthy' }
      });
    });

    it('should not upgrade non-DB dependencies', () => {
      const yaml = `
services:
  web:
    image: nginx
    depends_on:
      - proxy
  proxy:
    image: nginx:alpine
`;
      const result = patchComposeYaml(yaml);
      const parsed = YAML.parse(result);
      expect(parsed.services.web.depends_on).toEqual({
        proxy: { condition: 'service_started' }
      });
    });
  });

  describe('patchComposeYaml - resource limits', () => {
    it('should inject resource limits from metadata', () => {
      const yaml = `
services:
  web:
    image: nginx
`;
      const metadata = {
        resources: {
          web: { cpus: '0.5', memory: '512m' }
        }
      };
      const result = patchComposeYaml(yaml, metadata);
      const parsed = YAML.parse(result);
      expect(parsed.services.web.deploy.resources.limits).toEqual({
        cpus: '0.5',
        memory: '512m'
      });
    });

    it('should not add deploy section if no resources', () => {
      const yaml = `
services:
  web:
    image: nginx
`;
      const result = patchComposeYaml(yaml, {});
      const parsed = YAML.parse(result);
      expect(parsed.services.web.deploy).toBeUndefined();
    });
  });
});