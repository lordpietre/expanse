"use client"

import React, { useEffect, useState, useCallback } from "react";
import { getAllMyComposeOrderByEditDate } from "@/actions/userActions";
import { getGlobalDockerStats } from "@/actions/dockerActions";
import { DataTable } from "@/components/display/dataTable";
import { columns } from "@/components/display/composeTable/colums";
import { Separator } from "@/components/ui/separator";
import { Activity, Plus } from "lucide-react";
import Link from "next/link";
import ProjectMonitor from "@/components/display/projectMonitor";

export default function Page() {
    const [composes, setComposes] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedProject, setSelectedProject] = useState<any>(null);

    const fetchData = useCallback(async () => {
        const [composesData, globalStats] = await Promise.all([
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
        const data = composesData.map((c) => {
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

        setComposes(data);
        setLoading(false);
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

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
                <DataTable
                    columns={columns}
                    data={composes}
                    onRowClick={(row) => setSelectedProject(row)}
                    selectedRowId={selectedProject?.id}
                />
            </div>

            {selectedProject && (
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <Separator className="bg-white/10 mb-8" />
                    <ProjectMonitor
                        project={selectedProject}
                        onClose={() => setSelectedProject(null)}
                        onRefresh={fetchData}
                    />
                </div>
            )}
        </div>
    );
}