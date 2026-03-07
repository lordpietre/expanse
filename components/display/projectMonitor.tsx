"use client"

import React, { useEffect, useState, useCallback } from "react";
import { Cpu, Activity, RefreshCw, HardDrive, Square, Trash2, X, Plus, Boxes, Container as ContainerIcon } from "lucide-react";
import { getComposeStats, getProjectContainers, stopProjectByName, removeProjectByName, stopContainer, removeContainer } from "@/actions/dockerActions";
import usePositionMap from "@/store/metadataMap";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import toast from "react-hot-toast";

interface ProjectMonitorProps {
    project: {
        id: string;
        name: string;
        projectName: string;
        status?: string | null;
    };
    onClose?: () => void;
    onRefresh?: () => void;
}

export default function ProjectMonitor({ project, onClose, onRefresh }: ProjectMonitorProps) {
    const [detail, setDetail] = useState<{ containers: any[]; volumes: any[] } | null>(null);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState<any[]>([]);
    const { resourceMeta, setResourceMeta } = usePositionMap();

    const fetchDetail = useCallback(async () => {
        try {
            setLoading(true);
            const res = await getProjectContainers(project.projectName);
            if (!('error' in res)) setDetail(res as any);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, [project.projectName]);

    useEffect(() => {
        fetchDetail();
    }, [fetchDetail]);

    // Poll for stats
    useEffect(() => {
        let interval: NodeJS.Timeout;
        const fetchStats = async () => {
            if (project.status?.includes("running") || project.status?.includes("Up")) {
                const s = await getComposeStats(project.id);
                if (Array.isArray(s)) setStats(s);
            }
        };

        fetchStats();
        interval = setInterval(fetchStats, 3000);
        return () => clearInterval(interval);
    }, [project.projectName, project.status]);

    const handleReapply = () => {
        toast.error("Please redeploy from Playground to apply new resource limits.");
    };

    return (
        <div className="mt-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-emerald-500/20 rounded-xl border border-emerald-500/20">
                        <Activity className="w-5 h-5 text-emerald-400" />
                    </div>
                    <div>
                        <h2 className="text-xl font-black text-white uppercase tracking-tight">{project.name}</h2>
                        <p className="text-[10px] text-slate-500 font-mono tracking-widest uppercase">{project.projectName}</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <Button
                        onClick={handleReapply}
                        variant="outline"
                        className="bg-blue-500/10 hover:bg-blue-500/20 border-blue-500/20 text-blue-400 rounded-xl text-[10px] font-black uppercase tracking-widest h-9"
                    >
                        <RefreshCw className="w-3 h-3 mr-2" /> Reapply Limits
                    </Button>
                    {onClose && (
                        <Button onClick={onClose} variant="ghost" className="text-slate-500 hover:text-white">
                            <X className="w-4 h-4" />
                        </Button>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Real-time Stats */}
                <div className="space-y-4">
                    <div className="flex items-center gap-2 px-2">
                        <ContainerIcon className="w-4 h-4 text-indigo-400" />
                        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Live Performance</h3>
                    </div>
                    <div className="grid gap-3">
                        {loading ? (
                            <div className="h-32 flex items-center justify-center bg-white/5 rounded-2xl border border-white/5">
                                <RefreshCw className="w-6 h-6 text-slate-700 animate-spin" />
                            </div>
                        ) : detail?.containers.map((c: any) => {
                            const containerStats = stats.find(s =>
                                s.Name === c.Names ||
                                (typeof c.Names === 'string' && c.Names.includes(s.Name)) ||
                                s.ID === c.ID ||
                                s.ID === c.ID?.substring(0, 12)
                            );
                            const cpuPerc = parseFloat(containerStats?.CPUPerc) || 0;
                            const memPerc = parseFloat(containerStats?.MemPerc) || 0;
                            return (
                                <div key={c.ID} className="bg-white/5 border border-white/5 rounded-2xl p-4 hover:border-indigo-500/20 transition-all group">
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="flex items-center gap-3">
                                            <div className={cn("w-2 h-2 rounded-full", c.State === "running" ? "bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.5)]" : "bg-slate-600")} />
                                            <span className="font-bold text-sm text-white">{c.Names}</span>
                                        </div>
                                        <span className="text-[10px] text-slate-500 font-mono italic">{c.Image.split(':')[0]}</span>
                                    </div>

                                    <div className="space-y-4">
                                        <div className="space-y-1.5">
                                            <div className="flex justify-between text-[9px] font-black uppercase tracking-widest text-slate-500">
                                                <span>Processor Load</span>
                                                <span className="text-indigo-400">{containerStats?.CPUPerc || "0.00%"}</span>
                                            </div>
                                            <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                                                <div
                                                    className="h-full bg-indigo-500 transition-all duration-1000 shadow-[0_0_10px_rgba(99,102,241,0.5)]"
                                                    style={{ width: `${Math.min(cpuPerc, 100)}%` }}
                                                />
                                            </div>
                                        </div>
                                        <div className="space-y-1.5">
                                            <div className="flex justify-between text-[9px] font-black uppercase tracking-widest text-slate-500">
                                                <span>Memory Usage</span>
                                                <span className="text-emerald-400">{containerStats?.MemUsage.split('/')[0] || "0B"}</span>
                                            </div>
                                            <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                                                <div
                                                    className="h-full bg-emerald-500 transition-all duration-1000 shadow-[0_0_10px_rgba(16,185,129,0.5)]"
                                                    style={{ width: `${Math.min(memPerc, 100)}%` }}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Resource Configuration */}
                <div className="space-y-4">
                    <div className="flex items-center gap-2 px-2">
                        <Cpu className="w-4 h-4 text-emerald-400" />
                        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Resource Allocation</h3>
                    </div>
                    <div className="bg-slate-900/40 border border-white/5 rounded-3xl p-6 space-y-6">
                        {detail?.containers.map((c: any) => {
                            const meta = resourceMeta.get(c.Names) || {};
                            return (
                                <div key={c.ID} className="space-y-4 p-4 bg-black/20 rounded-2xl border border-white/5">
                                    <div className="flex items-center justify-between pb-2 border-b border-white/5">
                                        <span className="text-xs font-bold text-white uppercase tracking-tight">{c.Names}</span>
                                        <div className="flex items-center gap-2">
                                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                                            <span className="text-[9px] font-black text-emerald-400 uppercase tracking-widest">Active</span>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Max CPU Cores</label>
                                            <input
                                                type="text"
                                                placeholder="0.5"
                                                value={meta.cpus || ''}
                                                onChange={(e) => setResourceMeta(c.Names, { ...meta, cpus: e.target.value })}
                                                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs font-mono text-emerald-400 focus:outline-none focus:border-emerald-500/50 transition-all"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Max RAM (e.g. 1G)</label>
                                            <input
                                                type="text"
                                                placeholder="512M"
                                                value={meta.memory || ''}
                                                onChange={(e) => setResourceMeta(c.Names, { ...meta, memory: e.target.value })}
                                                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs font-mono text-blue-400 focus:outline-none focus:border-blue-500/50 transition-all"
                                            />
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                        <div className="flex items-start gap-3 p-4 bg-blue-500/5 border border-blue-500/10 rounded-2xl">
                            <Activity className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                            <p className="text-[10px] text-blue-400/80 leading-relaxed italic">
                                Resource limits define the maximum capacity each container can consume from the host system. Changes require a redeploy to take full effect.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
