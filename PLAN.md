# Expanse - Issues & Improvement Plan

## Issues Found

### Critical Issues

#### 1. Port Collision Retry Uses Stale Reference (Bug) - FIXED
**File**: `components/playground/playGroundContent.tsx` lines 323-342

When `executeCompose` fails with `collisionPort`, the retry loop uses the outer `compose` variable which is captured at function start. During retry, `setCompose` updates the store but the local `compose` variable isn't updated, causing stale port values to be sent.

**Fix Applied**: Changed to use `useComposeStore.getState().compose` instead of outer scope `compose` variable in both `handleExecute` and `handleRestart` functions.

#### 2. No Test Suite
No tests configured. Every change requires manual testing. No way to verify fixes don't break existing functionality.

#### 3. Auth Bypass During Build
Multiple places check `process.env.npm_lifecycle_event === 'build'` to skip auth:
- `actions/composeActions.ts:75-76`
- `actions/userActions.ts:176-178, 328-330`
- `lib/auth.ts:6-8`

While intentional for Next.js build, this pattern could be a security risk if build artifacts are served in the same environment as dev.

### Medium Issues

#### 4. Library Actions Swallows Errors - FIXED
**File**: `actions/libraryActions.ts:10-23`

Returns empty array on error instead of throwing, making debugging difficult.

**Fix Applied**: Now throws errors with descriptive messages instead of returning empty arrays.

#### 5. CSRF Token Fire-and-Forget
**File**: `actions/github.ts:33`

CSRF token inserted without `await` - potential race condition.

#### 6. Default Save Disabled State
**File**: `store/disabled.ts`

`useDisableStateStore` defaults to `state: true` (save disabled). If not properly toggled, saves silently fail.

#### 7. Debounce Save Race Condition
**File**: `store/compose.ts:73-85`

2-second debounce means data can be lost if tab closes immediately after changes.

#### 8. Hardcoded Popularity Maps
**File**: `actions/libraryActions.ts:46-207`

15+ hardcoded `Popularity` maps for sorting services. Adding new categories requires code changes.

### Minor Issues

#### 9. DB Healthcheck Limited Coverage
**File**: `actions/dockerActions.ts:18-24`

Only MariaDB, MySQL, PostgreSQL, MongoDB, Redis have healthcheck injection. Other DBs (CouchDB, etc.) lack health checks.

#### 10. Session Duration Comment Mismatch
**File**: `actions/userActions.ts:18-20`

Comment says "30-day expiry used consistently" but `SESSION_DURATION_MS = 30 * 24 * 60 * 60 * 1000` and `SESSION_DURATION_STR = '30d'` - both are 30d, so comment is accurate but could be clearer.

#### 11. Missing URL Validation
**File**: `actions/composeActions.ts:8-11`

`SITE_URL` env var is checked with `console.warn` but doesn't prevent errors - share links will be broken without it.

#### 12. ConnectionMap Key Encoding
**File**: `lib/metadata.ts:17-18`

Source info encoded in key as `"{sourceId}:{targetId}"` - fragile if format changes.

#### 13. Brevo Integration Missing Implementation
**File**: `actions/userActions.ts:7`

`registerUserToBrevo`, `sendRecoverPassdEmail`, `updateUserList` imported but implementation in `lib/brevo.ts` wasn't inspected - may have issues.

#### 14. Missing exportToGoogleDrive Function - FIXED
**File**: `components/display/settings.tsx`

Imported `exportToGoogleDrive` from `backupActions` but function didn't exist.

**Fix Applied**: Added stub implementation that returns a "coming soon" message.

#### 15. pnpm@latest Incompatibility - FIXED
**File**: `Dockerfile`

pnpm@latest (v11) requires Node.js v22.13+ but base image uses Node.js v20.20.2, causing build failures.

**Fix Applied**: Changed to `pnpm@9` which is compatible with Node.js v20.

#### 16. Mastodon Template Broken - FIXED
**File**: `data/library/mastodon.json`, `data/library/mastodon-docker.json`

The Mastodon template had several issues:
- Streaming service used wrong image (`node:20-alpine` instead of mastodon)
- DB_USER was "postgres" instead of "mastodon" causing postgres database not to match
- Missing `mastodon_public_system_v4` volume mount for sidekiq
- The streaming service was trying to run `./streaming` but node wasn't in mastodon image

**Fix Applied**: Simplified mastodon.json to only include web + sidekiq + postgres + redis (removed broken streaming). Fixed DB_USER to match POSTGRES_USER so database name is correct. Removed mastodon-docker.json as it was a duplicate with the same issues.

---

## Improvement Plan (By Priority)

### Phase 1: Critical Fixes

#### 1.1 Fix Port Collision Retry Bug - DONE
**Priority**: Critical (Bug)
**Effort**: Low

Fixed in both `handleExecute` and `handleRestart` by using `useComposeStore.getState().compose` instead of outer scope variable.

