import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { DM_Sans } from 'next/font/google';
import { Toaster } from 'react-hot-toast';
import VersionUpdateBanner from '@/components/ui/versionUpdateBanner';
import PostHogInstrumentation from '@/components/PostHogInstrumentation';
import Script from 'next/script';
import { getCachedLastVersion } from '@/lib/utils';
import packageJson from '@/package.json';

const dm_sans = DM_Sans({ subsets: ['latin'] });

export default async function LocaleLayout({
    children,
    params,
}: {
    children: React.ReactNode;
    params: Promise<{ locale: string }>;
}) {
    const { locale } = await params;
    const messages = await getMessages();

    let version;
    if (process.env.npm_lifecycle_event !== 'build') {
        try {
            const timeoutPromise = new Promise<undefined>((_, reject) =>
                setTimeout(() => reject(new Error('timeout')), 2000)
            );
            version = await Promise.race([getCachedLastVersion(), timeoutPromise]).catch(() => undefined);
        } catch (error) {
            console.error("Failed to fetch latest version:", error);
        }
    }

    let showUpdateBanner = version != packageJson.version;
    if (!version) {
        showUpdateBanner = false;
    }

    return (
        <html lang={locale} className={dm_sans.className}>
            <head>
                {!process.env.DISABLE_TELEMETRY &&
                    <Script
                        src="https://opentech-ux.org/lom-captor/dist/opentech-ux-lib.js"
                        strategy="beforeInteractive"
                        async
                        data-endpoint="https://cattlemoontwelve.ux-key.com/endpoint"
                        suppressHydrationWarning
                    />
                }
            </head>
            <body className={`${dm_sans.className} antialiased h-screen`}>
                <NextIntlClientProvider messages={messages}>
                    {!process.env.DISABLE_TELEMETRY && process.env.NEXT_PUBLIC_POSTHOG_KEY && (
                        <PostHogInstrumentation posthogKey={process.env.NEXT_PUBLIC_POSTHOG_KEY} />
                    )}
                    <Toaster position="top-right" reverseOrder={false} />
                    {showUpdateBanner && (
                        <VersionUpdateBanner
                            currentVersion={packageJson.version}
                            latestVersion={version || ""}
                        />
                    )}
                    {children}
                </NextIntlClientProvider>
            </body>
        </html>
    );
}