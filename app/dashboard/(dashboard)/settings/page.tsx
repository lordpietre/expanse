import { getMyInfos } from "@/actions/userActions";
import Settings from "@/components/display/settings";
import { Activity } from "lucide-react";

export default async function Page() {
    const myInfos = await getMyInfos();

    return (
        <div className="w-full">
            <div className="flex justify-between items-start mb-12">
                <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-3">
                        <Activity className="w-5 h-5 text-purple-400 animate-pulse" />
                        <span className="text-[10px] font-black uppercase tracking-[0.4em] text-purple-400 italic">configuration</span>
                    </div>
                    <h1 className="text-slate-900 font-black text-5xl tracking-tighter uppercase">
                        Settings
                    </h1>
                </div>
            </div>

            <div className="bg-white/50 backdrop-blur-sm shadow-xl shadow-slate-200/50 rounded-3xl border border-slate-100 p-8 overflow-hidden">
                <Settings init={myInfos} />
            </div>
        </div>
    );
}