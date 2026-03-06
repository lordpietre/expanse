'use server'

import { getDb } from "@/lib/mongodb"
import { z } from "zod";
import { zfd } from "zod-form-data";
import bcrypt from "bcryptjs";
import { registerUserToBrevo, sendRecoverPassdEmail, updateUserList } from "@/lib/brevo";
import { cookies } from 'next/headers'
import { redirect } from "next/navigation";
import { SignJWT } from "jose";
import { ObjectId } from "bson";
import { composeMetadata } from "@/lib/metadata";
import { processAndSaveClientExport } from "@/app/actions/exportActions";
import { revalidatePath } from "next/cache";
import { ensureAuth } from "@/lib/auth";
import { generateRandomString, isWithinOneDay } from "@/lib/utils";

/** 30-day expiry used consistently for both the JWT payload and the cookie */
const SESSION_DURATION_MS = 30 * 24 * 60 * 60 * 1000;
const SESSION_DURATION_STR = '30d';

export async function createOrLoginUser(email: string, data: any): Promise<string> {
    // Validate secret key before any DB operation
    const secretKey = process.env.SECRET_KEY;
    if (!secretKey) {
        throw new Error("Server configuration error: SECRET_KEY is not set.");
    }

    const db = await getDb();
    const collection = db.collection("users");
    const userExist = await collection.findOne({ email: email });

    if (userExist) {
        // Skip password check for OAuth users (external field is set, no password stored)
        if (!data.external) {
            const passwordMatch = await bcrypt.compare(data.password, userExist.password);
            if (!passwordMatch) {
                throw new Error("Invalid email or password");
            }
        }

        const token = await new SignJWT({ userId: userExist._id, email: userExist.email })
            .setProtectedHeader({ alg: 'HS256' })
            .setExpirationTime(SESSION_DURATION_STR)
            .sign(new TextEncoder().encode(secretKey));

        (await cookies()).set({
            name: "token",
            value: token,
            httpOnly: true,
            path: "/",
            expires: new Date(Date.now() + SESSION_DURATION_MS),
        });

        return userExist._id.toString();
    }

    // New user: hash password only if provided (not OAuth)
    if (data.password) {
        data.password = await bcrypt.hash(data.password, 10);
    }

    const result = await collection.insertOne({ email: email, ...data, createdAt: new Date().getTime() });

    if (result.insertedId) {
        const token = await new SignJWT({ userId: result.insertedId, email: email })
            .setProtectedHeader({ alg: 'HS256' })
            .setExpirationTime(SESSION_DURATION_STR)
            .sign(new TextEncoder().encode(secretKey));

        (await cookies()).set({
            name: "token",
            value: token,
            httpOnly: true,
            path: "/",
            expires: new Date(Date.now() + SESSION_DURATION_MS),
        });

        return result.insertedId.toString();
    }

    return "";
}

export async function registerUser(email: string, password: string, company: string, terms: boolean, data: string) {
    if (process.env.DISABLE_SIGNUP) {
        console.error("Signup is disabled")
        throw new Error("Signup is disabled")
    }
    const brevoId = await registerUserToBrevo({ email: email })
    const user = {
        email: email,
        password: password,
        companyType: company,
        termsAccepted: !!terms,
        brevoId: brevoId
    }
    await createOrLoginUser(user.email, user)
    const parsedData = JSON.parse(data)
    if (Object.keys(parsedData)?.length === 0) {
        return ""
    }
    if (data) {
        // Use native Buffer API instead of external Base64UrlDecoder dependency
        return Buffer.from(JSON.stringify(parsedData)).toString('base64url')
    }
    return true
}

export const registerCompose = async (compose: object, metadata: composeMetadata, id?: string | undefined, imageBase64?: string) => {
    const payload = await ensureAuth();
    const db = await getDb();
    const userId = new ObjectId(payload.userId as string);
    const collection = db.collection("composes");
    let result = "";
    if (id) {
        const objectId = new ObjectId(id);
        const updateResult = await collection.updateOne(
            { _id: objectId, userId: userId }, // scope to owner
            { $set: { data: compose, metadata: metadata, updatedAt: Date.now() } }
        );
        if (updateResult.matchedCount > 0) {
            result = objectId.toString();
        } else {
            throw new Error("Could not update document: not found or not owned by user.");
        }
    } else {
        const r = await collection.insertOne({
            userId: userId,
            data: compose,
            metadata: metadata,
            createdAt: Date.now(),
            updatedAt: Date.now()
        });
        result = r.insertedId.toString();
    }
    if (result) {
        if (imageBase64) {
            try {
                const { createHash } = await import("crypto");
                const { promises: fs } = await import("fs");
                const path = await import("path");
                const pngBuffer = await processAndSaveClientExport(result, imageBase64);
                const dataString = JSON.stringify(compose) + JSON.stringify(metadata);
                const checksum = createHash('sha256').update(dataString).digest('hex').substring(0, 16);
                const filename = `playground-${checksum}.png`;
                const filepath = path.join(process.cwd(), 'public', 'exports', filename);
                const exportsDir = path.dirname(filepath);
                await fs.mkdir(exportsDir, { recursive: true });
                await fs.writeFile(filepath, pngBuffer);
            } catch (error) {
                console.error("Failed to save client-side thumbnail:", error);
            }
        }
        return result;
    }
    throw Error("could not register");
};

