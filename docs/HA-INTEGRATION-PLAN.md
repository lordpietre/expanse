# Plan de Integración: Spec-Driven Development para HA con PostgREST

**Versión**: 1.0
**Fecha**: 2026-06-13
**Arquitectura**: HAProxy + PgBouncer + PostgreSQL + PostgREST (Autoscaling)

---

## Resumen Ejecutivo

Implementar despliegue de arquitecturas de Alta Disponibilidad (HA) desde el entorno visual de Expanse, con:
- **Load Balancer**: HAProxy (round-robin, health checks)
- **API Layer**: PostgREST con escalado automático (2-10 instancias)
- **Database Layer**: PostgreSQL + PgBouncer (connection pooling)

---

## Decisiones de Diseño

| Componente | Decisión |
|------------|----------|
| Load Balancer | HAProxy |
| Database HA | PgBouncer + PostgreSQL |
| Scaling | Autoscaling (2-10 instancias) |
| Connection Pooling | PgBouncer en modo transaction |

---

## Fases de Implementación

### Fase 1: Extensión del Schema y Tipos

#### 1.1 Actualizar `types/library.ts`

```typescript
// Tipos HA para templates
export interface LoadBalancerConfig {
  type: 'haproxy' | 'nginx' | 'traefik';
  port: number;
  targetPort: number;
  algorithm: 'round-robin' | 'least-connections' | 'ip-hash';
  healthCheckPath: string;
  healthCheckInterval: string;
}

export interface ReplicasConfig {
  enabled: boolean;
  minReplicas: number;       // mínimo 2
  maxReplicas: number;       // máximo 10
  scaleTarget: string;       // nombre del servicio a escalar
  targetCPUUtilization?: number;  // para autoscaling
  targetMemoryUtilization?: number;
}

export interface DatabaseHaConfig {
  type: 'single' | 'pgbouncer';
  poolMode: 'transaction' | 'session' | 'statement';
  maxConnections: number;
  poolSize: number;
}

export interface TemplateService {
  // ... campos existentes ...
  loadBalancer?: LoadBalancerConfig;
  replicas?: ReplicasConfig;
  databaseHa?: DatabaseHaConfig;
}
```

#### 1.2 Crear archivo de configuración HA

**Archivo**: `data/haproxy.cfg.template`

```
global
    log stdout format raw local0
    maxconn 4096
    user haproxy
    group haproxy
    daemon

defaults
    log     global
    mode    http
    option  httplog
    option  dontlognull
    timeout connect 5000ms
    timeout client  50000ms
    timeout server  50000ms

frontend postgrest_ha
    bind :{{PORT}}
    default_backend postgrest_nodes

backend postgrest_nodes
    balance {{ALGORITHM}}
    option httpchk GET {{HEALTH_CHECK_PATH}}
    http-check expect status 200
    {{#EACH_SERVERS}}
    server {{NAME}} {{HOST}}:{{TARGET_PORT}} check inter 5s fall 2 rise 1
    {{/EACH_SERVERS}}
```

#### 1.3 Crear archivo de configuración PgBouncer

**Archivo**: `data/pgbouncer.ini.template`

```
[databases]
{{DB_NAME}} = host={{DB_HOST}} port={{DB_PORT}} dbname={{DB_NAME}}

[pgbouncer]
pool_mode = {{POOL_MODE}}
max_client_conn = {{MAX_CLIENT_CONN}}
default_pool_size = {{POOL_SIZE}}
min_pool_size = {{MIN_POOL_SIZE}}
reserve_pool_size = {{RESERVE_POOL_SIZE}}
reserve_pool_timeout = {{RESERVE_POOL_TIMEOUT}}
server_lifetime = {{SERVER_LIFETIME}}
server_idle_timeout = {{SERVER_IDLE_TIMEOUT}}
log_connections = 0
log_disconnections = 0
log_pooler_errors = 1
```

---

### Fase 2: Template HA de Ejemplo

#### 2.1 Crear `data/library/postgrest-ha.json`

