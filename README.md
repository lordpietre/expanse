<div align="center">
  <img src="./assets/logo_mark.jpg" alt="Expanse Logo" width="200" />
  <h1>Expanse</h1>
  <p><strong>Visual IDE & Orchestration Engine for Docker Compose</strong></p>

  <p>
    <a href="https://opensource.org/licenses/MIT"><img src="https://img.shields.io/badge/License-MIT-yellow.svg" alt="License: MIT" /></a>
    <a href="https://discord.gg/Wdz7Dht9YQ"><img src="https://img.shields.io/discord/123456789012345678.svg?label=Discord&logo=discord" alt="Discord" /></a>
    <img src="https://img.shields.io/badge/PRs-welcome-brightgreen.svg" alt="PRs Welcome" />
  </p>
</div>

---

## 🌟 What is Expanse?

**Expanse** is a modern, open-source orchestration tool that transforms Docker Compose management from a manual YAML-writing task into a fluid, visual experience. By providing a professional-grade node-based interface, Expanse allows developers to design, deploy, and monitor complex container architectures without touching a single line of YAML.

It is not just a diagramming tool; it is a **live execution wrapper** that talks directly to your Docker daemon.

## 🚀 Key Features

### 🎨 Visual Orchestration (vIaC)
- **Drag-and-Drop Canvas**: Build architectures using nodes for Services, Networks, Volumes, and ENV variables.
- **Intelligent Auto-Injection**: Connecting a service to a database (like Postgres or MySQL) automatically injects the required environment variables.
- **Dagre Auto-Layout**: Keep your graphs clean and organized with advanced layout algorithms.

### ⚡ Smart Execution Engine
- **One-Click Deploy**: Run, Stop, and Restart entire projects directly from the UI.
- **Auto-Port Reassignment**: Never face a "Port already in use" error again. Expanse detects collisions and reassigns host ports dynamically.
- **Resilient Monitoring**: Status polling and log streaming that persist even if temporary configuration files are lost.

### 📊 Global Management
- **Centralized Dashboard**: Monitor all global Docker projects, containers, and system resources (CPU, RAM, Disk) in real-time.
- **Live Logs**: Integrated terminal for real-time log streaming from any running container.
- **Service Library**: Instantly drop optimized templates for popular stacks (Nginx, Redis, WordPress, Neo4j, etc.).

## 🛠️ Technology Stack

Expanse is built with cutting-edge web technologies:

- **Frontend**: Next.js 15 (App Router) + React 19
- **Diagrams**: [React Flow](https://reactflow.dev/) (@xyflow/react)
- **Styling**: Tailwind CSS + Framer Motion (Glassmorphism UI)
- **State**: Zustand (Atomic & Debounced persistence)
- **Database**: MongoDB + Mongoose
- **Backend**: Next.js Server Actions (Direct Docker CLI Integration)

## 📋 Project Structure

```bash
├── actions/             # Server-side bridge to Docker CLI and MongoDB
├── app/                 # Next.js Pages (Playground, Dashboard, Auth)
├── components/          # React Components (Nodes, Editors, Glass UI)
├── lib/                 # Core logic (YAML mapping, Metadata rehydration)
├── store/               # Zustand state definitions for the engine
├── types/               # TypeScript interfaces for Docker entities
└── assets/              # Logos and branding assets
```

## ⚙️ Getting Started

### Prerequisites
- Node.js 20+
- Docker Engine & Docker Compose
- pnpm (recommended)

### Installation

1. **Clone and Install**
   ```bash
   git clone https://github.com/composecraft/composecraft.git
   cd expanse
   pnpm install
   ```

2. **Configuration**
   Create a `.env.local` file:
   ```env
   MONGODB_URI=mongodb://localhost:27017/expanse
   SECRET_KEY=your_secret_key
   URL=http://localhost:3000
   ```

3. **Development**
   ```bash
   pnpm run dev
   ```

Navigate to `http://localhost:3000` to start orchestrating.

## 🤝 Contributing

We love community contributions! Check our `CONTRIBUTING.md` for guidelines on how to submit PRs or report bugs.

---
**Crafted with precision by the Expanse Community.**
