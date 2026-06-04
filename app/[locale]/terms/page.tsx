import { getTranslations } from 'next-intl/server';
import TermsContent from './content';

export const metadata = {
    title: "Terms and Conditions — Expanse",
    description: "Expanse Terms and Conditions — MIT License",
};

export default async function TermsPage({ params }: { params: Promise<{ locale: string }> }) {
    const { locale } = await params;
    const t = await getTranslations('terms');

    return (
        <div style={{ fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif", background: "#07090f", minHeight: "100vh", color: "#e2e8f0" }}>
            <header style={{ borderBottom: "1px solid rgba(255,255,255,0.07)", background: "rgba(13,17,23,0.9)", position: "sticky", top: 0, zIndex: 100, backdropFilter: "blur(12px)" }}>
                <div style={{ maxWidth: 860, margin: "0 auto", padding: "1.25rem 2rem", display: "flex", alignItems: "center", gap: "1rem" }}>
                    <span style={{ fontWeight: 800, letterSpacing: "0.12em", textTransform: "uppercase", background: "linear-gradient(90deg,#1a96f8,#62beff)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                        {t('expanseHeader')}
                    </span>
                    <span style={{ color: "rgba(255,255,255,0.15)" }}>/</span>
                    <span style={{ fontSize: "0.8rem", fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "#64748b" }}>
                        {t('termsAndConditions')}
                    </span>
                </div>
            </header>

            <main style={{ maxWidth: 860, margin: "0 auto", padding: "4rem 2rem 6rem" }}>
                <TermsContent locale={locale} />
            </main>

            <footer style={{ borderTop: "1px solid rgba(255,255,255,0.07)", padding: "2rem", textAlign: "center", fontSize: "0.75rem", color: "#64748b", letterSpacing: "0.05em" }}>
                {t('footer')}
            </footer>
        </div>
    );
}