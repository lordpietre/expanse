# Contributing to Expanse

We love contributions! Whether you're fixing a bug, adding a feature, or contributing a new service stack, this guide will help you get started.

## Quick Setup

**1. Prerequisites:** Docker & Docker Compose.
**2. Fork & Clone:** Clone your fork of the repository.
**3. Install (Dev Only):** `pnpm install` (only if modifying code).
**4. Run:** `docker compose up -d` to see changes.

## How to Contribute

### 1. Contributing Service Stacks (Recommended)
You can contribute new services to the Expanse library by creating a JSON file in `data/library/`.

**Template for `data/library/your-service.json`:**
```json
{
    "name": "Service Name",
    "description": "Short description of the service",
    "category": "Database | Web | Network | etc",
    "isStack": true,
    "image": "image:latest",
    "logo": "https://url-to-logo.png",
    "default_ports": ["8080:80"],
    "env_vars": {
        "DB_HOST": "${related_db}:5432"
    },
    "volumes": ["data:/app/data"],
    "related_services": [
        {
            "name": "related_db",
            "image": "postgres:alpine",
            "env_vars": { "POSTGRES_PASSWORD": "pass" }
        }
    ]
}
```

### 2. Code Contributions
- **Bug Fixes:** Open an issue first to discuss the bug.
- **Features:** Create a proposal issue before starting work.
- **Standards:** We use **TypeScript**, **Next.js 15**, and **Tailwind CSS**.
- **Commits:** Keep commit messages clear and concise (e.g., `feat: add redis stack`).

## Pull Request Process
1. Create a branch: `git checkout -b feat/my-new-feature`.
2. Commit changes and push to your fork.
3. Open a PR against the `main` branch.
4. Ensure your PR description clearly explains the changes.

## Questions?
Open a [GitHub Issue](https://github.com/lordpietre/expanse/issues) if you need help!

---
By contributing, you agree that your work will be licensed under the **MIT License**.
