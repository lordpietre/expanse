import { MongoClient } from "mongodb";

// Singleton client with connection pooling — works for both dev and production.
// In development, we cache the client on the global object to survive HMR reloads.
// In production, module-level singletons are fine (no HMR).
declare global {
    // eslint-disable-next-line no-var
    var _mongoClientPromise: Promise<MongoClient> | undefined;
}

const options = {};

let clientPromise: Promise<MongoClient> | undefined;

export function getMongoClient(): Promise<MongoClient> {
    const uri = process.env.MONGODB_URI;

    if (!uri) {
        throw new Error("MONGODB_URI environment variable is required.");
    }

    if (clientPromise) return clientPromise;

    if (process.env.NODE_ENV === "development") {
        if (!global._mongoClientPromise) {
            const client = new MongoClient(uri, options);
            global._mongoClientPromise = client.connect();
        }
        clientPromise = global._mongoClientPromise;
    } else {
        const client = new MongoClient(uri, options);
        clientPromise = client.connect();
    }
    return clientPromise;
}

export const DB_NAME = "expanse";

export async function getDb() {
    const client = await getMongoClient();
    return client.db(DB_NAME);
}