```json
{
  "name": "PostgREST (HA)",
  "description": "REST API layer with HAProxy load balancer, autoscaling PostgREST instances, and PgBouncer connection pooling",
  "category": "Web Server",
  "isStack": true,
  "image": "postgrest/postgrest:latest",
  "logo": "postgresql",
  "default_ports": ["3000:80"],
  "loadBalancer": {
    "type": "haproxy",
    "port": 80,
    "targetPort": 3000,
    "algorithm": "round-robin",
    "healthCheckPath": "/",
    "healthCheckInterval": "5s"
  },
  "replicas": {
    "enabled": true,
    "minReplicas": 2,
    "maxReplicas": 10,
    "scaleTarget": "api",
    "targetCPUUtilization": 70,
    "targetMemoryUtilization": 80
  },
  "databaseHa": {
    "type": "pgbouncer",
    "poolMode": "transaction",
    "maxConnections": 100,
    "poolSize": 20
  },
  "env_vars": {
    "PGRST_DB_SCHEMAS": "public",
    "PGRST_DB_ANON_ROLE": "anon",
    "PGRST_DB_USE_LEGACY_GUCS": "false"
  },
  "related_services": [
    {
      "name": "db",
      "image": "postgres:18-alpine",
      "env_vars": {
        "POSTGRES_PASSWORD": "postgres",
        "POSTGRES_USER": "postgres",
        "POSTGRES_DB": "postgres"
      },
      "healthcheck": {
        "test": ["CMD-SHELL", "pg_isready -h localhost -U postgres"],
        "interval": "10s",
        "timeout": "5s",
        "retries": 5,
        "start_period": "20s"
      },
      "volumes": ["postgres_data:/var/lib/postgresql/data"]
    },
    {
      "name": "pgbouncer",
      "image": "edoburu/pgbouncer:latest",
      "env_vars": {
        "DATABASE_URL": "postgres://postgres:postgres@db:5432/postgres",
        "POOL_MODE": "transaction",
        "MAX_CLIENT_CONN": "100",
        "DEFAULT_POOL_SIZE": "20"
      },
      "ports": ["5439:5432"]
    },
    {
      "name": "api",
      "image": "postgrest/postgrest:latest",
      "env_vars": {
        "PGRST_DB_URI": "postgres://postgres:postgres@pgbouncer:5439/postgres"
      },
      "deploy": {
        "replicas": 2,
        "resources": {
          "limits": {
            "cpus": "0.5",
            "memory": "512m"
          }
        }
      }
    },
    {
      "name": "lb",
      "image": "haproxy:2.9-alpine",
      "ports": ["80:80"],
      "volumes": ["haproxy.conf:/usr/local/etc/haproxy/haproxy.cfg:ro"]
    }
  ]
}
```

---

### Fase 3: Generador de Configuración

#### 3.1 Nueva función en `lib/metadata.ts`

```typescript
import { TemplateService } from "@/types/library";

export interface HaConfig {
  loadBalancer?: LoadBalancerConfig;
  replicas?: ReplicasConfig;
  databaseHa?: DatabaseHaConfig;
}

export interface GeneratedHaFiles {
  haproxyConfig?: string;
  pgbouncerIni?: string;
  envFiles?: Record<string, string>;
}

export function extractHaConfig(template: TemplateService): HaConfig {
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
  return `[databases]
${dbName} = host=${dbHost} port=${dbPort} dbname=${dbName} pool_size=${dbConfig.poolSize}

[pgbouncer]
pool_mode = ${dbConfig.poolMode}
max_client_conn = ${dbConfig.maxConnections}
default_pool_size = ${dbConfig.poolSize}
min_pool_size = 5
reserve_pool_size = 5
reserve_pool_timeout = 5
server_lifetime = 3600
server_idle_timeout = 600
log_connections = 0
log_disconnections = 0
`;
}

export function generateAutoscalingConfig(
  replicasConfig: ReplicasConfig,
  serviceName: string
): object {
  return {
    apiVersion: 'autoscaling/v2',
    kind: 'HorizontalPodAutoscaler',
    metadata: {
      name: `${serviceName}-hpa`
    },
    spec: {
      scaleTargetRef: {
        apiVersion: 'apps/v1',
        kind: 'Deployment',
        name: serviceName
      },
      minReplicas: replicasConfig.minReplicas,
      maxReplicas: replicasConfig.maxReplicas,
      metrics: [
        {
          type: 'Resource',
          resource: {
            name: 'cpu',
            target: {
              type: 'Utilization',
              utilizationPercentage: replicasConfig.targetCPUUtilization
            }
          }
        },
        {
          type: 'Resource',
          resource: {
            name: 'memory',
            target: {
              type: 'Utilization',
              utilizationPercentage: replicasConfig.targetMemoryUtilization
            }
          }
        }
      ]
    }
  };
}
```

