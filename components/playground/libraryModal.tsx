"use client"

import React, { useState } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription
} from "@/components/ui/dialog";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { libraryServices } from "@/lib/library_data";
import { useComposeStore } from "@/store/compose";
import useUIStore from "@/store/ui";
import { Plus, Database, Globe, Zap, MessageSquare, Box, Search, ChevronRight, LayoutGrid } from "lucide-react";
import { cn } from "@/lib/utils";

interface LibraryModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

const categoryIcons = {
    'Database': <Database className="w-4 h-4" />,
    'Web Server': <Globe className="w-4 h-4" />,
    'Cache': <Zap className="w-4 h-4" />,
    'Queue': <MessageSquare className="w-4 h-4" />,
    'Applications': <LayoutGrid className="w-4 h-4" />,
    'Other': <Box className="w-4 h-4" />
};

export default function LibraryModal({ open, onOpenChange }: LibraryModalProps) {
    const { addServiceFromTemplate } = useComposeStore();
    const { libraryCategory, setIsLibraryOpen } = useUIStore();
    const categories = Array.from(new Set(libraryServices.map(s => s.category)));
    const [activeCategory, setActiveCategory] = useState(categories[0]);
    const [searchQuery, setSearchQuery] = useState("");

    // Sync active category if the library overrides it
    React.useEffect(() => {
        if (open && libraryCategory && categories.includes(libraryCategory as any)) {
            setActiveCategory(libraryCategory as any);
        }
    }, [open, libraryCategory]);

    const handleOpenChange = (newOpen: boolean) => {
        onOpenChange(newOpen);
        if (!newOpen) {
            setIsLibraryOpen(false, undefined); // clear override when closed
        }
    };

    const handleAdd = async (service: any) => {
        await addServiceFromTemplate(service);
        onOpenChange(false);
    };

    const filteredServices = libraryServices.filter(s => {
        const matchesCategory = s.category === activeCategory;
        const matchesSearch = s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            s.description?.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesCategory && matchesSearch;
    });

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogContent className="max-w-5xl h-[85vh] p-0 gap-0 overflow-hidden flex flex-col bg-[#0d1117] border-white/10 text-slate-300">
                <DialogHeader className="p-6 border-b border-white/10 bg-[#0a0d14]">
                    <div className="flex items-center justify-between">
                        <DialogTitle className="text-2xl font-bold flex items-center gap-3 text-white">
                            <div className="p-2 bg-blue-600 rounded-lg text-white">
                                <Box className="w-6 h-6" />
                            </div>
                            Service Library
                        </DialogTitle>
                        <DialogDescription className="sr-only">Browse and add services to your compose deployment</DialogDescription>
                        <div className="relative w-64">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <Input
                                placeholder="Search services..."
                                className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-slate-500"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                    </div>
                </DialogHeader>

                <div className="flex flex-1 overflow-hidden">
                    {/* Sidebar */}
                    <aside className="w-64 border-r border-white/5 bg-white/5 p-4 space-y-1 overflow-y-auto">
                        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4 px-2">Categories</p>
                        {categories.map(cat => (
                            <button
                                key={cat}
                                onClick={() => setActiveCategory(cat)}
                                className={cn(
                                    "w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-all group",
                                    activeCategory === cat
                                        ? "bg-blue-600 text-white shadow-md shadow-blue-500/20"
                                        : "text-slate-400 hover:bg-white/10 hover:text-white"
                                )}
                            >
                                <div className="flex items-center gap-3">
                                    <span className={cn(
                                        activeCategory === cat ? "text-white" : "text-slate-500 group-hover:text-blue-400"
                                    )}>
                                        {categoryIcons[cat as keyof typeof categoryIcons]}
                                    </span>
                                    {cat}
                                </div>
                                <ChevronRight className={cn(
                                    "w-4 h-4 transition-transform",
                                    activeCategory === cat ? "opacity-100" : "opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0"
                                )} />
                            </button>
                        ))}
                    </aside>

                    {/* Content */}
                    <main className="flex-1 p-6 overflow-y-auto bg-[#0d1117] custom-scrollbar">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {filteredServices.length > 0 ? (
                                filteredServices.map(service => (
                                    <Card key={service.name} className="flex flex-col bg-white/5 border-white/10 hover:border-blue-500/50 hover:bg-white/10 transition-all duration-300 group shadow-none">
                                        <CardHeader className="pb-3 border-none">
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <CardTitle className="text-xl font-bold group-hover:text-blue-400 text-white transition-colors">
                                                        {service.name}
                                                    </CardTitle>
                                                    <CardDescription className="font-mono text-xs mt-1 text-slate-400">
                                                        {service.image}
                                                    </CardDescription>
                                                </div>
                                                <div className="p-2 bg-slate-900 rounded-md text-slate-400 border border-white/10">
                                                    {categoryIcons[service.category as keyof typeof categoryIcons]}
                                                </div>
                                            </div>
                                        </CardHeader>
                                        <CardContent className="flex-grow pb-4 border-none">
                                            <p className="text-sm text-slate-400 leading-relaxed">
                                                {service.description}
                                            </p>
                                        </CardContent>
                                        <CardFooter className="pt-0 border-none">
                                            <Button
                                                onClick={() => handleAdd(service)}
                                                className="w-full bg-blue-600 hover:bg-blue-700 text-white flex gap-2 transition-colors py-6 shadow-lg shadow-blue-500/20"
                                            >
                                                <Plus className="w-5 h-5" />
                                                Add to Compose
                                            </Button>
                                        </CardFooter>
                                    </Card>
                                ))
                            ) : (
                                <div className="col-span-full py-20 flex flex-col items-center justify-center text-slate-500 gap-4">
                                    <Search className="w-12 h-12 stroke-1" />
                                    <p className="text-lg">No services found in this category</p>
                                </div>
                            )}
                        </div>
                    </main>
                </div>
            </DialogContent>
        </Dialog>
    );
}
