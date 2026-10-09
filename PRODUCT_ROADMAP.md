# 📋 Plan Estratégico de Producto — Expanse

## 🎯 Visión del Producto

**Expanse** es un **Visual IDE para Docker Compose** que democratiza el despliegue de aplicaciones containerizadas. El producto permite diseñar, desplegar y administrar infraestructura Docker sin escribir YAML, orientado a developers, startups y equipos DevOps.

---

## 📊 Análisis de Situación Actual

### ✅ Fortalezas Identificadas
1. **Editor visual funcional** con React Flow + ELK.js
2. **138+ templates** verificados de servicios populares
3. **HA integrado** (HAProxy, PgBouncer, replicas)
4. **Monitoreo en tiempo real** con logs y terminal
5. **Auth JWT** robusta con HTTP-only cookies
6. **i18n** completo (EN/ES)
7. **Docker socket bridge** para ejecución real

### ⚠️ Áreas de Mejora Identificadas
1. **No hay team collaboration** — sin workspaces compartidos
2. **Solo local** — no soporta remote Docker hosts
3. **Sin marketplace** — templates son estáticos
4. **UI mejorable** — necesita refinamiento visual
5. **No hay plugin system** — extensibilidad limitada
6. **YAML export/import** funcional pero básico
7. **Sin GitOps** — no hay integración con CI/CD
8. **Métricas básicas** — sin gráficos históricos

---

## 🚀 Plan de Mejoras por Fases

---

## Fase 1: Producto Mínimo Viable Comercial (Mes 1-2)

### 1.1 Refinamiento UI/UX
**Prioridad: CRÍTICA**

| Mejora | Descripción | Esfuerzo |
|--------|-------------|----------|
| **Onboarding flow** | Tutorial interactivo de 3 pasos para nuevos usuarios | Bajo |
| **Empty states mejorados** | Ilustraciones + CTAs claros en canvas vacío | Bajo |
| **Tooltips consistentes** | Documentación inline en cada nodo/config | Bajo |
| **Dark mode** | Tema oscuro para reducir fatiga visual | Medio |
| **Keyboard shortcuts** | `Cmd+S` save, `Del` delete node, `Cmd+Z` undo | Medio |
| **Undo/Redo** | Historial de cambios del canvas (10 niveles) | Alto |

**Detalles técnicos:**
- Añadir `next-themes` para dark mode
- Implementar Zustand middleware para undo/redo
- Usar `tippy.js` o Radix Tooltip para documentación inline

### 1.2 Export/Import Mejorado
**Prioridad: ALTA**

| Mejora | Descripción |
|--------|-------------|
| **Export múltiples formatos** | `docker-compose.yaml`, `kubernetes.yaml`, `.json` |
| **Import desde URL** | Descargar docker-compose.yml desde GitHub, GitLab |
| **Template ZIP** | Exportar stack completo como ZIP portable |
| **Diff visual** | Comparar versión actual con importada antes de confirmar |

### 1.3 Mejoras en Canvas
**Prioridad: ALTA**

| Mejora | Descripción |
|--------|-------------|
| **Multi-select** | Shift+Click para seleccionar múltiples nodos |
| **Snap to grid** | Alineación automática de nodos |
| **Zoom presets** | Botones 50%, 100%, 150%, Fit |
| **Minimap mejorada** | Click en minimap para navegar |
| **Breadcrumbs** | Mostrar jerarquía de servicios |

### 1.4 Validación y Feedback
**Prioridad: ALTA**

| Mejora | Descripción |
|--------|-------------|
| **Validación en tiempo real** | Errores de config shown inline antes de deploy |
| **Dry-run** | Simular deploy sin ejecutar (preview YAML) |
| **Notification center** | Centro unificado de notificaciones |
| **Toast notifications** | Feedback visual de acciones |

---

## Fase 2: Colaboración y Enterprise (Mes 3-4)

### 2.1 Team Workspaces
**Prioridad: CRÍTICA**

