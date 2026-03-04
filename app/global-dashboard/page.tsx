"use client"

import React, { useEffect, useState, useCallback, useMemo } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    getGlobalDockerStats, getSystemInfo,
    stopProjectByName, removeProjectByName,
    stopContainer, removeContainer, removeContainers, getProjectContainers,
    removeVolume, removeVolumes
} from "@/actions/dockerActions";
import {
    Layers, Database, Activity, RefreshCw, HardDrive, Cpu,
    Container, ArrowLeft, ChevronRight, Square, Trash2, X,
    Lock, AlertTriangle, Box, Boxes, MemoryStick, Network,
    Info, CheckSquare, Square as SquareIcon
} from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import toast from "react-hot-toast";
import { useComposeStore } from "@/store/compose";

// ── Port parsing util ──────────────────────────────────────────────────────────
/** Parse Docker Ports string e.g. "0.0.0.0:8080->80/tcp, :::443->443/tcp, 3306/tcp" into chips */
function parsePorts(portsStr: string | undefined): { host: string; container: string }[] {
    if (!portsStr || typeof portsStr !== 'string') return [];
    const result: { host: string; container: string }[] = [];
    const parts = portsStr.split(',');
    for (const part of parts) {
        const m = part.trim().match(/:(\d+)->([\d]+)/);
        if (m) {
            const entry = { host: m[1], container: m[2] };
            // Deduplicate by host:container pair
            if (!result.some(r => r.host === entry.host && r.container === entry.container)) {
                result.push(entry);
            }
        } else {
            const mUnmapped = part.trim().match(/^(\d+)\//);
            if (mUnmapped) {
                const entry = { host: '-', container: mUnmapped[1] };
                if (!result.some(r => r.host === entry.host && r.container === entry.container)) {
                    result.push(entry);
                }
            }
        }
    }
    return result;
}

function PortChips({ ports }: { ports: { host: string; container: string }[] }) {
    if (!ports.length) return null;
    return (
        <div className="flex flex-wrap gap-1 mt-1">
            {ports.map((p, i) => (
                <span key={i} className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md bg-cyan-500/10 border border-cyan-500/20 text-[9px] font-mono font-bold text-cyan-400">
                    <Network className="w-2.5 h-2.5 shrink-0" />
                    {p.host === '-' ? p.container : `${p.host}:${p.container}`}
                </span>
            ))}
        </div>
    );
}

// ─── Password Modal ───────────────────────────────────────────────────────────
interface PasswordModalProps {
    open: boolean;
    title: string;
    description: string;
    onConfirm: (password: string) => void;
    onCancel: () => void;
}

function PasswordModal({
    open, title, description, onConfirm, onCancel
}: PasswordModalProps) {
    const [value, setValue] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!value.trim()) { setError("Please enter the password"); return; }
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
                            <Lock className="w-3 h-3" /> Confirmation Password
                        </label>
                        <input
                            type="password"
                            value={value}
                            onChange={e => { setValue(e.target.value); setError(""); }}
                            placeholder="••••••••"
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500/50 transition-colors"
                            autoFocus
                        />
                        {error && <span className="text-[10px] text-rose-400 font-bold">{error}</span>}
                    </div>
                    <div className="flex gap-3 mt-2">
                        <Button type="button" variant="outline" onClick={onCancel}
                            className="flex-1 bg-white/5 border-white/10 text-slate-300 hover:bg-white/10 rounded-xl font-bold text-xs uppercase tracking-widest">
                            Cancel
                        </Button>
                        <Button type="submit" disabled={loading}
                            className="flex-1 bg-rose-500 hover:bg-rose-600 text-white rounded-xl font-black text-xs uppercase tracking-widest">
                            Confirm
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}

// ─── Project Detail Drawer ────────────────────────────────────────────────────
interface ProjectDetailProps {
    project: any;
    onClose: () => void;
    onRefresh: () => void;
}

