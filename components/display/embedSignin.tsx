"use client"

import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import QuickToolType from "@/components/ui/quickToolType";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { loginUser, registerUser } from "@/actions/userActions";
import toast from "react-hot-toast";
import { useState } from "react";
import { useComposeStore } from "@/store/compose";
import { Translator } from "@composecraft/docker-compose-lib";
import usePositionMap from "@/store/metadataMap";
import { extractMetadata } from "@/lib/metadata";
import { useRouter } from 'next/navigation'
import useDisableStateStore from "@/store/disabled";

export default function EmbedSignin({ redirectToPlayGround = false }: { redirectToPlayGround?: boolean }) {

    const { compose } = useComposeStore()
    const { positionMap } = usePositionMap()
    const { setState: setSaveState } = useDisableStateStore()
    const router = useRouter()

    const [mode, setMode] = useState<"register" | "login">("register")
    const [companyType, setCompanyType] = useState("")
    const [password, setPassword] = useState("")
    const [email, setEmail] = useState("")

    const getPlaygroundData = () => {
        if (!redirectToPlayGround) return JSON.stringify({})
        const t = new Translator(compose)
        return JSON.stringify({
            compose: t.toDict(),
            metadata: extractMetadata(compose, positionMap),
        })
    }

    async function handleRegister(e: React.FormEvent) {
        e.preventDefault()
        const data = getPlaygroundData()
        const registerPromise = registerUser(email, password, companyType, true, data)
        toast.promise(registerPromise, {
            success: (data: string) => {
                setSaveState(false)
                if (data != "") {
                    router.push("/dashboard/playground?data=" + data)
                } else {
                    router.push("/dashboard")
                }
                return "Account created!"
            },
            loading: "Creating account...",
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
                loading: "Logging in...",
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
                        return "Login successful!";
                    }
                    throw new Error("Login failed");
                },
                error: (err: Error) => {
                    return err.message || "Wrong password or email";
                }
            }
        );
    }

    return (
        <div className="flex flex-col gap-5">
            <h1 className="text-3xl text-primary font-bold bg-gradient-to-r from-[#1A96F8] via-[#3AA8FF] to-[#62BEFF] w-fit text-transparent bg-clip-text">
                {mode === "register" ? "Create an account" : "Welcome back"}
            </h1>
            <form onSubmit={mode === "register" ? handleRegister : handleLogin} className="flex flex-col gap-5">
                <div className="flex flex-col gap-2">
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" required name="email" placeholder="your@email.fr" value={email} onChange={(e) => setEmail(e.target.value)} />
                </div>
                <div className="flex flex-col gap-2">
                    <Label htmlFor="password">password</Label>
                    <Input id="password" required name="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
                </div>
                {mode === "register" && (
                    <>
                        <div className="flex flex-col gap-2">
                            <Label htmlFor="company" className="flex justify-between">
                                Company type
                                <QuickToolType className="" message={"This won't affect pricing"} />
                            </Label>
                            <Select onValueChange={(value) => {
                                setCompanyType(value)
                            }}>
                                <SelectTrigger className='w-full'>
                                    <SelectValue placeholder="select a company type" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value={"individual"}>Individual</SelectItem>
                                    <SelectItem value={"startup"}>Start Up</SelectItem>
                                    <SelectItem value={"serviceCompany"}>IT service company</SelectItem>
                                    <SelectItem value={"other"}>Other</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="flex flex-row items-center gap-3">
                            <Checkbox required id="terms" name="terms" />
                            <label
                                htmlFor="terms"
                                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                            >
                                Accept <Link className="underline" href="/cgu.pdf">terms and conditions</Link>
                            </label>
                        </div>
                    </>
                )}
                <Button className="bg-gradient-to-r from-[#1A96F8] via-[#3AA8FF] to-[#62BEFF]" type="submit">
                    {mode === "register" ? "Create an account" : "Login"}
                </Button>
            </form>

            <div className="flex flex-row gap-5">
                <Button variant="ghost" className="w-1/2 text-slate-500" onClick={() => setMode(mode === "register" ? "login" : "register")}>
                    {mode === "register" ? "Already have an account? Login" : "Need an account? Register"}
                </Button>
                <Button asChild variant="outline" className="w-1/2">
                    <Link href="/forgotPassword">Password recover</Link>
                </Button>
            </div>
        </div>
    )
}
