import { KeyValue } from "expanse-docker-lib";
import { Tag } from "lucide-react";
import Selectable from "@/components/playground/node/Selectable";
import useSelectionStore from "@/store/selection";
import { Handle, Position } from "@xyflow/react";
import { cn } from "@/lib/utils";

export default function LabelNode({ data }: { data: { label: KeyValue } }) {
    const { selectedId } = useSelectionStore();
    const isSelected = selectedId === data.label.id;

    return (
        <Selectable id={data.label.id}>
            <div className={cn(
                "group relative transition-all duration-500",
                isSelected
                    ? "p-[1.5px] rounded-xl bg-gradient-to-br from-rose-400 to-pink-600 scale-[1.05] shadow-xl shadow-rose-500/20"
                    : "p-[1px] rounded-xl bg-white/5 hover:bg-white/10 shadow-md"
            )}>
                <div className="bg-gradient-to-br from-rose-500/5 via-pink-500/5 to-red-500/5 backdrop-blur-2xl rounded-[0.65rem] overflow-visible flex items-center gap-3 px-4 py-3 min-w-[180px]">
                    <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-gradient-to-b from-rose-400 to-pink-600 opacity-70 rounded-l-[0.65rem]" />

                    <div className={cn(
                        "w-8 h-8 rounded-lg flex items-center justify-center shrink-0",
                        isSelected ? "bg-rose-500 text-white shadow-[0_0_12px_rgba(244,63,94,0.4)]" : "bg-rose-500/10 text-rose-400"
                    )}>
                        <Tag className="w-4 h-4" />
                    </div>

                    <div className="flex flex-col min-w-0 flex-1">
                        <span className="text-[7px] font-black uppercase tracking-[0.2em] text-slate-600">Metadata</span>
                        <h4 className="font-black text-white tracking-tight truncate uppercase text-sm leading-none mt-0.5 font-mono" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
                            {data.label?.key}
                        </h4>
                    </div>

                    <Handle id='label' type="target" position={Position.Right} isConnectable className="!w-9 !h-3 !rounded-full !bg-rose-500 !border-[#0d1117] !border-2 shadow-[0_0_8px_rgba(244,63,94,0.5)] !-right-1.5 hover:scale-125 transition-transform" />
                </div>
            </div>
        </Selectable>
    );
}