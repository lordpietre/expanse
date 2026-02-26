import React, { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Code, FileUp, Zap, Image, Square, Play, FileDown, Library, Box, Activity, CheckCircle2, Loader2 } from "lucide-react";
import Playground, { PlaygroundHandle } from "@/components/playground/playground";
import { useComposeStore } from "@/store/compose";
import useSelectionStore from "@/store/selection";
import { useExecutionStore } from "@/store/execution";
import useComposeIdStore from "@/store/composeId";
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import YamlEditor from "@/components/playground/yamlEditor";
import { Translator } from "@composecraft/docker-compose-lib";
import YAML from "yaml";
import { toPng } from "html-to-image";

import LibraryModal from "./libraryModal";
import EditMenu from "@/components/playground/editMenu";
import { runCompose as executeCompose, stopCompose, getComposeStatus, getComposeLogs, validateComposePorts, restartCompose } from "@/actions/dockerActions";
import ExecutionPanel from "./executionPanel";
import toast from "react-hot-toast";
import { cn } from "@/lib/utils";
import Link from "next/link";

// ── Deploy Phase Types ──────────────────────────────────────────────────────
type DeployPhase = null | 'validating' | 'writing' | 'starting' | 'done';

const PHASE_CONFIG: Record<Exclude<DeployPhase, null>, { label: string; detail: string; progress: number; color: string }> = {
    validating: { label: 'Validando puertos...', detail: 'Comprobando conflictos con puertos en uso', progress: 20, color: 'from-blue-500 to-indigo-500' },
    writing: { label: 'Escribiendo configuración...', detail: 'Generando docker-compose.yaml con parches', progress: 50, color: 'from-indigo-500 to-purple-500' },
    starting: { label: 'Iniciando contenedores...', detail: 'Ejecutando docker compose up -d', progress: 80, color: 'from-purple-500 to-emerald-500' },
    done: { label: '¡Listo!', detail: 'Contendores arrancados correctamente', progress: 100, color: 'from-emerald-400 to-teal-500' },
};

