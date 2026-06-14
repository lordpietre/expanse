# Expanse Cloud - Plan de Monetización

## Visión
Expanse es una plataforma visual para desplegar contenedores Docker. El modelo de monetización sigue el patrón **n8n**: software desplegable localmente (self-hosted, gratis) + versión cloud administrada con suscripción.

---

## Modelo de Negocio

### Planes

| Plan | Precio | Descripción |
|------|--------|-------------|
| **Self-hosted** | $0 | Descargar y desplegar en tu propia infraestructura. Gratis, código abierto. |
| **Starter** | $12/mes | Expanse Cloud hostea tus containers. Hasta 5 containers activos, 1 nodo. |
| **Pro** | $49/mes | Recursos ilimitados, 5 nodos, HA básico, templates premium. |
| **Business** | $199/mes | Multi-nodo, HA completo, SSO, soporte prioritario. |

### Diferenciación por Tipo de Usuario

- **Self-hosted**: Para devs que quieren la herramienta gratis, o empresas que prefieren controlar su infra.
- **Cloud (Starter/Pro/Business)**: Para usuarios que no quieren gestionar infraestructura y pagan por conveniencia.

---

## Arquitectura Necesaria

### Estado Actual
- ❌ Nodos remotos son stubs (solo UI, sin funcionalidad)
- ❌ Docker deploy es 100% local (socket `/var/run/docker.sock`)
- ❌ No hay persistencia de nodos en MongoDB
- ❌ No hay sistema de billing

### Componentes a Construir

#### Fase 1: Nodos Remotos (Semanas 1-2)
**Objetivo**: BYOC - usuario trae sus propios servers

| Componente | Archivo | Descripción |
|------------|---------|-------------|
| Store de nodos | `store/nodes.ts` | Zustand store para estado de nodos |
| Tipos | `types/node.ts` | Interface `RemoteNode` (host, port, TLS, status) |
| API CRUD | `app/api/nodes/route.ts` | CRUD de nodos en MongoDB |
| Acciones | `actions/nodeActions.ts` | Health check, agregar/eliminar |
| Docker execution | `actions/dockerActions.ts` | Modificar `runCompose()` para `targetNodeId` |
| UI Settings | `components/display/settings.tsx` | Conectar con store real |
| Node selector | `components/playground/nodeSelector.tsx` | Dropdown para elegir deploy target |

#### Fase 2: Billing y Suscripciones (Semanas 2-3)
**Objetivo**: Monetización básica con Stripe

| Componente | Descripción |
|------------|-------------|
| `store/subscription.ts` | Plan actual, límites, uso actual |
| Auth con tiers | Roles: `free`, `starter`, `pro`, `business` |
| Límites por plan | Max containers, max nodes, RAM total |
| Stripe/LemonSqueezy | Suscripciones, webhooks |
| UI de upgrade | Banner de límites, pricing page |

#### Fase 3: Cloud Provisioning (Semanas 3-5)
**Objetivo**: Crear nodos en hiperescaladores automáticamente

| Componente | Descripción |
|------------|-------------|
| `lib/cloud/` | SDKs para providers (DigitalOcean, Hetzner, AWS) |
| `actions/provisionActions.ts` | Crear/destruir instances |
| Node bootstrapping | Scripts para instalar Docker y registrar nodo |

**Providers a explorar**:
- **DigitalOcean** (simples, API fácil, $4-6/mes)
- **Hetzner** (barato, buenas specs)
- **AWS** (enterprise, más complejo)

#### Fase 4: Plataforma Multi-tenant (Semanas 5-8)
**Objetivo**: Expanse Cloud como SaaS completo

| Componente | Descripción |
|------------|-------------|
| Multi-tenancy | Aislar recursos por usuario |
| Resource monitoring | RAM/CPU/bandwidth tracking |
| Usage-based billing | Opcional: pagar por uso real |
| Teams/SSO | Empresas con múltiples usuarios |

---

## Roadmap de Implementación

### Mes 1 - MVP
- [x] Plan de monetización (este documento)
- [ ] Nodos remotos funcionales (BYOC)
- [ ] Integración Stripe para Starter plan
- [ ] Página de pricing
- [ ] Dashboard de uso

### Mes 2 - Cloud Provisioning
- [ ] Integración DigitalOcean (1-click provision)
- [ ] Bootstrapping automático de nodos
- [ ] Panel de infraestructura cloud

### Mes 3 - Escalabilidad
- [ ] Multi-tenancy
- [ ] Resource monitoring detallado
- [ ] HA y auto-scaling
- [ ] Teams y SSO

---

## Branding

- **Nombre**: Expanse Cloud
- **Dominio**: expanse.cloud
- **Tagline**: "Despliega Docker visualmente, en cualquier nube"
- **Colores**: Mantener identity actual de Expanse

---

## Tech Stack para Cloud

- **Infra**: Kubernetes en DigitalOcean/Hetzner
- **Billing**: Stripe + LemonSqueezy
- **Monitoring**: Prometheus + Grafana
- **Database**: MongoDB Atlas (cloud) o self-hosted
- **CI/CD**: GitHub Actions + Docker Hub

---

## Competidores

| Herramienta | Modelo | Precio |
|-------------|--------|--------|
| n8n | Self-hosted + Cloud | $0 / $20/mes |
| Railway | Cloud only | $5/mes (usage-based) |
| Render | Cloud only | $5/mes (usage-based) |
| CapRover | Self-hosted | $0 |
| Docketeer | Self-hosted | $0 |

**Diferenciador de Expanse**: Enfoque visual en Docker Compose + soporte para HA + multi-nodo.

---

## Métricas Clave

- **MRR**: Ingresos recurrentes mensuales
- **Churn**: Tasa de cancelación
- **CAC**: Costo de adquirir un cliente
- **LTV**: Lifetime value del cliente
- **NRR**: Net Revenue Retention (expansión de revenue)