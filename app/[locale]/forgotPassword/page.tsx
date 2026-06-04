"use client"

import {Card, CardContent} from "@/components/ui/card";
import {Label} from "@/components/ui/label";
import {Input} from "@/components/ui/input";
import { Link } from "@/i18n/navigation";
import {Button} from "@/components/ui/button";
import {askPasswordReset} from "@/actions/userActions";
import toast from "react-hot-toast";
import {useRouter} from "next/navigation";
import {useTranslations} from "next-intl";

export default function Dashboard() {
    const router = useRouter()
    const t = useTranslations('forgotPassword')

    const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        const formData = new FormData(event.currentTarget);

        toast.promise(
            askPasswordReset(null, formData),
            {
                loading: t('sendingResetEmail'),
                success: (result: any) => {
                    if (result?.error) {
                        throw new Error(result.error);
                    }
                    toast.success(t('emailSent'));
                    router.push("/login");
                    return t('resetEmailSent');
                },
                error: (err: Error) => {
                    return err.message || t('failedToSendResetEmail');
                }
            }
        );
    }

    return(
        <div className="flex h-screen items-center justify-center">
            <Card className="w-full sm:w-1/2 lg:w-1/3 xl:w-1/4">
                <CardContent className="p-5">
                    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
                        <h1 className="text-3xl text-primary font-bold">{t('passwordLost')}</h1>
                        <div className="flex flex-col gap-2">
                            <Label htmlFor="email">{t('login')}</Label>
                            <Input required name="email" placeholder="your@email.fr"/>
                        </div>
                        <Button type="submit">{t('askForReset')}</Button>
                        <Link href="/login" >
                            <Button variant="outline">
                                {t('login')}
                            </Button>
                        </Link>
                    </form>
                </CardContent>
            </Card>
        </div>
    )
}