function DeployProgress({ phase }: { phase: DeployPhase }) {
    if (!phase) return null;
    const cfg = PHASE_CONFIG[phase];
    return (
        <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 bg-[#0d1117] border border-white/10 rounded-2xl p-4 flex flex-col gap-3">
            <div className="flex items-center gap-2">
                {phase === 'done'
                    ? <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    : <Loader2 className="w-4 h-4 text-blue-400 shrink-0 animate-spin" />}
                <div className="flex flex-col min-w-0">
                    <span className="text-xs font-black text-white">{cfg.label}</span>
                    <span className="text-[10px] text-slate-500 truncate">{cfg.detail}</span>
                </div>
            </div>
            {/* Progress bar */}
            <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
                <div
                    className={cn("h-full rounded-full bg-gradient-to-r transition-all duration-700 ease-out", cfg.color)}
                    style={{ width: `${cfg.progress}%` }}
                />
            </div>
        </div>
    );
}

import useUIStore from "@/store/ui";
import usePositionMap from "@/store/metadataMap";

import { useSearchParams } from "next/navigation";
import { getComposeById } from "@/actions/userActions";
import { reHydrateComposeIds, recreatePositionMap, recreateConnectionMap } from "@/lib/metadata";

export default function PlaygroundContent({ inviteMode = false }: { inviteMode?: boolean }) {
    const { compose, setCompose, replaceCompose } = useComposeStore();
    const { id: composeId } = useComposeIdStore();
    const { setSelectedString } = useSelectionStore();
    const { isExecuting, setExecuting, clearStatuses, updateStatuses, setLogs } = useExecutionStore();
    const { isLibraryOpen, setIsLibraryOpen } = useUIStore();
    const playgroundRef = useRef<PlaygroundHandle>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [deployPhase, setDeployPhase] = useState<DeployPhase>(null);

    const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const content = event.target?.result as string;
                const dict = YAML.parse(content);
                const newCompose = Translator.fromDict(dict);
                replaceCompose(newCompose);
                toast.success("Project imported successfully");
            } catch (error) {
                console.error("Import failed:", error);
                toast.error("Failed to parse YAML file");
            }
        };
        reader.readAsText(file);
        // Reset input
        e.target.value = '';
    };

    const searchParams = useSearchParams();
    const idParam = searchParams.get('id');

    React.useEffect(() => {
        const loadCompose = async () => {
            if (idParam) {
                try {
                    const loadedCompose = await getComposeById(idParam);
                    if (loadedCompose) {
                        const newCompose = Translator.fromDict(loadedCompose.data);
                        if (loadedCompose.metadata) {
                            reHydrateComposeIds(newCompose, loadedCompose.metadata);
                            usePositionMap.getState().setPositionMap(recreatePositionMap(loadedCompose.metadata.positionMap));
                            if (loadedCompose.metadata.connectionMap) {
                                // Rehydrate connection map correctly using helper
                                const connections = recreateConnectionMap(loadedCompose.metadata.connectionMap);
                                usePositionMap.getState().setConnectionMap(connections);
                            }
                        }
                        replaceCompose(newCompose, { disableSave: true });
                        useComposeIdStore.getState().setId(idParam);

                        // Wait for nodes to be rendered and layed out if there was no metadata
                        if (!loadedCompose.metadata) {
                            setTimeout(() => {
                                playgroundRef.current?.onLayout("TB");
                            }, 100);
                        }
                    }
                } catch (error) {
                    toast.error("Failed to load compose.");
                    console.error(error);
                }
            } else {
                const dataParam = searchParams.get('data');
                if (dataParam) {
                    try {
                        // Decode Base64URL
                        const base64 = dataParam.replace(/-/g, '+').replace(/_/g, '/');
                        const json = decodeURIComponent(atob(base64).split('').map(function (c) {
                            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
                        }).join(''));
                        const decoded = JSON.parse(json);

                        if (decoded && decoded.compose) {
                            const newCompose = Translator.fromDict(decoded.compose);
                            if (decoded.metadata) {
                                reHydrateComposeIds(newCompose, decoded.metadata);
                                usePositionMap.getState().setPositionMap(recreatePositionMap(decoded.metadata.positionMap));
                                if (decoded.metadata.connectionMap) {
                                    const connections = recreateConnectionMap(decoded.metadata.connectionMap);
                                    usePositionMap.getState().setConnectionMap(connections);
                                }
                            }
                            replaceCompose(newCompose);

                            // Clean up URL
                            const newUrl = new URL(window.location.href);
                            newUrl.searchParams.delete('data');
                            window.history.replaceState({}, '', newUrl.toString());
                        }
                    } catch (error) {
                        console.error("Failed to load data from URL", error);
                        toast.error("Failed to recover data from redirect");
                    }
                }
            }
        };

        loadCompose();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [idParam, searchParams]);

    React.useEffect(() => {
        let interval: NodeJS.Timeout;

        if (isExecuting && composeId) {
            const fetchData = async () => {
                const [statuses, logsRes] = await Promise.all([
                    getComposeStatus(composeId),
                    getComposeLogs(composeId)
                ]);

                if (statuses) updateStatuses(statuses);
                if (logsRes.success) setLogs(logsRes.logs || "");
            };

            fetchData();
            interval = setInterval(fetchData, 3000);
        }

        return () => {
            if (interval) clearInterval(interval);
        };
    }, [isExecuting, composeId, updateStatuses, setLogs]);

    const handleExecute = async () => {
        if (!composeId) {
            toast.error("Save your compose first");
            return;
        }
        try {
            setExecuting(true);
            setDeployPhase('validating');
            const translator = new Translator(compose);
            let yaml = YAML.stringify(translator.toDict());

            // Port Validation Check
            const portValidation = await validateComposePorts(yaml);
            if (portValidation.hasChanges) {
                // Apply reassignments to the store
                await setCompose((currentCompose) => {
                    Object.entries(portValidation.reassignments).forEach(([serviceName, changes]) => {
                        const service = Array.from(currentCompose.services).find(s => s.name === serviceName);
                        if (service && service.ports) {
                            changes.forEach(change => {
                                const portMapping = service.ports?.find(p => p.hostPort === change.old);
                                if (portMapping) {
                                    portMapping.hostPort = change.new;
                                }
                            });
                        }
                    });
                });

                // Generate new YAML with the updated compose object
                yaml = YAML.stringify(new Translator(useComposeStore.getState().compose).toDict());

                toast(() => (
                    <div className="flex flex-col gap-1">
                        <span className="font-bold text-slate-900">Ports Reassigned</span>
                        <span className="text-xs text-slate-500">Some host ports were already in use and have been randomly assigned to free ports.</span>
                    </div>
                ), { duration: 6000, icon: '🔄' });
            }

            setDeployPhase('writing');
            // Small yield so React can paint the progress bar before the heavy call
            await new Promise(r => setTimeout(r, 80));

            let retries = 0;
            let success = false;
            let currentYaml = yaml;

            while (retries < 5 && !success) {
                setDeployPhase('starting');
                const res = await executeCompose(composeId, currentYaml);
                if (res.success) {
                    setDeployPhase('done');
                    setTimeout(() => setDeployPhase(null), 2500);
                    toast.success(
                        (_t: any) => (
                            <div className="flex flex-col gap-1 w-full min-w-[200px]">
                                <span className="font-bold">Compose execution started</span>
                                {Array.from(useComposeStore.getState().compose.services).some(s => s.ports && s.ports.length > 0) && (
                                    <div className="flex flex-col gap-1 mt-1 border-t border-slate-100 pt-2">
                                        <span className="text-[10px] uppercase font-bold text-slate-400">Exposed Ports</span>
                                        {Array.from(useComposeStore.getState().compose.services).filter(s => s.ports && s.ports.length > 0).map(s => (
                                            <div key={s.name} className="flex justify-between items-center text-xs">
                                                <span className="text-slate-600 font-medium">{s.name}</span>
                                                <div className="flex gap-1">
                                                    {s.ports!.map(p => (
                                                        <span key={`${p.hostPort}`} className="px-1.5 py-0.5 bg-blue-50 text-blue-600 rounded font-mono font-bold">
                                                            {p.hostPort}:{p.containerPort}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ),
                        { duration: 8000 }
                    );
                    success = true;
                } else if (res.collisionPort) {
                    toast.error(`Host port ${res.collisionPort} is currently occupied natively. Reassigning...`);

                    await setCompose((currentCompose) => {
                        currentCompose.services.forEach(service => {
                            service.ports?.forEach(portMapping => {
                                if (portMapping.hostPort === res.collisionPort) {
                                    portMapping.hostPort += 1; // Increment and retry
                                }
                            });
                        });
                    });
                    currentYaml = YAML.stringify(new Translator(useComposeStore.getState().compose).toDict());
                    retries++;
                } else {
                    toast.error(res.error || "Failed to start compose");
                    setDeployPhase(null);
                    setExecuting(false);
                    return;
                }
            }

            if (!success) {
                toast.error("Exceeded maximum retries for port fixing.");
                setDeployPhase(null);
                setExecuting(false);
            }
        } catch (error) {
            toast.error("An unexpected error occurred");
            setDeployPhase(null);
            setExecuting(false);
        }
    };

    const handleRestart = async () => {
        if (!composeId) return;
        setExecuting(true);
        clearStatuses();
        setDeployPhase('writing');
        await new Promise(r => setTimeout(r, 80));

        let yaml = YAML.stringify(new Translator(useComposeStore.getState().compose).toDict());

        try {
            let retries = 0;
            let success = false;
            let currentYaml = yaml;

            while (retries < 5 && !success) {
                setDeployPhase('starting');
                const res = await restartCompose(composeId, currentYaml);
                if (res.success) {
                    setDeployPhase('done');
                    setTimeout(() => setDeployPhase(null), 2500);
                    toast.success(
                        (_t: any) => (
                            <div className="flex flex-col gap-1 w-full min-w-[200px]">
                                <span className="font-bold">Compose restarted</span>
                                {Array.from(useComposeStore.getState().compose.services).some(s => s.ports && s.ports.length > 0) && (
                                    <div className="flex flex-col gap-1 mt-1 border-t border-slate-100 pt-2">
                                        <span className="text-[10px] uppercase font-bold text-slate-400">Exposed Ports</span>
                                        {Array.from(useComposeStore.getState().compose.services).filter(s => s.ports && s.ports.length > 0).map(s => (
                                            <div key={s.name} className="flex justify-between items-center text-xs">
                                                <span className="text-slate-600 font-medium">{s.name}</span>
                                                <div className="flex gap-1">
                                                    {s.ports!.map(p => (
                                                        <span key={`${p.hostPort}`} className="px-1.5 py-0.5 bg-blue-50 text-blue-600 rounded font-mono font-bold">
                                                            {p.hostPort}:{p.containerPort}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ),
                        { duration: 8000 }
                    );
                    success = true;
                } else if (res.collisionPort) {
                    toast.error(`Host port ${res.collisionPort} is currently occupied natively. Reassigning...`);

                    await setCompose((currentCompose) => {
                        currentCompose.services.forEach(service => {
                            service.ports?.forEach(portMapping => {
                                if (portMapping.hostPort === res.collisionPort) {
                                    portMapping.hostPort += 1; // Increment and retry
                                }
                            });
                        });
                    });
                    currentYaml = YAML.stringify(new Translator(useComposeStore.getState().compose).toDict());
                    retries++;
                } else {
                    toast.error(res.error || "Failed to restart compose");
                    setDeployPhase(null);
                    setExecuting(false);
                    return;
                }
            }
            if (!success) {
                toast.error("Exceeded max retries for port fixing.");
                setDeployPhase(null);
                setExecuting(false);
            }
        } catch (error) {
            toast.error("An unexpected error occurred");
            setDeployPhase(null);
            setExecuting(false);
        }
    };

    const handleStop = async () => {
        if (!composeId) return;
        try {
            const res = await stopCompose(composeId);
            if (res.success) {
                toast.success("Compose stopped");
                setExecuting(false);
                clearStatuses();
            } else {
                toast.error(res.error || "Failed to stop compose");
            }
        } catch (error) {
            toast.error("An unexpected error occurred");
        }
    };

    const exportPlaygroundAsPNG = async () => {
        const playgroundElement = document.querySelector('.react-flow__renderer') as HTMLElement;
        if (playgroundElement) {
            const dataUrl = await toPng(playgroundElement, { backgroundColor: '#f8fafc' });
            const link = document.createElement('a');
            link.download = 'composecraft-playground.png';
            link.href = dataUrl;
            link.click();
        }
    };

    return (
        <section className="flex flex-col h-screen bg-[hsl(222,47%,5%)] relative overflow-hidden">
            {/* Mesh Background */}
            <div className="absolute inset-0 opacity-10 pointer-events-none mesh-gradient-blue" />

            <div className="flex z-10 p-3 px-8 border-b border-white/5 relative justify-between backdrop-blur-3xl bg-[#0a0d14]/80 shadow-[0_4px_30px_rgba(0,0,0,0.3)]">
                <div className="flex gap-4 items-center pl-8">
                    <input
                        type="file"
                        ref={fileInputRef}
                        className="hidden"
                        accept=".yaml,.yml"
                        onChange={handleImport}
                    />
                    <Button
                        variant="secondary"
                        onClick={() => fileInputRef.current?.click()}
                        className="bg-white/5 hover:bg-white/10 border-white/10 text-white shadow-sm font-bold flex gap-2 transition-all"
                    >
                        <FileUp className="w-4 h-4 text-blue-400" /> Import
                    </Button>
                    <Dialog>
                        <DialogTrigger asChild>
                            <Button variant="secondary" className="bg-white/5 hover:bg-white/10 border-white/10 text-white shadow-sm font-bold flex gap-2 transition-all">
                                <Code className="w-4 h-4 text-indigo-400" /> Code
                            </Button>
                        </DialogTrigger>
                        <DialogContent aria-describedby={undefined} className="max-w-[70vw] h-[80vh] flex flex-col p-0 overflow-hidden border-0 bg-transparent shadow-2xl">
                            <DialogTitle className="sr-only">YAML Details</DialogTitle>
                            <div className="flex-grow rounded-2xl overflow-hidden glass shadow-2xl relative">
                                <div className="absolute inset-0 bg-slate-900" />
                                <div className="absolute top-0 left-0 right-0 h-14 bg-slate-900/50 backdrop-blur-xl border-b border-white/10 z-10 flex items-center px-6">
                                    <div className="flex gap-2 mr-4">
                                        <div className="w-3 h-3 rounded-full bg-rose-500/80" />
                                        <div className="w-3 h-3 rounded-full bg-amber-500/80" />
                                        <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
                                    </div>
                                    <h3 className="font-mono text-sm text-slate-300">docker-compose.yaml</h3>

                                    <Button
                                        variant="default"
                                        size="sm"
                                        className="ml-auto bg-blue-500 hover:bg-blue-600 text-white shadow-lg shadow-blue-500/20"
                                        onClick={() => {
                                            const yaml = YAML.stringify(new Translator(compose).toDict());
                                            const blob = new Blob([yaml], { type: 'text/yaml' });
                                            const url = window.URL.createObjectURL(blob);
                                            const a = document.createElement('a');
                                            a.href = url;
                                            a.download = 'docker-compose.yaml';
                                            a.click();
                                            window.URL.revokeObjectURL(url);
                                            toast.success('File downloaded successfully');
                                        }}
                                    >
                                        <FileDown className="w-4 h-4 mr-2" />
                                        Download
                                    </Button>
                                </div>
                                <div className="pt-14 h-full relative z-0">
                                    <YamlEditor />
                                </div>
                            </div>
                        </DialogContent>
                    </Dialog>
                    <Button
                        onClick={() => playgroundRef.current?.onLayout("TB")}
                        variant="secondary"
                        className="bg-white/5 hover:bg-white/10 border-white/10 text-white shadow-sm transition-all"
                    >
                        <Zap className="w-4 h-4 text-amber-400 mr-2" />
                        <span className="font-bold">Layout</span>
                    </Button>
                    <Link href="/global-dashboard">
                        <Button variant="secondary" className="bg-white/5 hover:bg-white/10 border-white/10 text-white shadow-sm transition-all" >
                            <Activity className="w-4 h-4 text-rose-500 mr-2" />
                            <span className="font-bold">Dashboard</span>
                        </Button>
                    </Link>
                </div>

                <div className="flex gap-3">
                    <Button onClick={exportPlaygroundAsPNG} variant="secondary" className="bg-white/5 hover:bg-white/10 border-white/10 text-white shadow-sm transition-all">
                        <Image className="w-4 h-4 text-emerald-500" />
                    </Button>
                </div>
            </div>

            <div className="flex-grow flex flex-row p-6 gap-6 overflow-hidden">
                <div className="flex-grow bg-[#070b0f]/60 rounded-2xl overflow-hidden relative shadow-2xl border border-white/5">
                    <Playground ref={playgroundRef} />
                </div>

                <div className="w-[400px] flex flex-col gap-6 h-full overflow-y-auto pr-2 custom-scrollbar">
                    <div className="bg-[#0d1117]/80 backdrop-blur-xl border border-white/5 rounded-2xl p-6 shadow-2xl">
                        <EditMenu />
                    </div>

                    <div className="bg-[#0d1117]/80 backdrop-blur-xl border border-white/5 rounded-2xl p-5 shadow-2xl flex flex-col gap-4 mt-auto">
                        <div className="flex flex-col gap-3">
                            {/* Deploy progress bar — shown during launch */}
                            <DeployProgress phase={deployPhase} />

                            <Button
                                onClick={isExecuting ? handleStop : handleExecute}
                                disabled={!!deployPhase && deployPhase !== 'done'}
                                className={cn(
                                    "w-full py-5 rounded-2xl font-black text-base uppercase tracking-widest transition-all duration-500 scale-100 active:scale-95 shadow-2xl relative overflow-hidden group",
                                    isExecuting ? "bg-rose-500 hover:bg-rose-600 shadow-rose-500/30" : "bg-blue-600 hover:bg-blue-700 shadow-blue-500/30"
                                )}
                            >
                                <div className="absolute inset-0 opacity-20 pointer-events-none group-hover:opacity-40 transition-opacity animate-liquid" />
                                <div className="relative z-10 flex items-center justify-center gap-3">
                                    {deployPhase && deployPhase !== 'done'
                                        ? <Loader2 className="w-5 h-5 animate-spin" />
                                        : isExecuting ? <Square className="fill-white" /> : <Play className="fill-white" />}
                                    <span>{isExecuting ? "Detener" : "Ejecutar"}</span>
                                </div>
                            </Button>

                            {isExecuting && (
                                <Button
                                    onClick={handleRestart}
                                    disabled={!!deployPhase && deployPhase !== 'done'}
                                    variant="outline"
                                    className="w-full py-5 rounded-xl font-black text-sm uppercase tracking-widest transition-all duration-300 hover:bg-amber-500/10 border-amber-500/30 text-amber-400 relative overflow-hidden group"
                                >
                                    <div className="relative z-10 flex items-center justify-center gap-3">
                                        <Zap className="fill-amber-500" />
                                        <span>Reiniciar</span>
                                    </div>
                                </Button>
                            )}

                            {isExecuting && (
                                <div className="mt-2 text-white">
                                    <ExecutionPanel />
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
            <LibraryModal open={isLibraryOpen} onOpenChange={setIsLibraryOpen} />
        </section>
    );
}
