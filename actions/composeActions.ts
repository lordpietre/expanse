"use server"

import { getDb } from "@/lib/mongodb";
import { ObjectId } from "bson";
import { ensureAuth } from "@/lib/auth";
import { revalidatePath } from "next/cache";

const SITE_URL = process.env.URL || '';
if (!SITE_URL) {
    console.warn('[composeActions] WARNING: URL env variable is not set. Share links will be broken.');
}

export async function shareCompose(composeId: string) {
    const payload = await ensureAuth();
    const db = await getDb();
    const shares = db.collection("shares");

    // Check if a share already exists for the given composeId
    const existingShare = await shares.findOne({
        composeId: new ObjectId(composeId),
        userId: new ObjectId(payload.userId as string),
    });

    revalidatePath("/dashboard/shares");

    if (existingShare) {
        return `${SITE_URL}/share?id=${existingShare._id.toString()}`;
    }

    const insert = await shares.insertOne({
        access: "public",
        composeId: new ObjectId(composeId),
        createdAt: new Date().getTime(),
        userId: new ObjectId(payload.userId as string),
    });

    if (!insert.insertedId) {
        throw new Error("Could not share the docker compose file");
    }

    return `${SITE_URL}/share?id=${insert.insertedId.toString()}`;
}

export const getComposeByShareId = async (shareId: string) => {
    const db = await getDb();
    const collection = db.collection("shares");

    try {
        const compose = await collection.aggregate([
            { $match: { _id: new ObjectId(shareId) } },
            {
                $lookup: {
                    from: "composes",
                    localField: "composeId",
                    foreignField: "_id",
                    as: "composeDetails"
                }
            },
            { $limit: 1 }
        ]).toArray();

        if (!compose[0]) return undefined;

        return {
            id: compose[0].composeId.toString(),
            data: compose[0].composeDetails
        };
    } catch (error) {
        console.error(error);
        throw new Error("Failed to fetch compose");
    }
};

export const getAllMyShares = async () => {
    if (process.env.npm_lifecycle_event === 'build') {
        return [];
    }
    const payload = await ensureAuth();
    const db = await getDb();
    const collection = db.collection("shares");

    try {
        const shares = await collection.aggregate([
            { $match: { userId: new ObjectId(payload.userId as string) } },
            {
                $lookup: {
                    from: "composes",
                    localField: "composeId",
                    foreignField: "_id",
                    as: "composeDetails",
                    pipeline: [{ $project: { "data.name": 1, _id: 0 } }],
                },
            },
            { $unwind: { path: "$composeDetails", preserveNullAndEmptyArrays: true } },
            { $addFields: { name: "$composeDetails.data.name" } },
            { $project: { composeDetails: 0 } },
            { $sort: { createdAt: -1 } },
        ]).toArray();

        return shares || [];
    } catch (error) {
        console.error(error);
        throw new Error("Failed to fetch shares");
    }
};

export const deleteShareById = async (shareId: string) => {
    const payload = await ensureAuth();
    const db = await getDb();
    const collection = db.collection("shares");

    try {
        const result = await collection.deleteOne({
            _id: new ObjectId(shareId),
            userId: new ObjectId(payload.userId as string)
        });

        revalidatePath("/dashboard/shares");
        return result;
    } catch (error) {
        console.error(error);
        throw new Error("Failed to delete share");
    }
};