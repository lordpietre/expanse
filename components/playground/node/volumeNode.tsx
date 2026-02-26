import { Binding, Service, Volume } from "@composecraft/docker-compose-lib";
import { HardDrive } from "lucide-react";
import Selectable from "@/components/playground/node/Selectable";
import useSelectionStore from "@/store/selection";
import { Handle, Position } from "@xyflow/react";
import { cn } from "@/lib/utils";
import { useComposeStore } from "@/store/compose";

export default function VolumeNode({ data }: { data: { volume: Volume } }) {
    const { compose, tick } = useComposeStore();
    const { selectedId } = useSelectionStore();
    const isSelected = selectedId === data.volume.id;

    // Listen to tick to compel re-renders on edge additions
    const connectedServices = Array.from(compose.services || []).filter((service: Service) =>
        Array.from(service.bindings || []).some((binding: Binding) =>
            // Binding source can be a string or a Volume reference
            (Object.prototype.hasOwnProperty.call(binding.source, "id")
                ? (binding.source as Volume).id
                : binding.source) === data.volume.id
        )
    );

    const isExpanded = connectedServices.length > 0;

    return (
        <Selectable id={data.volume.id}>
            <div className={cn(
                "group relative transition-all duration-500",
                isSelected
                    ? "p-[1.5px] rounded-xl bg-gradient-to-br from-amber-400 to-orange-600 scale-[1.05] shadow-xl shadow-amber-500/20"
                    : "p-[1px] rounded-xl bg-white/5 hover:bg-white/10 shadow-md"
            )}>
                <div className="bg-gradient-to-br from-amber-500/5 via-orange-500/5 to-yellow-500/5 backdrop-blur-2xl rounded-[0.65rem] overflow-visible flex flex-col w-[120px]">
                    {/* Header */}
                    <div className="flex items-center gap-2.5 px-3 py-2 relative border-b border-white/5">
                        <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-gradient-to-b from-amber-400 to-orange-600 opacity-70 rounded-tl-[0.65rem]" />
                        <div className={cn(
                            "w-8 h-8 rounded-lg flex items-center justify-center shrink-0 z-10",
                            isSelected ? "bg-amber-500 text-white shadow-[0_0_12px_rgba(245,158,11,0.4)]" : "bg-amber-500/10 text-amber-400"
                        )}>
                            <HardDrive className="w-4 h-4" />
                        </div>
                        <div className="flex flex-col min-w-0 flex-1 z-10">
                            <span className="text-[7px] font-black uppercase tracking-[0.2em] text-slate-600">Persistence</span>
                            <h4 className="font-black text-white tracking-tight truncate uppercase text-sm leading-none mt-0.5" style={{ fontFamily: 'Outfit, sans-serif' }}>
                                {data.volume?.name}
                            </h4>
                        </div>

                        {/* Connectors anchored to header when collapsed */}
                        {!isExpanded && (
                            <>
                                <Handle
                                    id='volume-target'
                                    type="target"
                                    position={Position.Left}
                                    isConnectable
                                    className="!w-4 !h-4 !rounded-full !bg-amber-500 !border-[#0d1117] !border-2 shadow-[0_0_8px_rgba(245,158,11,0.5)] !-left-3.5 hover:scale-125 transition-transform !z-50 !opacity-100 !visible cursor-pointer"
                                />
                                <Handle
                                    id='volume'
                                    type="source"
                                    position={Position.Right}
                                    isConnectable
                                    className="!w-4 !h-4 !rounded-full !bg-amber-500 !border-[#0d1117] !border-2 shadow-[0_0_8px_rgba(245,158,11,0.5)] !-right-3.5 hover:scale-125 transition-transform !z-50 !opacity-100 !visible cursor-pointer"
                                />
                            </>
                        )}
                    </div>

                    {/* Connected Services — expanded section */}
                    {isExpanded && (
                        <div className="relative px-3 py-1.5 flex flex-col gap-1 bg-white/5 rounded-b-[0.65rem]">
                            <span className="text-[7px] font-black uppercase tracking-[0.2em] text-slate-500 leading-none">Mounted by</span>
                            <div className="flex flex-wrap gap-1 mt-0.5">
                                {connectedServices.map(service => (
                                    <div key={service.id} className="text-[8px] font-black px-1.5 py-0.5 rounded bg-amber-500/10 border border-amber-500/20 text-amber-400 uppercase tracking-widest">
                                        {service.name}
                                    </div>
                                ))}
                            </div>

                            {/* Connectors anchored to the expanded section */}
                            <Handle
                                id='volume-target'
                                type="target"
                                position={Position.Left}
                                isConnectable
                                className="!w-4 !h-4 !rounded-full !bg-amber-500 !border-[#0d1117] !border-2 shadow-[0_0_8px_rgba(245,158,11,0.5)] !-left-3.5 hover:scale-125 transition-transform !z-50 !opacity-100 !visible cursor-pointer"
                            />
                            <Handle
                                id='volume'
                                type="source"
                                position={Position.Right}
                                isConnectable
                                className="!w-4 !h-4 !rounded-full !bg-amber-500 !border-[#0d1117] !border-2 shadow-[0_0_8px_rgba(245,158,11,0.5)] !-right-3.5 hover:scale-125 transition-transform !z-50 !opacity-100 !visible cursor-pointer"
                            />
                        </div>
                    )}
                </div>
            </div>
        </Selectable>
    );
}