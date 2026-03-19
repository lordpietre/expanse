<div align="center">
  <img src="./assets/expanse.png" alt="Expanse Logo" width="160" />

  <h1>Expanse</h1>
  <p><strong>Professional Orchestration Engine and Visual IDE for Docker Compose</strong></p>

  <p>
    <a href="https://opensource.org/licenses/MIT"><img src="https://img.shields.io/badge/License-MIT-blue.svg" alt="License: MIT" /></a>
    <img src="https://img.shields.io/badge/Next.js-15-black?logo=next.js" alt="Next.js 15" />
    <img src="https://img.shields.io/badge/Docker-Compose-2496ED?logo=docker&logoColor=white" alt="Docker Compose" />
  </p>
</div>

---

## Overview

Expanse is a professional-grade orchestration platform designed to streamline the management of Docker Compose environments. By providing a high-fidelity visual interface, it allows developers to design, deploy, and monitor complex multi-container architectures with precision.

Unlike traditional diagramming tools, Expanse serves as a live execution wrapper. It interfaces directly with the Docker daemon, ensuring that every visual modification on the canvas is reflected in the actual deployment state.

---

## Key Features

### Visual Infrastructure as Code
- **Node-Based Canvas:** Architect systems by composing interactive nodes for Services, Networks, Volumes, and Environment Variables.
- **Intelligent Dependency Management:** Automated injection of environment variables and network links when connecting services to infrastructure components.
- **Dynamic Layout Engine:** Maintains clarity in complex architectures through automated positioning using advanced graph algorithms.
- **Legacy Support:** Seamless import of existing Docker Compose YAML files for immediate visualization and management.

### Execution and Management Engine
- **Atomic Operations:** Deploy, stop, and restart entire stacks or individual services with a single action from the interface.
- **Automated Port Resolution:** Proactive detection of host port collisions during deployment with dynamic reassignment capabilities.
- **Integrated Observability:** Real-time log streaming and performance metrics (CPU, Memory, Disk) refreshed every 3 seconds for active containers.
- **Governance and Control:** Fine-grained resource limits (CPU/RAM) and volume management, including bulk selection and pruning of unused resources.

### Service Library and Extensibility
- **Standardized Templates:** A comprehensive catalog of JSON-based templates for standard industry services and applications.
- **Multi-Container Stacks:** Pre-configured architectures (e.g., Gitea, Appwrite, ELK) deployable as unified, production-ready units.
- **Branding Integration:** Visual representation of services using official iconography for immediate identification.

### Security and Reliability
- **Authentication:** Secure access control via JWT-based authorization and HTTP-only cookies.
- **Backup and Recovery:** Provisions for backing up project states and restoring configurations to ensure business continuity.
- **Persistence:** Reliable state management backed by MongoDB, ensuring data integrity across system restarts.

---

## Technical Architecture

| Component | Technology |
|---|---|
| Frontend Framework | Next.js 15 (App Router) + React 19 |
| Orchestration Canvas | React Flow (@xyflow/react) |
| State Management | Zustand |
| Styling and Motion | Tailwind CSS + Framer Motion |
| Database | MongoDB |
| Integration Layer | Next.js Server Actions (Docker CLI Bridge) |
| Security | JWT (jose) |

---

## Getting Started

### Deployment via Docker Compose

Deployment through Docker is the standard and recommended method for the Expanse project.

**Prerequisites:** Ensure that Docker and Docker Compose are installed and operational on the host system.

1. **Clone the Repository:**
   ```bash
   git clone https://github.com/lordpietre/expanse.git
   cd expanse
   ```

2. **Initialize the Orchestration Engine:**
   ```bash
   docker compose up -d
   ```

Upon completion, the Expanse interface will be accessible at `http://localhost:4000`.

---

## Contributing

Technical contributions are welcome. Please refer to `CONTRIBUTING.md` for information on our coding standards and the process for submitting pull requests.

---

<div align="center">
  <sub>Developed for professional Docker orchestration.</sub>
</div>
