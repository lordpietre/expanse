import useSelectionStore from "@/store/selection";
import { useComposeStore } from "@/store/compose";
import { Network } from "@composecraft/docker-compose-lib";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Toggle } from "@/components/ui/toggle";
import { Unlink, Link, Blocks, Grid2x2, Router, Shield, ShieldOff, Cpu, Globe, GitBranch } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { NetworkDriver } from "@composecraft/docker-compose-lib";
import usePositionMap, { NetworkNodeType, GatewayImpl } from "@/store/metadataMap";

export default function NetowrkEditor() {

    const { selectedId } = useSelectionStore();
    const { compose, setCompose } = useComposeStore();
    const { networkNodeMeta, setNetworkNodeMeta } = usePositionMap();

    function getNetwork(): Network {
        const net = compose.networks.get("id", selectedId)
        if (net) {
            return net
        }
        throw Error(`${selectedId} network is not found`)
    }

    const network = getNetwork();
    const meta = networkNodeMeta.get(network.id) || { type: 'switch' as NetworkNodeType };

    return (
        <form className="flex flex-col gap-6 p-6 bg-gradient-to-br from-emerald-500/10 via-teal-500/10 to-cyan-500/10 backdrop-blur-2xl border border-emerald-500/10 rounded-3xl shadow-2xl animate-in fade-in slide-in-from-right-4 duration-500 text-slate-300">
            <h2 className="text-3xl font-black tracking-tighter text-white flex items-center gap-2 drop-shadow-md">
                <Router className="w-8 h-8 text-orange-500" />
                Network
            </h2>

            {/* ── Node Type Selector ───────────────────────────────────────── */}
            <div className="flex flex-col gap-3 p-4 bg-emerald-500/5 rounded-2xl border border-emerald-500/15">
                <Label className="text-[10px] font-bold uppercase tracking-widest text-emerald-400 flex items-center gap-2">
                    <GitBranch className="w-3.5 h-3.5" />
                    Node Type
                </Label>

                {/* Type radio-style buttons */}
                <div className="grid grid-cols-3 gap-2">
                    {([
                        { value: 'switch', label: 'Switch Virtual', icon: GitBranch, color: 'text-emerald-400', activeBg: 'bg-emerald-500/20 border-emerald-500/40' },
                        { value: 'gateway-l7', label: 'Gateway L7', icon: Globe, color: 'text-emerald-400', activeBg: 'bg-emerald-500/20 border-emerald-500/40' },
                        { value: 'router-l3', label: 'Router L3', icon: Router, color: 'text-amber-400', activeBg: 'bg-amber-500/20 border-amber-500/40' },
                    ] as const).map(({ value, label, icon: Icon, color, activeBg }) => {
                        const isActive = meta.type === value;
                        return (
                            <button
                                key={value}
                                type="button"
                                onClick={() => setNetworkNodeMeta(network.id, { type: value as NetworkNodeType })}
                                className={`flex flex-col items-center gap-1.5 px-2 py-2.5 rounded-xl border transition-all duration-200 cursor-pointer select-none ${isActive ? activeBg : 'bg-white/3 border-white/10 hover:bg-white/6'}`}
                            >
                                <Icon className={`w-4 h-4 ${isActive ? color : 'text-slate-600'}`} />
                                <span className={`text-[7px] font-black uppercase tracking-wider leading-tight text-center ${isActive ? color : 'text-slate-600'}`}>
                                    {label}
                                </span>
                            </button>
                        );
                    })}
                </div>

                {/* Sub-option: nginx / traefik — only when gateway-l7 */}
                {meta.type === 'gateway-l7' && (
                    <div className="flex flex-col gap-2 mt-1">
                        <Label className="text-xs text-slate-400">Gateway Implementation</Label>
                        <div className="grid grid-cols-2 gap-2">
                            {(['nginx', 'traefik'] as GatewayImpl[]).map(impl => {
                                const isActive = (meta.gatewayImpl || 'nginx') === impl;
                                return (
                                    <button
                                        key={impl}
                                        type="button"
                                        onClick={() => setNetworkNodeMeta(network.id, { gatewayImpl: impl })}
                                        className={`py-2 px-3 rounded-xl border transition-all duration-200 cursor-pointer select-none ${isActive ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400' : 'bg-white/3 border-white/10 text-slate-600 hover:bg-white/6'}`}
                                    >
                                        <span className="text-[9px] font-black uppercase tracking-widest">{impl}</span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                )}
            </div>

            <div className="flex flex-col gap-6 w-full">
                <div className="flex flex-col gap-2">
                    <Label className="text-sm font-bold text-slate-400" htmlFor="name">Name</Label>
                    <Input name="name" value={network.name}
                        className="bg-white/5 border-white/10 text-white"
                        onChange={(e) => {
                            setCompose(() => network.name = e.target.value)
                        }}
                    />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="flex flex-col gap-2">
                        <Label className="text-sm font-bold text-slate-400">Driver</Label>
                        <Select value={network.driver || "bridge"} onValueChange={(value) => {
                            setCompose(() => network.driver = value as NetworkDriver)
                        }}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select driver" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="bridge">Bridge</SelectItem>
                                <SelectItem value="host">Host</SelectItem>
                                <SelectItem value="overlay">Overlay</SelectItem>
                                <SelectItem value="ipvlan">IPVLAN</SelectItem>
                                <SelectItem value="macvlan">MACVLAN</SelectItem>
                                <SelectItem value="none">None</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="flex flex-col gap-2">
                        <Label className="text-sm font-bold text-slate-400">Internal</Label>
                        <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <div className="flex">
                                        <Toggle
                                            className="w-full"
                                            pressed={network.internal}
                                            onPressedChange={(pressed) => setCompose(() => network.internal = pressed)}
                                            variant="outline"
                                        >
                                            {network.internal ? <Shield className="w-4 h-4 mr-2 text-rose-500" /> : <ShieldOff className="w-4 h-4 mr-2" />}
                                            {network.internal ? "Isolated" : "Public"}
                                        </Toggle>
                                    </div>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p>If true, restricts external host access</p>
                                </TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                    </div>
                </div>

                <div className="flex flex-col gap-3 p-4 bg-slate-900/50 rounded-2xl border border-white/10">
                    <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">IPAM Configuration</Label>
                    <div className="space-y-3">
                        <div className="flex flex-col gap-1.5">
                            <Label htmlFor="subnet" className="text-xs text-slate-400">Subnet</Label>
                            <Input name="subnet" placeholder="e.g. 172.16.238.0/24" value={network.ipam?.config?.[0]?.subnet || ""}
                                className="bg-white/5 border-white/10 text-white"
                                onChange={(e) => {
                                    setCompose(() => {
                                        if (!network.ipam) network.ipam = { config: [{ subnet: "" }] };
                                        if (!network.ipam.config) network.ipam.config = [{ subnet: "" }];
                                        if (!network.ipam.config[0]) network.ipam.config[0] = { subnet: "" };
                                        network.ipam.config[0].subnet = e.target.value;
                                        if (e.target.value === "") network.ipam = undefined;
                                    })
                                }}
                            />
                        </div>
                        <div className="flex flex-col gap-1.5">
                            <Label htmlFor="gateway" className="text-xs text-slate-400">Gateway</Label>
                            <Input name="gateway" placeholder="e.g. 172.16.238.1" value={network.ipam?.config?.[0]?.gateway || ""}
                                className="bg-white/5 border-white/10 text-white"
                                onChange={(e) => {
                                    setCompose(() => {
                                        if (!network.ipam) network.ipam = { config: [{ subnet: "", gateway: "" }] };
                                        if (!network.ipam.config) network.ipam.config = [{ subnet: "", gateway: "" }];
                                        if (!network.ipam.config[0]) network.ipam.config[0] = { subnet: "", gateway: "" };
                                        network.ipam.config[0].gateway = e.target.value;
                                    })
                                }}
                            />
                        </div>
                    </div>
                </div>
            </div>

            <Separator className="bg-white/10" />

            <div className="flex flex-row gap-3">
                <TooltipProvider>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Toggle variant="outline" pressed={network.attachable} onPressedChange={(pressed) => setCompose(() => { network.attachable = pressed })}>
                                {!network.attachable ? <Unlink /> : <Link />}
                            </Toggle>
                        </TooltipTrigger>
                        <TooltipContent>
                            <p>Current: {network.attachable ? "Attachable" : "Not attachable"}</p>
                        </TooltipContent>
                    </Tooltip>
                </TooltipProvider>
                <TooltipProvider>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Toggle variant="outline" pressed={network.external} onPressedChange={(pressed) => setCompose(() => { network.external = pressed })}>
                                {network.external ? <Blocks /> : <Grid2x2 />}
                            </Toggle>
                        </TooltipTrigger>
                        <TooltipContent>
                            <p>Current: {network.external ? "External" : "Internal"}</p>
                        </TooltipContent>
                    </Tooltip>
                </TooltipProvider>
            </div>

            <Separator className="bg-white/10" />

            <div className="flex flex-col gap-4">
                <p className="font-black text-xs uppercase tracking-[0.2em] text-slate-400 flex items-center gap-2">
                    <Cpu className="w-4 h-4 text-emerald-500" />
                    Interface Mapping
                </p>
                <div className="flex flex-col gap-3">
                    {Array.from(compose.services).filter(s =>
                        Array.from(s.networks).some(n => n.id === network.id)
                    ).length === 0 ? (
                        <p className="text-xs text-slate-500 italic py-4 text-center border-2 border-dashed border-white/10 rounded-3xl">No services linked to this hub.</p>
                    ) : (
                        Array.from(compose.services).filter(s =>
                            Array.from(s.networks).some(n => n.id === network.id)
                        ).map(srv => (
                            <div key={srv.id} className="flex flex-col p-4 rounded-[2rem] border bg-white/5 gap-3 border-white/10 shadow-sm">
                                <div className="flex justify-between items-center">
                                    <div className="flex flex-col">
                                        <span className="font-bold text-white">{srv.name}</span>
                                        <span className="text-[9px] font-bold text-emerald-400 uppercase tracking-widest flex items-center gap-1">
                                            <Globe className="w-3 h-3" /> Linked
                                        </span>
                                    </div>
                                    <div className="flex flex-col items-end gap-1">
                                        <Label className="text-[9px] uppercase font-black text-slate-400">Static IPv4</Label>
                                        <Input
                                            className="h-8 text-xs font-mono w-32 bg-slate-900 border-white/10 text-white"
                                            placeholder="e.g. 172.16.238.2"
                                            value={srv.ipv4_addresses?.[network.name] || ""}
                                            onChange={(e) => {
                                                setCompose(() => {
                                                    if (!srv.ipv4_addresses) srv.ipv4_addresses = {};
                                                    srv.ipv4_addresses[network.name] = e.target.value;
                                                    if (e.target.value === "") delete srv.ipv4_addresses[network.name];
                                                })
                                            }}
                                        />
                                    </div>
                                </div>
                            </div>
                        )
                        ))}
                </div>
            </div>
        </form>
    )
}