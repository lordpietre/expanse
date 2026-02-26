"use client"

import { Plus, Rocket } from "lucide-react";

export default function FirstCompose() {
    return (
        <div className="flex flex-col justify-center items-center py-20 animate-in fade-in zoom-in duration-1000">
            <div className="bg-gradient-to-br from-emerald-500/10 via-teal-500/10 to-cyan-500/10 backdrop-blur-xl border border-emerald-500/10 p-8 rounded-[2.5rem] flex flex-col items-center gap-6 shadow-2xl relative overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-teal-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-700" />

                <div className="p-4 bg-emerald-500/10 rounded-2xl relative z-10">
                    <Rocket className="w-10 h-10 text-emerald-400 opacity-50" />
                </div>

                <div className="flex items-center gap-6 relative z-10">
                    <p className="text-3xl font-black text-white uppercase tracking-tighter" style={{ fontFamily: 'Outfit, sans-serif' }}>
                        Deploy
                    </p>

                    <button
                        onClick={() => { window.location.href = "/dashboard/playground" }}
                        className="group/btn relative flex items-center justify-center w-14 h-14 transition-all duration-500 hover:scale-110 active:scale-95"
                    >
                        <div className="absolute inset-0 bg-emerald-500 opacity-20 blur-xl group-hover/btn:opacity-40 transition-opacity" />
                        <div className="relative flex items-center justify-center w-full h-full bg-emerald-500 rounded-2xl border border-white/20 shadow-lg shadow-emerald-500/20 group-hover/btn:bg-emerald-400 transition-colors duration-300">
                            <Plus className="w-7 h-7 text-white stroke-[3px]" />
                        </div>
                    </button>
                </div>

                <div className="mt-4">
                    <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-slate-500">
                        Start your first project
                    </span>
                </div>
            </div>
        </div>
    )
}