#### 3.2 Modificar `store/compose.ts`

```typescript
// Añadir a addServiceFromTemplate
addServiceFromTemplate: async (template: TemplateService) => {
  // ... código existente ...

  // NUEVO: Generar archivos HA si es necesario
  const haConfig = extractHaConfig(template);
  if (haConfig.loadBalancer) {
    // Guardar config HA en metadata
    usePositionMap.setState({ haConfig });
  }
}
```

---

### Fase 4: Modificar UI del Playground

#### 4.1 Nueva pestaña en `components/playground/editor/serviceEditor.tsx`

```tsx
"use client"

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export function HaConfigPanel({ service, onUpdate }: { service: Service; onUpdate: (updates: Partial<Service>) => void }) {
  const t = useTranslations();

  const [haEnabled, setHaEnabled] = useState(!!service.replicas?.enabled);
  const [minReplicas, setMinReplicas] = useState(service.replicas?.minReplicas ?? 2);
  const [maxReplicas, setMaxReplicas] = useState(service.replicas?.maxReplicas ?? 10);
  const [lbType, setLbType] = useState<'haproxy' | 'nginx' | 'traefik'>(service.loadBalancer?.type ?? 'haproxy');
  const [lbPort, setLbPort] = useState(service.loadBalancer?.port ?? 80);
  const [lbAlgorithm, setLbAlgorithm] = useState<'round-robin' | 'least-connections' | 'ip-hash'>(
    service.loadBalancer?.algorithm ?? 'round-robin'
  );

  return (
    <div className="space-y-6 p-4">
      <div className="flex items-center justify-between">
        <div>
          <Label>High Availability</Label>
          <p className="text-sm text-slate-500">Enable autoscaling and load balancing</p>
        </div>
        <Switch checked={haEnabled} onCheckedChange={setHaEnabled} />
      </div>

      {haEnabled && (
        <>
          <div className="space-y-2">
            <Label>Minimum Replicas: {minReplicas}</Label>
            <Slider
              value={[minReplicas]}
              min={2}
              max={maxReplicas}
              step={1}
              onValueChange={([v]) => setMinReplicas(v)}
            />
          </div>

          <div className="space-y-2">
            <Label>Maximum Replicas: {maxReplicas}</Label>
            <Slider
              value={[maxReplicas]}
              min={minReplicas}
              max={10}
              step={1}
              onValueChange={([v]) => setMaxReplicas(v)}
            />
          </div>

          <div className="space-y-2">
            <Label>Load Balancer Type</Label>
            <Select value={lbType} onValueChange={(v: any) => setLbType(v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="haproxy">HAProxy</SelectItem>
                <SelectItem value="nginx">Nginx</SelectItem>
                <SelectItem value="traefik">Traefik</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Load Balancing Algorithm</Label>
            <Select value={lbAlgorithm} onValueChange={(v: any) => setLbAlgorithm(v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="round-robin">Round Robin</SelectItem>
                <SelectItem value="least-connections">Least Connections</SelectItem>
                <SelectItem value="ip-hash">IP Hash</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </>
      )}
    </div>
  );
}
```

#### 4.2 Añadir pestaña en ServiceEditor

```tsx
// En ServiceEditor.tsx, dentro del tab switch case:
case 'ha':
  return <HaConfigPanel service={currentService} onUpdate={handleServiceUpdate} />;
```

---

### Fase 5: Modificar Flujo de Despliegue

#### 5.1 Extender `actions/dockerActions.ts`