| Feature | Descripción | Complejidad |
|---------|-------------|--------------|
| **Organizations** | Crear org, invitar miembros por email | Alta |
| **Roles: Owner/Admin/Member** | RBAC con permisos granulares | Alta |
| **Shared compose projects** | Ver y editar proyectos del team | Alta |
| **Activity log** | Quién hizo qué y cuándo | Media |
| **Comments** | Comentar en nodos específicos | Media |

**Modelo de datos:**
```typescript
interface Organization {
  _id: ObjectId;
  name: string;
  ownerId: ObjectId;
  members: Array<{ userId: ObjectId; role: 'owner' | 'admin' | 'member' }>;
  createdAt: Date;
}

interface ComposePermission {
  composeId: ObjectId;
  orgId: ObjectId;
  visibility: 'private' | 'org' | 'public';
}
```

### 2.2 Versioning de Composites
**Prioridad: ALTA**

| Feature | Descripción |
|--------|-------------|
| **Auto-save versions** | Cada deploy crea versión |
| **Version history** | Ver/restaruar versiones anteriores |
| **Diff entre versiones** | Comparar visualmente cambios |
| **Tags** | Marcar versiones como "stable", "prod" |

### 2.3 Sharing Avanzado
**Prioridad: MEDIA**

| Feature | Descripción |
|--------|-------------|
| **Links con expiry** | Compartir con link que expira en N días |
| **Links con password** | Proteger links compartidos con password |
| **Embed code** | Embed canvas en iframes (read-only) |
| **Social share** | Compartir en LinkedIn, Twitter con preview |

---

## Fase 3: Remote Docker & Cloud (Mes 5-6)

### 3.1 Remote Docker Hosts
**Prioridad: CRÍTICA**

| Feature | Descripción | Complejidad |
|---------|-------------|-------------|
| **Add remote host** | SSH connection + Docker socket tunnel | Alta |
| **Docker contexts** | Soporte nativo para Docker contexts | Media |
| **Connection testing** | Validar credenciales antes de guardar | Media |
| **Host selector** | Dropdown para elegir target (local/remote) | Bajo |

**Modelo de datos:**
```typescript
interface DockerHost {
  _id: ObjectId;
  userId: ObjectId;
  name: string;           // "Production Server"
  endpoint: string;       // ssh://user@host:22
  socketPath?: string;    // /var/run/docker.sock (local)
  sshKeyId?: ObjectId;    // Reference to stored SSH key
  status: 'connected' | 'disconnected' | 'error';
  lastConnected?: Date;
}
```

### 3.2 Multi-Environment Deployment
**Prioridad: ALTA**

| Feature | Descripción |
|--------|-------------|
| **Environment variables por host** | `DB_PASS` diferente en prod vs dev |
| **Environment cloning** | Copiar config de dev → staging → prod |
| **Secrets management** | Store passwords encriptados, no en YAML |
| **Env override UI** | UI para sobreescribir vars por ambiente |

### 3.3 Docker Registry Integration
**Prioridad: MEDIA**

| Feature | Descripción |
|--------|-------------|
| **Pull from private registry** | Autenticación con Docker Hub, ECR, GCR |
| **Push images** | Build y push de Dockerfiles personalizados |
| **Image scanning** | Integración con Trivy para vulnerabilidades |

---

## Fase 4: Automation & CI/CD (Mes 7-8)

### 4.1 GitOps Integration
**Prioridad: CRÍTICA**

| Feature | Descripción |
|--------|-------------|
| **Connect GitHub/GitLab repo** | OAuth flow para autenticar |
| **Auto-sync on push** | Webhook para re-deploy en push |
| **PR preview environments** | Deploy automático en PRs |
| **GitHub Actions generator** | Generar workflow YAML optimizado |

**Flujo GitOps:**
```
Developer push → GitHub webhook → Expanse API →
→ Pull latest compose → Validate → Deploy →
→ Update status in PR
```