function ProjectDetail({
    project,
    onClose,
    onRefresh
}: ProjectDetailProps) {
    const [detail, setDetail] = useState<{ containers: any[]; volumes: any[] } | null>(null);
    const [loadingDetail, setLoadingDetail] = useState(true);
    const [modalAction, setModalAction] = useState<null | { label: string; desc: string; fn: () => Promise<any> }>(null);
    const [actionLoading, setActionLoading] = useState(false);

    const fetchDetail = useCallback(async () => {
        try {
            setLoadingDetail(true);
            const res = await getProjectContainers(project.Name);
            if (!('error' in res)) setDetail(res as any);
            else console.error('getProjectContainers error:', (res as any).error);
        } catch (err) {
            console.error('fetchDetail threw:', err);
        } finally {
            setLoadingDetail(false);
        }
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
            if (res.warning) {
                toast.error(res.warning, { duration: 5000 });
            } else {
                toast.success(res.message || "Operation completed");
            }
            fetchDetail();
            onRefresh();
        } else {
            toast.error(res?.error || "Operation error");
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
                            <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                                <Boxes className="w-5 h-5 text-blue-400" />
                            </div>
                            <div>
                                <div className="flex items-center gap-3">
                                    <h2 className="font-black text-white text-base uppercase tracking-widest">
                                        {project.Name}
                                    </h2>
                                    {project.Status?.includes("running") && detail?.containers?.[0] && (
                                        <span className="text-[10px] font-mono font-black text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20 whitespace-nowrap shadow-[0_0_15px_rgba(16,185,129,0.15)]">
                                            {parsePorts(detail.containers[0].Ports)?.[0]?.host || ''}
                                        </span>
                                    )}
                                </div>
                                <p className="text-[10px] text-slate-500 truncate max-w-[300px] font-mono mt-0.5">
                                    {project.ConfigFiles}
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <Button
                                onClick={() => runWithPassword(
                                    "Stop project",
                                    `All containers of "${project.Name}" will be stopped`,
                                    () => stopProjectByName(project.Name)
                                )}
                                disabled={actionLoading}
                                className="bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/20 text-amber-400 rounded-xl text-[10px] font-black uppercase tracking-widest px-3 py-2 h-auto gap-1.5"
                            >
                                <Square className="w-3 h-3 fill-amber-400" /> Stop
                            </Button>
                            <Button
                                onClick={() => runWithPassword(
                                    "Delete project",
                                    `All containers and volumes of "${project.Name}" will be deleted`,
                                    () => removeProjectByName(project.Name).then(r => {
                                        if (r.success) {
                                            const { compose, resetCompose } = useComposeStore.getState();
                                            if (compose.name === project.Name) resetCompose();
                                        }
                                        return r;
                                    })
                                )}
                                disabled={actionLoading}
                                className="bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 text-rose-400 rounded-xl text-[10px] font-black uppercase tracking-widest px-3 py-2 h-auto gap-1.5"
                            >
                                <Trash2 className="w-3 h-3" /> Delete
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
                                    Containers ({detail?.containers.length ?? 0})
                                </h3>
                            </div>

                            {loadingDetail ? (
                                <div className="flex items-center justify-center py-10 text-slate-600">
                                    <RefreshCw className="w-5 h-5 animate-spin" />
                                </div>
                            ) : detail?.containers.length === 0 ? (
                                <div className="py-8 text-center text-slate-600 text-xs">No containers</div>
                            ) : (
                                <div className="space-y-2">
                                    {detail?.containers.map((c: any) => {
                                        const ports = parsePorts(c.Ports);
                                        return (
                                            <div key={c.ID}
                                                className="flex items-center justify-between p-4 bg-white/5 border border-white/5 rounded-xl hover:border-indigo-500/20 transition-colors group">
                                                <div className="flex items-center gap-3 min-w-0 flex-1">
                                                    <div className={cn(
                                                        "w-2 h-2 rounded-full shrink-0",
                                                        c.State === "running" ? "bg-emerald-400 shadow-sm shadow-emerald-400/50" : "bg-slate-600"
                                                    )} />
                                                    <div className="min-w-0 flex-1">
                                                        <div className="flex items-center gap-2">
                                                            <div className="font-bold text-sm text-white truncate">{c.Names}</div>
                                                            {c.State === 'running' && ports.length > 0 && (
                                                                <span className="text-[9px] font-mono font-black text-cyan-400 bg-black/40 px-1.5 py-0.5 rounded border border-cyan-500/30 whitespace-nowrap">
                                                                    {ports[0].host}
                                                                </span>
                                                            )}
                                                        </div>
                                                        <div className="text-[10px] text-slate-500 font-mono italic">{c.Image}</div>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2 shrink-0 ml-2">
                                                    <span className={cn(
                                                        "px-2 py-0.5 rounded-full font-black uppercase tracking-widest text-[9px] border",
                                                        c.State === "running"
                                                            ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                                                            : "bg-slate-800 border-slate-700 text-slate-500"
                                                    )}>{c.State}</span>
                                                    <button
                                                        onClick={() => runWithPassword(
                                                            "Stop container",
                                                            `Stop "${c.Names}"`,
                                                            () => stopContainer(c.ID)
                                                        )}
                                                        className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 transition-all"
                                                        title="Stop">
                                                        <Square className="w-3 h-3 fill-amber-400" />
                                                    </button>
                                                    <button
                                                        onClick={() => runWithPassword(
                                                            "Delete container",
                                                            `Permanently delete "${c.Names}"`,
                                                            () => removeContainer(c.ID)
                                                        )}
                                                        className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 transition-all"
                                                        title="Delete">
                                                        <Trash2 className="w-3 h-3" />
                                                    </button>
                                                </div>
                                            </div>
                                        );
                                    })}
                                    {detail?.containers && detail.containers.length > 0 && (
                                        <Button
                                            onClick={() => runWithPassword(
                                                "Delete all containers",
                                                `Permanently delete all ${detail.containers.length} containers of project "${project.Name}"`,
                                                () => removeContainers(detail.containers.map((c: any) => c.ID))
                                            )}
                                            variant="outline"
                                            className="w-full mt-2 border-rose-500/20 text-rose-400 hover:bg-rose-500/10 h-10 text-[10px] font-black uppercase tracking-widest"
                                        >
                                            <Trash2 className="w-3.5 h-3.5 mr-2" />
                                            Delete Project Containers
                                        </Button>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Volumes */}
                        <div>
                            <div className="flex items-center gap-2 mb-3">
                                <HardDrive className="w-4 h-4 text-purple-400" />
                                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                    Volumes ({detail?.volumes.length ?? 0})
                                </h3>
                            </div>
                            {!loadingDetail && detail?.volumes.length === 0 ? (
                                <div className="py-8 text-center text-slate-600 text-xs">No volumes</div>
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
                                            <div className="flex items-center gap-3 shrink-0">
                                                {v.Size && (
                                                    <div className="flex flex-col items-end mr-1">
                                                        <span className="text-[9px] font-black uppercase tracking-widest text-slate-500">Size</span>
                                                        <span className="text-xs font-black text-purple-400">{v.Size}</span>
                                                    </div>
                                                )}
                                                <span className="text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400 shrink-0">
                                                    {v.Driver}
                                                </span>
                                                <button
                                                    onClick={() => runWithPassword(
                                                        "Delete volume",
                                                        `Permanently delete "${v.Name}"`,
                                                        () => removeVolume(v.Name)
                                                    )}
                                                    className="p-1.5 rounded-lg bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 border border-rose-500/20 transition-all"
                                                    title="Delete">
                                                    <Trash2 className="w-3 h-3" />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                    {detail?.volumes && detail.volumes.length > 0 && (
                                        <Button
                                            onClick={() => runWithPassword(
                                                "Delete all volumes",
                                                `Permanently delete all ${detail.volumes.length} volumes of project "${project.Name}"`,
                                                () => removeVolumes(detail.volumes.map((v: any) => v.Name))
                                            )}
                                            variant="outline"
                                            className="w-full mt-2 border-rose-500/20 text-rose-400 hover:bg-rose-500/10 h-10 text-[10px] font-black uppercase tracking-widest"
                                        >
                                            <Trash2 className="w-3.5 h-3.5 mr-2" />
                                            Delete Project Volumes
                                        </Button>
                                    )}
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

    // Selection state for group deletion
    const [selectedContainers, setSelectedContainers] = useState<string[]>([]);
    const [selectedVolumes, setSelectedVolumes] = useState<string[]>([]);

    // Global action state
    const [modalAction, setModalAction] = useState<null | { label: string; desc: string; fn: () => Promise<any> }>(null);
    const [actionLoading, setActionLoading] = useState(false);

    const fetchData = useCallback(async () => {
        try {
            const [dockerStats, systemStats] = await Promise.all([
                getGlobalDockerStats(),
                getSystemInfo()
            ]);
            if (!('error' in dockerStats)) setStats(dockerStats);
            if (!('error' in systemStats)) setSysInfo(systemStats);
            setLastUpdated(new Date());
        } catch (err) {
            console.error('fetchData error:', err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
        const interval = setInterval(fetchData, 5000);
        return () => clearInterval(interval);
    }, [fetchData]);

    // Build a map of projectName -> all port mappings across its containers
    const portsByProject = useMemo(() => {
        const map: Record<string, { host: string; container: string }[]> = {};
        if (!stats?.containers) return map;
        for (const c of stats.containers) {
            try {
                let projectName: string | null = null;
                const labels = c.Labels;

                if (typeof labels === 'object' && labels !== null) {
                    projectName = labels['com.docker.compose.project'];
                } else if (typeof labels === 'string') {
                    const m = labels.match(/(?:^|,)com\.docker\.compose\.project=([^,]+)/);
                    projectName = m ? m[1].trim() : null;
                }

                if (!projectName) continue;
                const ports = parsePorts(c.Ports);
                if (!map[projectName]) map[projectName] = [];
                for (const p of ports) {
                    if (!map[projectName].some(existing => existing.host === p.host && existing.container === p.container)) {
                        map[projectName].push(p);
                    }
                }
            } catch (err) {
                console.error("Error grouping ports by project:", err);
            }
        }
        return map;
    }, [stats]);

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
            if (res.warning) {
                toast.error(res.warning, { duration: 5000 });
            } else {
                toast.success(res.message || "Operation completed");
            }
            fetchData();
        } else {
            toast.error(res?.error || "Operation error");
        }
    };

    return (
        <div className="min-h-screen bg-[hsl(222,47%,5%)] text-white">
            <PasswordModal
                open={!!modalAction}
                title={modalAction?.label || ""}
                description={modalAction?.desc || ""}
                onConfirm={handlePasswordConfirm}
                onCancel={() => setModalAction(null)}
            />

            {/* Project Detail Drawer */}
            {selectedProject && (
                <ProjectDetail
                    project={selectedProject}
                    onClose={() => setSelectedProject(null)}
                    onRefresh={fetchData}
                />
            )}

            {/* ── Header ── */}
            <div className="border-b border-emerald-500/10 bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-cyan-500/10 backdrop-blur-xl sticky top-0 z-30">
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
                            "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest border transition-all duration-500",
                            loading
                                ? "bg-emerald-500/20 border-emerald-500/30 text-emerald-300 shadow-[0_0_10px_rgba(16,185,129,0.2)]"
                                : "bg-slate-500/10 border-slate-500/20 text-slate-400"
                        )}>
                            <RefreshCw className={cn("w-3 h-3", loading && "animate-spin")} />
                            {loading ? "Updating" : `Synced ${lastUpdated.toLocaleTimeString()}`}
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
                            sub: sysInfo?.cpuModel || "Loading..."
                        },
                        {
                            icon: <MemoryStick className="w-4 h-4 text-emerald-400" />,
                            label: "Memory",
                            value: sysInfo ? formatBytes(sysInfo.totalMemory - sysInfo.freeMemory) : "—",
                            sub: `of ${sysInfo ? formatBytes(sysInfo.totalMemory) : "—"} total`
                        },
                        {
                            icon: <HardDrive className="w-4 h-4 text-purple-400" />,
                            label: "Disk (/)",
                            value: sysInfo?.diskInfo?.free || "—",
                            sub: `${sysInfo?.diskInfo?.used || "—"} used (${sysInfo?.diskInfo?.usage || "—"})`
                        },
                        {
                            icon: <Activity className="w-4 h-4 text-amber-400" />,
                            label: "Uptime",
                            value: sysInfo ? formatUptime(sysInfo.uptime) : "—",
                            sub: "Host system"
                        }
                    ].map((card: { icon: React.ReactNode; label: string; value: string; sub: string }) => (
                        <div key={card.label}
                            className="group bg-[#0d1117]/80 border border-white/5 rounded-xl p-5 flex flex-col gap-2 hover:border-emerald-500/20 transition-all duration-300">
                            <div className="flex items-center gap-2">
                                <div className="group-hover:scale-110 transition-transform duration-300">{card.icon}</div>
                                <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">{card.label}</span>
                            </div>
                            <div className="text-xl font-black text-white">{card.value}</div>
                            <div className="text-[10px] text-slate-600 truncate group-hover:text-slate-400 transition-colors">{card.sub}</div>
                        </div>
                    ))}
                </div>
            </div>

            {/* ── Tabs ── */}
            <div className="max-w-6xl mx-auto px-8 py-8">
                <Tabs defaultValue="projects" className="w-full">
                    <TabsList className="bg-white/5 border border-white/5 p-1 rounded-xl mb-6 flex w-fit gap-1">
                        {[
                            { value: "projects", label: "Projects", count: stats?.projects.length ?? 0 },
                            { value: "containers", label: "Containers", count: stats?.containers.length ?? 0 },
                            { value: "volumes", label: "Volumes", count: stats?.volumes.length ?? 0 },
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
                            <EmptyState icon={<Layers className="w-12 h-12" />} label="No active projects" />
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                {stats.projects.map((proj: any) => {
                                    const projPorts = portsByProject[proj.Name] || [];
                                    return (
                                        <div
                                            key={proj.Name}
                                            className="flex items-start justify-between p-4 bg-[#0d1117]/80 border border-white/5 rounded-xl hover:border-emerald-500/30 hover:bg-[#0d1117] transition-all group"
                                        >
                                            <button
                                                onClick={() => setSelectedProject(proj)}
                                                className="flex items-start gap-3 min-w-0 flex-1 text-left"
                                            >
                                                <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/10 group-hover:border-emerald-500/30 transition-colors shrink-0 mt-0.5">
                                                    <Boxes className="w-4 h-4 text-emerald-400" />
                                                </div>
                                                <div className="min-w-0">
                                                    <div className="flex items-center gap-2">
                                                        <div className="font-bold text-sm text-white truncate">{proj.Name}</div>
                                                        {proj.Status?.includes("running") && projPorts.length > 0 && (
                                                            <span className="text-[9px] font-mono font-black text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20 whitespace-nowrap">
                                                                {projPorts[0].host}
                                                            </span>
                                                        )}
                                                    </div>
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
                                                            { loading: 'Stopping...', success: 'Stopped', error: (e: Error) => e.message || 'Error' }
                                                        );
                                                    }}
                                                    className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 border border-amber-500/20 transition-all"
                                                    title="Stop project"
                                                >
                                                    <Square className="w-3 h-3 fill-amber-400" />
                                                </button>
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        if (!confirm(`Completely delete "${proj.Name}"? This will erase all containers and volumes.`)) return;
                                                        toast.promise(
                                                            removeProjectByName(proj.Name).then(r => {
                                                                if (r.success) {
                                                                    const { compose, resetCompose } = useComposeStore.getState();
                                                                    if (compose.name === proj.Name) resetCompose();
                                                                }
                                                                return r;
                                                            }).then(r => {
                                                                if (r.success) fetchData(); else throw new Error(r.error);
                                                            }),
                                                            { loading: 'Deleting...', success: 'Deleted', error: (e: Error) => e.message || 'Error' }
                                                        );
                                                    }}
                                                    className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 border border-rose-500/20 transition-all"
                                                    title="Delete project"
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
                                    );
                                })}
                            </div>
                        )}
                    </TabsContent>

                    {/* Containers Tab */}
                    <TabsContent value="containers" className="mt-0">
                        {selectedContainers.length > 0 && (
                            <div className="mb-4 p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl flex items-center justify-between animate-in fade-in slide-in-from-top-2 duration-200">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 rounded-lg bg-rose-500/20">
                                        <Trash2 className="w-4 h-4 text-rose-400" />
                                    </div>
                                    <span className="text-xs font-bold text-rose-400 uppercase tracking-widest">
                                        {selectedContainers.length} containers selected
                                    </span>
                                </div>
                                <div className="flex gap-2">
                                    <Button
                                        variant="outline"
                                        onClick={() => setSelectedContainers(stats?.containers.map((c: any) => c.ID) || [])}
                                        className="bg-white/5 border-white/10 text-slate-300 hover:bg-white/10 rounded-lg text-[10px] font-black uppercase tracking-widest h-8 px-3"
                                    >
                                        Select All
                                    </Button>
                                    <Button
                                        variant="outline"
                                        onClick={() => setSelectedContainers([])}
                                        className="bg-white/5 border-white/10 text-slate-300 hover:bg-white/10 rounded-lg text-[10px] font-black uppercase tracking-widest h-8 px-3"
                                    >
                                        Deselect
                                    </Button>
                                    <Button
                                        onClick={() => runWithPassword(
                                            "Delete selected containers",
                                            `Permanently delete ${selectedContainers.length} selected containers`,
                                            () => removeContainers(selectedContainers).then(r => {
                                                if (r.success) setSelectedContainers([]);
                                                return r;
                                            })
                                        )}
                                        className="bg-rose-500 hover:bg-rose-600 text-white rounded-lg text-[10px] font-black uppercase tracking-widest h-8 px-3"
                                    >
                                        Delete Group
                                    </Button>
                                </div>
                            </div>
                        )}

                        {!stats || stats.containers.length === 0 ? (
                            <EmptyState icon={<Container className="w-12 h-12" />} label="No containers" />
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                {stats.containers.map((c: any) => {
                                    const ports = parsePorts(c.Ports);
                                    const isSelected = selectedContainers.includes(c.ID);
                                    return (
                                        <div key={c.ID}
                                            className={cn(
                                                "flex items-start justify-between p-4 bg-[#0d1117]/80 border rounded-xl hover:border-white/10 transition-all group cursor-pointer",
                                                isSelected ? "border-rose-500/50 bg-rose-500/5" : "border-white/5"
                                            )}
                                            onClick={() => {
                                                if (isSelected) setSelectedContainers((prev: string[]) => prev.filter(id => id !== c.ID));
                                                else setSelectedContainers((prev: string[]) => [...prev, c.ID]);
                                            }}
                                        >
                                            <div className="flex items-start gap-3 min-w-0 flex-1">
                                                <div className="flex flex-col items-center gap-2 mt-1">
                                                    <div className={cn(
                                                        "w-2 h-2 rounded-full shrink-0",
                                                        c.State === "running" ? "bg-emerald-400 shadow-sm shadow-emerald-500/50" : "bg-slate-600"
                                                    )} />
                                                    <div className={cn(
                                                        "p-1 rounded bg-white/5 border border-white/10 group-hover:bg-white/10 transition-colors",
                                                        isSelected && "bg-rose-500/20 border-rose-500/30"
                                                    )}>
                                                        {isSelected ? <CheckSquare className="w-3 h-3 text-rose-400" /> : <SquareIcon className="w-3 h-3 text-slate-600" />}
                                                    </div>
                                                </div>
                                                <div className="min-w-0 flex-1">
                                                    <div className="flex items-center gap-2">
                                                        <div className="font-bold text-sm text-white truncate">{c.Names}</div>
                                                        {c.State === 'running' && ports.length > 0 && (
                                                            <span className="text-[9px] font-mono font-black text-cyan-400 bg-black/40 px-1.5 py-0.5 rounded border border-cyan-500/30 whitespace-nowrap">
                                                                {ports[0].host}
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div className="text-[10px] text-slate-500 font-mono italic">{c.Image}</div>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2 shrink-0 ml-2" onClick={e => e.stopPropagation()}>
                                                <span className={cn(
                                                    "px-2 py-0.5 rounded-full font-black uppercase tracking-widest text-[9px] border",
                                                    c.State === "running"
                                                        ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                                                        : "bg-slate-800 border-slate-700 text-slate-500"
                                                )}>
                                                    {c.State}
                                                </span>
                                                <button
                                                    onClick={() => runWithPassword(
                                                        "Stop container",
                                                        `Stop "${c.Names}"`,
                                                        () => stopContainer(c.ID)
                                                    )}
                                                    className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 border border-amber-500/20 transition-all"
                                                    title="Stop">
                                                    <Square className="w-3 h-3 fill-amber-400" />
                                                </button>
                                                <button
                                                    onClick={() => runWithPassword(
                                                        "Delete container",
                                                        `Permanently delete "${c.Names}"`,
                                                        () => removeContainer(c.ID)
                                                    )}
                                                    className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 border border-rose-500/20 transition-all"
                                                    title="Delete">
                                                    <Trash2 className="w-3 h-3" />
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </TabsContent>

                    {/* Volumes Tab */}
                    <TabsContent value="volumes" className="mt-0">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest">Global Volumes</h3>
                            <Button
                                onClick={() => {
                                    const unused = stats?.volumes.filter((v: any) => !v.Links || v.Links === 0).map((v: any) => v.Name) || [];
                                    if (unused.length === 0) {
                                        toast.success("No unused volumes to prune");
                                        return;
                                    }
                                    runWithPassword(
                                        "Prune unused volumes",
                                        `Delete all ${unused.length} volumes that are not currently in use by any container`,
                                        () => removeVolumes(unused)
                                    )
                                }}
                                className="bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/20 text-purple-400 rounded-lg text-[10px] font-black uppercase tracking-widest h-8 px-3 gap-2"
                            >
                                <Trash2 className="w-3 h-3" /> Prune Unused
                            </Button>
                        </div>

                        {selectedVolumes.length > 0 && (
                            <div className="mb-4 p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl flex items-center justify-between animate-in fade-in slide-in-from-top-2 duration-200">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 rounded-lg bg-rose-500/20">
                                        <Trash2 className="w-4 h-4 text-rose-400" />
                                    </div>
                                    <span className="text-xs font-bold text-rose-400 uppercase tracking-widest">
                                        {selectedVolumes.length} volumes selected
                                    </span>
                                </div>
                                <div className="flex gap-2">
                                    <Button
                                        variant="outline"
                                        onClick={() => setSelectedVolumes(stats?.volumes.map((v: any) => v.Name) || [])}
                                        className="bg-white/5 border-white/10 text-slate-300 hover:bg-white/10 rounded-lg text-[10px] font-black uppercase tracking-widest h-8 px-3"
                                    >
                                        Select All
                                    </Button>
                                    <Button
                                        variant="outline"
                                        onClick={() => setSelectedVolumes(stats?.volumes.filter((v: any) => !v.Links || v.Links === 0).map((v: any) => v.Name) || [])}
                                        className="bg-purple-500/10 border-purple-500/20 text-purple-400 hover:bg-purple-500/20 rounded-lg text-[10px] font-black uppercase tracking-widest h-8 px-3"
                                    >
                                        Select All Unused
                                    </Button>
                                    <Button
                                        variant="outline"
                                        onClick={() => setSelectedVolumes([])}
                                        className="bg-white/5 border-white/10 text-slate-300 hover:bg-white/10 rounded-lg text-[10px] font-black uppercase tracking-widest h-8 px-3"
                                    >
                                        Deselect
                                    </Button>
                                    <Button
                                        onClick={() => runWithPassword(
                                            "Delete selected volumes",
                                            `Permanently delete ${selectedVolumes.length} selected volumes`,
                                            () => removeVolumes(selectedVolumes).then(r => {
                                                if (r.success) setSelectedVolumes([]);
                                                return r;
                                            })
                                        )}
                                        className="bg-rose-500 hover:bg-rose-600 text-white rounded-lg text-[10px] font-black uppercase tracking-widest h-8 px-3"
                                    >
                                        Delete Group
                                    </Button>
                                </div>
                            </div>
                        )}

                        {!stats || stats.volumes.length === 0 ? (
                            <EmptyState icon={<HardDrive className="w-12 h-12" />} label="No volumes" />
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                {stats.volumes.map((v: any) => {
                                    const isSelected = selectedVolumes.includes(v.Name);
                                    return (
                                        <div key={v.Name}
                                            className={cn(
                                                "flex items-center gap-4 p-4 bg-[#0d1117]/80 border rounded-xl hover:border-white/10 transition-all group cursor-pointer",
                                                isSelected ? "border-rose-500/50 bg-rose-500/5" : "border-white/5"
                                            )}
                                            onClick={() => {
                                                if (isSelected) setSelectedVolumes((prev: string[]) => prev.filter(name => name !== v.Name));
                                                else setSelectedVolumes((prev: string[]) => [...prev, v.Name]);
                                            }}
                                        >
                                            <div className={cn(
                                                "p-1 rounded bg-white/5 border border-white/10 group-hover:bg-white/10 transition-colors shrink-0",
                                                isSelected && "bg-rose-500/20 border-rose-500/30"
                                            )}>
                                                {isSelected ? <CheckSquare className="w-3 h-3 text-rose-400" /> : <SquareIcon className="w-3 h-3 text-slate-600" />}
                                            </div>
                                            <div className="p-2.5 rounded-xl bg-purple-500/10 border border-purple-500/10">
                                                <HardDrive className="w-4 h-4 text-purple-400" />
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <div className="font-bold text-sm text-white truncate">{v.Name}</div>
                                                <div className="text-[10px] text-slate-600 font-mono truncate">{v.Mountpoint}</div>
                                            </div>
                                            <div className="flex items-center gap-3 shrink-0" onClick={e => e.stopPropagation()}>
                                                {v.Size && (
                                                    <div className="flex flex-col items-end mr-1">
                                                        <span className="text-[9px] font-black uppercase tracking-widest text-slate-500">Size</span>
                                                        <span className="text-xs font-black text-purple-400">{v.Size}</span>
                                                    </div>
                                                )}
                                                {v.Links > 0 ? (
                                                    <span className="text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                                                        In Use ({v.Links})
                                                    </span>
                                                ) : (
                                                    <span className="text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full bg-slate-500/10 border border-slate-500/20 text-slate-400">
                                                        Unused
                                                    </span>
                                                )}
                                                <span className="text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400">
                                                    {v.Driver}
                                                </span>
                                                <button
                                                    onClick={() => runWithPassword(
                                                        "Delete volume",
                                                        `Permanently delete "${v.Name}"`,
                                                        () => removeVolume(v.Name)
                                                    )}
                                                    className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 border border-rose-500/20 transition-all"
                                                    title="Delete">
                                                    <Trash2 className="w-3 h-3" />
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })}
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
