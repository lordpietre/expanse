import { getAllMyComposeOrderByEditDate } from "@/actions/userActions";
import { getGlobalDockerStats } from "@/actions/dockerActions";
import { DataTable } from "@/components/display/dataTable";
import { columns } from "@/components/display/composeTable/colums";
import { Separator } from "@/components/ui/separator";
import FirstCompose from "@/components/ui/fisrtCompose";
import BetaWarning from "@/components/ui/betaWarning";
import { Activity, Box, Container, HardDrive, Network } from "lucide-react";

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

        return {
            id: c.id.toString(),
            name: c.data?.name,
            createdAt: c.createdAt,
            updatedAt: c.updatedAt,
            status,
            projectName
        };
    });

    return (
        <div className="w-full text-white">
            <div className="flex justify-between items-start mb-12">
                <div className="flex flex-col gap-2 relative">
                    <div className="absolute -left-10 -top-10 w-32 h-32 bg-emerald-500/20 blur-3xl rounded-full pointer-events-none" />
                    <div className="flex items-center gap-3 relative z-10">
                        <Activity className="w-5 h-5 text-emerald-400 animate-pulse" />
                        <span className="text-[10px] font-black uppercase tracking-[0.4em] text-emerald-400 italic">compose engine</span>
                    </div>
                    <h1 className="text-white font-black text-5xl tracking-tighter uppercase relative z-10">
                        Deploys
                    </h1>
                </div>
            </div>



            {
                composes.length > 0 ? (
                    <div className="bg-gradient-to-br from-emerald-500/10 via-teal-500/10 to-cyan-500/10 backdrop-blur-md shadow-2xl shadow-black/50 rounded-3xl border border-emerald-500/10 overflow-hidden mb-12 relative group">
                        <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 via-transparent to-transparent opacity-50 group-hover:opacity-100 transition-opacity duration-500" />
                        <div className="relative z-10">
                            <DataTable columns={columns} data={data} />
                        </div>
                    </div>
                ) : (
                    <div className="mb-12">
                        <FirstCompose />
                    </div>
                )
            }

            <Separator className="bg-white/10 mb-8" />

            <div className="grid grid-cols-4 gap-4 mb-8">
                <div className="bg-gradient-to-br from-emerald-500/10 via-teal-500/10 to-cyan-500/10 backdrop-blur-md border border-emerald-500/10 rounded-2xl p-5 shadow-xl">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="p-2 bg-emerald-500/20 rounded-lg">
                            <Box className="w-5 h-5 text-emerald-400" />
                        </div>
                        <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Proyectos</span>
                    </div>
                    <p className="text-3xl font-black text-white">{globalStats?.projects?.length || 0}</p>
                </div>

                <div className="bg-gradient-to-br from-emerald-500/10 via-teal-500/10 to-cyan-500/10 backdrop-blur-md border border-emerald-500/10 rounded-2xl p-5 shadow-xl">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="p-2 bg-emerald-500/20 rounded-lg">
                            <Container className="w-5 h-5 text-emerald-400" />
                        </div>
                        <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Contenedores</span>
                    </div>
                    <p className="text-3xl font-black text-white">{globalStats?.containers?.length || 0}</p>
                </div>

                <div className="bg-gradient-to-br from-amber-500/10 via-orange-500/10 to-yellow-500/10 backdrop-blur-md border border-amber-500/10 rounded-2xl p-5 shadow-xl">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="p-2 bg-amber-500/20 rounded-lg">
                            <HardDrive className="w-5 h-5 text-amber-400" />
                        </div>
                        <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Volúmenes</span>
                    </div>
                    <p className="text-3xl font-black text-white">{globalStats?.volumes?.length || 0}</p>
                </div>

                <div className="bg-gradient-to-br from-violet-500/10 via-purple-500/10 to-fuchsia-500/10 backdrop-blur-md border border-violet-500/10 rounded-2xl p-5 shadow-xl">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="p-2 bg-violet-500/20 rounded-lg">
                            <Network className="w-5 h-5 text-violet-400" />
                        </div>
                        <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Redes</span>
                    </div>
                    <p className="text-3xl font-black text-white">{globalStats?.networks?.length || 0}</p>
                </div>
            </div>

        </div>
    );
}