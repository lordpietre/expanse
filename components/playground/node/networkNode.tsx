import { Network as NetworkType } from "@composecraft/docker-compose-lib";
import { Handle, Position, useEdges } from "@xyflow/react";
import { CardContent } from "@/components/ui/card";
import { Globe, Activity, Signal, Link, Router, Zap, GitBranch, Shield } from "lucide-react";
import { useComposeStore } from "@/store/compose";
import { useExecutionStore } from "@/store/execution";
import { cn } from "@/lib/utils";
import Selectable from "@/components/playground/node/Selectable";
import { useMemo } from "react";
import usePositionMap, { NetworkNodeType, GatewayImpl } from "@/store/metadataMap";

// ─── Node type config ─────────────────────────────────────────────────────────
type NodeTypeMeta = {
    label: string;
    subLabel?: string;
    Icon: React.ElementType;
    badgeBg: string;
    badgeText: string;
    glowColor: string;
    gradient: string;
};

function getNodeTypeMeta(type: NetworkNodeType, gatewayImpl?: GatewayImpl): NodeTypeMeta {
    switch (type) {
        case 'gateway-l7':
            return {
                label: 'Gateway',
                subLabel: gatewayImpl === 'traefik' ? 'Traefik' : 'Nginx',
                Icon: Globe,
                badgeBg: 'bg-emerald-500/15 border-emerald-500/25',
                badgeText: 'text-emerald-400',
                glowColor: 'rgba(16,185,129,0.5)',
                gradient: 'from-emerald-400 via-teal-500 to-cyan-600',
            };
        case 'router-l3':
            return {
                label: 'Router L3',
                Icon: Router,
                badgeBg: 'bg-amber-500/15 border-amber-500/25',
                badgeText: 'text-amber-400',
                glowColor: 'rgba(245,158,11,0.5)',
                gradient: 'from-amber-400 via-orange-500 to-red-500',
            };
        case 'switch':
        default:
            return {
                label: 'Switch',
                Icon: GitBranch,
                badgeBg: 'bg-blue-500/15 border-blue-500/25',
                badgeText: 'text-blue-400',
                glowColor: 'rgba(59,130,246,0.5)',
                gradient: 'from-blue-400 via-indigo-500 to-purple-600',
            };
    }
}

