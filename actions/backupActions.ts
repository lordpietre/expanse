'use server'

import { getDb } from "@/lib/mongodb";
import { ensureAuth } from "@/lib/auth";
import { ObjectId } from "bson";

/**
 * Fetches all projects (composes) for the authenticated user and returns them as a structured object
 */
export async function exportAllProjects() {
    const payload = await ensureAuth();
    const db = await getDb();
    const userId = new ObjectId(payload.userId as string);
    const collection = db.collection("composes");

    try {
        const composes = await collection.find({ userId: userId }).toArray();

        // Structure the data for export
        const exportData = {
            version: "1.0",
            timestamp: new Date().toISOString(),
            projects: composes.map(c => ({
                id: c._id.toString(),
                data: c.data,
                metadata: c.metadata,
                createdAt: c.createdAt,
                updatedAt: c.updatedAt
            }))
        };

        return { success: true, data: exportData };
    } catch (error) {
        console.error("Failed to export projects:", error);
        return { success: false, error: "Failed to fetch project data" };
    }
}

/**
 * Placeholder for Google Drive export logic
 */
export async function exportToGoogleDrive() {
    // This would require Google OAuth implementation
    // For now, we'll return a "not implemented" result
    return { success: false, error: "Google Drive integration is not yet configured. Please use local backup for now." };
}
