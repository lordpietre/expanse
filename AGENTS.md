# Expanse Agents

## Dev Commands
- `pnpm dev` — local dev with turbopack (port 3000)
- `pnpm build` — production build (runs `sync-icons` first)
- `pnpm lint` — ESLint
- `pnpm sync-icons` — syncs library service icons (standalone script)

No test suite is configured.

## Environment Setup
- Requires `SECRET_KEY` env var (middleware redirect loop if missing)
- Requires MongoDB at `MONGODB_URI` (default: `mongodb://localhost:27017`)
- Requires Docker socket at `/var/run/docker.sock` (app runs as root or needs docker group)
- `CORE_ONLY=true` skips analytics/telemetry
- `DISABLE_TELEMETRY` disables both PostHog and external telemetry script
- `.env` file is NOT used — all config via environment variables or `docker compose`

## Package Manager
- **pnpm** (not npm/yarn)
- `expanse-docker-lib` is patched at `patches/expanse-docker-lib.patch` — must reinstall after patch changes

## Build Notes
- `next.config.mjs` has `ignoreBuildErrors: true` and `ignoreDuringBuilds: true` — ESLint/type errors do not block builds
- Standalone output mode (`output: 'standalone'`) — server.js is the entrypoint
- `pnpm sync-icons` must run before `build` (Dockerfile runs it)

## Architecture
- **State**: 9 Zustand stores in `store/` — `compose.ts` is central (auto-saves with 2s debounce)
- **Canvas**: React Flow (`@xyflow/react`) + ELK.js layout — node-based Docker Compose editor in `components/playground/`
- **Docker bridge**: Server Actions in `actions/` wrap `docker compose` CLI via `child_process.exec()`
- **Auth**: JWT (HS256 via `jose`) in HTTP-only cookie, 30-day expiry. Edge middleware enforces. `lib/auth.ts` `ensureAuth()` guards all server actions
- **Database**: MongoDB via mongoose — schemaless collections: `users`, `composes`, `shares`, `reset_code`
- **Service library**: 137 JSON templates in `data/library/` — each follows `TemplateService` interface in `types/library.ts`
- **Compose library**: `expanse-docker-lib` provides `Compose`, `Service`, `Translator` classes (NOT i18n — translates between compose object formats)
- **i18n**: `next-intl` with `[locale]` route segments (see i18n section below)

## Key Routes
All page routes are under `app/[locale]/` (e.g., `/en/dashboard`, `/es/login`):

| Route | Purpose |
|---|---|
| `/[locale]` | Home — lists user's compose projects |
| `/[locale]/dashboard` | Same as home, in UnifiedLayout sidebar |
| `/[locale]/dashboard/playground?id=` | Visual Docker Compose canvas editor |
| `/[locale]/dashboard/settings` | Account settings, nodes, backup |
| `/[locale]/deploy/settings` | System-level Docker management |
| `/[locale]/login` / `/[locale]/signin` | Auth pages |
| `/[locale]/login/cli` | CLI token auth |
| `/[locale]/share?id=&name=` | Read-only shared compose view |

Static routes outside `[locale]`: `app/api/`, `app/robots.ts`, `app/sitemap.ts`

## i18n (next-intl)

### Infrastructure
- **Library**: `next-intl` (App Router-compatible)
- **Config**: `i18n/routing.ts` (locales: `en`, `es`; default: `en`), `i18n/request.ts`
- **Messages**: `messages/en.json`, `messages/es.json` — nested JSON catalogs by namespace
- **Middleware**: `middleware.ts` chains `next-intl` middleware (locale detection/redirect) with existing auth middleware
- **Root layout** (`app/layout.tsx`): minimal — html/body only, no `<html lang>` or providers
- **Locale layout** (`app/[locale]/layout.tsx`): sets `<html lang={locale}>`, wraps children with `NextIntlClientProvider`
- **Routing**: All `<Link>` imports MUST use `next-intl/link` (auto-prepends locale prefix)

### Translation Patterns
- **Client components**: `const t = useTranslations('namespace')` then `t('key')`
- **Server components**: `const t = await getTranslations('namespace')` then `t('key')`
- **Rich text (links)**: `t.rich('acceptTerms', { terms: (chunks) => <Link href="/terms">{chunks}</Link> })`
- **Interpolation**: `t('remoteNodeAdded', { host: remoteHost })`
- **Locale switcher**: `<LocaleSwitcher />` component in `components/ui/localeSwitcher.tsx`

### Namespaces in messages/
`common`, `nav`, `home`, `auth`, `forgotPassword`, `settings`, `deploy`, `monitor`, `library`, `execution`, `terminal`, `terms`

### When Adding New Strings
1. Add key to both `messages/en.json` and `messages/es.json`
2. Use `useTranslations('namespace')` in client components, `getTranslations('namespace')` in server components
3. Import `Link` from `next-intl/link` (not `next/link`) in all locale-scoped pages

## Docker Deploy Flow
1. User creates compose on canvas → `store/compose.ts` auto-saves to MongoDB
2. Deploy validates ports via `validateComposePorts()` → auto-reassigns collisions (up to 5 retries)
3. `dockerActions.ts` writes YAML to `/tmp/expanse-{id}/docker-compose.yaml`
4. Patches YAML: injects DB healthchecks, `service_healthy` conditions, resource limits from metadata
5. Runs `docker compose up -d`

## Known Quirks
- App runs as root inside container (docker group access needed)
- Docker socket mount required: `/var/run/docker.sock:/var/run/docker.sock`
- `middleware.ts` redirects unauthenticated users to `/{locale}` (not `/login`)
- Build-time `ensureAuth()` returns a stub user via `npm_lifecycle_event === 'build'` check
- Font config only loads Latin subset (`DM_Sans({ subsets: ['latin'] })`) — sufficient for English and Spanish
- `store/compose.ts` `disabled` store defaults to `true` — auto-save is OFF until explicitly enabled
- `expanse-docker-lib`'s `Translator` class is NOT related to i18n — it converts between Docker Compose object formats
- Server actions need `getTranslations()` (not `useTranslations()`) since they run server-side
- The `?data=` URL param on login/playground routes carries base64url-encoded compose data — locale prefix doesn't break this flow
- `data/library/*.json` `description` fields are a mix of English and some Spanish — not yet translated via i18n keys

## Adding Service Templates
Create `data/library/<service-name>.json` following the schema in `CONTRIBUTING.md`. Categories: Database, Web, Network, etc. Stack templates (multi-container) have `isStack: true` and `related_services`.

## CI/CD
- Push to `main`: builds multi-arch (amd64+arm64) image, pushes to Docker Hub
- Push to other branches: build-only test (no push)