<div align="center">
  <img src="https://raw.githubusercontent.com/lordpietre/expanse/main/assets/expanse.png" alt="Expanse Logo" width="160" />

  <h1>Expanse</h1>
  <p><strong>Visual IDE para Docker Compose — Diseña, despliega y administra tus contenedores sin escribir código</strong></p>

  <p>
    <a href="https://opensource.org/licenses/MIT"><img src="https://img.shields.io/badge/License-MIT-blue.svg" alt="License: MIT" /></a>
    <img src="https://img.shields.io/badge/Next.js-15-black?logo=next.js" alt="Next.js 15" />
    <img src="https://img.shields.io/badge/Docker-Compose-2496ED?logo=docker&logoColor=white" alt="Docker Compose" />
  </p>
</div>

---

## 🎯 ¿Qué es Expanse?

Expanse es una herramienta visual que te permite **diseñar y gestionar aplicaciones Docker Compose sin necesidad de escribir archivos YAML**. Imagínalo como un editor visual donde puedes arrastrar servicios, conectar bases de datos, configurar redes y desplegar todo con un clic.

### ¿Por qué Expanse?

- **Sin YAML manual** — Diseña tu infraestructura visualmente y Expanse genera el código automáticamente
- **Monitoreo en tiempo real** — Ve el estado de tus contenedores, CPU, memoria y logs al instante
- **Biblioteca de servicios** — Despliega aplicaciones populares (PostgreSQL, Redis, WordPress, n8n...) con un clic
- **Alta Disponibilidad** — Configura múltiples instancias, balanceador de carga y pooling de conexiones en segundos
- **Compatible con YAML existente** — Importa tus archivos docker-compose.yml actuales y visualízalos

---

## ✨ Características Principales

### 🖼️ Editor Visual Intuitivo
Arrastra y suelta servicios Docker en un lienzo. Conecta bases de datos, redes, volúmenes y variables de entorno de forma visual. El sistema detecta automáticamente las dependencias entre servicios.

### 📦 Biblioteca de Servicios
Accede a más de 130 plantillas de servicios populares:
- **Bases de datos**: PostgreSQL, MySQL, MongoDB, Redis, MariaDB
- **Automatización**: n8n, Home Assistant, Node-RED
- **CMS**: WordPress, Ghost, Strapi, Directus
- **Redes**: Nginx, Traefik, HAProxy
- **AI/ML**: Ollama, Open WebUI, ComfyUI, PrivateGPT
- **Y mucho más**...

### 🚀 Despliegue con Un Clic
Selecciona tus servicios, configura las opciones y despliega. Expanse:
- Detecta y resuelve conflictos de puertos automáticamente
- Inyecta healthchecks para bases de datos
- Configura límites de CPU y memoria
- Genera la configuración optimizada

### 🔄 Alta Disponibilidad (HA)
Cuando despliegas, Expanse te pregunta si quieres alta disponibilidad. Si eliges sí:
- **Balanceador de carga HAProxy** distribuye el tráfico entre instancias
- **Autoscaling** — 2 a 10 réplicas configurables
- **PgBouncer** — pooling de conexiones para PostgreSQL

### 📊 Monitoreo Completo
- Estado de contenedores en tiempo real
- Métricas de CPU, memoria y disco
- Logs transmitidos en vivo
- Terminal integrada por contenedor

---

## 🚀 Primeros Pasos

### Requisitos Previos
- Docker y Docker Compose instalados
- Puerto 4000 disponible

### Instalación Rápida

```bash
# 1. Clona el repositorio
git clone https://github.com/lordpietre/expanse.git
cd expanse

# 2. Inicia Expanse
docker compose up -d

# 3. Abre en tu navegador
# http://localhost:4000
```

¡Listo! Ya puedes empezar a diseñar tu infraestructura.

---

## 📖 Cómo Usar

### 1. Añade Servicios
Haz clic en **"+"** o navega la biblioteca de servicios. Selecciona lo que necesitas (por ejemplo, PostgreSQL + Redis + Tu Aplicación).

### 2. Conecta los Puntos
Arrastra para conectar servicios. Expanse automáticamente:
- Creará las redes necesarias
- Configurará las variables de entorno
- Establecerá las dependencias

### 3. Despliega
Haz clic en **"Run"**. Si quieres alta disponibilidad, activa la opción cuando te pregunte.

### 4. Monitorea
Ve el estado de tus servicios en tiempo real. Accede a logs, métricas y terminals desde el panel de ejecución.

---

## 🏗️ Arquitectura

Expanse usa tu Docker local para desplegar. No hay servidores remotos, todo funciona en tu máquina.

```
┌─────────────────────────────────────────────────────────┐
│                      Tu Navegador                         │
│              http://localhost:4000                        │
└─────────────────────────┬───────────────────────────────┘
                          │
┌─────────────────────────▼───────────────────────────────┐
│                    Expanse (Docker)                      │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────┐   │
│  │   MongoDB   │  │  Next.js   │  │  Docker Engine  │   │
│  │  (Estado)   │  │  (Frontend) │  │    (Docker)     │   │
│  └─────────────┘  └─────────────┘  └────────┬────────┘   │
│                                            │             │
│                            ┌──────────────┼──────────┐  │
│                            │   Contenedores             │  │
│                            │  (PostgreSQL, Redis,      │  │
│                            │   TuApp, HAProxy...)      │  │
│                            └───────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

---

## 🤝 Contribuir

¡Las contribuciones son bienvenidas! Consulta [CONTRIBUTING.md](CONTRIBUTING.md) para conocer nuestros estándares de código y el proceso para enviar cambios.

---

## 📄 Licencia

MIT — Expanse es y será siempre gratuito.

---

<div align="center">
  <sub>Hecho para hacer Docker Compose más accesible para todos.</sub>
</div>