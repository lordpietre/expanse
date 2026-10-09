<div align="center">
  <img src="https://raw.githubusercontent.com/lordpietre/expanse/main/assets/expanse.png" alt="Expanse Logo" width="160" />

  <h1>Expanse</h1>
  <p><strong>El IDE Visual Profesional para Docker Compose</strong></p>

  <p>
    <a href="https://opensource.org/licenses/MIT"><img src="https://img.shields.io/badge/License-MIT-blue.svg" alt="License: MIT" /></a>
    <img src="https://img.shields.io/badge/Next.js-15-black?logo=next.js" alt="Next.js 15" />
    <img src="https://img.shields.io/badge/Docker-Compose-2496ED?logo=docker&logoColor=white" alt="Docker Compose" />
    <img src="https://img.shields.io/badge/TypeScript-3178C6?logo=typescript&logoColor=white" alt="TypeScript" />
  </p>
</div>

---

## 🎯 ¿Qué es Expanse?

**Expanse** es una plataforma profesional que simplifica radicalmente el despliegue de aplicaciones containerizadas. Diseña tu infraestructura visualmente, despliegala con un clic, y monitoreala en tiempo real — todo sin escribir una sola línea de YAML.

> _"El 90% de los desarrolladores struggle con Docker Compose. Expanse lo hace trivial."_

### 🎯 Público Objetivo

| Segmento | Beneficio Principal |
|----------|---------------------|
| **DevOps Engineers** | Prototipado rápido de arquitecturas, reducción de errores en YAML |
| **Startups** | Deploy de stacks completos (DB + Backend + Frontend) en minutos |
| **Desarrolladores Individuales** | Curva de aprendizaje cero para Docker |
| **Equipos de Producto** | Sharing de configuraciones entre entornos |
| **Agencias** | Gestión multi-cliente sin complejidad |

---

## ✨ Características Principales

### 🖼️ Editor Visual de Drag & Drop

Interface intuitiva tipo canvas donde puedes:
- **Arrastrar servicios** desde una biblioteca de 138+ plantillas
- **Conectar visualmente** bases de datos, APIs, redes y volúmenes
- **Ver dependencias** entre servicios representadas como flechas
- **Auto-layout** inteligente que organiza nodos según tipología (routers → apps → databases)

### 📦 Biblioteca de Servicios Enterprise

Templates verificados y mantenidos para las tecnologías más populares:

| Categoría | Servicios |
|-----------|-----------|
| **Databases** | PostgreSQL, MySQL, MongoDB, Redis, MariaDB, Elasticsearch |
| **AI/ML** | Ollama, Open WebUI, Qdrant, AnythingLLM, vLLM, ComfyUI |
| **Automation** | n8n, Node-RED, Home Assistant, ActivePieces |
| **CMS** | WordPress, Ghost, Strapi, Directus, Drupal |
| **Monitoring** | Prometheus, Grafana, Zabbix, Netdata, Uptime Kuma |
| **Networking** | Nginx, Traefik, HAProxy, WireGuard, NetBird |
| **Messaging** | Rocket.Chat, Zulip, Matrix, Mattermost |
| **Media** | Jellyfin, Plex, Pi-hole, AdGuard |
| **Cloud** | Nextcloud, OwnCloud, Seafile, Duplicacy |

### 🚀 Despliegue Inteligente

Un solo clic para desplegar stacks complejos:

```yaml
# Expanse genera automáticamente:
# ✓ Healthchecks optimizados por tipo de servicio
# ✓ Variables de entorno inyectadas según dependencias
# ✓ Límites de CPU/memoria configurables
# ✓ Redes y volúmenes auto-configurados
# ✓ Resolución de conflictos de puertos (auto-reasignación)
```

### 🔄 Alta Disponibilidad Integrada

Configura HA en segundos sin ser experto en infrastructure:

| Componente | Tecnología | Beneficio |
|------------|------------|-----------|
| **Load Balancer** | HAProxy | Balanceo round-robin, health checks |
| **Autoscaling** | Docker Compose replicas | 2-10 réplicas automáticas |
| **Connection Pool** | PgBouncer | Transaction mode, hasta 100 conexiones |

### 📊 Monitoreo en Tiempo Real

- **Estado de servicios**: Running, Exited, Unknown con iconografía clara
- **Métricas live**: CPU, memoria, disco por contenedor
- **Logs streaming**: Transmisión en vivo con colores diferenciados
- **Terminal integrada**: xterm.js para acceso shell directo por contenedor

### 🔐 Seguridad & Colaboración

- **Auth JWT** con cookies HTTP-only (30 días expiry)
- **Sharing granular**: Comparte configuraciones vía link read-only
- **Backup automático**: Exporta/importa configuraciones
- **Validación de puertos**: Detección proactiva de conflictos

---

## 🚀 Primeros Pasos

### Requisitos Previos

- Docker Engine 20.10+ y Docker Compose v2
- MongoDB 5.0+ (incluido en el stack)
- 4GB RAM mínimo recomendado
- Puerto 4000 disponible

### Instalación Instantánea

```bash
# Opción 1: Clone y ejecuta
git clone https://github.com/lordpietre/expanse.git
cd expanse
docker compose up -d

# Accede a http://localhost:4000
```

