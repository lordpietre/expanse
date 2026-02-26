"use client"

import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { House, Settings, Share, Rocket, Activity, LogOut, House as HouseIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";

export default function HomePage() {
    const pathname = usePathname();
    const router = useRouter();
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const checkAuth = async () => {
            try {
                const token = document.cookie.split('; ').find(row => row.startsWith('token='));
                if (!token) {
                    router.push('/login');
                    return;
                }
                setLoading(false);
            } catch {
                router.push('/login');
            }
        };
        checkAuth();
    }, [router]);

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-emerald-500/10 via-teal-500/10 to-cyan-500/10 flex items-center justify-center">
                <div className="animate-pulse text-slate-500">Loading...</div>
            </div>
        );
    }

    const navItems = [
        { href: "/", label: "Home", icon: HouseIcon },
        { href: "/deploy/settings", label: "System", icon: Activity },
        { href: "/dashboard/playground", label: "Deploy", icon: Rocket },
        { href: "/dashboard/deploys", label: "Deploys", icon: Share },
        { href: "/dashboard/settings", label: "Settings", icon: Settings },
    ];

    return (
        <div className="min-h-screen bg-gradient-to-br from-emerald-500/10 via-teal-500/10 to-cyan-500/10">
            {/* Unified Header */}
            <div className="bg-slate-950 py-2 px-4 flex flex-col relative overflow-hidden">
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10" />
                <div className="absolute -left-20 -top-20 w-[300px] h-[300px] bg-emerald-500/10 rounded-full blur-[60px]" />

                <div className="z-10 max-w-[100vw] mx-auto w-full flex items-center justify-between">
                    <div className="flex items-center gap-6">
                        <div className="flex bg-slate-900/50 border border-slate-800 rounded-xl p-1 backdrop-blur-md">
                            {navItems.map((item) => {
                                const isActive = pathname === "/" 
                                    ? item.href === "/" 
                                    : pathname.startsWith(item.href);
                                return (
                                    <Link 
                                        key={item.href} 
                                        href={item.href}
                                        className={cn(
                                            "flex items-center gap-2 px-4 py-1.5 rounded-lg font-bold text-xs uppercase tracking-widest transition-all",
                                            isActive 
                                                ? "bg-white text-emerald-600 shadow-lg" 
                                                : "text-slate-400 hover:text-white hover:bg-slate-800/50"
                                        )}
                                    >
                                        <item.icon className="w-3.5 h-3.5" /> {item.label}
                                    </Link>
                                );
                            })}
                        </div>
                    </div>

                    <button
                        onClick={() => {
                            document.cookie = 'token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC;';
                            router.push('/login');
                        }}
                        className="flex items-center gap-2 px-3 py-1.5 rounded-lg font-bold text-xs uppercase tracking-widest text-slate-400 hover:text-white hover:bg-slate-800/50 transition-all"
                    >
                        <LogOut className="w-3.5 h-3.5" /> Logout
                    </button>
                </div>
            </div>

            {/* Main Content */}
            <div className="max-w-[100vw] mx-auto w-full px-1">
                <div className="bg-gradient-to-br from-emerald-500/10 via-teal-500/10 to-cyan-500/10 backdrop-blur-md border border-emerald-500/10 rounded-xl p-4 text-center mt-1">
                    <h1 className="text-xl font-black text-white uppercase tracking-tighter mb-2">
                        Welcome to Expanse
                    </h1>
                    <p className="text-slate-400 text-xs mb-3">
                        Select an option from the menu above to get started
                    </p>
                    <div className="flex justify-center gap-2">
                        <Link 
                            href="/dashboard/playground"
                            className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white font-bold uppercase tracking-widest rounded-lg transition-all shadow-lg shadow-emerald-500/20 text-xs"
                        >
                            <Rocket className="w-3.5 h-3.5 inline mr-1.5" />
                            Start Deploying
                        </Link>
                        <Link 
                            href="/deploy/settings"
                            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white font-bold uppercase tracking-widest rounded-lg transition-all border border-slate-700 text-xs"
                        >
                            <Activity className="w-3.5 h-3.5 inline mr-1.5" />
                            View System
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
