"use client"

import React, { useEffect, useState, useCallback } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    getGlobalDockerStats, getSystemInfo,
    stopProjectByName, removeProjectByName,
    stopContainer, removeContainer, getProjectContainers
} from "@/actions/dockerActions";
import {
    Layers, Database, Activity, RefreshCw, HardDrive, Cpu,
    Container, ArrowLeft, ChevronRight, Square, Trash2, X,
    Lock, AlertTriangle, Box, Boxes, MemoryStick
} from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import toast from "react-hot-toast";

// ─── Password Modal ───────────────────────────────────────────────────────────
function PasswordModal({
    open, title, description, onConfirm, onCancel
}: {
    open: boolean;
    title: string;
    description: string;
    onConfirm: (password: string) => void;
    onCancel: () => void;
}) {
    const [value, setValue] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!value.trim()) { setError("Introduce la contraseña"); return; }
        setLoading(true);
        setError("");
        // Simple PIN – we just require the user to type "confirm" or their own arbitrary token
        onConfirm(value);
        setLoading(false);
        setValue("");
    };

    if (!open) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
            <div className="bg-[#0d1117] border border-white/10 rounded-2xl p-8 w-full max-w-sm shadow-2xl shadow-black/60 animate-in fade-in zoom-in-95 duration-200">
                <div className="flex items-center gap-3 mb-6">
                    <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20">
                        <AlertTriangle className="w-5 h-5 text-rose-400" />
                    </div>
                    <div>
                        <h3 className="font-black text-white text-sm uppercase tracking-widest">{title}</h3>
                        <p className="text-xs text-slate-400 mt-0.5">{description}</p>
                    </div>
                </div>
                <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                    <div className="flex flex-col gap-1.5">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                            <Lock className="w-3 h-3" /> Contraseña de confirmación
                        </label>
                        <input
                            type="password"
                            value={value}
                            onChange={e => { setValue(e.target.value); setError(""); }}
                            placeholder="••••••••"
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-blue-500/50 transition-colors"
                            autoFocus
                        />
                        {error && <span className="text-[10px] text-rose-400 font-bold">{error}</span>}
                    </div>
                    <div className="flex gap-3 mt-2">
                        <Button type="button" variant="outline" onClick={onCancel}
                            className="flex-1 bg-white/5 border-white/10 text-slate-300 hover:bg-white/10 rounded-xl font-bold text-xs uppercase tracking-widest">
                            Cancelar
                        </Button>
                        <Button type="submit" disabled={loading}
                            className="flex-1 bg-rose-500 hover:bg-rose-600 text-white rounded-xl font-black text-xs uppercase tracking-widest">
                            Confirmar
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}

