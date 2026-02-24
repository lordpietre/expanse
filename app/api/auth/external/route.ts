import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { getGithubAccesToken } from "@/actions/github";
import axios from "axios";
import { createOrLoginUser } from "@/actions/userActions";
import { registerUserToBrevo } from "@/lib/brevo";

export async function GET(req: Request) {
    const state = new URL(req.url).searchParams.get("state")
    const code = new URL(req.url).searchParams.get("code")

    const db = await getDb();
    const CSRF_collection = db.collection('csrf_token')
    const token = await CSRF_collection.findOne({ token: state })
    if (!token || !code) {
        return NextResponse.json({ msg: "unauthorized" }, { status: 401 })
    }
    await CSRF_collection.deleteOne({ token: state })
    try {
        const ghToken = await getGithubAccesToken(code)
        console.log(ghToken)
        const resp = await axios.get('https://api.github.com/user', {
            headers: {
                Authorization: `Bearer ${ghToken}`
            }
        })
        if (!resp.data.email) {
            return NextResponse.json({ error: "Unable to sign in with GitHub: your account email is not accessible. Please make your GitHub email public and try again." }, { status: 406 })
        }
        const brevoId = await registerUserToBrevo({ email: resp.data.email })
        const user = {
            termsAccepted: true,
            brevoId: brevoId,
            external: "github",
            infos: {
                company: resp.data?.company,
                avatar_url: resp.data?.avatar_url,
                blog: resp.data?.blog,
                githubId: resp?.data?.id,
                location: resp?.data?.location,
                githubFollowers: resp?.data?.followers,
                notification_email: resp?.data?.notification_email
            }
        }
        await createOrLoginUser(resp.data.email, user)
    } catch (e) {
        console.error("GitHub OAuth callback error:", e)
        return NextResponse.json({ error: "Authentication failed. Please try again." }, { status: 500 })
    }
    return NextResponse.redirect(`${process.env.URL}/dashboard`)
}