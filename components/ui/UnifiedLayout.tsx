"use client"

import Link from "next/link";
import { House, LogOut, Settings, Share, Rocket, Activity } from "lucide-react";
import { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { usePathname } from "next/navigation";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { logout } from "@/actions/userActions";

export default function UnifiedLayout({ children, version }: { children: ReactNode, version: string }) {
    const pathname = usePathname();

    const navItems = [
        { href: "/", label: "Home", icon: House },
        { href: "/deploy/settings", label: "System", icon: Activity },
        { href: "/dashboard/playground", label: "Deploy", icon: Rocket },
        { href: "/dashboard/deploys", label: "Deploys", icon: Share },
        { href: "/dashboard/settings", label: "Settings", icon: Settings },
    ];

    const getActiveHref = () => {
        if (pathname === "/" || pathname === "/dashboard") return "/";
        if (pathname.startsWith("/deploy")) return "/deploy/settings";
        if (pathname.includes("/playground")) return "/dashboard/playground";
        if (pathname.includes("/deploys")) return "/dashboard/deploys";
        if (pathname.includes("/settings")) return "/dashboard/settings";
        return "/";
    };

    const activeHref = getActiveHref();

    return (
        <div className="min-h-screen bg-transparent">
            {/* Dark Horizon Header Navigation */}
            <div className="bg-slate-950 py-2 px-4 flex flex-col relative overflow-hidden">
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10" />
                <div className="absolute -left-20 -top-20 w-[300px] h-[300px] bg-emerald-500/10 rounded-full blur-[60px]" />

                <div className="z-10 max-w-[98vw] mx-auto w-full flex items-center justify-between">
                    <div className="flex items-center gap-6">
                        {/* Unified Navigation Links */}
                        <div className="flex bg-slate-900/50 border border-slate-800 rounded-xl p-1 backdrop-blur-md">
                            {navItems.map((item) => {
                                const isActive = pathname === "/" 
                                    ? item.href === "/" 
                                    : item.href === activeHref;
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

                    <DropdownMenu>
                        <DropdownMenuTrigger className="bg-slate-800/50 hover:bg-slate-700 text-slate-300 p-1.5 rounded-lg transition-colors border border-slate-700">
                            <Settings className="w-4 h-4" />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="bg-white rounded-xl shadow-2xl border-slate-100">
                            <DropdownMenuItem onClick={() => logout()} className="flex items-center gap-2 text-rose-600 font-bold cursor-pointer hover:bg-rose-50 rounded-lg">
                                <LogOut className="w-4 h-4" />
                                Logout
                            </DropdownMenuItem>
                            <div className="px-2 py-1.5 text-[10px] text-slate-400 font-mono text-right border-t border-slate-100 mt-1">
                                v{version}
                            </div>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="max-w-[100vw] mx-auto w-full px-1">
                {children}
            </div>
        </div>
    );
}
