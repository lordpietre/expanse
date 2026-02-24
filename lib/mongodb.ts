import { MongoClient } from "mongodb";

const uri = process.env.MONGODB_URI;

if (!uri) {
    throw new Error("MONGODB_URI environment variable is required.");
}

// Singleton client with connection pooling — works for both dev and production.
// In development, we cache the client on the global object to survive HMR reloads.
// In production, module-level singletons are fine (no HMR).
declare global {
    // eslint-disable-next-line no-var
    var _mongoClientPromise: Promise<MongoClient> | undefined;
}

const options = {};

let clientPromise: Promise<MongoClient>;

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

export const DB_NAME = "compose_craft";

export async function getDb() {
    const client = await clientPromise;
    return client.db(DB_NAME);
}

export default clientPromise;