#### 1.2 Add Basic Test Suite - PENDING
**Priority**: Critical (Quality)
**Effort**: Medium

Add Vitest for unit tests:
```bash
pnpm add -D vitest @testing-library/react @testing-library/jest-dom jsdom
```

Create tests for:
- `store/compose.ts` - save, setCompose, replaceCompose
- `actions/dockerActions.ts` - patchComposeYaml logic
- `actions/libraryActions.ts` - sorting/filtering
- `lib/metadata.ts` - reHydrateComposeIds, recreatePositionMap

### Phase 2: Error Handling

#### 2.1 Improve Library Error Handling - DONE
**Priority**: Medium
**Effort**: Low

Now throws errors with descriptive messages instead of returning empty arrays.

#### 2.2 Add Error Boundary Components - PENDING
**Priority**: Medium
**Effort**: Medium

Wrap React Flow and ExecutionPanel in error boundaries to prevent full app crashes.

### Phase 3: Reliability

#### 3.1 Immediate Save on Unload - PENDING
**Priority**: Medium
**Effort**: Medium

Add `beforeunload` handler to trigger immediate save instead of waiting for debounce.

#### 3.2 Verify Disable State Logic - PENDING
**Priority**: Low
**Effort**: Low

Audit all uses of `useDisableStateStore` to ensure proper toggling.

### Phase 4: Maintainability

#### 4.1 Externalize Popularity Config - PENDING
**Priority**: Low
**Effort**: Medium

Move popularity maps to `data/library-popularity.json` to allow updating without code changes.

#### 4.2 Add Healthcheck for More DBs - PENDING
**Priority**: Low
**Effort**: Low

Extend `DB_HEALTHCHECKS` in `dockerActions.ts` to include CouchDB, Cassandra, Neo4j, etc.

### Phase 5: Future Enhancements

#### 5.1 WebSocket for Real-time Status
Replace polling with WebSocket connections for live container status updates.

#### 5.2 Undo/Redo Support
Add Zustand middleware for undo/redo on compose changes.

#### 5.3 Collaborative Editing
Add CRDT-based collaborative editing for team use.

---

## Library Templates Analysis

### Templates with Issues

#### Critical: gitea-full.json - Broken Variable Interpolation - FIXED
**File**: `data/library/gitea-full.json`

Uses `${gitea_db}` and `${gitea_cache}` which are **not Docker Compose variable interpolations** - they are literal strings that won't be resolved.

**Fix Applied**:
- Renamed related_service `gitea_db` → `db` and `gitea_cache` → `cache`
- Changed env vars: `"GITEA__database__HOST": "db:5432"` and `"GITEA__cache__HOST": "redis://cache:6379/0"`

#### Critical: Mastodon Template Broken - FIXED
**File**: `data/library/mastodon.json`, `data/library/mastodon-docker.json` (removed)

Simplified mastodon.json to only include web + sidekiq + postgres + redis (removed broken streaming). Fixed DB_USER to match POSTGRES_USER so database name is correct. Removed mastodon-docker.json as it was a duplicate with the same issues.

#### Critical: Single-Service DBs Missing Volumes - FIXED
The following templates now have persistence volumes:

| Template | Volume Added |
|----------|-------------|
| postgres.json | `postgres_data:/var/lib/postgresql/data` |
| redis.json | `redis_data:/data` |
| mariadb.json | `mariadb_data:/var/lib/mysql` |
| mysql.json | `mysql_data:/var/lib/mysql` |
| mongodb.json | `mongodb_data:/data/db` |
| influxdb.json | `influxdb_data:/var/lib/influxdb2` |

#### Minor: traefik.json Command Format - FIXED
Changed command from string to array format: `["--api.insecure=true", "--providers.docker"]`

#### Healthchecks Added to Stack Templates - IN PROGRESS
Added healthchecks to database services in:
- n8n-full.json (postgres) ✓
- vaultwarden-full.json (postgres) ✓
- wordpress-full.json (mariadb) ✓
- ghost-full.json (mysql) ✓
- freepbx-full.json (mariadb) ✓
- appwrite-full.json already had healthcheck ✓

---

## Library Templates Analysis (Complete)

### Templates Fixed in This Session
| Template | Issue | Status |
|----------|-------|--------|
| gitea-full.json | Broken `${gitea_db}` variable interpolation | FIXED |
| mastodon.json | DB_USER mismatch, broken streaming | FIXED |
| postgres.json | Missing volumes | FIXED |
| redis.json | Missing volumes | FIXED |
| mariadb.json | Missing volumes | FIXED |
| mysql.json | Missing volumes | FIXED |
| mongodb.json | Missing volumes | FIXED |
| influxdb.json | Missing volumes | FIXED |
| traefik.json | Command as string instead of array | FIXED |
| n8n-full.json | Missing healthcheck | FIXED |
| vaultwarden-full.json | Missing healthcheck | FIXED |
| wordpress-full.json | Missing healthcheck | FIXED |
| ghost-full.json | Missing healthcheck | FIXED |
| freepbx-full.json | Missing healthcheck | FIXED |