export default function NetworkNode({ data, selected }: { data: { network: NetworkType }, selected?: boolean }) {
    const { compose, tick } = useComposeStore();
    const { serviceStatuses } = useExecutionStore();
    const { networkNodeMeta } = usePositionMap();
    const edges = useEdges();

    const subnet = data.network.ipam?.config?.[0]?.subnet;
    const explicitGateway = data.network.ipam?.config?.[0]?.gateway;
    const gatewayIp = explicitGateway || (subnet ? subnet.split('/')[0].split('.').slice(0, 3).join('.') + '.1' : null);

    const meta = networkNodeMeta.get(data.network.id) || { type: 'switch' as NetworkNodeType };
    const typeMeta = getNodeTypeMeta(meta.type, meta.gatewayImpl);
    const NodeIcon = typeMeta.Icon;

    const portConnections = useMemo(() => {
        const connections: Record<string, boolean> = {};
        for (let i = 1; i <= 7; i++) {
            const portId = `port-${i}`;
            connections[portId] = edges.some(edge => edge.target === data.network.id && edge.targetHandle === portId);
        }
        return connections;
    }, [edges, data.network.id]);

    const connectedServices = Array.from(compose.services || []).filter(service =>
        Array.from(service.networks || []).some(net => net.name === data.network.name)
    );

    const activeCount = connectedServices.filter(s => serviceStatuses[s.name]?.status === 'running').length;
    const isHostMode = data.network.driver === 'host';

    return (
        <Selectable id={data.network.id}>
            <div className={cn(
                "group relative flex flex-col transition-all duration-500 overflow-visible",
                selected
                    ? `p-[1.5px] rounded-xl bg-gradient-to-br ${typeMeta.gradient} scale-[1.03] z-50 shadow-xl`
                    : "p-[1px] rounded-xl bg-white/5 hover:bg-white/10 shadow-lg"
            )}>
                <div className="bg-[#0d1117]/95 backdrop-blur-3xl rounded-[0.7rem] overflow-visible flex flex-col min-w-[260px]">

                    {/* Header — dark chassis */}
                    <div className="px-5 py-3 flex items-center justify-between relative overflow-hidden bg-slate-950 rounded-t-[0.7rem]">
                        <div className="absolute inset-0 opacity-5 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]" />
                        <div className={cn("absolute -right-10 -top-10 w-32 h-32 rounded-full blur-[60px] animate-pulse opacity-15")}
                            style={{ background: typeMeta.glowColor }} />

                        <div className="flex flex-col z-10 gap-1 min-w-0">
                            <div className="flex items-center gap-2">
                                <div className="w-5 h-0.5 bg-blue-500 rounded-full shadow-[0_0_6px_rgba(59,130,246,0.9)]" />
                                <span className={cn("text-[8px] font-black uppercase tracking-[0.35em]", typeMeta.badgeText)}>
                                    {typeMeta.label}{typeMeta.subLabel ? ` · ${typeMeta.subLabel}` : ''}
                                </span>
                            </div>
                            <h3 className="text-white font-black text-lg tracking-tight uppercase truncate max-w-[140px] drop-shadow-lg leading-none" style={{ fontFamily: 'Outfit, sans-serif' }}>
                                {data.network.name}
                            </h3>
                            <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                                {/* Network type badge */}
                                <div className={cn("px-1.5 py-0.5 rounded border text-[7px] font-black uppercase tracking-widest", typeMeta.badgeBg, typeMeta.badgeText)}>
                                    {meta.type === 'switch' ? 'Switch Virtual' : meta.type === 'gateway-l7' ? `L7 · ${meta.gatewayImpl || 'nginx'}` : 'Router L3'}
                                </div>
                                {/* Driver badge */}
                                <div className="px-1.5 py-0.5 rounded bg-blue-500/15 border border-blue-500/25 text-[7px] font-black text-blue-400 uppercase tracking-widest">
                                    {data.network.driver?.toUpperCase() || "BRIDGE"}
                                </div>
                            </div>
                        </div>

                        <div className="relative z-10 shrink-0 ml-3">
                            <div className="bg-slate-900 shadow-inner p-3 rounded-xl border border-white/5 flex items-center justify-center group-hover:rotate-12 transition-transform duration-700">
                                {isHostMode
                                    ? <Zap className="w-7 h-7 text-amber-400 drop-shadow-[0_0_12px_rgba(245,158,11,0.5)]" />
                                    : <NodeIcon className={cn("w-7 h-7 drop-shadow", typeMeta.badgeText)} style={{ filter: `drop-shadow(0 0 10px ${typeMeta.glowColor})` }} />
                                }
                            </div>
                        </div>
                    </div>

                    <CardContent className="p-0">
                        {/* 7-Port Panel */}
                        <div className="bg-slate-950 px-4 py-2 border-y border-white/5">
                            <span className="text-[7px] font-black text-slate-600 uppercase tracking-[0.2em] leading-none mb-1 block">Ethernet Ports</span>
                            <div className="flex items-center justify-between gap-1 mt-1">
                                {[1, 2, 3, 4, 5, 6, 7].map((num) => {
                                    const portId = `port-${num}`;
                                    const isConnected = portConnections[portId];
                                    return (
                                        <div key={num} className="flex flex-col items-center gap-1">
                                            {/* LED */}
                                            <div className={cn(
                                                "w-1.5 h-1.5 rounded-full transition-all duration-500",
                                                isConnected
                                                    ? "bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,1)] scale-110"
                                                    : "bg-slate-800"
                                            )} />
                                            {/* Socket */}
                                            <div className={cn(
                                                "relative w-7 h-7 rounded-lg flex items-center justify-center border transition-all duration-500",
                                                isConnected
                                                    ? "bg-slate-800 border-emerald-500/40 shadow-[0_0_12px_rgba(52,211,153,0.12)]"
                                                    : "bg-black border-slate-800 hover:border-slate-600"
                                            )}>
                                                <div className="w-4 h-2 bg-slate-900 rounded-sm border border-white/5" />
                                                <span className="absolute -bottom-3.5 text-[6px] font-bold text-slate-600">{num}</span>
                                                <Handle
                                                    id={portId}
                                                    type="target"
                                                    position={Position.Bottom}
                                                    className="!w-4 !h-4 !-bottom-5 !bg-transparent !border-none !z-[9999] cursor-pointer"
                                                />
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Stats & Services */}
                        <div className="p-3 space-y-2 bg-[#0d1117]/90">
                            {/* Stats row */}
                            <div className="flex items-center justify-between bg-white/3 border border-white/5 rounded-lg px-2 py-1.5 gap-2">
                                <div className="flex items-center gap-2">
                                    <div className="w-6 h-6 rounded-md bg-blue-500/10 flex items-center justify-center">
                                        {isHostMode ? <Zap className="w-3.5 h-3.5 text-amber-400" /> : <Globe className="w-3.5 h-3.5 text-blue-400" />}
                                    </div>
                                    <div>
                                        <div className="text-[7px] font-black text-slate-600 uppercase tracking-widest">
                                            {isHostMode ? "Host Bridge" : "Gateway"}
                                        </div>
                                        <div className="font-mono text-[10px] font-bold text-slate-300">
                                            {isHostMode ? "Direct" : (gatewayIp || 'Auto...')}
                                        </div>
                                    </div>
                                </div>
                                <div className="w-px h-5 bg-white/5" />
                                <div className="flex items-center gap-1.5">
                                    <div className="w-6 h-6 rounded-md bg-emerald-500/10 flex items-center justify-center">
                                        <Activity className="w-3.5 h-3.5 text-emerald-400" />
                                    </div>
                                    <div>
                                        <div className="text-[7px] font-black text-slate-600 uppercase tracking-widest">Hub Load</div>
                                        <div className="font-mono text-[10px] font-bold text-emerald-400">
                                            {activeCount}/{connectedServices.length} Srv
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Services list */}
                            <div>
                                <div className="flex items-center gap-1.5 mb-2">
                                    <Link className="w-3 h-3 text-blue-400" />
                                    <span className="text-[8px] font-black uppercase text-slate-500 tracking-wider">Interface Discovery</span>
                                </div>
                                {connectedServices.length > 0 ? (
                                    <div className="grid grid-cols-2 gap-1.5">
                                        {connectedServices.map(service => {
                                            const isRunning = serviceStatuses[service.name]?.status === 'running';
                                            return (
                                                <div key={service.id} className={cn(
                                                    "flex items-center justify-between px-2.5 py-2 rounded-lg border transition-all duration-300",
                                                    isRunning
                                                        ? "bg-emerald-500/8 border-emerald-500/20"
                                                        : "bg-white/3 border-white/5 opacity-50"
                                                )}>
                                                    <span className={cn("text-[8px] font-black uppercase tracking-tight truncate", isRunning ? "text-emerald-400" : "text-slate-500")}>
                                                        {service.name}
                                                    </span>
                                                    <div className={cn("w-1.5 h-1.5 rounded-full ml-1 shrink-0", isRunning ? "bg-emerald-400 shadow-[0_0_6px_rgba(16,185,129,0.8)] animate-pulse" : "bg-slate-700")} />
                                                </div>
                                            );
                                        })}
                                    </div>
                                ) : (
                                    <div className="py-5 rounded-xl border border-dashed border-white/8 flex flex-col items-center justify-center gap-2 bg-white/2">
                                        <Signal className="w-5 h-5 text-slate-700" />
                                        <span className="text-[8px] italic text-slate-600 leading-none">Link a service to port 1–7...</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </CardContent>
                </div>
            </div>
        </Selectable>
    );
}