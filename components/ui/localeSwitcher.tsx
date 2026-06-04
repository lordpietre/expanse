"use client"

import { usePathname, useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import { routing, type Locale } from "@/i18n/routing";

export default function LocaleSwitcher() {
    const locale = useLocale();
    const router = useRouter();
    const pathname = usePathname();

    function handleLocaleChange(newLocale: Locale) {
        if (newLocale === locale) return;

        const segments = pathname.split("/");
        if (routing.locales.includes(segments[1] as Locale)) {
            segments[1] = newLocale;
        } else {
            segments.splice(1, 0, newLocale);
        }

        router.push(segments.join("/"));
    }

    return (
        <div className="flex bg-slate-900/50 border border-slate-800 rounded-lg overflow-hidden">
            {routing.locales.map((loc) => (
                <button
                    key={loc}
                    onClick={() => handleLocaleChange(loc)}
                    className={`px-2 py-1 text-[10px] font-bold uppercase tracking-wider transition-all ${
                        locale === loc
                            ? "bg-emerald-500 text-white"
                            : "text-slate-500 hover:text-white hover:bg-slate-800/50"
                    }`}
                >
                    {loc.toUpperCase()}
                </button>
            ))}
        </div>
    );
}