// ─── Project Detail Drawer ────────────────────────────────────────────────────
function ProjectDetail({
    project,
    onClose,
    onRefresh
}: {
    project: any;
    onClose: () => void;
    onRefresh: () => void;
}) {
    const [detail, setDetail] = useState<{ containers: any[]; volumes: any[] } | null>(null);
    const [loadingDetail, setLoadingDetail] = useState(true);
    const [modalAction, setModalAction] = useState<null | { label: string; desc: string; fn: () => Promise<any> }>(null);
    const [actionLoading, setActionLoading] = useState(false);

    const fetchDetail = useCallback(async () => {
        setLoadingDetail(true);
        const res = await getProjectContainers(project.Name);
        if (!('error' in res)) setDetail(res as any);
        setLoadingDetail(false);
    }, [project.Name]);

    useEffect(() => { fetchDetail(); }, [fetchDetail]);

    const runWithPassword = (label: string, desc: string, fn: () => Promise<any>) => {
        setModalAction({ label, desc, fn });
    };

    const handlePasswordConfirm = async () => {
        if (!modalAction) return;
        setActionLoading(true);
        setModalAction(null);
        const res = await modalAction.fn();
        setActionLoading(false);
        if (res?.success) {
            toast.success("Operación completada");
            fetchDetail();
            onRefresh();
        } else {
            toast.error(res?.error || "Error en la operación");
        }
    };

    return (
        <>
            <PasswordModal
                open={!!modalAction}
                title={modalAction?.label || ""}
                description={modalAction?.desc || ""}
                onConfirm={handlePasswordConfirm}
                onCancel={() => setModalAction(null)}
            />

            <div className="fixed inset-0 z-40 flex items-stretch">
                {/* Backdrop */}
                <div className="flex-1 bg-black/50 backdrop-blur-sm cursor-pointer" onClick={onClose} />

                {/* Drawer */}
                <div className="w-full max-w-2xl bg-[#080c12] border-l border-white/5 flex flex-col overflow-hidden shadow-2xl animate-in slide-in-from-right duration-300">
                    {/* Header */}
                    <div className="flex items-center justify-between px-6 py-5 border-b border-white/5 bg-[#0d1117]/80">
                        <div className="flex items-center gap-4">
                            <div className="p-2.5 rounded-xl bg-blue-500/10 border border-blue-500/20">
                                <Boxes className="w-5 h-5 text-blue-400" />
                            </div>
                            <div>
                                <h2 className="font-black text-white text-base uppercase tracking-widest">
                                    {project.Name}
                                </h2>
                                <p className="text-[10px] text-slate-500 truncate max-w-[300px] font-mono mt-0.5">
                                    {project.ConfigFiles}
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <Button
                                onClick={() => runWithPassword(
                                    "Detener proyecto",
                                    `Se detendrán todos los contenedores de "${project.Name}"`,
                                    () => stopProjectByName(project.Name)
                                )}
                                disabled={actionLoading}
                                className="bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/20 text-amber-400 rounded-xl text-[10px] font-black uppercase tracking-widest px-3 py-2 h-auto gap-1.5"
                            >
                                <Square className="w-3 h-3 fill-amber-400" /> Detener
                            </Button>
                            <Button
                                onClick={() => runWithPassword(
                                    "Eliminar proyecto",
                                    `Se eliminarán todos los contenedores y volúmenes de "${project.Name}"`,
                                    () => removeProjectByName(project.Name)
                                )}
                                disabled={actionLoading}
                                className="bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 text-rose-400 rounded-xl text-[10px] font-black uppercase tracking-widest px-3 py-2 h-auto gap-1.5"
                            >
                                <Trash2 className="w-3 h-3" /> Eliminar
                            </Button>
                            <button onClick={onClose}
                                className="p-2 rounded-xl hover:bg-white/5 text-slate-500 hover:text-white transition-colors">
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
                        {/* Containers */}
                        <div>
                            <div className="flex items-center gap-2 mb-3">
                                <Container className="w-4 h-4 text-indigo-400" />
                                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                    Contenedores ({detail?.containers.length ?? 0})
                                </h3>
                            </div>

                            {loadingDetail ? (
                                <div className="flex items-center justify-center py-10 text-slate-600">
                                    <RefreshCw className="w-5 h-5 animate-spin" />
                                </div>
                            ) : detail?.containers.length === 0 ? (
                                <div className="py-8 text-center text-slate-600 text-xs">Sin contenedores</div>
                            ) : (
                                <div className="space-y-2">
                                    {detail?.containers.map((c: any) => (
                                        <div key={c.ID}
                                            className="flex items-center justify-between p-4 bg-white/5 border border-white/5 rounded-xl hover:border-indigo-500/20 transition-colors group">
                                            <div className="flex items-center gap-3 min-w-0">
                                                <div className={cn(
                                                    "w-2 h-2 rounded-full shrink-0",
                                                    c.State === "running" ? "bg-emerald-400 shadow-sm shadow-emerald-400/50" : "bg-slate-600"
                                                )} />
                                                <div className="min-w-0">
                                                    <div className="font-bold text-sm text-white truncate">{c.Names}</div>
                                                    <div className="text-[10px] text-slate-500 font-mono">{c.Image}</div>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2 shrink-0">
                                                <span className={cn(
                                                    "px-2 py-0.5 rounded-full font-black uppercase tracking-widest text-[9px] border",
                                                    c.State === "running"
                                                        ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                                                        : "bg-slate-800 border-slate-700 text-slate-500"
                                                )}>{c.State}</span>
                                                <button
                                                    onClick={() => runWithPassword(
                                                        "Detener contenedor",
                                                        `Detener "${c.Names}"`,
                                                        () => stopContainer(c.ID)
                                                    )}
                                                    className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 transition-all"
                                                    title="Detener">
                                                    <Square className="w-3 h-3 fill-amber-400" />
                                                </button>
                                                <button
                                                    onClick={() => runWithPassword(
                                                        "Eliminar contenedor",
                                                        `Eliminar permanentemente "${c.Names}"`,
                                                        () => removeContainer(c.ID)
                                                    )}
                                                    className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 transition-all"
                                                    title="Eliminar">
                                                    <Trash2 className="w-3 h-3" />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Volumes */}
                        <div>
                            <div className="flex items-center gap-2 mb-3">
                                <HardDrive className="w-4 h-4 text-purple-400" />
                                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                    Volúmenes ({detail?.volumes.length ?? 0})
                                </h3>
                            </div>
                            {!loadingDetail && detail?.volumes.length === 0 ? (
                                <div className="py-8 text-center text-slate-600 text-xs">Sin volúmenes</div>
                            ) : (
                                <div className="space-y-2">
                                    {detail?.volumes.map((v: any) => (
                                        <div key={v.Name}
                                            className="flex items-center gap-4 p-4 bg-white/5 border border-white/5 rounded-xl">
                                            <div className="p-2 rounded-lg bg-purple-500/10 border border-purple-500/20">
                                                <HardDrive className="w-3.5 h-3.5 text-purple-400" />
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <div className="font-bold text-sm text-white truncate">{v.Name}</div>
                                                <div className="text-[10px] text-slate-500 font-mono truncate">{v.Mountpoint}</div>
                                            </div>
                                            <span className="text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400 shrink-0">
                                                {v.Driver}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function DashboardPage() {
    const [stats, setStats] = useState<any>(null);
    const [sysInfo, setSysInfo] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
    const [selectedProject, setSelectedProject] = useState<any>(null);

    const fetchData = async () => {
        const [dockerStats, systemStats] = await Promise.all([
            getGlobalDockerStats(),
            getSystemInfo()
        ]);
        if (!dockerStats.error) setStats(dockerStats);
        if (!systemStats.error) setSysInfo(systemStats);
        setLastUpdated(new Date());
        setLoading(false);
    };

    useEffect(() => {
        fetchData();
        const interval = setInterval(fetchData, 5000);
        return () => clearInterval(interval);
    }, []);

    const formatBytes = (bytes: number) => {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    const formatUptime = (seconds: number) => {
        const d = Math.floor(seconds / 86400);
        const h = Math.floor((seconds % 86400) / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        return `${d}d ${h}h ${m}m`;
    };

    return (
        <div className="min-h-screen bg-[hsl(222,47%,5%)] text-white">
            {/* Project Detail Drawer */}
            {selectedProject && (
                <ProjectDetail
                    project={selectedProject}
                    onClose={() => setSelectedProject(null)}
                    onRefresh={fetchData}
                />
            )}

            {/* ── Header ── */}
            <div className="border-b border-white/5 bg-[#0a0d14]/80 backdrop-blur-xl sticky top-0 z-30">
                <div className="max-w-6xl mx-auto px-8 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-6">
                        <Link href="/">
                            <button className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors text-sm font-bold uppercase tracking-widest">
                                <ArrowLeft className="w-4 h-4" />
                            </button>
                        </Link>
                        <h1 className="text-white font-black text-xl uppercase tracking-[0.15em]">Dashboard</h1>
                    </div>

                    <div className="flex items-center gap-3">
                        <div className={cn(
                            "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest border",
                            loading
                                ? "bg-blue-500/10 border-blue-500/20 text-blue-400"
                                : "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                        )}>
                            <RefreshCw className={cn("w-3 h-3", loading && "animate-spin")} />
                            {loading ? "Actualizando" : `Synced ${lastUpdated.toLocaleTimeString()}`}
                        </div>
                    </div>
                </div>
            </div>

            {/* ── System Stats ── */}
            <div className="max-w-6xl mx-auto px-8 pt-8">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[
                        {
                            icon: <Cpu className="w-4 h-4 text-indigo-400" />,
                            label: "CPU",
                            value: sysInfo?.cpuCount ? `${sysInfo.cpuCount} Cores` : "—",
                            sub: sysInfo?.cpuModel || "Cargando..."
                        },
                        {
                            icon: <MemoryStick className="w-4 h-4 text-emerald-400" />,
                            label: "Memoria",
                            value: sysInfo ? formatBytes(sysInfo.totalMemory - sysInfo.freeMemory) : "—",
                            sub: `de ${sysInfo ? formatBytes(sysInfo.totalMemory) : "—"} total`
                        },
                        {
                            icon: <HardDrive className="w-4 h-4 text-purple-400" />,
                            label: "Disco (/)",
                            value: sysInfo?.diskInfo?.free || "—",
                            sub: `${sysInfo?.diskInfo?.used || "—"} usado (${sysInfo?.diskInfo?.usage || "—"})`
                        },
                        {
                            icon: <Activity className="w-4 h-4 text-amber-400" />,
                            label: "Uptime",
                            value: sysInfo ? formatUptime(sysInfo.uptime) : "—",
                            sub: "Host system"
                        }
                    ].map((card) => (
                        <div key={card.label}
                            className="bg-[#0d1117]/80 border border-white/5 rounded-xl p-5 flex flex-col gap-2 hover:border-white/10 transition-colors">
                            <div className="flex items-center gap-2">
                                {card.icon}
                                <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">{card.label}</span>
                            </div>
                            <div className="text-xl font-black text-white">{card.value}</div>
                            <div className="text-[10px] text-slate-600 truncate">{card.sub}</div>
                        </div>
                    ))}
                </div>
            </div>

            {/* ── Tabs ── */}
            <div className="max-w-6xl mx-auto px-8 py-8">
                <Tabs defaultValue="projects" className="w-full">
                    <TabsList className="bg-white/5 border border-white/5 p-1 rounded-xl mb-6 flex w-fit gap-1">
                        {[
                            { value: "projects", label: "Proyectos", count: stats?.projects.length ?? 0 },
                            { value: "containers", label: "Contenedores", count: stats?.containers.length ?? 0 },
                            { value: "volumes", label: "Volúmenes", count: stats?.volumes.length ?? 0 },
                        ].map(tab => (
                            <TabsTrigger key={tab.value} value={tab.value}
                                className="rounded-lg px-5 py-2 text-slate-500 data-[state=active]:bg-white/10 data-[state=active]:text-white font-bold text-xs uppercase tracking-widest transition-all">
                                {tab.label}
                                <span className="ml-2 px-1.5 py-0.5 rounded-md bg-white/5 text-[10px] font-black">
                                    {tab.count}
                                </span>
                            </TabsTrigger>
                        ))}
                    </TabsList>

                    {/* Projects Tab */}
                    <TabsContent value="projects" className="mt-0">
                        {!stats || stats.projects.length === 0 ? (
                            <EmptyState icon={<Layers className="w-12 h-12" />} label="Sin proyectos activos" />
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                {stats.projects.map((proj: any) => (
                                    <div
                                        key={proj.Name}
                                        className="flex items-center justify-between p-4 bg-[#0d1117]/80 border border-white/5 rounded-xl hover:border-blue-500/30 hover:bg-[#0d1117] transition-all group"
                                    >
                                        <button
                                            onClick={() => setSelectedProject(proj)}
                                            className="flex items-center gap-3 min-w-0 flex-1 text-left"
                                        >
                                            <div className="p-2.5 rounded-xl bg-blue-500/10 border border-blue-500/10 group-hover:border-blue-500/30 transition-colors">
                                                <Boxes className="w-4 h-4 text-blue-400" />
                                            </div>
                                            <div className="min-w-0">
                                                <div className="font-bold text-sm text-white truncate">{proj.Name}</div>
                                                <div className="text-[10px] text-slate-600 font-mono truncate max-w-[200px]">{proj.ConfigFiles}</div>
                                            </div>
                                        </button>
                                        <div className="flex items-center gap-2 shrink-0 ml-3">
                                            <span className={cn(
                                                "px-2 py-0.5 rounded-full font-black uppercase tracking-widest text-[9px] border",
                                                proj.Status?.includes("running")
                                                    ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                                                    : "bg-slate-800 border-slate-700 text-slate-500"
                                            )}>
                                                {proj.Status}
                                            </span>
                                            {/* Quick-action buttons visible on hover */}
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    toast.promise(
                                                        stopProjectByName(proj.Name).then(r => {
                                                            if (r.success) fetchData(); else throw new Error(r.error);
                                                        }),
                                                        { loading: 'Deteniendo...', success: 'Detenido', error: (e: Error) => e.message || 'Error' }
                                                    );
                                                }}
                                                className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 border border-amber-500/20 transition-all"
                                                title="Detener proyecto"
                                            >
                                                <Square className="w-3 h-3 fill-amber-400" />
                                            </button>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    if (!confirm(`¿Eliminar completamente "${proj.Name}"? Esto borrará todos los contenedores y volúmenes.`)) return;
                                                    toast.promise(
                                                        removeProjectByName(proj.Name).then(r => {
                                                            if (r.success) fetchData(); else throw new Error(r.error);
                                                        }),
                                                        { loading: 'Eliminando...', success: 'Eliminado', error: (e: Error) => e.message || 'Error' }
                                                    );
                                                }}
                                                className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 border border-rose-500/20 transition-all"
                                                title="Eliminar proyecto"
                                            >
                                                <Trash2 className="w-3 h-3" />
                                            </button>
                                            <button
                                                onClick={() => setSelectedProject(proj)}
                                                className="p-1.5 rounded-lg text-slate-600 hover:text-white transition-colors"
                                            >
                                                <ChevronRight className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </TabsContent>

                    {/* Containers Tab */}
                    <TabsContent value="containers" className="mt-0">
                        {!stats || stats.containers.length === 0 ? (
                            <EmptyState icon={<Container className="w-12 h-12" />} label="Sin contenedores" />
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                {stats.containers.map((c: any) => (
                                    <div key={c.ID}
                                        className="flex items-center justify-between p-4 bg-[#0d1117]/80 border border-white/5 rounded-xl hover:border-white/10 transition-all group">
                                        <div className="flex items-center gap-3 min-w-0">
                                            <div className={cn(
                                                "w-2 h-2 rounded-full shrink-0",
                                                c.State === "running" ? "bg-emerald-400 shadow-sm shadow-emerald-500/50" : "bg-slate-600"
                                            )} />
                                            <div className="min-w-0">
                                                <div className="font-bold text-sm text-white truncate">{c.Names}</div>
                                                <div className="text-[10px] text-slate-500">{c.Image}</div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2 shrink-0">
                                            <span className={cn(
                                                "px-2 py-0.5 rounded-full font-black uppercase tracking-widest text-[9px] border",
                                                c.State === "running"
                                                    ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                                                    : "bg-slate-800 border-slate-700 text-slate-500"
                                            )}>
                                                {c.State}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </TabsContent>

                    {/* Volumes Tab */}
                    <TabsContent value="volumes" className="mt-0">
                        {!stats || stats.volumes.length === 0 ? (
                            <EmptyState icon={<Database className="w-12 h-12" />} label="Sin volúmenes" />
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                {stats.volumes.map((v: any) => (
                                    <div key={v.Name}
                                        className="flex items-center gap-4 p-4 bg-[#0d1117]/80 border border-white/5 rounded-xl hover:border-white/10 transition-all">
                                        <div className="p-2.5 rounded-xl bg-purple-500/10 border border-purple-500/10">
                                            <HardDrive className="w-4 h-4 text-purple-400" />
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <div className="font-bold text-sm text-white truncate">{v.Name}</div>
                                            <div className="text-[10px] text-slate-600 font-mono truncate">{v.Mountpoint}</div>
                                        </div>
                                        <span className="text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400 shrink-0">
                                            {v.Driver}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    );
}

function EmptyState({ icon, label }: { icon: React.ReactNode; label: string }) {
    return (
        <div className="flex flex-col items-center justify-center py-20 text-slate-700">
            <div className="mb-4 opacity-20">{icon}</div>
            <p className="text-sm font-bold text-slate-600">{label}</p>
        </div>
    );
}
