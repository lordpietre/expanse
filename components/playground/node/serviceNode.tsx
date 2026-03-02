"use client"
import { Service } from "expanse-docker-lib";
import { Handle, Position } from "@xyflow/react";
import { CardContent } from "@/components/ui/card";
import { Container, Database, Globe, Network, HardDrive, Key, Tag, ChevronDown, ChevronUp, Cloud } from "lucide-react";
import { useExecutionStore } from "@/store/execution";
import { cn } from "@/lib/utils";
import Selectable from "@/components/playground/node/Selectable";
import { useState } from "react";
import { useComposeStore } from "@/store/compose";

const getCategoryTheme = (imageName: string = "") => {
    const name = imageName.toLowerCase();
    if (name.includes('db') || name.includes('sql') || name.includes('mongo') || name.includes('redis') || name.includes('postgres') || name.includes('maria')) {
        return { icon: Database, gradient: "from-amber-500 to-orange-600", color: "text-amber-400", glow: "shadow-amber-500/20" };
    }
    if (name.includes('nginx') || name.includes('apache') || name.includes('proxy') || name.includes('http')) {
        return { icon: Globe, gradient: "from-sky-500 to-emerald-600", color: "text-sky-400", glow: "shadow-sky-500/20" };
    }
    if (name.includes('chat') || name.includes('matrix') || name.includes('slack') || name.includes('mattermost') || name.includes('zulip') || name.includes('revolt') || name.includes('synapse') || name.includes('rocketchat')) {
        return { icon: Globe, gradient: "from-indigo-500 to-purple-600", color: "text-indigo-400", glow: "shadow-indigo-500/20" };
    }
    if (name.includes('vpn') || name.includes('wireguard') || name.includes('proxy') || name.includes('dns') || name.includes('traefik') || name.includes('uptime') || name.includes('netdata')) {
        return { icon: Network, gradient: "from-orange-500 to-red-600", color: "text-orange-400", glow: "shadow-orange-500/20" };
    }
    if (name.includes('cloud') || name.includes('nextcloud') || name.includes('owncloud') || name.includes('seafile') || name.includes('syncthing') || name.includes('filebrowser')) {
        return { icon: Cloud, gradient: "from-sky-400 to-indigo-600", color: "text-sky-300", glow: "shadow-sky-400/20" };
    }
    return { icon: Container, gradient: "from-emerald-500 to-teal-600", color: "text-emerald-400", glow: "shadow-emerald-500/20" };
};