### 4.2 Template Marketplace
**Prioridad: ALTA**

| Feature | Descripción |
|--------|-------------|
| **Public marketplace** | Explorar templates compartidos por comunidad |
| **Submit template** | Validación antes de publicación |
| **Ratings & reviews** | Sistema de estrellas + comentarios |
| **Categories & search** | Filtros avanzados |
| **Verified badges** | Templates oficiales verificados |
| **Pricing tiers** | Templates gratuitos vs premium |

**Modelo de datos:**
```typescript
interface MarketplaceTemplate {
  _id: ObjectId;
  authorId: ObjectId;
  name: string;
  description: string;
  category: string;
  tags: string[];
  compose: Compose;
  downloads: number;
  rating: number;
  reviews: Array<{ userId: ObjectId; rating: number; comment: string }>;
  isVerified: boolean;
  isPremium: boolean;
  price: number;
  createdAt: Date;
}
```

### 4.3 Scheduled Deployments
**Prioridad: MEDIA**

| Feature | Descripción |
|--------|-------------|
| **Cron jobs** | Deploy automático en schedule |
| **Auto-restart** | Restart de contenedores caídos |
| **Backup automation** | Backup periódico de volúmenes |

---

## Fase 5: Observabilidad Avanzada (Mes 9-10)

### 5.1 Dashboard de Métricas
**Prioridad: ALTA**

| Feature | Descripción |
|--------|-------------|
| **Gráficos de CPU/Mem** | Time-series con Chart.js o Recharts |
| **Network I/O** | Tráfico de red por servicio |
| **Historical data** | Retención de métricas 30 días |
| **Custom alerts** | Notificar si CPU > 80% por 5 min |
| **Export metrics** | CSV/PDF reports |

### 5.2 Log Aggregation
**Prioridad: MEDIA**

| Feature | Descripción |
|--------|-------------|
| **Searchable logs** | Full-text search en logs |
| **Log retention** | Configurable (7/30/90 días) |
| **Log export** | Download como archivo |
| **Error highlighting** | Detectar y marcar errores automáticamente |

### 5.3 Health Checks Avanzados
**Prioridad: MEDIA**

| Feature | Descripción |
|--------|-------------|
| **Custom healthchecks** | Endpoint HTTP para apps custom |
| **Uptime monitoring** | Ping externo para verificar disponibilidad |
| **Status page** | Página pública de status ( tipo statuspage.io) |

---

## Fase 6: Kubernetes Support (Mes 11-12)

### 6.1 Kubernetes Migration
**Prioridad: ESTRATÉGICA**

| Feature | Descripción |
|--------|-------------|
| **Kubernetes export** | Generar manifests kubectl-ready |
| **Helm chart export** | Generar Helm charts |
| **K8s deployment** | Deploy directo a clusters |
| **Ingress configuration** | UI para configurar Ingress resources |

### 6.2 Hybrid Mode
**Prioridad: MEDIA**

| Feature | Descripción |
|--------|-------------|
| **Local = Docker** | Desarrollo local sigue siendo Docker Compose |
| **Production = K8s** | Deploy a Kubernetes |
| **Config translation** | Traducir automáticamente entre formatos |

---

## 💰 Modelo de Monetización Sugerido

### Tier Free (Actual)
- ✅ Canvas visual
- ✅ 138+ templates
- ✅ Deploy local (Docker)
- ✅ Basic monitoring
- ✅ 1 user, 3 projects
- ❌ No team features
- ❌ No GitOps
- ❌ No K8s

### Tier Pro — $19/mo
- Todo lo anterior
- ✅ Unlimited projects
- ✅ Remote Docker hosts (hasta 3)
- ✅ Version history (30 days)
- ✅ Advanced sharing (expiry, password)
- ✅ GitHub integration
- ✅ Email support

