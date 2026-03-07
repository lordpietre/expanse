<div align="center">
  <img src="./assets/expanse.png" alt="Expanse" width="160" />

  <h1>Expanse</h1>
  <p><strong>Visual IDE and Orchestration Engine for Docker Compose</strong></p>

  <p>
    <a href="https://opensource.org/licenses/MIT"><img src="https://img.shields.io/badge/License-MIT-blue.svg" alt="License: MIT" /></a>
    <img src="https://img.shields.io/badge/Next.js-15-black?logo=next.js" alt="Next.js 15" />
    <img src="https://img.shields.io/badge/Docker-Compose-2496ED?logo=docker&logoColor=white" alt="Docker Compose" />
    <img src="https://img.shields.io/badge/PRs-welcome-4caf50.svg" alt="PRs Welcome" />
  </p>
</div>

---

## Overview

**Expanse** is a professional-grade, open-source orchestration platform that transforms Docker Compose management into a fluid visual experience. Through a node-based canvas, developers design, deploy, and monitor multi-container architectures without writing YAML by hand.

Expanse is not a diagramming tool. It is a **live execution wrapper** that communicates directly with the Docker daemon, turning every action on the canvas into a real deployment operation.

---

## Features

### Visual Infrastructure as Code

- **Node-Based Canvas** — Build architectures by composing nodes for Services, Networks, Volumes, and Environment Variables.
- **Intelligent Auto-Injection** — Connecting a service to a database automatically propagates the required environment variables and network links.
- **Auto-Layout** — Uses the Dagre algorithm to keep complex graphs clean and readable without manual positioning.
- **One-Click Import** — Load any existing `docker-compose.yaml` directly onto the canvas for visualization and editing.

### Execution Engine

- **Deploy, Stop, and Restart** — Execute entire projects with a single action from the UI.
- **Auto-Port Reassignment** — Detects host port collisions at deploy time and reassigns them dynamically.
- **Live Log Streaming** — Integrated terminal for real-time log output from any running container.
- **Resource Control** — Configure CPU and RAM limits per service directly from the UI to prevent resource exhaustion.
- **Live Performance Metrics** — Real-time CPU and Memory usage graphs for every container, refreshing every 3 seconds.
- **Resilient Monitoring** — Status polling persists across network interruptions and temporary file loss.

### Service Library

- **Extensible Templates** — JSON-based service catalog with templates for databases, web servers, networking tools, cloud utilities, and more.
- **Official Branding** — Services display their official logos for immediate visual identification.
- **Stacks** — Multi-container compositions (Gitea, Appwrite, ELK, etc.) deployable as a single unit.

### Global Dashboard

- **System Overview** — Real-time CPU, memory, and disk metrics for the host machine.
- **Project and Container Management** — Inspect, stop, and remove projects, containers, and volumes from a centralized interface.
- **Volume Management** — Bulk selection, individual deletion, and pruning of unused volumes.

---

## Technology Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 15 (App Router) + React 19 |
| Canvas Engine | React Flow (`@xyflow/react`) |
| Styling | Tailwind CSS + Framer Motion |
| State Management | Zustand (debounced persistence) |
| Database | MongoDB |
| Backend | Next.js Server Actions (Docker CLI bridge) |
| Authentication | JWT via `jose` + HTTP-only cookies |

---

## Project Structure

```
expanse/
├── actions/          Server-side bridge to Docker CLI and MongoDB
├── app/              Next.js pages (Playground, Dashboard, Auth, Deploy)
├── components/       React components (Nodes, Editors, Panels, UI primitives)
├── data/library/     JSON service templates for the extensible library
├── lib/              Core logic (YAML mapping, metadata, auth)
├── store/            Zustand state definitions
├── types/            TypeScript interfaces for all entities
└── assets/           Branding and logo assets
```

---

## Getting Started

The fastest way to run Expanse is using **Docker Compose**.

### Quick Start (Docker)

**1. Clone the repository**
```bash
git clone https://github.com/lordpietre/expanse.git
cd expanse
```

**2. Start the engine**
```bash
docker compose up -d
```

Expanse will be available at `http://localhost:4000`.

---

## Development Setup

If you prefer to run the project manually for development purposes:

### Prerequisites

- Node.js 20 or later
- Docker Engine (required for the bridge to work)
- pnpm (recommended) or npm

### Manual Installation

**1. Install dependencies**
```bash
pnpm install
```

**2. Configure environment variables**

Create a `.env.local` file:
```env
MONGODB_URI=mongodb://localhost:27017/expanse
SECRET_KEY=your-secret-key-here
URL=http://localhost:3000
```

**3. Start the development server**
```bash
pnpm run dev
```

---

## Contributing

Contributions are welcome. Please review the `CONTRIBUTING.md` file for guidelines on submitting pull requests, reporting issues, and the code style requirements expected across the codebase.

---

<div align="center">
  <sub>Built with precision by the Expanse community.</sub>
</div>
