"use client"

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { House, LogOut, Settings, Share, Rocket, Activity } from "lucide-react";
import { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { usePathname } from "next/navigation";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { logout } from "@/actions/userActions";

export default function ClientLayout({ children, version }: { children: ReactNode, version: string }) {
    const pathname = usePathname();

    return (
        <div className="min-h-screen bg-slate-50/50 pb-20">
            {/* Dark Horizon Header Navigation */}
            <div className="bg-slate-950 p-6 flex flex-col relative overflow-hidden">
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10" />
                <div className="absolute -left-20 -top-20 w-[400px] h-[400px] bg-blue-600/10 rounded-full blur-[80px]" />

                <div className="z-10 max-w-6xl mx-auto w-full flex items-center justify-between">
                    <div className="flex items-center gap-8">
                        {/* Navigation Links */}
                        <div className="flex bg-slate-900/50 border border-slate-800 rounded-2xl p-1 backdrop-blur-md">
                            <Link href="/dashboard" className={cn("flex items-center gap-2 px-6 py-2 rounded-xl font-bold text-xs uppercase tracking-widest transition-all", pathname.endsWith("dashboard") ? "bg-white text-blue-600 shadow-lg" : "text-slate-400 hover:text-white hover:bg-slate-800/50")}>
                                <House className="w-4 h-4" /> Home
                            </Link>
                            <Link href="/dashboard/shares" className={cn("flex items-center gap-2 px-6 py-2 rounded-xl font-bold text-xs uppercase tracking-widest transition-all", pathname.endsWith("shares") ? "bg-white text-indigo-600 shadow-lg" : "text-slate-400 hover:text-white hover:bg-slate-800/50")}>
                                <Share className="w-4 h-4" /> My Shares
                            </Link>
                            <Link href="/dashboard/settings" className={cn("flex items-center gap-2 px-6 py-2 rounded-xl font-bold text-xs uppercase tracking-widest transition-all", pathname.endsWith("settings") ? "bg-white text-purple-600 shadow-lg" : "text-slate-400 hover:text-white hover:bg-slate-800/50")}>
                                <Settings className="w-4 h-4" /> Settings
                            </Link>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <Link href="/global-dashboard">
                            <Button variant="outline" className="bg-slate-800/50 hover:bg-slate-700 text-slate-300 border-slate-700 font-bold uppercase tracking-widest text-xs h-10 px-6 rounded-xl shadow-lg gap-2 transition-all">
                                <Activity className="w-4 h-4 text-rose-500" /> Dashboard
                            </Button>
                        </Link>

                        <Link href="/dashboard/playground">
                            <Button className="bg-blue-600 hover:bg-blue-700 text-white font-bold uppercase tracking-widest text-xs h-10 px-6 rounded-xl border-0 shadow-lg shadow-blue-900/20 gap-2 transition-all">
                                <Rocket className="w-4 h-4" /> Deploy
                            </Button>
                        </Link>

                        <DropdownMenu>
                            <DropdownMenuTrigger className="bg-slate-800/50 hover:bg-slate-700 text-slate-300 p-2 rounded-xl transition-colors border border-slate-700">
                                <Settings className="w-5 h-5" />
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
            </div>

            {/* Main Content Area */}
            <div className="max-w-6xl mx-auto w-full p-8 mt-4">
                {children}
            </div>
        </div>
    );
}