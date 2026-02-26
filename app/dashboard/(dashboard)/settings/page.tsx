import { getMyInfos } from "@/actions/userActions";
import Settings from "@/components/display/settings";
import { Activity } from "lucide-react";

export default async function Page() {
    const myInfos = await getMyInfos();

    return (
        <div className="w-full">
            <div className="flex justify-between items-start mb-6">
                <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-3">
                        <Activity className="w-5 h-5 text-emerald-400 animate-pulse" />
                        <span className="text-[10px] font-black uppercase tracking-[0.4em] text-emerald-400 italic">configuration</span>
                    </div>
                    <h1 className="text-white font-black text-4xl tracking-tighter uppercase">
                        Settings
                    </h1>
                </div>
            </div>

            <div className="bg-gradient-to-br from-emerald-500/10 via-teal-500/10 to-cyan-500/10 backdrop-blur-sm shadow-xl rounded-2xl border border-emerald-500/10 p-6 overflow-hidden">
                <Settings init={myInfos} />
            </div>
        </div>
    );
}