```bash
# Opción 2: Docker Run directo
docker run -d \
  --name expanse \
  -p 4000:4000 \
  -p 27017:27017 \
  -v /var/run/docker.sock:/var/run/docker.sock \
  lordpietre/expanse:latest
```

---

## 📖 Flujo de Trabajo

### Phase 1: Diseña

1. **Abre el Canvas** → Click en "+" o selecciona de la biblioteca
2. **Arrastra servicios** → PostgreSQL, Redis, tu API, Nginx
3. **Conecta servicios** → Arrastra de un nodo a otro
4. **Configura** → Click en cualquier nodo para editar recursos

### Phase 2: Despliega

1. **Click en "Run"** → Se abre el diálogo de HA (opcional)
2. **Selecciona HA options** → Réplicas, Load Balancer, Connection Pool
3. **Confirm** → Expanse valida puertos y despliega
4. **Verifica** → Estado "running" en verde

### Phase 3: Monitorea

1. **Panel de ejecución** → Estado de todos los servicios
2. **Logs live** → Click en servicio para ver logs
3. **Terminal** → Click en icono de terminal para shell interactivo
4. **Métricas HA** → Panel dedicado con throughput, conexiones

---

## 🏗️ Arquitectura Técnica

### Stack Tecnológico

| Capa | Tecnología | Versión |
|------|------------|---------|
| **Framework** | Next.js | 15.x |
| **UI** | React | 19.x |
| **Canvas** | @xyflow/react + ELK.js | 12.x / 0.9.x |
| **State** | Zustand | 5.x |
| **Database** | MongoDB + Mongoose | 6.x / 8.x |
| **Auth** | JWT (jose) + bcrypt | HS256 |
| **Styling** | Tailwind CSS + Radix UI | 3.x |
| **Terminal** | xterm.js | 5.x |
| **Validation** | Zod + react-hook-form | 3.x |

### Diagrama de Arquitectura

```
┌─────────────────────────────────────────────────────────────┐
│                        Usuario                              │
│                    Browser (Chrome)                          │
│              https://localhost:4000                          │
└──────────────────────────┬──────────────────────────────────┘
                           │ HTTPS
┌──────────────────────────▼──────────────────────────────────┐
│                    Expanse Container                         │
│  ┌────────────────┐  ┌────────────────┐  ┌───────────────┐  │
│  │   Next.js     │  │    MongoDB     │  │     ELK       │  │
│  │  (App + API)  │  │   (Estado)     │  │  (Layout)     │  │
│  └───────┬───────┘  └────────────────┘  └───────────────┘  │
│          │                                                  │
│          │ docker.sock                                       │
│          ▼                                                  │
│  ┌──────────────────────────────────────────────────────┐   │
│  │              Docker Engine                             │   │
│  │  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐  │   │
│  │  │Postgres │  │  Redis  │  │ HAProxy │  │ TuApp   │  │   │
│  │  └─────────┘  └─────────┘  └─────────┘  └─────────┘  │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

### Modelo de Datos

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│    User     │────▶│   Compose   │────▶│  Metadata   │
├─────────────┤     ├─────────────┤     ├─────────────┤
│ _id         │     │ _id         │     │ Ids         │
│ email       │     │ userId      │     │ positionMap │
│ password    │     │ data        │     │ connection  │
│ companyType │     │ metadata    │     │ resources   │
└─────────────┘     │ createdAt   │     └─────────────┘
                    │ updatedAt   │
                    └─────────────┘
                           │
                    ┌──────▼──────┐
                    │   Share      │
                    ├─────────────┤
                    │ composeId   │
                    │ name        │
                    │ readOnly    │
                    └─────────────┘
```

---

## 🔄 Comparativa

| Feature | Docker Compose Manual | Expanse |
|---------|---------------------|---------|
| **Curva de aprendizaje** | Alta (YAML, networking, volumes) | Baja (visual drag & drop) |
| **Tiempo de prototipado** | 30-60 min por stack | 5 min por stack |
| **Errores de sintaxis** | Frecuentes (YAML es frágil) | Cero (generación automática) |
| **HA setup** | Manual (HAProxy, replicas) | 1-click |
| **Monitoreo** | CLI `docker ps`, `logs` | Dashboard visual + terminal |
| **Sharing** | Archivos .yml por email | Links compartibles |
| **Validación puertos** | Manual | Automática con reasignación |

---

## 🌐 Internacionalización

- **English (en)** — Default
- **Español (es)** — Completo

---

## 🤝 Contribuir

Ver [CONTRIBUTING.md](CONTRIBUTING.md) para estándares de código y proceso de pull requests.

---

## 📄 Licencia

MIT — Expanse es y será siempre gratuito y open source.

---

## 🔮 Roadmap

- [ ] **v2.0**: Multi-cluster management (Kubernetes)
- [ ] **v2.1**: Templates marketplace con ratings
- [ ] **v2.2**: GitOps integration (GitHub Actions)
- [ ] **v2.3**: Team workspaces con RBAC
- [ ] **v2.4**: Cloud deployment target (AWS, GCP, Azure)

---

<div align="center">
  <sub>Hecho para hacer Docker Compose accesible para todos.</sub>
  <br/>
  <sub>⭐ Star el repo si te gusta Expanse</sub>
</div>
