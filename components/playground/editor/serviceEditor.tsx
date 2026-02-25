import React, { useState } from "react";
import useSelectionStore from "@/store/selection";
import { useComposeStore } from "@/store/compose";
import {
    Binding,
    Delay,
    HealthCheck,
    Image,
    PortMapping,
    RestartPolicyCondition,
    Service, SuperSet, Env,
    TimeUnits, Volume,
    KeyValue
} from "@composecraft/docker-compose-lib";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Eraser, EthernetPort, FolderTree, Tag, ListPlus, Box, Database, Zap } from "lucide-react";
import QuickToolType from "@/components/ui/quickToolType";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import DurationInput from "@/components/playground/editor/durationInput";
import { addExtraDots, cn } from "@/lib/utils";
import useUIStore from "@/store/ui";
import { libraryServices } from "@/lib/library_data";
import { useExecutionStore } from "@/store/execution";
import { ChevronDown, ChevronUp, Menu } from "lucide-react";

export default function ServiceEditor() {

    const { selectedId } = useSelectionStore();
    const { compose, setCompose } = useComposeStore();
    const { setIsLibraryOpen } = useUIStore();
    const { serviceStatuses } = useExecutionStore();
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    function getService(): Service {
        const service = compose.services.get("id", selectedId)
        if (service) {
            return service
        }
        throw Error(`${selectedId} service is not found`)
    }

    const serviceName = getService().name;
    const isRunning = serviceStatuses[serviceName]?.status === 'running';

    return (
        <form className="flex flex-col gap-6 p-6 bg-[#0a0d14]/90 backdrop-blur-2xl border border-white/10 rounded-3xl shadow-2xl animate-in fade-in slide-in-from-right-4 duration-500 text-slate-300">
            <div className="flex items-center justify-between">
                <h2 className="text-3xl font-black tracking-tighter text-white flex items-center gap-2 drop-shadow-md">
                    <Box className="w-8 h-8 text-blue-500" />
                    Service
                </h2>
                <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsMenuOpen(!isMenuOpen)}
                    className="flex items-center gap-2 text-slate-400 hover:text-white hover:bg-white/5 border border-white/5"
                >
                    <Menu className="w-4 h-4" />
                    Menu
                    {isMenuOpen ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                </Button>
            </div>

            <Tabs defaultValue="general" className="w-full">
                {isMenuOpen && (
                    <TabsList className="flex flex-wrap h-auto w-full bg-slate-900/50 p-1 border border-white/5 rounded-xl shadow-inner mb-4 animate-in slide-in-from-top-2 duration-300">
                        <TabsTrigger className="w-full data-[state=active]:bg-white/10 data-[state=active]:shadow-md transition-all font-bold text-slate-500 data-[state=active]:text-blue-400 rounded-lg" value="general">General</TabsTrigger>
                        <TabsTrigger className="w-full data-[state=active]:bg-white/10 data-[state=active]:shadow-md transition-all font-bold text-slate-500 data-[state=active]:text-amber-400 rounded-lg" value="volume">Volumes</TabsTrigger>
                        <TabsTrigger className="w-full data-[state=active]:bg-white/10 data-[state=active]:shadow-md transition-all font-bold text-slate-500 data-[state=active]:text-orange-400 rounded-lg" value="network">Networking</TabsTrigger>
                        <TabsTrigger className="w-full data-[state=active]:bg-white/10 data-[state=active]:shadow-md transition-all font-bold text-slate-500 data-[state=active]:text-cyan-400 rounded-lg" value="db">DB</TabsTrigger>
                        <TabsTrigger className="w-full data-[state=active]:bg-white/10 data-[state=active]:shadow-md transition-all font-bold text-slate-500 data-[state=active]:text-violet-400 rounded-lg" value="env">Env</TabsTrigger>
                        <TabsTrigger className="w-full data-[state=active]:bg-white/10 data-[state=active]:shadow-md transition-all font-bold text-slate-500 data-[state=active]:text-emerald-400 rounded-lg" value="health">Health</TabsTrigger>
                    </TabsList>
                )}
                <TabsContent className="flex flex-col gap-6 w-full mt-2" value="general">
                    <div className="flex flex-col gap-2">
                        <label htmlFor="name" className="text-sm font-bold text-slate-400">Name</label>
                        <Input
                            name="name"
                            value={getService().name}
                            disabled={isRunning}
                            className={cn(
                                isRunning ? "opacity-60 cursor-not-allowed bg-white/5 border-amber-500/20" : "bg-white/5 border-white/10",
                                "text-white focus:ring-blue-500/40"
                            )}
                            onChange={(e) => {
                                setCompose(() => getService().name = e.target.value)
                            }}
                        />
                        {isRunning && (
                            <p className="text-xs font-medium text-amber-400 flex items-center gap-1.5 mt-1 animate-pulse">
                                <Zap className="w-3 h-3" />
                                Container is running. Stop the deployment to change the name.
                            </p>
                        )}
                    </div>
                    <div className="flex flex-row justify-between">
                        <div className="flex flex-col gap-2">
                            <label className="text-sm font-bold text-slate-400" htmlFor="image">Image</label>
                            <Input name="image"
                                className="bg-white/5 border-white/10 text-white"
                                value={getService().image?.name || ""}
                                onChange={(e) => {
                                    setCompose(() => {
                                        const image = getService().image
                                        if (image) {
                                            image.name = e.target.value
                                        } else {
                                            getService().image = new Image({ name: e.target.value })
                                        }
                                    })
                                }}
                            />
                        </div>
                        <div className="flex flex-col gap-2">
                            <label htmlFor="tag">Tag</label>
                            <Input defaultValue="latest" name="tag"
                                value={getService().image?.tag}
                                onChange={(e) => {
                                    setCompose(() => {
                                        const image = getService().image
                                        if (image) {
                                            image.tag = e.target.value
                                        } else {
                                            getService().image = new Image({ name: "", tag: e.target.value })
                                        }
                                    })
                                }}
                            />
                        </div>
                    </div>
                    <div className="flex flex-col gap-2">
                        <label className="flex flex-row justify-between">
                            Restart
                            <QuickToolType className=""
                                message={"Configure if and how to restart containers when they exit"} />
                        </label>
                        {/* @ts-expect-error tkt*/}
                        <Select value={RestartPolicyCondition[getService().restart]}
                            onValueChange={(value) => {
                                setCompose(() => {
                                    //@ts-expect-error tkt
                                    const newValue = RestartPolicyCondition[value]
                                    if (newValue) {
                                        getService().restart = newValue
                                    }
                                })
                            }}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="restart policy ..." />
                            </SelectTrigger>
                            <SelectContent>
                                {
                                    (Object.keys(RestartPolicyCondition) as Array<keyof typeof RestartPolicyCondition>).map((key) => (
                                        <SelectItem key={key} value={key}>
                                            {RestartPolicyCondition[key]}
                                        </SelectItem>
                                    ))
                                }
                            </SelectContent>
                        </Select>
                    </div>
                    <div>
                        <label className="flex flex-row justify-between" htmlFor="command">
                            Command
                            <QuickToolType className="" message={"Override command run by the container"} />
                        </label>
                        <Input name="command" value={getService().command?.join(" ")}
                            onChange={(e) => {
                                setCompose(() => getService().command = e.target.value.split(" "))
                            }}
                        />
                    </div>
                    <div>
                        <label className="flex flex-row justify-between" htmlFor="entryPoint">
                            Entry point
                            <QuickToolType className="" message={"Override container's default executable"} />
                        </label>
                        <Input name="entryPoint" value={getService().entrypoint}
                            onChange={(e) => {
                                setCompose(() => getService().entrypoint = e.target.value)
                            }}
                        />
                    </div>
                    <div>
                        <Button type="button"
                            className="flex flex-row gap-2" onClick={() => {
                                setCompose(() => {
                                    if (getService().labels) {
                                        getService().labels?.push(new KeyValue("com.to_set", "", "lab_"))
                                    } else {
                                        getService().labels = [new KeyValue("com.to_set", "", "lab_")]
                                    }
                                })
                            }}>
                            <Tag height={20} />
                            Add Label
                        </Button>
                    </div>
                </TabsContent>
                <TabsContent value="volume" className="flex flex-col gap-6 mt-2">
                    <div className="flex flex-col gap-3">
                        <label className="flex flex-row justify-between text-sm font-bold text-slate-400">
                            Bindings
                            <QuickToolType className=""
                                message={"Bindings are local folder mounted inside the container"} />
                        </label>
                        <Button type="button"
                            className="flex flex-row gap-2" onClick={() => {
                                setCompose(() => {
                                    getService().bindings.add(new Binding({
                                        source: "./",
                                        target: "/"
                                    }))
                                })
                            }}>
                            <FolderTree height={20} />
                            Add binding
                        </Button>
                        {
                            Array.from(getService().bindings).filter((binding) => (binding.source as Volume)?.id === undefined) //get only the direct bindings
                                .map((binding) => {
                                    return (
                                        <div className='flex flex-row gap-2 items-center'>
                                            <p className="w-20">{addExtraDots((binding.source as string), 10, false)}</p>
                                            <Input value={binding.target}
                                                className="bg-white/5 border-white/10 text-white"
                                                onChange={(e) => setCompose(() => {
                                                    const vol = getService().bindings.get("id", binding.id)
                                                    if (vol) {
                                                        vol.target = e.target.value
                                                    }
                                                })} />
                                            <Button type="button" className="bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20" variant="secondary"
                                                onClick={() => setCompose(() => {
                                                    getService().bindings.delete(binding)
                                                })}>
                                                <Eraser className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    )
                                })
                        }
                        <Separator className='my-3' />
                        <label className="flex flex-row justify-between">
                            Volumes
                            <QuickToolType className=""
                                message={"Volumes are docker managed folder mounted inside the container"} />
                        </label>
                        {
                            Array.from(getService().bindings).filter((binding) => (binding.source as Volume)?.id !== undefined) //get only the volumes bindings
                                .map((binding) => {
                                    return (
                                        <div className='flex flex-row gap-2 items-center'>
                                            <p>{addExtraDots((binding.source as Volume).name, 10)}</p>
                                            <Input value={binding.target}
                                                className="bg-white/5 border-white/10 text-white"
                                                onChange={(e) => setCompose(() => {
                                                    const vol = getService().bindings.get("id", binding.id)
                                                    if (vol) {
                                                        vol.target = e.target.value
                                                    }
                                                })} />
                                            <Button type="button" className="bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20" variant="secondary"
                                                onClick={() => setCompose(() => {
                                                    getService().bindings.delete(binding)
                                                })}>
                                                <Eraser className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    )
                                })
                        }
                    </div>
                </TabsContent>
                <TabsContent value="network" className="flex flex-col gap-6 mt-2">
                    <div className="flex flex-col gap-3">
                        <label className="flex flex-row justify-between text-sm font-bold text-slate-400">
                            Ports
                            <QuickToolType className="" message={"Ports you want to expose from the container"} />
                        </label>
                        {getService().ports?.map((port, index) => (
                            <>
                                <div className='flex flex-row gap-2 items-end'>
                                    <div className='flex flex-col w-full'>
                                        <label className="text-sm">Host</label>
                                        <Input value={port.hostPort}
                                            className="bg-white/5 border-white/10 text-white"
                                            {...{}/*@ts-expect-error tkt*/}
                                            onChange={(e) => setCompose(() => getService().ports[index].hostPort = Number(e.target.value))} />
                                    </div>
                                    <div className='flex flex-col w-full'>
                                        <label className="text-sm">Container</label>
                                        {/*@ts-expect-error tkt*/}
                                        <Input value={port.containerPort} className="bg-white/5 border-white/10 text-white" onChange={(e) => setCompose(() => getService().ports[index].containerPort = Number(e.target.value))} />
                                    </div>
                                    <Button type="button" className="bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20" variant="secondary"
                                        onClick={() => setCompose(() => {
                                            getService().ports?.splice(index, 1)
                                        })}>
                                        <Eraser className="w-4 h-4" />
                                    </Button>
                                </div>
                                <Separator />
                            </>
                        ))}
                        <Button type="button"
                            onClick={() => setCompose(() => {
                                const servicePorts = getService().ports
                                if (servicePorts) {
                                    servicePorts.push(new PortMapping({ containerPort: 80, hostPort: 80 }))
                                } else {
                                    getService().ports = [
                                        new PortMapping({ containerPort: 80, hostPort: 80 })
                                    ]
                                }
                            })} className="flex flex-row gap-2">
                            <EthernetPort height={20} />Add mapping
                        </Button>
                        <Separator />
                        <div className="flex flex-col gap-2">
                            <label htmlFor="network_mode">Network mode</label>
                            <Input name="network_mode" value={getService().network_mode || ""}
                                onChange={(e) => {
                                    setCompose(() => getService().network_mode = e.target.value)
                                }}
                            />
                        </div>
                        <Separator />
                        <div className="flex flex-col gap-2">
                            <label className="flex flex-row justify-between">
                                Connected Networks
                                <QuickToolType className="" message={"Manage static IP addresses for connected networks"} />
                            </label>
                            {Array.from(getService().networks || []).length === 0 && (
                                <p className="text-sm text-gray-400">No networks connected. Link this service to a network node.</p>
                            )}
                            {Array.from(getService().networks || []).map((net) => (
                                <div key={net.id} className="flex flex-col gap-2">
                                    <label className="text-sm">{net.name} IPv4 Address</label>
                                    <Input
                                        placeholder="e.g. 172.16.238.10"
                                        value={getService().ipv4_addresses?.[net.name] || ""}
                                        onChange={(e) => {
                                            setCompose(() => {
                                                const srv = getService();
                                                if (!srv.ipv4_addresses) srv.ipv4_addresses = {};
                                                srv.ipv4_addresses[net.name] = e.target.value;
                                                if (e.target.value === "") {
                                                    delete srv.ipv4_addresses[net.name];
                                                }
                                            });
                                        }}
                                    />
                                </div>
                            ))}
                        </div>
                    </div>
                </TabsContent>
                <TabsContent value="db" className="flex flex-col gap-6 mt-2">
                    <div className="flex flex-col gap-3">
                        <label className="flex flex-row justify-between text-sm font-bold text-slate-400">
                            Database Link
                            <QuickToolType className="" message={"Select or add a database to link and auto-configure variables"} />
                        </label>
                        {/* List available databases in project */}
                        <div className="flex flex-col gap-2 relative">
                            <Select
                                value={Array.from(getService().depends_on || []).find(dep => {
                                    const name = dep.image?.name?.toLowerCase() || "";
                                    return name.includes('db') || name.includes('sql') || name.includes('mongo') || name.includes('redis') || name.includes('postgres') || name.includes('maria');
                                })?.id || "none"}
                                onValueChange={(selectedDbId) => {
                                    setCompose(() => {
                                        const service = getService()
                                        if (selectedDbId === "none") {
                                            // Remove current database dependencies
                                            const currentDBs = Array.from(service.depends_on || []).filter(dep => {
                                                const name = dep.image?.name?.toLowerCase() || "";
                                                return name.includes('db') || name.includes('sql') || name.includes('mongo') || name.includes('redis') || name.includes('postgres') || name.includes('maria');
                                            });
                                            currentDBs.forEach(db => service.depends_on.delete(db))
                                            return;
                                        }

                                        const targetDb = Array.from(compose.services).find(s => s.id === selectedDbId)
                                        if (targetDb) {
                                            service.depends_on.add(targetDb)
                                            // Auto-inject env configurations from template if applicable
                                            const templateApp = libraryServices.find(t =>
                                                service.image?.name?.toLowerCase().includes(t.image.split(":")[0])
                                            );
                                            // Use specific database connection ENV map if it's defined in the app template
                                            if (templateApp && templateApp.env_vars && service.environment) {
                                                Object.entries(templateApp.env_vars).forEach(([key, value]) => {
                                                    // Only auto-add if it doesn't exist
                                                    const exists = Array.from(service.environment!).some(env => env.key === key);
                                                    if (!exists) {
                                                        service.environment!.add(new Env(key, value));
                                                        compose.envs.add(new Env(key, value));
                                                    }
                                                });
                                            }
                                        }
                                    })
                                }}
                            >
                                <SelectTrigger className="bg-white/5 border-white/10 text-white w-full">
                                    <SelectValue placeholder="Link existing database" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="none">None</SelectItem>
                                    {Array.from(compose.services).filter(s => {
                                        if (s.id === getService().id) return false;
                                        const name = s.image?.name?.toLowerCase() || "";
                                        return name.includes('db') || name.includes('sql') || name.includes('mongo') || name.includes('redis') || name.includes('postgres') || name.includes('maria');
                                    }).map(dbService => (
                                        <SelectItem key={dbService.id} value={dbService.id}>
                                            {dbService.name} ({dbService.image?.name || 'unknown'})
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <Separator className='my-3 border-white/10' />
                        <label className="text-sm font-bold text-slate-400">Not in your project?</label>
                        <Button type="button"
                            onClick={() => setIsLibraryOpen(true, "Database")}
                            className="bg-cyan-600 hover:bg-cyan-700 text-white font-bold border border-cyan-500/50 shadow-lg shadow-cyan-500/20 flex flex-row gap-2 w-full justify-center">
                            <Database height={18} /> Add Database from Library
                        </Button>
                    </div>
                </TabsContent>
                <TabsContent value="env" className="flex flex-col gap-6 mt-2">
                    <div className="flex flex-col gap-3">
                        <label className="flex flex-row justify-between text-sm font-bold text-slate-400">
                            Environment Variables
                            <QuickToolType className="" message={"Define environment variables mapped to this service"} />
                        </label>
                        {getService().environment && Array.from(getService().environment!).map((envItem) => (
                            <div key={envItem.id}>
                                <div className='flex flex-row gap-2 items-end'>
                                    <div className='flex flex-col w-full'>
                                        <label className="text-sm">Key</label>
                                        <Input value={envItem.key}
                                            className="bg-white/5 border-white/10 text-white"
                                            onChange={(e) => setCompose(() => {
                                                const env = getService().environment?.get("id", envItem.id);
                                                // @ts-expect-error tkt
                                                if (env) env.key = e.target.value;
                                            })} />
                                    </div>
                                    <div className='flex flex-col w-full'>
                                        <label className="text-sm">Value</label>
                                        <Input value={envItem.value}
                                            className="bg-white/5 border-white/10 text-white"
                                            onChange={(e) => setCompose(() => {
                                                const env = getService().environment?.get("id", envItem.id);
                                                // @ts-expect-error tkt
                                                if (env) env.value = e.target.value;
                                            })} />
                                    </div>
                                    <Button type="button" className="bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20" variant="secondary"
                                        onClick={() => setCompose(() => {
                                            const envSet = getService().environment;
                                            if (envSet) {
                                                envSet.delete(envItem);
                                                compose.envs.delete(envItem);
                                            }
                                        })}>
                                        <Eraser className="w-4 h-4" />
                                    </Button>
                                </div>
                                <Separator className="my-2" />
                            </div>
                        ))}
                        <Button type="button"
                            onClick={() => setCompose(() => {
                                const newEnv = new Env("NEW_VAR", "value");
                                compose.envs.add(newEnv); // Add to global pool so it appears in graph if needed

                                if (getService().environment) {
                                    getService().environment!.add(newEnv);
                                } else {
                                    getService().environment = new SuperSet<Readonly<Env>>();
                                    getService().environment!.add(newEnv);
                                }
                            })} className="flex flex-row gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold border border-blue-500/50 shadow-lg shadow-blue-500/20">
                            <ListPlus height={20} />Add variable
                        </Button>
                    </div>
                </TabsContent>
                <TabsContent className="flex flex-col gap-6 w-full mt-2" value="health">
                    <div className="flex flex-col gap-1.5">
                        <label className="flex flex-row justify-between text-sm font-bold text-slate-400" htmlFor="test">
                            Test
                            <QuickToolType className=""
                                message={"The command that will be ran to check container health"} />
                        </label>
                        <Input name="test" value={getService().healthcheck?.test?.join(" ")}
                            onChange={(e) => {
                                setCompose(() => {
                                    const health = getService().healthcheck
                                    if (health) {
                                        health.test = e.target.value.split(" ")
                                    } else {
                                        getService().healthcheck = new HealthCheck({
                                            test: e.target.value.split(" "),
                                            interval: new Delay(30, TimeUnits.SECONDS)
                                        })
                                    }
                                })
                            }}
                        />
                    </div>
                    <div>
                        <label className="flex flex-row justify-between" htmlFor="retry">
                            Retry
                            <QuickToolType className=""
                                message={"Number of retry before the container become unhealthy"} />
                        </label>
                        <Input name="retry" placeholder="3" value={getService().healthcheck?.retries}
                            onChange={(e) => {
                                setCompose(() => {
                                    const health = getService().healthcheck
                                    if (health) {
                                        health.retries = Number(e.target.value)
                                    } else {
                                        getService().healthcheck = new HealthCheck({
                                            test: [],
                                            interval: new Delay(30, TimeUnits.SECONDS),
                                            retries: Number(e.target.value)
                                        })
                                    }
                                })
                            }}
                        />
                    </div>
                    <div>
                        <label className="flex flex-row justify-between">
                            Timeout
                            <QuickToolType className="" message={"Maximum time for a command before failing"} />
                        </label>
                        <DurationInput onValueChange={(newDelay) => {
                            setCompose(() => {
                                const health = getService().healthcheck
                                if (health) {
                                    health.timeout = newDelay
                                } else {
                                    getService().healthcheck = new HealthCheck({
                                        test: [],
                                        interval: new Delay(30, TimeUnits.SECONDS),
                                        timeout: newDelay
                                    })
                                }
                            })
                        }} />
                    </div>
                    <div>
                        <label className="flex flex-row justify-between">
                            Start period
                            <QuickToolType className="" message={"Delay before the first test"} />
                        </label>
                        <DurationInput onValueChange={(newDelay) => {
                            setCompose(() => {
                                const health = getService().healthcheck
                                if (health) {
                                    health.start_period = newDelay
                                } else {
                                    getService().healthcheck = new HealthCheck({
                                        test: [],
                                        interval: new Delay(30, TimeUnits.SECONDS),
                                        start_period: newDelay
                                    })
                                }
                            })
                        }} />
                    </div>
                    <div>
                        <label className="flex flex-row justify-between">
                            Start interval
                            <QuickToolType className="" message={"Time between retries during startup"} />
                        </label>
                        <DurationInput onValueChange={(newDelay) => {
                            setCompose(() => {
                                const health = getService().healthcheck
                                if (health) {
                                    health.start_interval = newDelay
                                } else {
                                    getService().healthcheck = new HealthCheck({
                                        test: [],
                                        interval: new Delay(30, TimeUnits.SECONDS),
                                        start_interval: newDelay
                                    })
                                }
                            })
                        }} />
                    </div>
                </TabsContent>
            </Tabs>
        </form>
    )

}