```typescript
import { generateHaproxyConfig, generatePgbouncerConfig } from "@/lib/metadata";

export async function runHaCompose(
  composeId: string,
  yamlContent: string,
  haConfig?: {
    loadBalancer?: LoadBalancerConfig;
    replicas?: ReplicasConfig;
    databaseHa?: DatabaseHaConfig;
  }
) {
  await ensureAuth();
  const tempDir = path.join(os.tmpdir(), `expanse-${composeId}`);
  await fs.mkdir(tempDir, { recursive: true });

  // 1. Escribir docker-compose.yaml
  const yamlPath = path.join(tempDir, 'docker-compose.yaml');

  // 2. Generar y escribir archivos HA si es necesario
  let extraFiles: Record<string, string> = {};

  if (haConfig?.loadBalancer) {
    // Extraer servidores del YAML
    const doc = YAML.parse(yamlContent);
    const servers = extractApiServers(doc, haConfig.replicas?.scaleTarget ?? 'api');

    // Generar configuración HAProxy
    const haproxyConfig = generateHaproxyConfig(
      haConfig.loadBalancer,
      servers
    );
    extraFiles['haproxy.conf'] = haproxyConfig;
    await fs.writeFile(path.join(tempDir, 'haproxy.conf'), haproxyConfig);
  }

  if (haConfig?.databaseHa && haConfig.databaseHa.type === 'pgbouncer') {
    const pgbouncerConfig = generatePgbouncerConfig(
      haConfig.databaseHa,
      'db',  // host del servicio postgres
      5432,
      'postgres'
    );
    extraFiles['pgbouncer.ini'] = pgbouncerConfig;
    await fs.writeFile(path.join(tempDir, 'pgbouncer.ini'), pgbouncerConfig);
  }

  // 3. Patch YAML con healthchecks y replicas
  const patchedYaml = patchComposeYaml(yamlContent, metadata);

  // 4. Incluir archivos extra en el compose (montajes de volumen)
  const finalYaml = injectExtraFiles(patchedYaml, extraFiles);

  await fs.writeFile(yamlPath, finalYaml);

  // 5. Ejecutar docker compose up -d
  try {
    const { stdout, stderr } = await execAsync(
      `docker compose -f ${yamlPath} -p expanse-project_${composeId} up -d`
    );
    return { success: true, message: 'HA Stack deployed successfully' };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

function extractApiServers(
  doc: any,
  scaleTarget: string
): Array<{ name: string; host: string; port: number }> {
  const servers: Array<{ name: string; host: string; port: number }> = [];
  const replicas = doc.services?.[scaleTarget]?.deploy?.replicas ?? 2;

  for (let i = 1; i <= replicas; i++) {
    servers.push({
      name: `${scaleTarget}_${i}`,
      host: scaleTarget,
      port: doc.services?.[scaleTarget]?.ports?.[0]?.split(':')[1] ?? 3000
    });
  }

  return servers;
}
```

#### 5.2 Modificar `patchComposeYaml` en `dockerActions.ts`

```typescript
function patchComposeYaml(
  yamlText: string,
  metadata?: composeMetadata,
  replicas?: ReplicasConfig
): string {
  const doc = YAML.parse(yamlText);
  if (!doc?.services) return yamlText;

  // ... código existente de healthchecks ...

  // NUEVO: Aplicar configuración de replicas
  if (replicas?.enabled && replicas.scaleTarget) {
    const targetService = doc.services[replicas.scaleTarget];
    if (targetService) {
      if (!targetService.deploy) targetService.deploy = {};
      targetService.deploy.replicas = replicas.minReplicas;
    }
  }

  return YAML.stringify(doc);
}
```

---

### Fase 6: Panel de Métricas HA

#### 6.1 Nuevo componente `components/playground/haMetricsPanel.tsx`

```tsx
"use client"

import { useTranslations } from "next-intl";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useExecutionStore } from "@/store/execution";

interface HaMetricsPanelProps {
  composeId: string;
}

export function HaMetricsPanel({ composeId }: HaMetricsPanelProps) {
  const t = useTranslations();
  const { serviceStatuses } = useExecutionStore();

  const runningCount = Object.values(serviceStatuses).filter(
    s => s.status === 'running'
  ).length;

  const totalInstances = Object.keys(serviceStatuses).length;

  return (
    <Card className="mt-4">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">HA Metrics</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <div className="text-2xl font-bold">{runningCount}/{totalInstances}</div>
            <p className="text-xs text-slate-500">Active Instances</p>
          </div>

          <Badge variant={runningCount === totalInstances ? "success" : "warning"}>
            {runningCount === totalInstances ? "Healthy" : "Degraded"}
          </Badge>
        </div>

        <div className="mt-4 space-y-2">
          {Object.entries(serviceStatuses).map(([name, status]) => (
            <div key={name} className="flex items-center justify-between text-sm">
              <span className="text-slate-600">{name}</span>
              <Badge
                variant={status.status === 'running' ? "success" : "destructive"}
              >
                {status.status}
              </Badge>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
```

---

### Fase 7: Actualizar Documentación

#### 7.1 Añadir a `AGENTS.md`