### Tier Team — $49/mo por seat
- Todo lo anterior
- ✅ Team workspaces (5 seats min)
- ✅ RBAC (Owner, Admin, Member)
- ✅ Activity log
- ✅ Comments & annotations
- ✅ Priority support
- ✅ SSO (Google, GitHub OAuth)

### Tier Enterprise — Custom
- Todo lo anterior
- ✅ Unlimited seats
- ✅ On-premise deployment
- ✅ Custom SLA
- ✅ Dedicated support
- ✅ Kubernetes support
- ✅ Audit logs
- ✅ Custom integrations

---

## 📈 Métricas de Producto para Trackear

| Métrica | Target Mes 1 | Target Mes 6 | Target Mes 12 |
|---------|--------------|--------------|---------------|
| **MAUs** | 100 | 1,000 | 10,000 |
| **Active deployments/day** | 50 | 500 | 5,000 |
| **Templates used** | 20 | 50 | 100 |
| **NPS Score** | 40 | 50 | 60 |
| **Support tickets/resolver** | < 24h | < 8h | < 4h |
| **Uptime** | 99.5% | 99.9% | 99.99% |

---

## 🏁 Priorización — Quick Wins Inmediatos

Para generar momentum rápido, implementar en las primeras 2 semanas:

1. **Dark mode** — 2 días, alto impacto visual
2. **Onboarding tutorial** — 3 días, reduce bounce
3. **Keyboard shortcuts + undo/redo** — 4 días, power users love it
4. **Export a ZIP con screenshots** — 2 días, sharing mejorado
5. **Better empty states** — 1 día, professionalism

---

## 🔧 Stack Técnico Sugerido para Nuevas Features

| Feature | Librería Recomendada |
|---------|---------------------|
| **Gráficos** | Recharts o Tremor |
| **Date picker** | react-day-picker |
| **Rich text editor** | TipTap (para comments) |
| **PDF export** | react-pdf |
| **SSE for real-time** | Native EventSource o SSE library |
| **WebSockets** | Socket.io o native WebSocket |
| **Search** | Fuse.js para client-side |
| **Testing E2E** | Playwright |
| **Error tracking** | Sentry |

---

## 📝 Checklist de Product Launch

### Pre-Launch (Semanas 1-4)
- [ ] Dark mode implementado
- [ ] Onboarding flow completo
- [ ] Undo/redo funcionando
- [ ] Empty states profesionales
- [ ] README actualizado ✅
- [ ] Landing page optimizada
- [ ] Screenshots/videos de producto
- [ ] Demo environment

### Soft Launch (Semanas 5-8)
- [ ] Publicar en Product Hunt
- [ ] Outreach a comunidades Docker/Kubernetes
- [ ] GitHub repo con stars (target: 500+)
- [ ] Twitter/LinkedIn presence
- [ ] Newsletter signup
- [ ] Basic analytics (Posthog ya instalado ✅)

### Growth (Mes 3-6)
- [ ] Template marketplace MVP
- [ ] GitHub integration
- [ ] YouTube tutorials
- [ ] Guest blog posts
- [ ] Conference talks
- [ ] Partnership con Docker-related tools

---

## 🎯 Conclusión

Expanse tiene una base sólida y diferenciadora como Visual IDE para Docker Compose. La oportunidad de mercado es clara:

1. **Docker adoption growing** — cada vez más developers usan containers
2. **YAML is painful** — cualquier herramienta que oculte YAML tiene valor
3. **Visual tools lag** — no hay competidores directos con esta madurez

El plan propuesto prioriza:
1. **Quick wins** para validación de mercado (mes 1-2)
2. **Team/Enterprise** para monetización real (mes 3-4)
3. **Cloud/Remote** para escalabilidad (mes 5-6)
4. **Kubernetes** para completitud (mes 11-12)

El objetivo es alcanzar 10,000 MAUs en 12 meses con un NPS de 60+.

---

*Documento preparado para presentación comercial — v1.0*
*Fecha: Octubre 2026*
