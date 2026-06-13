"use server"

import fs from "fs";
import path from "path";
import { TemplateService } from "@/types/library";

interface PopularityConfig {
    categoryOrder: Record<string, number>;
    popularity: Record<string, Record<string, number>>;
}

let cachedConfig: PopularityConfig | null = null;

function loadPopularityConfig(): PopularityConfig {
    if (cachedConfig) return cachedConfig;

    const configPath = path.resolve(process.cwd(), "data/library-popularity.json");

    try {
        if (fs.existsSync(configPath)) {
            const content = fs.readFileSync(configPath, "utf-8");
            cachedConfig = JSON.parse(content);
            return cachedConfig!;
        }
    } catch (error) {
        console.error("[Library] Failed to load popularity config:", error);
    }

    throw new Error(`Popularity config not found: ${configPath}`);
}

export async function getLibraryServices(): Promise<TemplateService[]> {
    const libraryDir = path.resolve(process.cwd(), "data/library");

    try {
        if (!fs.existsSync(libraryDir)) {
            console.warn(`[Library] Directory not found: ${libraryDir}`);
            const fallbackDir = path.resolve(__dirname, "../../../data/library");
            if (fs.existsSync(fallbackDir)) {
                return readFromDir(fallbackDir);
            }
            throw new Error(`Library directory not found: ${libraryDir}`);
        }
        return readFromDir(libraryDir);
    } catch (error) {
        console.error("[Library] FATAL:", error);
        throw new Error(`Failed to load library services: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
}

function readFromDir(dir: string): TemplateService[] {
    const files = fs.readdirSync(dir);
    const services: TemplateService[] = [];

    for (const file of files) {
        if (file.endsWith(".json")) {
            try {
                const filePath = path.join(dir, file);
                const content = fs.readFileSync(filePath, "utf-8");
                const service = JSON.parse(content);
                if (service.name && service.category) {
                    services.push(service);
                } else {
                    console.warn(`[Library] Invalid service in ${file}:`, service);
                }
            } catch (e) {
                console.error(`[Library] Failed to parse ${file}:`, e);
            }
        }
    }
    console.log(`[Library] Loaded ${services.length} services`);

    const config = loadPopularityConfig();
    const { categoryOrder, popularity } = config;

    services.sort((a, b) => {
        const catOrderA = categoryOrder[a.category] ?? 99;
        const catOrderB = categoryOrder[b.category] ?? 99;

        if (catOrderA !== catOrderB) {
            return catOrderA - catOrderB;
        }

        const categoryPopularity = popularity[a.category];
        if (categoryPopularity) {
            const popA = categoryPopularity[a.name] ?? 99;
            const popB = categoryPopularity[b.name] ?? 99;
            if (popA !== 99 || popB !== 99) {
                return popA - popB;
            }
        }

        return a.name.localeCompare(b.name);
    });

    return services;
}