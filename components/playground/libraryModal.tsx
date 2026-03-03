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
import { TemplateService } from "@/types/library";
import { useComposeStore } from "@/store/compose";
import useUIStore from "@/store/ui";
import useLibraryStore from "@/store/library";
import { Plus, Database, Globe, Zap, MessageSquare, Box, Search, ChevronRight, LayoutGrid, Loader2, Code2, Monitor, Share2, Cloud, Library, Brain, Workflow, Activity, FileText, Users, Network, Shield } from "lucide-react";
import { cn, resolveLogoPath } from "@/lib/utils";

interface LibraryModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

const categoryIcons = {
    'Database': <Database className="w-4 h-4" />,
    'CMS': <FileText className="w-4 h-4" />,
    'AI': <Brain className="w-4 h-4" />,
    'Automation': <Workflow className="w-4 h-4" />,
    'Social': <Users className="w-4 h-4" />,
    'Web Server': <Globe className="w-4 h-4" />,
    'Monitoring': <Activity className="w-4 h-4" />,
    'Cache': <Zap className="w-4 h-4" />,
    'Queue': <MessageSquare className="w-4 h-4" />,
    'Applications': <LayoutGrid className="w-4 h-4" />,
    'Development': <Code2 className="w-4 h-4" />,
    'OS': <Monitor className="w-4 h-4" />,
    'Network': <Network className="w-4 h-4" />,
    'Cloud': <Cloud className="w-4 h-4" />,
    'Other': <Box className="w-4 h-4" />,
    'Messaging': <MessageSquare className="w-4 h-4" />,
};