export const registerComposeWithoutMetadata = async (compose: object, userId: ObjectId) => {
    const db = await getDb();
    const collection = db.collection("composes");
    const r = await collection.insertOne({
        userId: userId,
        data: compose,
        metadata: null,
        createdAt: Date.now(),
        updatedAt: Date.now()
    });
    const result = r.insertedId.toString();
    if (result) return result;
    throw Error("could not register");
};

export const getAllMyComposeOrderByEditDate = async () => {
    if (process.env.npm_lifecycle_event === 'build') {
        return [];
    }
    const payload = await ensureAuth();
    const db = await getDb();
    const collection = db.collection("composes");
    const userId = new ObjectId(payload.userId as string);

    try {
        const composes = await collection
            .find({ userId: userId })
            .sort({ updatedAt: -1 })
            .toArray();

        return composes.map(compose => ({
            id: compose._id.toString(),
            data: compose.data,
            metadata: compose.metadata,
            createdAt: compose.createdAt,
            updatedAt: compose.updatedAt
        }));
    } catch (error) {
        console.error(error);
        throw new Error("Failed to fetch composes");
    }
};

export async function loginUser(prevState: any, formData: FormData) {
    const loginSchema = zfd.formData({
        email: z.string().email(),
        password: z.string().min(6).max(100),
        data: z.string().optional()
    });

    try {
        const secretKey = process.env.SECRET_KEY;
        if (!secretKey) return { error: "Server configuration error." };

        const { email, password, data } = loginSchema.parse({
            email: formData.get('email'),
            password: formData.get('password'),
            data: formData.get('data') || undefined
        });

        const db = await getDb();
        const collection = db.collection("users");
        const user = await collection.findOne({ email: email });

        if (!user) throw new Error("Invalid email or password");

        const passwordMatch = await bcrypt.compare(password, user.password);
        if (!passwordMatch) throw new Error("Invalid email or password");

        const token = await new SignJWT({ userId: user._id, email: user.email })
            .setProtectedHeader({ alg: 'HS256' })
            .setExpirationTime(SESSION_DURATION_STR)
            .sign(new TextEncoder().encode(secretKey));

        (await cookies()).set({
            name: "token",
            value: token,
            expires: new Date(Date.now() + SESSION_DURATION_MS),
            httpOnly: true,
            path: "/",
        });

        if (data) {
            const parsedData = JSON.parse(data);
            if (Object.keys(parsedData)?.length > 0) {
                const encoded = Buffer.from(JSON.stringify(parsedData)).toString('base64url');
                return { success: true, data: encoded };
            }
        }

        return { success: true };

    } catch (e) {
        if (e instanceof Error) return { error: e.message };
        return { error: "An unknown error occurred" };
    }
}

export async function getApiToken(email: string, password: string): Promise<string> {
    const secretKey = process.env.SECRET_KEY;
    if (!secretKey) throw new Error("Server configuration error.");

    const db = await getDb();
    const collection = db.collection("users");
    const user = await collection.findOne({ email: email });

    if (!user) throw new Error("Invalid email or password");

    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) throw new Error("Invalid email or password");

    const token = await new SignJWT({ userId: user._id, email: user.email })
        .setProtectedHeader({ alg: 'HS256' })
        .setExpirationTime(SESSION_DURATION_STR)
        .sign(new TextEncoder().encode(secretKey));

    return token;
}

export const getComposeById = async (composeId: string) => {
    const payload = await ensureAuth();
    const db = await getDb();
    const collection = db.collection("composes");
    const userId = new ObjectId(payload.userId as string);

    try {
        const compose = await collection.findOne({
            _id: new ObjectId(composeId),
            userId: userId
        });

        if (!compose) return undefined;

        return {
            id: compose._id.toString(),
            data: compose.data,
            metadata: compose?.metadata,
            createdAt: compose.createdAt,
            updatedAt: compose.updatedAt
        };
    } catch (error) {
        console.error(error);
        throw new Error("Failed to fetch compose");
    }
};

