import { Binding } from "@composecraft/docker-compose-lib";
import { FolderSync } from "lucide-react";
import Selectable from "@/components/playground/node/Selectable";
import useSelectionStore from "@/store/selection";
import { Handle, Position } from "@xyflow/react";
import { cn } from "@/lib/utils";

export default function BindingNode({ data }: { data: { binding: Binding } }) {
    const { selectedId } = useSelectionStore();
    const isSelected = selectedId === data.binding.id;

    return (
        <Selectable id={data.binding.id}>
            <div className={cn(
                "group relative transition-all duration-500",
                isSelected
                    ? "p-[1.5px] rounded-xl bg-gradient-to-br from-emerald-400 to-teal-600 scale-[1.05] shadow-xl shadow-emerald-500/20"
                    : "p-[1px] rounded-xl bg-white/5 hover:bg-white/10 shadow-md"
            )}>
                <div className="bg-[#0d1117]/90 backdrop-blur-2xl rounded-[0.65rem] overflow-visible flex items-center gap-3 px-4 py-3 min-w-[180px]">
                    <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-gradient-to-b from-emerald-400 to-teal-600 opacity-70 rounded-l-[0.65rem]" />

                    <div className={cn(
                        "w-8 h-8 rounded-lg flex items-center justify-center shrink-0",
                        isSelected ? "bg-emerald-500 text-white shadow-[0_0_12px_rgba(52,211,153,0.4)]" : "bg-emerald-500/10 text-emerald-400"
                    )}>
                        <FolderSync className="w-4 h-4" />
                    </div>

                    <div className="flex flex-col min-w-0 flex-1">
                        <span className="text-[7px] font-black uppercase tracking-[0.2em] text-slate-600">Host Binding</span>
                        <h4 className="font-black text-white tracking-tight truncate text-sm leading-none mt-0.5" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
                            {data.binding?.source?.toString()}
                        </h4>
                    </div>

                    <Handle id='binding' type="source" position={Position.Left} isConnectable className="!w-9 !h-3 !rounded-full !bg-emerald-500 !border-[#0d1117] !border-2 !opacity-0 group-hover:!opacity-100 transition-opacity !-left-1.5" />
                </div>
            </div>
        </Selectable>
    );
}