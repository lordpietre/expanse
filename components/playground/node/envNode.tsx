import { Env } from "@composecraft/docker-compose-lib";
import { Key, Fingerprint } from "lucide-react";
import Selectable from "@/components/playground/node/Selectable";
import { Handle, Position } from "@xyflow/react";
import { cn } from "@/lib/utils";
import { useComposeStore } from "@/store/compose";
import useSelectionStore from "@/store/selection";

export default function EnvNode({ data, selected }: { data: { env: Env }, selected?: boolean }) {
    const env = data.env;

    const { compose, tick } = useComposeStore();
    const { selectedId } = useSelectionStore();
    const isSelected = selectedId === data.env.id;

    return (
        <Selectable id={env.id}>
            <div className={cn(
                "group relative transition-all duration-500",
                selected
                    ? "p-[1.5px] rounded-xl bg-gradient-to-br from-violet-400 to-fuchsia-600 scale-[1.05] shadow-xl shadow-violet-500/25"
                    : "p-[1px] rounded-xl bg-white/5 hover:bg-white/10 shadow-md"
            )}>
                <div className="bg-[#0d1117]/90 backdrop-blur-2xl rounded-[0.65rem] overflow-visible flex items-center gap-3 px-4 py-3 min-w-[180px]">
                    <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-gradient-to-b from-violet-400 to-fuchsia-600 opacity-70 rounded-l-[0.65rem]" />

                    <div className={cn(
                        "w-8 h-8 rounded-lg flex items-center justify-center shrink-0 relative",
                        selected ? "bg-violet-600 text-white shadow-[0_0_12px_rgba(139,92,246,0.4)]" : "bg-violet-500/10 text-violet-400"
                    )}>
                        <Key className="w-4 h-4" />
                        {selected && <Fingerprint className="absolute -bottom-1 -right-1 w-3 h-3 text-fuchsia-400 animate-pulse" />}
                    </div>

                    <div className="flex flex-col min-w-0 flex-1">
                        <span className="text-[7px] font-black uppercase tracking-[0.2em] text-slate-600">Security Key</span>
                        <h4 className="font-black text-white tracking-tight truncate uppercase text-sm leading-none mt-0.5 font-mono" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
                            {env.key || "UNSET"}
                        </h4>
                    </div>

                    <Handle id='env' type="target" position={Position.Right} isConnectable className="!w-9 !h-3 !rounded-full !bg-violet-500 !border-[#0d1117] !border-2 shadow-[0_0_8px_rgba(139,92,246,0.5)] !-right-1.5 hover:scale-125 transition-transform" />
                </div>
            </div>
        </Selectable>
    );
}