```markdown
## HA Deployments

Templates con configuración HA incluyen:
- `loadBalancer`: genera configuración de HAProxy/Nginx/Traefik
- `replicas`: crea servicios con `deploy.replicas` y autoscaling
- `databaseHa`: genera configuración de PgBouncer para connection pooling

### Template HA Example (`postgrest-ha.json`)
```json
{
  "name": "PostgREST (HA)",
  "isStack": true,
  "loadBalancer": {
    "type": "haproxy",
    "port": 80,
    "targetPort": 3000,
    "algorithm": "round-robin"
  },
  "replicas": {
    "enabled": true,
    "minReplicas": 2,
    "maxReplicas": 10,
    "scaleTarget": "api"
  },
  "databaseHa": {
    "type": "pgbouncer",
    "poolMode": "transaction",
    "maxConnections": 100,
    "poolSize": 20
  }
}
```

### Archivos Generados
- `haproxy.conf`: Configuración del load balancer
- `pgbouncer.ini`: Configuración del connection pooler
```

#### 7.2 Añadir a `CONTRIBUTING.md`

```markdown
## Adding HA Templates

Templates de Alta Disponibilidad requieren:

1. `isStack: true` - Indica que es un template multi-servicio
2. `loadBalancer` - Configuración del balanceador de carga
3. `replicas` - Configuración de autoscaling
4. `databaseHa` - Configuración de HA para base de datos (opcional)

Ver `data/library/postgrest-ha.json` como ejemplo completo.
```

---

## Orden de Implementación Sugerido

| Fase | Descripción | Dificultad | Tiempo Estimado |
|------|-------------|------------|-----------------|
| 1 | Extender tipos y schema | Baja | 2h |
| 2 | Template HA de ejemplo | Baja | 1h |
| 3 | Generador de configs HA | Media | 4h |
| 4 | UI del playground (panel HA) | Media | 6h |
| 5 | Modificar flujo de despliegue | Alta | 8h |
| 6 | Panel de métricas HA | Baja | 3h |
| 7 | Documentación | Baja | 1h |

**Total estimado**: ~25 horas

---

## Verificación

Después de implementar:

1. **Test unitarios**:
   - `pnpm test` - Todos los tests existentes pasan
   - Añadir tests para `generateHaproxyConfig` y `generatePgbouncerConfig`

2. **Test manual**:
   - Importar template `postgrest-ha.json`
   - Desplegar desde el playground
   - Verificar que:
     - HAProxy está escuchando en el puerto configurado
     - 2 instancias de PostgREST están corriendo
     - PgBouncer está en puerto 5439
     - PostgreSQL tiene healthcheck
   - Hacer requests a HAProxy y verificar balanceo
   - Simular caída de una instancia y verificar recuperación

3. **Test de escalado**:
   - Modificar número de réplicas via UI
   - Verificar que nuevas instancias se crean/destruyen

---

## Archivos a Modificar

| Archivo | Acción |
|---------|--------|
| `types/library.ts` | Añadir tipos HA |
| `data/library/postgrest-ha.json` | Crear template HA |
| `data/haproxy.cfg.template` | Crear template HAProxy |
| `data/pgbouncer.ini.template` | Crear template PgBouncer |
| `lib/metadata.ts` | Añadir funciones de generación HA |
| `store/compose.ts` | Integrar config HA en addServiceFromTemplate |
| `actions/dockerActions.ts` | Añadir runHaCompose, modificar patchComposeYaml |
| `components/playground/editor/serviceEditor.tsx` | Añadir pestaña HA |
| `components/playground/haMetricsPanel.tsx` | Crear panel de métricas |
| `AGENTS.md` | Documentar HA |
| `CONTRIBUTING.md` | Documentar creación de templates HA |
| `PLAN.md` | Marcar como completado |

---

## Notas Adicionales

1. **Seguridad**: La config HAProxy incluye health checks pero no TLS. Añadir soporte HTTPS es futura mejora.

2. **Persistencia**: El template usa volúmenes Docker estándar. Para producción, considerar volúmenes NFS o cloud storage.

3. **Monitoring**: El panel de métricas es básico. Integrar con Prometheus/Grafana es futura mejora.

4. **Resiliencia**: PgBouncer está configurado en modo transaction. Para transacciones largas, considerar modo session.

5. **Costos**: El autoscaling está limitado a 10 réplicas para controlar costos. El usuario puede ajustar `maxReplicas`.