"use client"

import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { useRouter, useSearchParams } from "next/navigation";
import { loginUser } from "@/actions/userActions";
import toast from "react-hot-toast";
import { useTranslations } from "next-intl";

import { Suspense } from "react";
import Image from "next/image";
import logo from "@/assets/expanse.png";

function LoginForm() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const dataFromUrl = searchParams.get("data")
    const t = useTranslations('auth')

    const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        const formData = new FormData(event.currentTarget);
        if (dataFromUrl) {
            formData.append("data", dataFromUrl);
        }

        toast.promise(
            loginUser(null, formData),
            {
                loading: t('loggingIn'),
                success: (result: any) => {
                    if (result?.error) {
                        throw new Error(result.error);
                    }
                    if (result?.success) {
                        if (result.data) {
                            router.push("/dashboard/playground?data=" + result.data);
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
        <Card className="w-full max-w-[480px]">
            <CardContent className="p-5">
                <form onSubmit={handleSubmit} className="flex flex-col gap-5">
                    <h1 className="text-3xl text-primary font-bold">{t('welcomeToExpanse')}</h1>
                    <div className="flex flex-col gap-2">
                        <Label htmlFor="email">{t('email')}</Label>
                        <Input required name="email" placeholder="MrNobody@expanse.omg" />
                    </div>
                    <div className="flex flex-col gap-2">
                        <Label htmlFor="password">{t('password')}</Label>
                        <Input required name="password" type="password" />
                    </div>
                    <Button type="submit">{t('login')}</Button>
                    <div className="flex flex-row gap-5">
                        <Button asChild variant="default" className="w-1/2">
                            <Link href="/signin">{t('createAnAccount')}</Link>
                        </Button>
                        <Button variant="outline" type="button" className="w-1/2">
                            <Link href="/forgotPassword">{t('passwordRecover')}</Link>
                        </Button>
                    </div>
                </form>
            </CardContent>
        </Card>
    )
}

export default function Dashboard() {
    return (
        <div className="flex h-screen items-center justify-center">
            <Suspense fallback={<div>Loading...</div>}>
                <div className="animate-in fade-in zoom-in duration-500">
                    <div className="flex justify-center mb-6">
                        <Image 
                            src={logo} 
                            alt="Expanse Logo" 
                            width={120} 
                            height={120}
                            className="rounded-lg"
                        />
                    </div>
                    <LoginForm />
                </div>
            </Suspense>
        </div>
    )
}