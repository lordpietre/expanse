<div style="display: flex; justify-content: center; flex-direction: column;gap:20px; align-items: center">
    <h1>Expanse</h1>
    <img src="./assets/logo_mark.jpg" width="300px">
</div>

[Expanse](https://composecraft.com) is a modern, open-source tool to help you manage, edit and share docker compose files in an intuitive GUI way.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](https://github.com/composecraft/composecraft/pulls)
[![Discord](https://img.shields.io/discord/123456789012345678.svg?label=Discord&logo=discord)](https://discord.gg/Wdz7Dht9YQ)

<img src="./assets/demo-img.png" alt="Expanse Demo" style="max-width: 100%; height: auto;">

## 📖 About Expanse

### Executive Summary
**Expanse** is a visual, node-based orchestration engine and IDE designed to completely abstract away the complexities of writing, managing, and executing `docker-compose.yaml` files. By providing a drag-and-drop canvas, real-time node validation, and an integrated execution environment, it empowers both novice developers and seasoned DevOps engineers to design complex, multi-container architectures in seconds. It bridges the gap between infrastructure visualization and actual deployment, serving as both a design tool and an active runtime manager.

### Complete Explanation & Philosophy
Traditionally, managing microservices and containerized environments requires manually composing YAML files, which are prone to indentation errors, port collisions, and network misconfigurations. Expanse solves this by turning infrastructure into a tangible, visual graph:

1. **Visual Infrastructure as Code (vIaC):** Every Docker Compose entity (Services, Networks, Volumes) is represented as an interactive node. When you drag a connection from a WordPress service to a MySQL database, Expanse automatically handles the underlying network bindings and environment variable injections. The visual state is continuously synthesized into robust, standard-compliant YAML.
2. **Integrated Execution & Telemetry Engine:** Unlike purely visual diagramming tools, Expanse is wired directly into the Docker daemon. You can execute your architecture straight from the canvas. The engine dynamically captures system metrics, container statuses, and live logs. Crucially, it features an **Auto-Port Reassignment** safety net: if a designed architecture attempts to deploy on host ports that are already occupied, Expanse intelligently detects the collision, reassigns the bindings to available ports, and seamlessly continues the deployment, notifying you of the changes.
3. **Agile and Modern Aesthetics:** Refined with a modern dark-glass UI, soft gradient node connectors, and a Dagre-powered auto-layout system, the playground is designed to remain uncluttered even when managing dozens of interconnected services.
4. **Library driven:** With a built-in Service Library, users don't need to memorize image tags or default environment variables. Whether you need a PostgreSQL database or a Redis cache, you simply drag it from the library into your environment, where it auto-populates with secure, sensible defaults.

In essence, Expanse transforms Docker orchestration from a backend script-kiddie task into a fluid, visual, and highly interactive engineering experience.

## 🚀 Features & Capabilities

### 🎨 Visual Drag-and-Drop Builder
- **Visual Nodes**: Visually connect and manage architecture components as nodes including `Services`, `Networks`, `Volumes`, `Env` variables, and `Labels`.
- **Intelligent Routing & Layouts**: Expanse automatically lays out nodes and traces smart connection paths using Dagre/ELK algorithms.
- **Port Mapping**: Drag-and-drop connections automatically map target exposed ports.
- **Real-time YAML Generation**: Under the hood, your visual builder accurately constructs the `docker-compose.yaml`.

### ⚡ Execution & Management Panel
- **Real-time Engine**: Run, Stop, and Restart your composed `docker-compose.yaml` instances directly from our Execution Panel. 
- **Auto-Port Reassignment**: During execution, the engine detects heavily utilized host ports and safely reassigns available ports to avoid service collisions.
- **Live Logs & Status**: Monitors and streams container logs dynamically via execution wrappers over native `docker compose logs`.
- **System Telemetry**: Displays Docker Project usage, resource limits, disk availability, and uptime.

### 📚 Library & Templates
- **Built-in Service Library**: Instantly drop in customized versions of Nginx, Redis, PostgreSQL, WordPress, Neo4j, Golang, Node.js and more without fumbling for tags.
- **Template Rehydration**: Expanse extracts node positions and mappings into custom metadata, efficiently rehydrating your UI state when importing from template files.

### 🌐 Sharing & Workflows
- **One-Click Sharing**: Export your creations to uniquely generated URLs or download them as raw `yaml` or `png` files.
- **GitHub Integration**: Seamlessly connect your workspace to Git repositories and push `docker-compose.yml` workflows transparently.

## 📖 Documentation

Complete documentation is available at [https://composecraft.com/docs/](https://composecraft.com/docs/)

## 🛠️ Quick Start

### Online Version

Use the hosted version at [composecraft.com](https://composecraft.com) - no installation required!

### Self-Hosted Deployment

#### Using Docker Compose (Recommended)

```bash
# Clone the repository
git clone https://github.com/composecraft/composecraft.git
cd composecraft/webapp

# Start with Docker Compose
docker compose up -d
```

The application will be available at http://localhost:3000

#### Manual Installation

```bash
# Clone the repository
git clone https://github.com/composecraft/composecraft.git
cd composecraft/webapp

# Install dependencies
pnpm install

# Start development server
pnpm run dev
```

## 🏗️ Architecture

Expanse is built with modern technologies:

- **Frontend**: Next.js 15 with React 19
- **UI Framework**: Radix UI + Tailwind CSS
- **Diagram Engine**: React Flow with Dagre layout
- **State Management**: Zustand
- **Backend**: Next.js API Routes
- **Database**: MongoDB with Mongoose
- **Authentication**: JWT with bcrypt
- **Code Editor**: Monaco Editor (VS Code's editor)
- **Styling**: Tailwind CSS with custom animations

### Key Dependencies

- `@xyflow/react`: Node-based diagram visualization
- `@composecraft/docker-compose-lib`: Core docker compose parsing library
- `@radix-ui/react-*`: Accessible UI components
- `zod`: Schema validation
- `react-hook-form`: Form management
- `posthog-js`: Analytics (optional)

## ⚙️ Configuration

### Environment Variables

Create a `.env.local` file with the following variables:

```env
# Required
SECRET_KEY=your-super-secret-jwt-key-here
MONGODB_URI=mongodb://localhost:27017/composecraft
URL=http://localhost:3000

# Optional
CORE_ONLY=false                    # Disable SaaS features for simple self-host
DISABLE_TELEMETRY=false           # Disable PostHog analytics
NEXT_PUBLIC_POSTHOG_KEY=your-key  # PostHog project key for telemetry
```

### Docker Configuration

For production deployments, use the provided `docker-compose.yml`:

```yaml
services:
  compose-craft:
    image: composecraft/composecraft:latest
    ports:
      - "3000:3000"
    environment:
      - SECRET_KEY=your-secret-key
      - MONGODB_URI=mongodb://mongo:27017/composecraft
      - URL=https://your-domain.com
    depends_on:
      - mongo
  mongo:
    image: mongo:latest
    environment:
      - MONGO_INITDB_ROOT_USERNAME=admin
      - MONGO_INITDB_ROOT_PASSWORD=password
```

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

### Development Setup

1. **Fork and clone the repository**
2. **Install dependencies**:
   ```bash
   pnpm install
   ```
3. **Set up environment variables** (see Configuration section)
4. **Start development server**:
   ```bash
   pnpm run dev
   ```
5. **Run tests**:
   ```bash
   pnpm test
   ```
6. **Lint code**:
   ```bash
   pnpm lint
   ```

### Development Workflow

1. Create a feature branch from `main`
2. Make your changes
3. Ensure tests pass and code is formatted
4. Create a pull request with a clear description

## 📋 Project Structure

```
webapp/
├── app/                    # Next.js app directory
│   ├── dashboard/         # Main application dashboard
│   ├── playground/        # Docker compose editor
│   ├── api/              # API routes
│   └── components/       # App-specific components
├── components/           # Shared UI components
│   ├── playground/       # Editor-specific components
│   ├── display/         # Data display components
│   └── ui/             # Reusable UI components
├── lib/                # Core libraries and utilities
├── store/              # Zustand state management
├── types/              # TypeScript type definitions
└── assets/             # Static assets and images
```

## 🐛 Bug Reports

If you find a bug, please open an issue with:

- Clear and descriptive title
- Steps to reproduce the issue
- Expected vs actual behavior
- Screenshots if applicable
- Your environment details

## 💡 Feature Requests

We'd love to hear your ideas! Please:

1. Check existing issues to avoid duplicates
2. Create a new issue with a clear description
3. Explain why this feature would be useful
4. Include mockups or examples if possible

## 📊 Roadmap

See our [Roadmap](ROADMAP.md) for planned features and improvements.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [React Flow](https://reactflow.dev/) for the excellent diagram library
- [Radix UI](https://www.radix-ui.com/) for accessible components
- [Next.js](https://nextjs.org/) for the fantastic framework
- All our contributors and community members!

## 🤝 Community

- **Discord**: [Join our Discord server](https://discord.gg/Wdz7Dht9YQ)
- **GitHub Discussions**: For questions and community discussions
- **Issues**: For bug reports and feature requests

## 📞 Support

For support:
- Check our [Documentation](https://composecraft.com/docs/)
- Search existing [Issues](https://github.com/composecraft/composecraft/issues)
- Join our [Discord](https://discord.gg/composecraft) community
- Open a new [GitHub Issue](https://github.com/composecraft/composecraft/issues/new)

---

**Made with ❤️ by the Expanse community**

[![Open Source Love](https://badges.frapsoft.com/os/v2/open-source.svg?v=103)](https://github.com/ellerbrock/open-source-badges/)
[![made with pnpm](https://img.shields.io/badge/made%20with-pnpm-000?logo=pnpm)](https://pnpm.io/)
