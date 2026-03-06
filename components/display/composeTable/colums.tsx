"use client"

import { ColumnDef } from "@tanstack/react-table"
import { formatDistanceToNow } from "date-fns";
import { Button } from "@/components/ui/button";
import { ArrowUpDown } from "lucide-react";
import ComposeRow from "@/components/display/composeTable/composeRow";

// This type is used to define the shape of our data.
// You can use a Zod schema here if you want.
export type ComposeLine = {
    id: string
    name: string,
    createdAt: number,
    updatedAt: number,
    status?: string | null,
    projectName?: string
}



export const columns: ColumnDef<ComposeLine>[] = [
    {
        accessorKey: "name",
        header: "Deployment / Services",
        cell: ({ row }) => {
            const name = row.original.name || "Untitled";
            const services = name.split(", ");
            return (
                <div className="flex flex-col gap-1.5 py-1">
                    {services.map((s, i) => (
                        <div key={i} className="flex items-center gap-2 group">
                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500/40 group-hover:bg-emerald-500 transition-colors shrink-0" />
                            <span className="text-[11px] font-black text-white/90 uppercase tracking-tighter leading-none truncate max-w-[200px]">
                                {s}
                            </span>
                        </div>
                    ))}
                </div>
            )
        }
    },
    {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => {
            const status = row.original.status
            if (status) {
                const isRunning = status.includes("running") || status.includes("Up")
                return (
                    <span className={`px-2 py-0.5 rounded-full font-black uppercase tracking-widest text-[9px] border whitespace-nowrap ${isRunning
                        ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                        : "bg-amber-500/10 border-amber-500/20 text-amber-400"
                        }`}>
                        {status}
                    </span>
                )
            }
            return (
                <span className="px-2 py-0.5 rounded-full font-black uppercase tracking-widest text-[9px] border whitespace-nowrap bg-slate-800 border-slate-700 text-slate-500">
                    Inactive
                </span>
            )
        }
    },
    {
        accessorKey: "createdAt",
        header: ({ column }) => {
            return (
                <Button
                    variant="ghost"
                    onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                >
                    Created at
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
            )
        },
        cell: ({ row }) => {
            return (
                formatDistanceToNow(row.getValue("createdAt"), { addSuffix: true })
            )
        }
    },
    {
        accessorKey: "updatedAt",
        header: ({ column }) => {
            return (
                <Button
                    variant="ghost"
                    onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                >
                    Updated at
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
            )
        },
        cell: ({ row }) => {
            return (
                formatDistanceToNow(row.getValue("updatedAt"), { addSuffix: true })
            )
        }
    },
    {
        id: "actions",
        cell: ({ row }) => {
            const data = row.original

            return (
                <ComposeRow {...data} />
            )
        },
    },
]
