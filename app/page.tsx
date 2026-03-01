"use client"

import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { Settings, Share, Rocket, Activity, LogOut, House as HouseIcon, Box } from "lucide-react";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";
import { getAllMyComposeOrderByEditDate } from "@/actions/userActions";
import { getGlobalDockerStats } from "@/actions/dockerActions";
import { DataTable } from "@/components/display/dataTable";
import { columns } from "@/components/display/composeTable/colums";
import { Plus } from "lucide-react";

export default function HomePage() {
    const pathname = usePathname();
    const router = useRouter();

    const [composes, setComposes] = useState<any[]>([]);
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const checkAndFetch = async () => {
            try {
                const token = document.cookie.split('; ').find(row => row.startsWith('token='));
                if (!token) {
                    router.push('/login');
                    return;
                }

                const [composesData, globalStats] = await Promise.all([
                    getAllMyComposeOrderByEditDate(),
                    getGlobalDockerStats()
                ]);

                // Create a mapping of project names to status from Docker
                const projectStatuses: Record<string, string> = {};
                if (globalStats && !globalStats.error && globalStats.projects) {
                    globalStats.projects.forEach((proj: any) => {
                        if (proj.Name && proj.Status) {
                            projectStatuses[proj.Name] = proj.Status;
                        }
                    });
                }

                // Map the database composes with real-time docker statuses
                const data = composesData.map((c) => {
                    const projectName = `expanse-project_${c.id}`;
                    const status = projectStatuses[projectName] || null;

                    return {
                        id: c.id.toString(),
                        name: c.data?.name,
                        createdAt: c.createdAt,
                        updatedAt: c.updatedAt,
                        status,
                        projectName
                    };
                });

                setComposes(data);
                setStats(globalStats);
                setLoading(false);
            } catch (err) {
                console.error(err);
                router.push('/login');
            }
        };
        checkAndFetch();
    }, [router]);

    const navItems = [
        { href: "/", label: "Home", icon: HouseIcon },
        { href: "/dashboard/playground", label: "Deploy", icon: Rocket },
        { href: "/deploy/settings", label: "System", icon: Activity },
        { href: "/dashboard/settings", label: "Settings", icon: Settings },
    ];

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-950 flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <Activity className="w-8 h-8 text-emerald-500 animate-pulse" />
                    <div className="text-slate-500 font-bold uppercase tracking-widest text-xs">Loading expanse...</div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-transparent">
            {/* Dark Horizon Header Navigation */}
            <div className="bg-slate-950 py-2 px-4 flex flex-col relative overflow-hidden">
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10" />
                <div className="absolute -left-20 -top-20 w-[300px] h-[300px] bg-emerald-500/10 rounded-full blur-[60px]" />

                <div className="z-10 max-w-[98vw] mx-auto w-full flex items-center justify-between">
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
                        className="flex items-center gap-2 px-3 py-1.5 rounded-lg font-bold text-xs uppercase tracking-widest text-slate-400 hover:text-white hover:bg-slate-800/50 transition-all font-mono"
                    >
                        <LogOut className="w-3.5 h-3.5" /> Logout
                    </button>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="max-w-[98vw] mx-auto w-full px-4 mt-8">
                <div className="flex items-center gap-6 mb-12">
                    <div className="flex flex-col gap-1 relative">
                        <div className="flex items-center gap-3 relative z-10">
                            <Activity className="w-4 h-4 text-emerald-500 animate-pulse" />
                            <span className="text-[9px] font-black uppercase tracking-[0.4em] text-emerald-500 italic">compose engine</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <h1 className="text-white font-black text-5xl tracking-tighter uppercase relative z-10">
                                Deploys
                            </h1>
                            <Link
                                href="/dashboard/playground"
                                className="flex items-center justify-center w-8 h-8 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-lg transition-all shadow-lg shadow-emerald-500/20 hover:scale-110 active:scale-95 mt-1"
                            >
                                <Plus className="w-5 h-5 stroke-[4]" />
                            </Link>
                        </div>
                    </div>
                </div>

                <div className="bg-slate-950/40 backdrop-blur-xl border border-white/5 rounded-[2rem] overflow-hidden shadow-2xl">
                    <DataTable columns={columns} data={composes} />
                </div>
            </div>
        </div>
    );
}
