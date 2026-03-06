import { getAllMyComposeOrderByEditDate } from "@/actions/userActions";
import { getGlobalDockerStats } from "@/actions/dockerActions";
import { DataTable } from "@/components/display/dataTable";
import { columns } from "@/components/display/composeTable/colums";
import { Separator } from "@/components/ui/separator";
import { Activity, Box, Container, HardDrive, Network, Plus } from "lucide-react";
import Link from "next/link";

export default async function Page() {
    const [composes, globalStats] = await Promise.all([
        getAllMyComposeOrderByEditDate(),
        getGlobalDockerStats()
    ]);

    // Create a mapping of project names to status from Docker
    const projectStatuses: Record<string, string> = {};
    if (globalStats && !globalStats.error && globalStats.projects) {
        globalStats.projects.forEach((proj: any) => {
            if (proj.Name && proj.Status) {
                projectStatuses[proj.Name] = proj.Status;
            }
        });
    }

    // Map the database composes with real-time docker statuses
    const data = composes.map((c) => {
        const projectName = `expanse-project_${c.id}`;
        const status = projectStatuses[projectName] || null;

        const services = c.data?.services || [];
        const serviceNames = Object.keys(services).map(s => {
            const name = services[s].name || s;
            return name.toUpperCase();
        }).join(", ");

        return {
            id: c.id.toString(),
            name: serviceNames || c.data?.name || "Untitled Project",
            createdAt: c.createdAt,
            updatedAt: c.updatedAt,
            status,
            projectName
        };
    });

    return (
        <div className="w-full text-white">
            <div className="flex justify-between items-start mb-12">
                <div className="flex flex-col gap-1 relative">
                    <div className="flex items-center gap-3 relative z-10">
                        <Activity className="w-4 h-4 text-emerald-500 animate-pulse" />
                        <span className="text-[9px] font-black uppercase tracking-[0.4em] text-emerald-500 italic">compose engine</span>
                    </div>
                    <div className="flex items-center gap-3">
                        <h1 className="text-white font-black text-5xl tracking-tighter uppercase relative z-10">
                            Deploys
                        </h1>
                        <Link
                            href="/dashboard/playground"
                            className="flex items-center justify-center w-8 h-8 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-lg transition-all shadow-lg shadow-emerald-500/20 hover:scale-110 active:scale-95 mt-1"
                        >
                            <Plus className="w-5 h-5 stroke-[4]" />
                        </Link>
                    </div>
                </div>
            </div>



            <div className="bg-slate-950/40 backdrop-blur-xl border border-white/5 rounded-[2rem] overflow-hidden shadow-2xl mb-12">
                <DataTable columns={columns} data={data} />
            </div>

            <Separator className="bg-white/10 mb-8" />

            <div className="grid grid-cols-4 gap-4 mb-8">
                <div className="bg-gradient-to-br from-emerald-500/10 via-teal-500/10 to-cyan-500/10 backdrop-blur-md border border-emerald-500/10 rounded-2xl p-5 shadow-xl">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="p-2 bg-emerald-500/20 rounded-lg">
                            <Box className="w-5 h-5 text-emerald-400" />
                        </div>
                        <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Projects</span>
                    </div>
                    <p className="text-3xl font-black text-white">{globalStats?.projects?.length || 0}</p>
                </div>

                <div className="bg-gradient-to-br from-emerald-500/10 via-teal-500/10 to-cyan-500/10 backdrop-blur-md border border-emerald-500/10 rounded-2xl p-5 shadow-xl">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="p-2 bg-emerald-500/20 rounded-lg">
                            <Container className="w-5 h-5 text-emerald-400" />
                        </div>
                        <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Containers</span>
                    </div>
                    <p className="text-3xl font-black text-white">{globalStats?.containers?.length || 0}</p>
                </div>

                <div className="bg-gradient-to-br from-amber-500/10 via-orange-500/10 to-yellow-500/10 backdrop-blur-md border border-amber-500/10 rounded-2xl p-5 shadow-xl">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="p-2 bg-amber-500/20 rounded-lg">
                            <HardDrive className="w-5 h-5 text-amber-400" />
                        </div>
                        <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Volumes</span>
                    </div>
                    <p className="text-3xl font-black text-white">{globalStats?.volumes?.length || 0}</p>
                </div>

                <div className="bg-gradient-to-br from-violet-500/10 via-purple-500/10 to-fuchsia-500/10 backdrop-blur-md border border-violet-500/10 rounded-2xl p-5 shadow-xl">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="p-2 bg-violet-500/20 rounded-lg">
                            <Network className="w-5 h-5 text-violet-400" />
                        </div>
                        <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Networks</span>
                    </div>
                    <p className="text-3xl font-black text-white">{globalStats?.networks?.length || 0}</p>
                </div>
            </div>

        </div>
    );
}