export default function LibraryModal({ open, onOpenChange }: LibraryModalProps) {
    const { services, loading, fetchServices } = useLibraryStore();
    const { addServiceFromTemplate } = useComposeStore();
    const { libraryCategory, setIsLibraryOpen } = useUIStore();
    const [libraryMode, setLibraryMode] = useState<'dockers' | 'stacks'>('dockers');
    const [activeCategory, setActiveCategory] = useState<string>("");
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedService, setSelectedService] = useState<TemplateService | null>(null);

    // Filter services based on mode
    const modeFilteredServices = services.filter(s => {
        if (libraryMode === 'stacks') return s.isStack === true && s.category !== 'Database';
        return s.isStack !== true;
    });

    const categories = Array.from(new Set(modeFilteredServices.map(s => s.category)));

    // Initial fetch
    React.useEffect(() => {
        if (open && services.length === 0) {
            fetchServices();
        }
    }, [open, services.length]);

    // Reset selection when mode changes
    React.useEffect(() => {
        if (categories.length > 0) {
            const firstCat = categories[0];
            setActiveCategory(firstCat);
            const firstService = modeFilteredServices.find(s => s.category === firstCat);
            setSelectedService(firstService || null);
        } else {
            setActiveCategory("");
            setSelectedService(null);
        }
    }, [libraryMode, services]);

    // Handle initial selection when services are loaded or libraryCategory changes
    React.useEffect(() => {
        if (modeFilteredServices.length > 0) {
            const currentCats = new Set(modeFilteredServices.map(s => s.category));
            const initialCat = (libraryCategory && currentCats.has(libraryCategory as any))
                ? libraryCategory
                : (categories[0] || "");

            if (initialCat) {
                setActiveCategory(initialCat);
                const firstService = modeFilteredServices.find(s => s.category === initialCat);
                setSelectedService(firstService || null);
            }
        }
    }, [services, libraryCategory]);

    const handleOpenChange = (newOpen: boolean) => {
        onOpenChange(newOpen);
        if (!newOpen) {
            setIsLibraryOpen(false, undefined);
        }
    };

    const handleAdd = async (service: any) => {
        if (!service) return;
        await addServiceFromTemplate(service);
        handleOpenChange(false);
    };

    const filteredServices = modeFilteredServices.filter(s => {
        const matchesCategory = s.category === activeCategory;
        const matchesSearch = s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            s.description?.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesCategory && matchesSearch;
    });

    const categoriesList = categories.map(cat => (
        <button
            key={cat}
            onClick={() => {
                setActiveCategory(cat);
                const first = modeFilteredServices.find(s => s.category === cat);
                setSelectedService(first || null);
            }}
            className={cn(
                "w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-all group",
                activeCategory === cat
                    ? "bg-emerald-500 text-white shadow-md shadow-emerald-500/20"
                    : "text-slate-400 hover:bg-white/10 hover:text-white"
            )}
        >
            <div className="flex items-center gap-3">
                <span className={cn(
                    activeCategory === cat ? "text-white" : "text-slate-500 group-hover:text-emerald-400"
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
    ));

    const servicesSubmenu = filteredServices.map(service => (
        <button
            key={service.name}
            onClick={() => setSelectedService(service)}
            className={cn(
                "w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-all group",
                selectedService?.name === service.name
                    ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                    : "text-slate-400 hover:bg-white/5 hover:text-white border border-transparent"
            )}
        >
            <div className="flex items-center gap-3 overflow-hidden">
                <div className="flex-shrink-0 w-6 h-6 rounded bg-slate-800 flex items-center justify-center overflow-hidden">
                    {service.logo ? (
                        <img src={resolveLogoPath(service.logo) || ''} alt={service.name} className="w-4 h-4 object-contain" />
                    ) : (
                        <span className="text-[10px] text-slate-500 font-bold">
                            {service.name.substring(0, 2).toUpperCase()}
                        </span>
                    )}
                </div>
                <span className="truncate">{service.name}</span>
            </div>
            {selectedService?.name === service.name && <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-sm shadow-emerald-500" />}
        </button>
    ));

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogContent className="max-w-6xl h-[85vh] p-0 gap-0 overflow-hidden flex flex-col bg-gradient-to-br from-emerald-500/5 via-teal-500/5 to-cyan-500/5 border-emerald-500/10 text-slate-300">
                <DialogHeader className="p-6 border-b border-emerald-500/10 bg-gradient-to-r from-emerald-500/5 to-teal-500/5">
                    <div className="flex items-center justify-between">
                        <div className="flex flex-col gap-4">
                            <DialogTitle className="text-2xl font-bold flex items-center gap-3 text-white">
                                <div className="p-2 bg-emerald-500 rounded-lg text-white">
                                    <Box className="w-6 h-6" />
                                </div>
                                Service Library
                            </DialogTitle>

                            <div className="flex bg-slate-900/50 p-1 rounded-xl border border-white/10 w-fit">
                                <button
                                    onClick={() => setLibraryMode('dockers')}
                                    className={cn(
                                        "px-6 py-2 rounded-lg text-sm font-black transition-all",
                                        libraryMode === 'dockers'
                                            ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/20"
                                            : "text-slate-500 hover:text-white"
                                    )}
                                >
                                    DOCKERS
                                </button>
                                <button
                                    onClick={() => setLibraryMode('stacks')}
                                    className={cn(
                                        "px-6 py-2 rounded-lg text-sm font-black transition-all",
                                        libraryMode === 'stacks'
                                            ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/20"
                                            : "text-slate-500 hover:text-white"
                                    )}
                                >
                                    STACKS
                                </button>
                            </div>
                        </div>

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
                    {/* Left Column (Categories) */}
                    <aside className="w-64 border-r border-emerald-500/10 bg-gradient-to-b from-emerald-500/5 to-teal-500/5 p-4 space-y-1 overflow-y-auto">
                        <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-4 px-2">
                            {libraryMode === 'dockers' ? 'Docker Categories' : 'Stack Categories'}
                        </p>
                        <div className="space-y-1">
                            {categoriesList}
                        </div>
                    </aside>

                    {/* Middle Column (Submenu) */}
                    <aside className="w-64 border-r border-emerald-500/10 bg-gradient-to-b from-emerald-5/10 to-teal-500/10 p-4 space-y-1 overflow-y-auto">
                        <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-4 px-2">Services</p>
                        <div className="space-y-1">
                            {servicesSubmenu.length > 0 ? servicesSubmenu : (
                                <p className="text-xs text-slate-600 px-2 italic">
                                    {loading ? "..." : "No results found"}
                                </p>
                            )}
                        </div>
                    </aside>

                    {/* Right Column (Details) */}
                    <main className="flex-1 p-8 overflow-y-auto bg-gradient-to-br from-emerald-500/5 via-teal-500/5 to-cyan-500/5 custom-scrollbar flex items-center justify-center">
                        {loading ? (
                            <div className="flex flex-col items-center gap-4 text-slate-500">
                                <Loader2 className="w-12 h-12 animate-spin text-emerald-500" />
                                <p className="animate-pulse">Loading library...</p>
                            </div>
                        ) : selectedService ? (
                            <div className="max-w-4xl w-full grid grid-cols-1 lg:grid-cols-2 gap-12 items-center animate-in fade-in slide-in-from-bottom-4 duration-500">
                                <div className="space-y-6">
                                    <div className="space-y-2">
                                        <h2 className="text-5xl font-bold text-white tracking-tight">{selectedService.name}</h2>
                                        <p className="font-mono text-emerald-400 text-sm bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20 inline-block">
                                            {selectedService.image}
                                        </p>
                                    </div>
                                    <p className="text-xl text-slate-400 leading-relaxed">
                                        {selectedService.description}
                                    </p>
                                    <div className="pt-4">
                                        <Button
                                            onClick={() => handleAdd(selectedService)}
                                            className="w-full bg-emerald-500 hover:bg-emerald-600 text-white flex gap-3 transition-all py-8 text-xl font-bold shadow-2xl shadow-emerald-500/20 rounded-xl"
                                        >
                                            <Plus className="w-6 h-6" />
                                            Add to Deployment
                                        </Button>
                                    </div>
                                </div>

                                <div className="flex justify-center">
                                    <div className="w-64 h-64 lg:w-80 lg:h-80 rounded-3xl bg-gradient-to-br from-emerald-500/10 via-teal-500/10 to-cyan-500/10 border border-emerald-500/10 flex items-center justify-center p-12 shadow-2xl overflow-hidden relative group">
                                        <div className="absolute inset-0 bg-emerald-500/5 group-hover:bg-emerald-500/10 transition-colors" />
                                        {selectedService.logo ? (
                                            <img src={resolveLogoPath(selectedService.logo) || ''} alt={selectedService.name} className="w-full h-full object-contain relative z-10 drop-shadow-2xl" />
                                        ) : (
                                            <div className="text-7xl relative z-10">
                                                {categoryIcons[selectedService.category as keyof typeof categoryIcons] || <Box className="w-32 h-32" />}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="text-slate-500 flex flex-col items-center gap-4">
                                <Search className="w-16 h-16 opacity-20" />
                                <p>Select a service to see details</p>
                            </div>
                        )}
                    </main>
                </div>

            </DialogContent>
        </Dialog>
    );
}


