import { getAllMyComposeOrderByEditDate } from "@/actions/userActions";
import { getGlobalDockerStats } from "@/actions/dockerActions";
import { DataTable } from "@/components/display/dataTable";
import { columns } from "@/components/display/composeTable/colums";
import { Separator } from "@/components/ui/separator";
import discordLogo from "@/assets/discord-logo-white.svg"
import Image from "next/image";
import FirstCompose from "@/components/ui/fisrtCompose";
import BetaWarning from "@/components/ui/betaWarning";
import { Activity } from "lucide-react";

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
                    <div className="absolute -left-10 -top-10 w-32 h-32 bg-blue-500/20 blur-3xl rounded-full pointer-events-none" />
                    <div className="flex items-center gap-3 relative z-10">
                        <Activity className="w-5 h-5 text-blue-400 animate-pulse" />
                        <span className="text-[10px] font-black uppercase tracking-[0.4em] text-blue-400 italic">compose engine</span>
                    </div>
                    <h1 className="text-white font-black text-5xl tracking-tighter uppercase relative z-10">
                        Deploys
                    </h1>
                </div>
            </div>



            {
                composes.length > 0 ? (
                    <div className="bg-[#0a0d14]/80 backdrop-blur-md shadow-2xl shadow-black/50 rounded-3xl border border-white/10 overflow-hidden mb-12 relative group">
                        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-transparent to-transparent opacity-50 group-hover:opacity-100 transition-opacity duration-500" />
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

            <Separator className="bg-white/10" />

            <div className="mt-8 flex flex-col gap-4">
                <p className="text-[10px] font-black uppercase text-slate-500 tracking-[0.2em] italic">Join Us</p>
                <div className="flex flex-row">
                    <a className="bg-[#0d1117] border border-white/10 w-40 h-12 flex justify-center items-center rounded-xl p-3 cursor-pointer hover:w-44 hover:bg-white/5 shadow-xl shadow-black/40 transition-all group" href="https://discord.gg/GBxRWQa6Dw" target="_blank">
                        <Image className="h-6 object-contain group-hover:scale-110 transition-transform opacity-70 group-hover:opacity-100" src={discordLogo} alt="join us on discord" />
                    </a>
                </div>
            </div>
        </div>
    );
}