### Templates That Work Well
| Template | Status | Notes |
|----------|--------|-------|
| n8n-full.json | EXCELLENT | All credentials match, proper volumes, healthcheck |
| wordpress-full.json | EXCELLENT | All credentials match, proper volumes, healthcheck |
| ghost-full.json | EXCELLENT | All credentials match, proper volumes, healthcheck |
| appwrite-full.json | EXCELLENT | Has healthcheck, best practices |
| vaultwarden-full.json | EXCELLENT | All credentials match, proper volumes, healthcheck |
| media-center-full.json | EXCELLENT | Jellyfin+Sonarr+Radarr+qBittorrent, shared volumes |
| freepbx-full.json | EXCELLENT | All credentials match, proper volumes, healthcheck |
| portainer.json | GOOD | Proper isStack:false, volumes correct |

### Templates Needing More Work
| Template | Issue | Priority |
|----------|-------|----------|
| pleroma.json | Missing postgres/redis related services definition | Medium |
| firefish.json | Missing postgres/redis related services definition | Medium |
| akkoma.json | Missing postgres/redis related services definition | Medium |
| misskey.json | Missing postgres/redis related services definition | Medium |
| lemmy.json | Missing postgres related services definition | Medium |
| nextcloud.json | Missing database service, uses ./ path for volume | Medium |
| strapi.json | Uses SQLite (not production), missing postgres | Low |
| pixelfed.json | Missing healthcheck on postgres | Low |

### New AI Templates Added
The following AI service templates have been added to `data/library/`:

| Template | File | Description |
|----------|------|-------------|
| Ollama | `ollama.json` | LLM local con soporte GPU (Llama 3, Mistral, Gemma, etc.) |
| Open WebUI | `open-webui.json` | Interfaz tipo ChatGPT para Ollama |
| vLLM | `vllm.json` | Motor de inferencia rápido con API OpenAI-compatible |
| ComfyUI | `comfyui.json` | Generación de imágenes/video con workflows nodos |
| AnythingLLM | `anythingllm.json` | RAG completo para documentos |
| Text Generation WebUI | `text-generation-webui.json` | Interfaz completa para LLMs |
| PrivateGPT | `privategpt.json` | RAG offline privado |
| Flowise | `flowise.json` | Low-code LangChain |
| Qdrant | `qdrant.json` | Vector database para RAG |
| Stable Diffusion WebUI | `stable-diffusion-webui.json` | Generación imágenes |
| InvokeAI | `invokeai.json` | Alternativa a SD WebUI |
| Fooocus | `fooocus.json` | SD fácil e intuitivo |
| Langflow | `langflow.json` | Visual LangChain |
| JupyterLab PyTorch | `jupyter-pytorch.json` | Notebook PyTorch |
| JupyterLab TensorFlow | `jupyter-tensorflow.json` | Notebook TensorFlow GPU |
| AI Stack (Full) | `ai-stack.json` | Ollama + Open WebUI + Qdrant |

### Port Conflicts to Consider

High-risk ports when deploying multiple instances:
- **80, 443**: nginx, traefik, appwrite, freepbx
- **5432**: All PostgreSQL instances
- **6379**: All Redis instances
- **3306**: All MySQL/MariaDB instances

---

## Completed Items

| Task | Status | Date |
|------|--------|------|
| Fix port collision bug | Done | 2026-06-03 |
| Fix missing exportToGoogleDrive | Done | 2026-06-03 |
| Fix pnpm version in Dockerfile | Done | 2026-06-03 |
| Improve library error handling | Done | 2026-06-03 |
| Add test suite (Vitest) | Done | 2026-06-13 |
| Error boundary components | Done | 2026-06-13 |
| beforeunload save handler | Done | 2026-06-13 |
| Verify disable state logic | Done | 2026-06-13 |
| Externalize popularity config | Done | 2026-06-13 |
| Extend DB healthchecks | Done | 2026-06-13 |

---

## Effort Estimates (Remaining)

| Task | Priority | Effort | Status |
|------|----------|--------|--------|
| Add test suite | Critical | 2-3 days | DONE |
| Error boundaries | Medium | 2h | DONE |
| beforeunload save | Medium | 1h | DONE |
| Externalize popularity | Low | 2h | DONE |
| Extend healthchecks | Low | 1h | DONE |

---

## Verification Steps

After any changes:
1. Run `pnpm lint` - no new warnings
2. Manual test: import a YAML with port conflicts, deploy, verify ports reassign correctly
3. Manual test: deploy a database service, verify healthcheck is injected
4. Manual test: save project, close tab, reopen - data should persist