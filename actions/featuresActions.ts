"use server"


import { getDb } from "@/lib/mongodb";
import { ObjectId } from "bson";
import { revalidatePath } from "next/cache";
import { ensureAuth } from "@/lib/auth";

export type FeatureType = {
    featureId: string;
    title: string;
    description: string;
    createdDate: number;
    likeCount: number;
}

export const getAllFeatures = async () => {
    const payload = await ensureAuth();
    const userId = new ObjectId(payload.userId as string);

    const db = await getDb();
    const featureLikesView = db.collection("featureLikesView");
    const likeCollection = db.collection("like")

    try {
        const features = await featureLikesView.find().sort({ createdDate: -1 }).toArray() as unknown as FeatureType[];
        const liked = await likeCollection.find({ userLiking: userId }, {
            projection: {
                _id: 0,
                featureLiked: 1
            }
        }).toArray()

        const featureIds = liked.map((like: any) => like.featureLiked.toString() as string);

        return {
            features: features,
            liked: featureIds,
        }

    } catch (error) {
        console.error(error)
        throw new Error("Failed to fetch features");
    }
};

export const toggleFeatureLike = async (featureId: string) => {
    const payload = await ensureAuth();
    const userId = new ObjectId(payload.userId as string);

    const db = await getDb();
    const likeCollection = db.collection("like")

    try {
        const liked = await likeCollection.findOne({
            userLiking: userId,
            featureLiked: new ObjectId(featureId)
        })

        if (liked?._id) {
            await likeCollection.deleteOne({ _id: liked?._id })
        } else {
            await likeCollection.insertOne({
                userLiking: userId,
                featureLiked: new ObjectId(featureId)
            })
        }
        revalidatePath("/dashboard/upcomingFeatures", "page")
        return true
    } catch (error) {
        console.error(error)
        throw new Error("Failed to toggle feature like");
    }
};
