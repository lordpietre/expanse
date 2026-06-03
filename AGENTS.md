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
- `.env` file is NOT used — all config via environment variables or `docker compose`

## Package Manager
- **pnpm** (not npm/yarn)
- `expanse-docker-lib` is patched at `patches/expanse-docker-lib.patch` — must reinstall after patch changes

## Build Notes
- `next.config.mjs` has `ignoreBuildErrors: true` and `ignoreDuringBuilds: true` — ESLint/type errors do not block builds
- Standalone output mode (`output: 'standalone'`) — server.js is the entrypoint

## Architecture
- **State**: Zustand stores in `actions/` and `components/playground/`
- **Canvas**: React Flow (`@xyflow/react`) — node-based Docker Compose editor
- **Docker bridge**: Server Actions in `actions/dockerActions.ts` + `actions/composeActions.ts`
- **Auth**: JWT via `jose`, cookie-based, handled in `middleware.ts`
- **Database**: MongoDB via `mongoose` — models in `lib/` or `models/`
- **Service library**: JSON templates in `data/library/` — contribute new services via PR

## Adding Service Templates
Create `data/library/<service-name>.json` following the schema in `CONTRIBUTING.md`. Categories: Database, Web, Network, etc. Stack templates (multi-container) have `isStack: true` and `related_services`.

## Monorepo
Single-package Next.js app. No workspaces.

## Known Quirks
- `pnpm sync-icons` must run before `build` (Dockerfile runs it)
- Docker socket mount required: `/var/run/docker.sock:/var/run/docker.sock`
- App runs as root inside container (docker group access needed)