import { TemplateService } from "@/types/library";

export const libraryServices: TemplateService[] = [
    {
        name: "Nginx",
        image: "nginx:alpine",
        category: "Web Server",
        description: "High-performance HTTP server and reverse proxy, known for its stability and low resource consumption.",
        default_ports: ["80:80"]
    },
    {
        name: "Apache",
        image: "httpd:alpine",
        category: "Web Server",
        description: "The world's most used web server software. Robust, reliable, and highly configurable.",
        default_ports: ["80:80"]
    },
    {
        name: "PostgreSQL",
        image: "postgres:18-alpine",
        category: "Database",
        description: "Powerful, open source object-relational database system with a strong reputation for reliability.",
        default_ports: ["5432:5432"],
        env_vars: {
            "POSTGRES_PASSWORD": "password",
            "POSTGRES_USER": "admin",
            "POSTGRES_DB": "composecraft"
        }
    },
    {
        name: "MySQL",
        image: "mysql:8.0",
        category: "Database",
        description: "The world's most popular open source database, widely used for web applications.",
        default_ports: ["3306:3306"],
        env_vars: {
            "MYSQL_ROOT_PASSWORD": "password",
            "MYSQL_DATABASE": "composecraft",
            "MYSQL_USER": "user",
            "MYSQL_PASSWORD": "password"
        }
    },
    {
        name: "MariaDB",
        image: "mariadb:10.11",
        category: "Database",
        description: "An open source relational database created by the original developers of MySQL.",
        default_ports: ["3306:3306"],
        env_vars: {
            "MARIADB_ROOT_PASSWORD": "password",
            "MARIADB_DATABASE": "composecraft"
        }
    },
    {
        name: "Redis",
        image: "redis:7-alpine",
        category: "Cache",
        description: "Extraordinarily fast in-memory data structure store, used as a database, cache, and broker.",
        default_ports: ["6379:6379"]
    },
    {
        name: "RabbitMQ",
        image: "rabbitmq:3-management-alpine",
        category: "Queue",
        description: "The most widely deployed open source message broker, with built-in management UI.",
        default_ports: ["5672:5672", "15672:15672"]
    },
    {
        name: "Elasticsearch",
        image: "elasticsearch:8.10.0",
        category: "Other",
        description: "Distributed, RESTful search and analytics engine capable of addressing a growing number of use cases.",
        default_ports: ["9200:9200", "9300:9300"],
        env_vars: {
            "discovery.type": "single-node",
            "xpack.security.enabled": "false"
        }
    },
    {
        name: "WordPress",
        image: "wordpress:latest",
        category: "Applications",
        description: "The world's most popular website builder and content management system.",
        default_ports: ["8080:80"],
        env_vars: {
            "WORDPRESS_DB_HOST": "db:3306",
            "WORDPRESS_DB_USER": "wordpress",
            "WORDPRESS_DB_PASSWORD": "password",
            "WORDPRESS_DB_NAME": "wordpress"
        }
    },
    {
        name: "Moodle",
        image: "bitnami/moodle:latest",
        category: "Applications",
        description: "The world's most widely used learning management system (LMS).",
        default_ports: ["8080:8080", "8443:8443"],
        env_vars: {
            "MOODLE_DATABASE_HOST": "db",
            "MOODLE_DATABASE_PORT_NUMBER": "3306",
            "MOODLE_DATABASE_USER": "bn_moodle",
            "MOODLE_DATABASE_PASSWORD": "password",
            "MOODLE_DATABASE_NAME": "bitnami_moodle"
        }
    },
    {
        name: "Drupal",
        image: "drupal:latest",
        category: "Applications",
        description: "A flexible and modular CMS for building complex websites and digital experiences.",
        default_ports: ["8081:80"],
        env_vars: {
            "DRUPAL_DATABASE_HOST": "db",
            "DRUPAL_DATABASE_NAME": "drupal",
            "DRUPAL_DATABASE_USER": "drupal",
            "DRUPAL_DATABASE_PASSWORD": "password"
        }
    },
    {
        name: "Joomla",
        image: "joomla:latest",
        category: "Applications",
        description: "A user-friendly CMS that strikes a balance between ease of use and powerful features.",
        default_ports: ["8082:80"],
        env_vars: {
            "JOOMLA_DB_HOST": "db",
            "JOOMLA_DB_USER": "joomla",
            "JOOMLA_DB_PASSWORD": "password",
            "JOOMLA_DB_NAME": "joomla"
        }
    },
    {
        name: "PrestaShop",
        image: "prestashop/prestashop:latest",
        category: "Applications",
        description: "A leading open source e-commerce solution with everything you need to sell online.",
        default_ports: ["8083:80"],
        env_vars: {
            "DB_SERVER": "db",
            "DB_USER": "prestashop",
            "DB_PASSWD": "password",
            "DB_NAME": "prestashop"
        }
    },
    {
        name: "Grafana",
        image: "grafana/grafana:latest",
        category: "Monitoring",
        description: "The open observability platform. Run Grafana to visualize your data.",
        default_ports: ["3000:3000"]
    },
    {
        name: "Neo4j",
        image: "neo4j:ubi9",
        category: "Database",
        description: "Graph Database Management System. Neo4j is a highly scalable, robust native graph database.",
        default_ports: ["7474:7474", "7687:7687"],
        volumes: ["./neo4j_data:/data"]
    },
    {
        name: "Alpine",
        image: "alpine:latest",
        category: "OS",
        description: "A minimal Docker image based on Alpine Linux with a complete package index and only 5 MB in size!"
    },
    {
        name: "HAProxy",
        image: "haproxy:alpine",
        category: "Web Server",
        description: "Reliable, high performance TCP/HTTP load balancer."
    },
    {
        name: "Python",
        image: "python:3.15.0a6-alpine",
        category: "Dev",
        description: "Python is an interpreted, interactive, object-oriented, open-source programming language."
    },
    {
        name: "Node.js",
        image: "node:lts-alpine3.22",
        category: "Dev",
        description: "Node.js is a JavaScript-based platform for server-side and networking applications."
    },
    {
        name: "Golang",
        image: "golang:tip-alpine3.22",
        category: "Dev",
        description: "Go (golang) is a general purpose, higher-level, imperative programming language."
    }
];
