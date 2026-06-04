'use client';

import { useTranslations } from 'next-intl';

export default function TermsContent({ locale }: { locale: string }) {
    const t = useTranslations('terms');

    return <>
        <div style={{ marginBottom: "3rem", paddingBottom: "2rem", borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
            <h1 style={{ fontSize: "2.25rem", fontWeight: 800, color: "#f8fafc", letterSpacing: "-0.02em", marginBottom: "0.75rem" }}>
                {t('termsAndConditions')}
            </h1>
            <p style={{ fontSize: "0.8rem", color: "#64748b", letterSpacing: "0.05em", textTransform: "uppercase" }}>
                {t('effectiveDate')}
            </p>
            <span style={{ display: "inline-block", marginTop: "1rem", padding: "0.3rem 0.75rem", borderRadius: 4, border: "1px solid rgba(26,150,248,0.3)", background: "rgba(26,150,248,0.08)", color: "#1a96f8", fontSize: "0.75rem", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase" }}>
                {t('mitLicense')}
            </span>
        </div>

        <Section title={t('section1Title')}>
            <div style={{ fontFamily: "monospace", fontSize: "0.8rem", padding: "1.25rem 1.5rem", background: "#0d1117", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 8, color: "#1a96f8", marginBottom: "1.5rem", letterSpacing: "0.02em" }}>
                SPDX-License-Identifier: MIT
            </div>
            <P>{t('section1P1')}</P>
            <P>{t('section1P2')}</P>
            <P>{t('section1P3')}</P>
            <P>{t('section1P4')}</P>
            <div style={{ padding: "1.25rem 1.5rem", background: "rgba(26,150,248,0.05)", border: "1px solid rgba(26,150,248,0.2)", borderRadius: 8, fontSize: "0.875rem", lineHeight: 1.75 }}>
                {t('section1Disclaimer')}
            </div>
        </Section>

        <Section title={t('section2Title')}>
            <P>{t('section2P1')}</P>
            <ul style={{ listStyle: "none", paddingLeft: 0, marginBottom: "0.9rem" }}>
                {[t('section2List1'), t('section2List2'), t('section2List3'), t('section2List4')].map((item) => (
                    <li key={item} style={{ position: "relative", paddingLeft: "1.25rem", fontSize: "0.935rem", marginBottom: "0.45rem" }}>
                        <span style={{ position: "absolute", left: 0, color: "#1a96f8", fontWeight: 700 }}>—</span>
                        {item}
                    </li>
                ))}
            </ul>
            <P>{t('section2P2')}</P>
        </Section>

        <Section title={t('section3Title')}>
            <P>{t('section3P1')}</P>
        </Section>

        <Section title={t('section4Title')}>
            <ul style={{ listStyle: "none", paddingLeft: 0 }}>
                {[t('section4List1'), t('section4List2'), t('section4List3')].map((item) => (
                    <li key={item} style={{ position: "relative", paddingLeft: "1.25rem", fontSize: "0.935rem", marginBottom: "0.45rem" }}>
                        <span style={{ position: "absolute", left: 0, color: "#1a96f8", fontWeight: 700 }}>—</span>
                        {item}
                    </li>
                ))}
            </ul>
        </Section>

        <Section title={t('section5Title')}>
            <P>{t('section5P1')}</P>
        </Section>

        <Section title={t('section6Title')}>
            <P>{t('section6P1')}</P>
        </Section>

        <Section title={t('section7Title')}>
            <P>
                {t.rich('section7P1', {
                    githubLink: (chunks) => (
                        <a href="https://github.com/lordpietre/expanse" target="_blank" rel="noopener noreferrer" style={{ color: "#1a96f8" }}>
                            {chunks}
                        </a>
                    )
                })}
            </P>
        </Section>
    </>;
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
    return (
        <section style={{ marginBottom: "2.5rem" }}>
            <h2 style={{ fontSize: "1.05rem", fontWeight: 700, color: "#f8fafc", letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: "0.9rem", paddingBottom: "0.5rem", borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
                {title}
            </h2>
            {children}
        </section>
    );
}

function P({ children }: { children: React.ReactNode }) {
    return <p style={{ fontSize: "0.935rem", lineHeight: 1.75, marginBottom: "0.9rem", color: "#e2e8f0" }}>{children}</p>;
}