"use server"

import fs from "fs";
import path from "path";
import { TemplateService } from "@/types/library";

export async function getLibraryServices(): Promise<TemplateService[]> {
    const libraryDir = path.resolve(process.cwd(), "data/library");
    console.log(`[Library] process.cwd(): ${process.cwd()}`);
    console.log(`[Library] libraryDir: ${libraryDir}`);

    try {
        if (!fs.existsSync(libraryDir)) {
            console.warn(`[Library] NOT FOUND: ${libraryDir}`);
            // Fallback: try relative to __dirname in case we are in a different context
            const fallbackDir = path.resolve(__dirname, "../../../data/library");
            console.log(`[Library] Trying fallback: ${fallbackDir}`);
            if (fs.existsSync(fallbackDir)) {
                return readFromDir(fallbackDir);
            }
            return [];
        }
        return readFromDir(libraryDir);
    } catch (error) {
        console.error("[Library] FATAL:", error);
        return [];
    }
}

function readFromDir(dir: string): TemplateService[] {
    const files = fs.readdirSync(dir);
    console.log(`[Library] Reading ${files.length} files from ${dir}`);
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
    console.log(`[Library] Success: loaded ${services.length} services`);
    return services;
}
