"use client"

import React, { useEffect, useState, useCallback, useMemo } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    getGlobalDockerStats, getSystemInfo,
    stopProjectByName, removeProjectByName,
    stopContainer, removeContainer, getProjectContainers,
    removeVolume, getComposeStats
} from "@/actions/dockerActions";
import usePositionMap from "@/store/metadataMap";
import { useComposeStore } from "@/store/compose";
import { verifyUserPassword } from "@/actions/userActions";
import {
    Layers, Database, Activity, RefreshCw, HardDrive, Cpu,
    Container, ChevronRight, Square, Trash2, X,
    Lock, AlertTriangle, Boxes, MemoryStick, Network
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import toast from "react-hot-toast";

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
function PasswordModal({
    open, title, description, showVolumeOption, onConfirm, onCancel
}: {
    open: boolean;
    title: string;
    description: string;
    showVolumeOption?: boolean;
    onConfirm: (isVerified: boolean, deleteVolumes: boolean) => void;
    onCancel: () => void;
}) {
    const [value, setValue] = useState("");
    const [deleteVolumes, setDeleteVolumes] = useState(true);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!value.trim()) { setError("Please enter your password"); return; }
        setLoading(true);
        setError("");

        try {
            const isVerified = await verifyUserPassword(value);
            if (!isVerified) {
                setError("Invalid password. Please try again.");
                setLoading(false);
                return;
            }
            onConfirm(true, deleteVolumes);
            setLoading(false);
            setValue("");
        } catch (err) {
            setError("Verification failed. Please try again.");
            setLoading(false);
        }
    };

    if (!open) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
            <div className="bg-[#0d1117] border border-white/10 rounded-2xl p-8 w-full max-sm shadow-2xl shadow-black/60 animate-in fade-in zoom-in-95 duration-200">
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
                            <Lock className="w-3 h-3" /> User Password
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

                    {showVolumeOption && (
                        <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/5 select-none cursor-pointer hover:bg-white/10 transition-colors"
                            onClick={() => setDeleteVolumes(!deleteVolumes)}>
                            <div className={cn(
                                "w-4 h-4 rounded border flex items-center justify-center transition-colors",
                                deleteVolumes ? "bg-rose-500 border-rose-500" : "border-white/20"
                            )}>
                                {deleteVolumes && <div className="w-2 h-2 bg-white rounded-full" />}
                            </div>
                            <div className="flex flex-col">
                                <span className="text-[10px] font-black text-white uppercase tracking-widest">Delete Volumes</span>
                                <span className="text-[8px] text-slate-500">Persistent data will be lost</span>
                            </div>
                        </div>
                    )}

                    <div className="flex gap-3 mt-2">
                        <Button type="button" variant="outline" onClick={onCancel}
                            className="flex-1 bg-white/5 border-white/10 text-slate-300 hover:bg-white/10 rounded-xl font-bold text-xs uppercase tracking-widest">
                            Cancel
                        </Button>
                        <Button type="submit" disabled={loading}
                            className="flex-1 bg-rose-500 hover:bg-rose-600 text-white rounded-xl font-black text-xs uppercase tracking-widest">
                            {loading ? "Verifying..." : "Confirm"}
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
    const [modalAction, setModalAction] = useState<null | { label: string; desc: string; showVolumes?: boolean; fn: (deleteVolumes?: boolean) => Promise<any> }>(null);
    const [actionLoading, setActionLoading] = useState(false);
    const [stats, setStats] = useState<any[]>([]);

    const { resourceMeta, setResourceMeta } = usePositionMap();

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

    // Poll for stats if running
    useEffect(() => {
        let interval: NodeJS.Timeout;
        const fetchStats = async () => {
            if (project.Status?.includes("running")) {
                const s = await getComposeStats(project.Name);
                if (Array.isArray(s)) setStats(s);
            }
        };

        fetchStats();
        interval = setInterval(fetchStats, 3000);
        return () => clearInterval(interval);
    }, [project.Name, project.Status]);

    const runWithPassword = (label: string, desc: string, fn: (deleteVolumes?: boolean) => Promise<any>, showVolumes?: boolean) => {
        setModalAction({ label, desc, fn, showVolumes });
    };

    const handlePasswordConfirm = async (isVerified: boolean, deleteVolumes: boolean) => {
        if (!modalAction || !isVerified) return;
        setActionLoading(true);
        setModalAction(null);
        const res = await modalAction.fn(deleteVolumes);
        setActionLoading(false);
        if (res?.success) {
            toast.success(res.message || "Operation completed");
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
                showVolumeOption={modalAction?.showVolumes}
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
                                    "Restart project",
                                    `All containers of "${project.Name}" will be restarted with current configuration and resource limits.`,
                                    () => {
                                        toast.error("Please redeploy from Playground to apply new resource limits.");
                                        return Promise.resolve({ success: false });
                                    }
                                )}
                                variant="outline"
                                className="bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/20 text-blue-400 rounded-xl text-[10px] font-black uppercase tracking-widest px-3 py-2 h-auto gap-1.5"
                            >
                                <RefreshCw className="w-3 h-3" /> Reapply
                            </Button>
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
                                    `Confirm your password to permanently delete "${project.Name}".`,
                                    (dv) => removeProjectByName(project.Name, dv),
                                    true
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
                                                        <div className="font-bold text-sm text-white truncate">{c.Names}</div>
                                                        <div className="text-[10px] text-slate-500 font-mono italic flex items-center gap-2">
                                                            {c.Image}
                                                            {c.State === 'running' && stats.find(s => s.Name === c.Names) && (
                                                                <div className="flex items-center gap-3 ml-2 border-l border-white/10 pl-3">
                                                                    <div className="flex items-center gap-1.5">
                                                                        <span className="text-[9px] text-slate-500 font-black">CPU</span>
                                                                        <div className="w-12 h-1 bg-white/5 rounded-full overflow-hidden">
                                                                            <div
                                                                                className="h-full bg-blue-500 transition-all duration-1000"
                                                                                style={{ width: `${Math.min(parseFloat(stats.find(s => s.Name === c.Names)?.CPUPerc) || 0, 100)}%` }}
                                                                            />
                                                                        </div>
                                                                        <span className="text-[9px] text-blue-400 font-bold">{stats.find(s => s.Name === c.Names)?.CPUPerc}</span>
                                                                    </div>
                                                                    <div className="flex items-center gap-1.5">
                                                                        <span className="text-[9px] text-slate-500 font-black">RAM</span>
                                                                        <span className="text-[9px] text-emerald-400 font-bold">{stats.find(s => s.Name === c.Names)?.MemUsage.split('/')[0]}</span>
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </div>
                                                        <PortChips ports={ports} />
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
                                </div>
                            )}
                        </div>

                        {/* Resource Limits */}
                        <div>
                            <div className="flex items-center gap-2 mb-3">
                                <Cpu className="w-4 h-4 text-emerald-400" />
                                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                    Resource Limits
                                </h3>
                            </div>
                            <div className="space-y-3 bg-white/5 border border-white/5 rounded-2xl p-4">
                                {detail?.containers.map((c: any) => {
                                    const meta = resourceMeta.get(c.Names) || {};
                                    return (
                                        <div key={c.ID} className="space-y-3 p-3 bg-black/20 rounded-xl border border-white/5">
                                            <div className="flex items-center justify-between">
                                                <span className="text-[10px] font-bold text-white truncate max-w-[150px]">{c.Names}</span>
                                                <span className="text-[9px] text-slate-500 font-mono italic">{c.Image.split(':')[0]}</span>
                                            </div>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="space-y-1.5">
                                                    <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest">CPU Limit (Cores)</label>
                                                    <div className="flex items-center gap-2">
                                                        <input
                                                            type="text"
                                                            placeholder="0.5"
                                                            value={meta.cpus || ''}
                                                            onChange={(e) => setResourceMeta(c.Names, { ...meta, cpus: e.target.value })}
                                                            className="w-full bg-white/5 border border-white/10 rounded-lg px-2 py-1.5 text-[10px] font-mono text-emerald-400 focus:outline-none focus:border-emerald-500/50"
                                                        />
                                                    </div>
                                                </div>
                                                <div className="space-y-1.5">
                                                    <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest">RAM Limit</label>
                                                    <div className="flex items-center gap-2">
                                                        <input
                                                            type="text"
                                                            placeholder="512M"
                                                            value={meta.memory || ''}
                                                            onChange={(e) => setResourceMeta(c.Names, { ...meta, memory: e.target.value })}
                                                            className="w-full bg-white/5 border border-white/10 rounded-lg px-2 py-1.5 text-[10px] font-mono text-blue-400 focus:outline-none focus:border-blue-500/50"
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                                <p className="text-[9px] text-slate-500 italic mt-2 px-1">
                                    * Changes take effect after Clicking "Reapply" or Redeploying from Playground.
                                </p>
                            </div>
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
    const [selectedProject, setSelectedProject] = useState<any>(null);

    // Global action state
    const [modalAction, setModalAction] = useState<null | { label: string; desc: string; fn: () => Promise<any> }>(null);

    const fetchData = useCallback(async () => {
        try {
            const [dockerStats, systemStats] = await Promise.all([
                getGlobalDockerStats(),
                getSystemInfo()
            ]);
            if (!('error' in dockerStats)) setStats(dockerStats);
            if (!('error' in systemStats)) setSysInfo(systemStats);
        } catch (err) {
            console.error('fetchData error:', err);
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
        setModalAction(null);
        const res = await modalAction.fn();
        if (res?.success) {
            toast.success("Operation completed");
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

            {/* ── System Stats ── */}
            <div className="max-w-[98vw] mx-auto px-4">
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
                                                    <div className="font-bold text-sm text-white truncate">{proj.Name}</div>
                                                    <div className="text-[10px] text-slate-600 font-mono truncate max-w-[200px]">{proj.ConfigFiles}</div>
                                                    {/* Port badges for this project */}
                                                    <PortChips ports={projPorts} />
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
                        {!stats || stats.containers.length === 0 ? (
                            <EmptyState icon={<Container className="w-12 h-12" />} label="No containers" />
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                {stats.containers.map((c: any) => {
                                    const ports = parsePorts(c.Ports);
                                    return (
                                        <div key={c.ID}
                                            className="flex items-start justify-between p-4 bg-[#0d1117]/80 border border-white/5 rounded-xl hover:border-white/10 transition-all group">
                                            <div className="flex items-start gap-3 min-w-0 flex-1">
                                                <div className={cn(
                                                    "w-2 h-2 rounded-full shrink-0 mt-2",
                                                    c.State === "running" ? "bg-emerald-400 shadow-sm shadow-emerald-500/50" : "bg-slate-600"
                                                )} />
                                                <div className="min-w-0 flex-1">
                                                    <div className="font-bold text-sm text-white truncate">{c.Names}</div>
                                                    <div className="text-[10px] text-slate-500">{c.Image}</div>
                                                    <PortChips ports={ports} />
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2 shrink-0 ml-2">
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
                        {!stats || stats.volumes.length === 0 ? (
                            <EmptyState icon={<Database className="w-12 h-12" />} label="No volumes" />
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                {stats.volumes.map((v: any) => (
                                    <div key={v.Name}
                                        className="flex items-center gap-4 p-4 bg-[#0d1117]/80 border border-white/5 rounded-xl hover:border-white/10 transition-all group">
                                        <div className="p-2.5 rounded-xl bg-purple-500/10 border border-purple-500/10">
                                            <HardDrive className="w-4 h-4 text-purple-400" />
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <div className="font-bold text-sm text-white truncate">{v.Name}</div>
                                            <div className="text-[10px] text-slate-600 font-mono truncate">{v.Mountpoint}</div>
                                        </div>
                                        <div className="flex items-center gap-3 shrink-0">
                                            {v.Size && (
                                                <div className="flex flex-col items-end mr-1">
                                                    <span className="text-[9px] font-black uppercase tracking-widest text-slate-500">Size</span>
                                                    <span className="text-xs font-black text-purple-400">{v.Size}</span>
                                                </div>
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
