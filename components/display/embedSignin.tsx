"use client"

import { useTranslations } from "next-intl";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { loginUser, registerUser } from "@/actions/userActions";
import toast from "react-hot-toast";
import { useState } from "react";
import { useComposeStore } from "@/store/compose";
import { Translator } from "expanse-docker-lib";
import usePositionMap from "@/store/metadataMap";
import { extractMetadata } from "@/lib/metadata";
import { useRouter } from 'next/navigation'
import useDisableStateStore from "@/store/disabled";

export default function EmbedSignin({ redirectToPlayGround = false }: { redirectToPlayGround?: boolean }) {

    const { compose } = useComposeStore()
    const { positionMap } = usePositionMap()
    const { setState: setSaveState } = useDisableStateStore()
    const router = useRouter()
    const t = useTranslations('auth')

    const [mode, setMode] = useState<"register" | "login">("register")

    const [password, setPassword] = useState("")
    const [email, setEmail] = useState("")

    const getPlaygroundData = () => {
        if (!redirectToPlayGround) return JSON.stringify({})
        const translator = new Translator(compose)
        return JSON.stringify({
            compose: translator.toDict(),
            metadata: extractMetadata(compose, positionMap),
        })
    }

    async function handleRegister(e: React.FormEvent) {
        e.preventDefault()
        const data = getPlaygroundData()
        const registerPromise = registerUser(email, password, "", true, data)
            .then(result => (result === true ? "" : result));
        toast.promise(registerPromise, {
            success: (data: string) => {
                setSaveState(false)
                if (data != "") {
                    router.push("/dashboard/playground?data=" + data)
                } else {
                    router.push("/dashboard")
                }
                return t('accountCreated')
            },
            loading: t('creatingAccount'),
            error: (e: Error) => { return e.message }
        })
    }

    async function handleLogin(e: React.FormEvent) {
        e.preventDefault()
        const data = getPlaygroundData()
        const formData = new FormData()
        formData.append("email", email)
        formData.append("password", password)
        formData.append("data", data)

        toast.promise(
            loginUser(null, formData),
            {
                loading: t('loggingIn'),
                success: (result: any) => {
                    if (result?.error) {
                        throw new Error(result.error);
                    }
                    if (result?.success) {
                        setSaveState(false)
                        if (result.data) {
                            router.push("/dashboard/playground?data=" + result.data)
                        } else {
                            router.push("/dashboard");
                        }
                        return t('loginSuccessful');
                    }
                    throw new Error(t('loginFailed'));
                },
                error: (err: Error) => {
                    return err.message || t('wrongPasswordOrEmail');
                }
            }
        );
    }

    return (
        <div className="flex flex-col gap-5">
            <h1 className="text-3xl text-primary font-bold bg-gradient-to-r from-[#1A96F8] via-[#3AA8FF] to-[#62BEFF] w-fit text-transparent bg-clip-text">
                {mode === "register" ? t('createAnAccount') : t('welcomeToExpanse')}
            </h1>
            <form onSubmit={mode === "register" ? handleRegister : handleLogin} className="flex flex-col gap-5">
                <div className="flex flex-col gap-2">
                    <Label htmlFor="email">{t('email')}</Label>
                    <Input id="email" required name="email" placeholder="MrNobody@expanse.omg" value={email} onChange={(e) => setEmail(e.target.value)} />
                </div>
                <div className="flex flex-col gap-2">
                    <Label htmlFor="password">{t('password')}</Label>
                    <Input id="password" required name="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
                </div>
                {mode === "register" && (
                    <div className="flex flex-row items-center gap-3">
                        <Checkbox required id="terms" name="terms" />
                        <label
                            htmlFor="terms"
                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                        >
                            {t.rich('acceptTerms', {
                                terms: (chunks) => <Link className="underline" href="/terms">{chunks}</Link>
                            })}
                        </label>
                    </div>
                )}
                <Button className="bg-gradient-to-r from-[#1A96F8] via-[#3AA8FF] to-[#62BEFF]" type="submit">
                    {mode === "register" ? t('createAnAccount') : t('login')}
                </Button>
            </form>

            <div className="flex flex-row gap-5">
                <Button variant="ghost" className="w-1/2 text-slate-500" onClick={() => setMode(mode === "register" ? "login" : "register")}>
                    {mode === "register" ? t('alreadyHaveAccount') : t('needAccount')}
                </Button>
                <Button asChild variant="outline" className="w-1/2">
                    <Link href="/forgotPassword">{t('passwordRecover')}</Link>
                </Button>
            </div>
        </div>
    )
}