export const getComposeByIdPublic = async (composeId: string) => {
    const db = await getDb();
    const collection = db.collection("composes");

    try {
        const compose = await collection.findOne({ _id: new ObjectId(composeId) });
        if (!compose) return undefined;

        return {
            id: compose._id.toString(),
            data: compose.data,
            metadata: compose?.metadata,
            createdAt: compose.createdAt,
            updatedAt: compose.updatedAt
        };
    } catch (error) {
        console.error(error);
        throw new Error("Failed to fetch compose");
    }
};

export const getMyInfos = async () => {
    if (process.env.npm_lifecycle_event === 'build') {
        return undefined;
    }
    const payload = await ensureAuth();
    const db = await getDb();
    const collection = db.collection("users");
    const userId = new ObjectId(payload.userId as string);

    try {
        const user = await collection.findOne({ _id: userId }, { projection: { email: 1 } });
        if (!user) return undefined;
        return { email: user.email };
    } catch (error) {
        console.error(error);
        throw new Error("Failed to fetch user info");
    }
};

export const deleteUser = async () => {
    const payload = await ensureAuth();
    const db = await getDb();
    const userId = new ObjectId(payload.userId as string);

    try {
        const userCollection = db.collection("users");
        const composeCollection = db.collection("composes");

        // Anonymize user's composes
        await composeCollection.updateMany({ userId: userId }, { $set: { userId: null } });

        const user = await userCollection.findOne({ _id: userId }, { projection: { email: 1 } });
        if (user?.email) {
            await updateUserList(user.email, [], [9]);
        }

        await userCollection.deleteOne({ _id: userId });
        (await cookies()).delete("token");
        console.log("account " + userId.toString() + " deleted");
    } catch (error) {
        console.error("Error deleting user:", error);
        throw new Error("Failed to delete account");
    }
    redirect("https://form.expanse.com/s/cm40i9zod000hwl0z6005uvwp");
}

export const logout = async () => {
    (await cookies()).delete("token");
    return { success: true };
};

export const deleteCompose = async (composeId: string) => {
    const payload = await ensureAuth();
    const db = await getDb();
    const composeCollection = db.collection("composes");

    await composeCollection.deleteOne({
        _id: new ObjectId(composeId),
        userId: new ObjectId(payload.userId as string)
    });

    revalidatePath("/dashboard", "page");
    return true;
}

export async function askPasswordReset(prevState: any, formData: FormData) {
    const passwordAskSchema = zfd.formData({
        email: z.string().email(),
    });

    try {
        const { email } = passwordAskSchema.parse({ email: formData.get('email') });
        const db = await getDb();
        const collection = db.collection("users");
        const user = await collection.findOne({ email: email });

        // Return success even if user not found to prevent email enumeration
        if (!user) {
            return { success: true };
        }

        const code = generateRandomString();
        const code_collec = db.collection("reset_code");
        const inserted = await code_collec.insertOne({
            code: code,
            type: email,
            createdAt: new Date().getTime(),
            userId: user._id
        });

        if (inserted) {
            await sendRecoverPassdEmail(email, code);
            return { success: true };
        }

        throw new Error("server side error");
    } catch (e) {
        if (e instanceof Error) return { error: e.message };
        return { error: "An unknown error occurred" };
    }
}

export async function passwordReset(prevState: any, formData: FormData) {
    const passwordResetSchema = zfd.formData({
        password: z.string().min(6, "Password must be at least 6 characters"),
        password2: z.string(),
        code: z.string(),
    });

    try {
        const { password, password2, code } = passwordResetSchema.parse({
            password: formData.get('password'),
            password2: formData.get('password2'),
            code: formData.get('code')
        });

        if (password !== password2) throw new Error("Passwords are not the same");

        const db = await getDb();
        const code_collec = db.collection("reset_code");
        const resetCode = await code_collec.findOne({ code: code });

        if (!resetCode) throw new Error("The code is invalid");

        if (!isWithinOneDay(Number(resetCode?.createdAt), new Date().getTime())) {
            throw new Error("The code is outdated");
        }

        await code_collec.deleteOne({ code: code });
        const user_collec = db.collection("users");
        const hashedPassword = await bcrypt.hash(password, 10);
        await user_collec.updateOne({ _id: resetCode.userId }, { $set: { password: hashedPassword } });

        return { success: true };

    } catch (e) {
        if (e instanceof Error) return { error: e.message };
        return { error: "An unknown error occurred" };
    }
}
