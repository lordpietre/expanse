import { getAllMyShares } from "@/actions/composeActions";
import { DataTable } from "@/components/display/dataTable";
import { columns } from "@/components/display/shareTable/colums";
import FirstCompose from "@/components/ui/fisrtCompose";
import { Activity } from "lucide-react";

export default async function Page() {

    const myShares = await getAllMyShares();

    return (
        <div className="w-full">
            <div className="flex justify-between items-start mb-6">
                <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-3">
                        <Activity className="w-5 h-5 text-emerald-400 animate-pulse" />
                        <span className="text-[10px] font-black uppercase tracking-[0.4em] text-emerald-400 italic">collaboration</span>
                    </div>
                    <h1 className="text-white font-black text-4xl tracking-tighter uppercase">
                        My Shares
                    </h1>
                </div>
            </div>

            {
                myShares.length > 0 ? (
                    <div className="bg-gradient-to-br from-emerald-500/10 via-teal-500/10 to-cyan-500/10 backdrop-blur-sm shadow-xl rounded-2xl border border-emerald-500/10 overflow-hidden mb-6">
                        <DataTable columns={columns} data={myShares.map((s) => ({
                            id: s._id.toString(),
                            composeName: s?.name,
                            createdAt: s?.createdAt,
                            link: `${process.env.URL}/share?id=${s._id.toString()}&name=${s?.name}`
                        }))} />
                    </div>
                ) : (
                    <div className="mb-6">
                        <FirstCompose />
                    </div>
                )
            }
        </div>
    )
}