export default function ServiceNode({ data, selected }: { data: { service: Service }, selected?: boolean }) {
    const { tick } = useComposeStore();
    const service = data.service;
    const { serviceStatuses } = useExecutionStore();
    const status = serviceStatuses[service.name]?.status || 'stopped';
    const isRunning = status === 'running';
    const isError = status === 'dead' || status === 'unknown';

    const theme = getCategoryTheme(service.image?.name);
    const Icon = theme.icon;
    const [expanded, setExpanded] = useState(false);

    // Color code based on status: Stopped (Black/Dark), Running (Green), Error (Red)
    const getStatusBorder = () => {
        if (isError) {
            return "p-[1px] rounded-xl border-[4px] border-rose-500 z-50";
        }
        if (isRunning) {
            return "p-[1px] rounded-xl border-[4px] border-emerald-400 z-50";
        }
        // Stopped - dark border
        return "p-[1px] rounded-xl border-[4px] border-slate-800 z-50";
    };

    return (
        <Selectable id={service.id}>
            <div className={cn(
                "group relative flex flex-col transition-all duration-500",
                selected ? getStatusBorder() : "p-[1px] rounded-xl",
                !selected && "border-[4px]",
                !selected && (isError ? "border-rose-500" : isRunning ? "border-emerald-400" : "border-slate-800"),
                isRunning && "float"
            )}>
                {/* Compact Glass Card */}
                <div className="bg-gradient-to-br from-emerald-500/5 via-teal-500/5 to-cyan-500/5 backdrop-blur-2xl rounded-[0.9rem] flex flex-col overflow-visible border border-white/5" style={{ minWidth: 195 }}>

                    {/* Gradient Header — always visible, click to toggle */}
                    <div
                        className={cn(
                            "px-3 py-2 flex items-center justify-between relative overflow-hidden bg-gradient-to-br rounded-[0.7rem] cursor-pointer select-none",
                            !expanded && "rounded-[0.7rem]",
                            expanded && "rounded-t-[0.7rem]",
                            theme.gradient
                        )}
                        onClick={() => setExpanded(e => !e)}
                        title={expanded ? "Collapse node" : "Expand node"}
                    >
                        <div className="absolute inset-0 shimmer opacity-30" />
                        <div className="flex flex-col z-10 min-w-0">
                            <h3 className="text-white font-black text-lg tracking-tight uppercase truncate max-w-[160px] leading-none" style={{ fontFamily: 'Outfit, sans-serif' }}>
                                {service.image?.name || 'no-image'}
                            </h3>
                            <span className="text-white/40 text-[10px] font-bold uppercase tracking-widest truncate max-w-[150px] mt-1" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
                                {service.name}
                            </span>
                        </div>
                        <div className="flex items-center gap-2 z-10 ml-3 shrink-0">
                            <div className="bg-white/20 backdrop-blur-sm p-2.5 rounded-lg border border-white/30 shadow-lg">
                                {(() => {
                                    const logo = service.labels?.find(l => l.key === "com.expanse.logo")?.value;
                                    return logo ? (
                                        <img src={logo} className="w-8 h-8 object-contain drop-shadow-lg" alt="logo" />
                                    ) : (
                                        <Icon className="w-8 h-8 text-white drop-shadow-lg" />
                                    );
                                })()}
                            </div>
                            <div className="bg-black/20 backdrop-blur-sm p-1 rounded-lg border border-white/20">
                                {expanded
                                    ? <ChevronUp className="w-3 h-3 text-white/70" />
                                    : <ChevronDown className="w-3 h-3 text-white/70" />
                                }
                            </div>
                        </div>
                    </div>

                    {/* Collapsed summary — always visible below header */}
                    <div className="flex items-center gap-3 px-3 py-1.5 border-t border-white/5">
                        {/* Network connector — always visible */}
                        <div className="relative flex items-center gap-1.5">
                            <Handle
                                id="network"
                                type="source"
                                position={Position.Left}
                                className="!w-4 !h-4 !rounded-full !-left-3.5 !bg-emerald-500 !border-[#0d1117] !border-2 shadow-[0_0_8px_rgba(16,185,129,0.5)] hover:scale-125 transition-transform !z-50 !opacity-100 !visible cursor-pointer"
                            />
                            <Network className="w-3 h-3 text-emerald-400" />
                            <span className="text-[8px] font-bold text-emerald-300">
                                {service.networks?.size || 0}
                            </span>
                        </div>

                        <div className="w-px h-4 bg-white/10" />

                        {/* Volume connector — always visible */}
                        <div className="relative flex items-center gap-1.5">
                            <Handle
                                id="volume-target"
                                type="target"
                                position={Position.Right}
                                className="!w-4 !h-4 !rounded-full !-right-3.5 !bg-amber-500 !border-[#0d1117] !border-2 shadow-[0_0_8px_rgba(245,158,11,0.5)] hover:scale-125 transition-transform !z-50 !opacity-100 !visible cursor-pointer"
                            />
                            <Handle
                                id="volume"
                                type="source"
                                position={Position.Right}
                                className="!w-4 !h-4 !rounded-full !-right-7 !bg-amber-500 !border-[#0d1117] !border-2 shadow-[0_0_8px_rgba(245,158,11,0.5)] hover:scale-125 transition-transform !z-50 !opacity-100 !visible cursor-pointer"
                            />
                            <HardDrive className="w-3 h-3 text-amber-400" />
                            <span className="text-[8px] font-bold text-amber-300">
                                {service.bindings?.size || 0}
                            </span>
                        </div>

                        {/* Dependency handle — always present for DB connections */}
                        <Handle
                            id="service"
                            type="target"
                            position={Position.Bottom}
                            className="!w-4 !h-4 !rounded-full !-bottom-2 !bg-cyan-500 !border-[#0d1117] !border-2 shadow-[0_0_8px_rgba(6,182,212,0.5)] hover:scale-125 transition-transform !z-50 !opacity-100 !visible cursor-pointer"
                        />
                    </div>

                    {/* Expanded detail sections */}
                    {expanded && (
                        <CardContent className="p-0 bg-gradient-to-br from-emerald-500/5 via-teal-500/5 to-cyan-500/5">
                            {/* Running badge */}
                            {isRunning && (
                                <div className="flex items-center gap-1.5 px-4 py-1.5 bg-emerald-500/10 border-b border-emerald-500/10">
                                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                                    <span className="text-[9px] font-black uppercase text-emerald-400 tracking-widest">Live</span>
                                </div>
                            )}

                            <div className="flex flex-col divide-y divide-white/5">
                                {/* NETWORKS */}
                                <div className="relative px-3 py-1.5 hover:bg-white/3 transition-colors">
                                    <div className="flex items-center gap-1.5 mb-1">
                                        <Network className="w-3 h-3 text-emerald-400" />
                                        <span className="text-[9px] font-black uppercase tracking-[0.18em] text-slate-500">Networks</span>
                                        {isRunning && serviceStatuses[service.name]?.ports && (
                                            <span className="ml-auto text-[8px] font-mono text-cyan-400 bg-cyan-500/10 px-1.5 py-0.5 rounded border border-cyan-500/20">
                                                {serviceStatuses[service.name]?.ports?.split(',')[0]?.replace('0.0.0.0:', '').replace(':::', '').replace('::', '') || serviceStatuses[service.name]?.ports?.split(',')[0]}
                                            </span>
                                        )}
                                    </div>
                                    <div className="flex flex-wrap gap-1">
                                        {Array.from(service.networks || []).map(net => (
                                            <div key={net.id} className="px-2 py-0.5 rounded-md bg-emerald-500/10 border border-emerald-500/20 text-[8px] font-bold text-emerald-300 leading-none">{net.name}</div>
                                        ))}
                                        {(service.networks?.size || 0) === 0 && <span className="text-[8px] italic text-slate-600 leading-none">None</span>}
                                    </div>
                                </div>

                                {/* DATABASE DEPENDENCIES */}
                                <div className="relative px-3 py-1.5 hover:bg-white/3 transition-colors">
                                    <div className="flex items-center gap-1.5 mb-1">
                                        <Database className="w-3 h-3 text-cyan-400" />
                                        <span className="text-[9px] font-black uppercase tracking-[0.18em] text-slate-500">DB</span>
                                        {/* DB connector in expanded view */}
                                        <div className="relative ml-auto flex items-center gap-1">
                                            <span className="text-[7px] font-black text-cyan-600 uppercase tracking-widest">link</span>
                                            <Handle
                                                id="service"
                                                type="target"
                                                position={Position.Bottom}
                                                className="!relative !w-3.5 !h-3.5 !rounded-full !bg-cyan-500 !border-[#0d1117] !border-2 shadow-[0_0_8px_rgba(6,182,212,0.6)] hover:scale-125 transition-transform !z-50 !opacity-100 !visible cursor-pointer !top-0 !left-0 !transform-none"
                                            />
                                        </div>
                                    </div>
                                    <div className="flex flex-wrap gap-1">
                                        {Array.from(service.depends_on || []).filter(dep => {
                                            const name = dep.image?.name?.toLowerCase() || "";
                                            return name.includes('db') || name.includes('sql') || name.includes('mongo') || name.includes('redis') || name.includes('postgres') || name.includes('maria') || name.includes('mysql');
                                        }).map((dep, idx) => (
                                            <div key={idx} className="px-2 py-0.5 rounded-md bg-cyan-500/10 border border-cyan-500/20 text-[8px] font-bold text-cyan-300 leading-none">
                                                {dep.name}
                                            </div>
                                        ))}
                                        {(!service.depends_on || Array.from(service.depends_on).filter(dep => {
                                            const name = dep.image?.name?.toLowerCase() || "";
                                            return name.includes('db') || name.includes('sql') || name.includes('mongo') || name.includes('redis') || name.includes('postgres') || name.includes('maria') || name.includes('mysql');
                                        }).length === 0) && (
                                                <span className="text-[8px] italic text-slate-600 leading-none">None</span>
                                            )}
                                    </div>
                                </div>

                                {/* VOLUMES */}
                                <div className="relative px-3 py-1.5 hover:bg-white/3 transition-colors">
                                    <div className="flex items-center gap-1.5 mb-1">
                                        <HardDrive className="w-3 h-3 text-amber-400" />
                                        <span className="text-[9px] font-black uppercase tracking-[0.18em] text-slate-500">Volumes</span>
                                    </div>
                                    <div className="space-y-0.5">
                                        {Array.from(service.bindings || []).map((vol, idx) => (
                                            <div key={idx} className="text-[8px] font-mono text-slate-500 truncate bg-amber-500/5 px-1.5 py-0.5 rounded border border-amber-500/10 leading-none">
                                                {vol.toString()}
                                            </div>
                                        ))}
                                        {(service.bindings?.size || 0) === 0 && <span className="text-[8px] italic text-slate-600 leading-none">None</span>}
                                    </div>
                                </div>

                                {/* ENVIRONMENT */}
                                <div className="relative px-3 py-1.5 hover:bg-white/3 transition-colors">
                                    <div className="flex items-center gap-1.5 mb-1">
                                        <Key className="w-3 h-3 text-violet-400" />
                                        <span className="text-[9px] font-black uppercase tracking-[0.18em] text-slate-500">Env</span>
                                    </div>
                                    <div className="flex flex-wrap gap-0.5">
                                        {service.environment && Array.from(service.environment).map((env, idx) => (
                                            <div key={idx} className="text-[8px] font-mono text-violet-400 truncate px-1.5 py-0.5 rounded bg-violet-500/10 border border-violet-500/15 leading-none">
                                                {env.key}={env.value || ""}
                                            </div>
                                        ))}
                                        {(!service.environment || service.environment.size === 0) && <span className="text-[8px] italic text-slate-600 leading-none">None</span>}
                                    </div>
                                </div>

                                {/* LABELS */}
                                <div className="relative px-3 py-1.5 hover:bg-white/3 transition-colors">
                                    <div className="flex items-center gap-1.5 mb-1">
                                        <Tag className="w-3 h-3 text-rose-400" />
                                        <span className="text-[9px] font-black uppercase tracking-[0.18em] text-slate-500">Labels</span>
                                    </div>
                                    <div className="flex flex-wrap gap-1">
                                        {service.labels && Array.from(service.labels).map((label, idx) => (
                                            <div key={idx} className="px-2 py-0.5 rounded-md bg-rose-500/10 border border-rose-500/20 text-[8px] font-black text-rose-400 leading-none">
                                                {label.key}
                                            </div>
                                        ))}
                                        {(!service.labels || service.labels.length === 0) && <span className="text-[8px] italic text-slate-600 leading-none">None</span>}
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    )}
                </div>
            </div>
        </Selectable>
    );
}
