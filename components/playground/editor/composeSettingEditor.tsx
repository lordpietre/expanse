"use client"

import { save, useComposeStore } from "@/store/compose";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger } from "@/components/ui/select";
import { ComposeVersion, Env, Network, Service, Volume } from "@composecraft/docker-compose-lib";
import { Button } from "@/components/ui/button";
import { Container, Folder, Key, NetworkIcon, Save } from "lucide-react";
import { generateRandomName } from "@/lib/utils";
import QuickToolType from "@/components/ui/quickToolType";
import toast from "react-hot-toast";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import EmbedSignin from "@/components/display/embedSignin";
import useDisableStateStore from "@/store/disabled";
import { useState } from "react";
import { cn } from "@/lib/utils";

const VolumeWizard = () => {
    const { setCompose } = useComposeStore();
    const [name, setName] = useState(generateRandomName());
    const [size, setSize] = useState("");
    const [isOpen, setIsOpen] = useState(false);

    const handleCreate = () => {
        setCompose((current) => {
            const newVolOptions: any = {
                name,
                labels: [{ id: Math.random().toString(36).substr(2, 9), key: "composecraft.persistence", value: "true" }]
            };
            if (size.trim() !== "" && size.match(/\d/)) {
                newVolOptions.driver_opts = [{ id: Math.random().toString(36).substr(2, 9), key: "size", value: size }];
            }
            current.volumes.add(new Volume(newVolOptions));
        });
        setIsOpen(false);
        toast.success(`Volume ${name} (${size}) created with persistence`);
        setName(generateRandomName()); // Reset for next time
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button type='button' className="flex flex-row gap-2 rounded-xl bg-white/5 hover:bg-amber-500/15 text-white font-bold border border-white/8 shadow-none transition-colors">
                    <Folder width={16} className="text-amber-400" /> Volume
                </Button>
            </DialogTrigger>
            <DialogContent className="glass border-white/20 p-8 rounded-[2rem]">
                <div className="flex flex-col gap-6">
                    <h3 className="text-2xl font-black uppercase italic tracking-tighter">New Volume Wizard</h3>
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase text-slate-400">Volume Name</label>
                            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="my-storage-vol" />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase text-slate-400 flex justify-between">
                                Required Memory / Size
                                <span className="text-amber-500/80 normal-case font-medium">(Optional)</span>
                            </label>
                            <div className="flex gap-2">
                                <Input value={size} onChange={(e) => setSize(e.target.value)} placeholder="e.g. 10GB (leave empty for no limit)" />
                                <Select value={size.slice(-2)} onValueChange={(v) => {
                                    const base = size.replace(/[A-Z]+$/, "");
                                    if (base) setSize(base + v);
                                }}>
                                    <SelectTrigger className="w-24">GB</SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="MB">MB</SelectItem>
                                        <SelectItem value="GB">GB</SelectItem>
                                        <SelectItem value="TB">TB</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <p className="text-[10px] text-slate-400 leading-tight">
                                Specifying a size requires <span className="font-bold text-slate-500">XFS/ext4 project quota</span> support enabled on your Docker host. If unsupported, leave this empty to avoid creation errors.
                            </p>
                        </div>
                    </div>
                    <Button onClick={handleCreate} className="w-full py-6 rounded-2xl bg-amber-500 hover:bg-amber-600 text-white font-black uppercase tracking-widest shadow-xl shadow-amber-200">
                        Confirm & Create
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
};

import { ChevronDown, ChevronUp, Library } from "lucide-react";
import useUIStore from "@/store/ui";

export default function ComposeSettingEditor() {

    const { compose, setCompose } = useComposeStore();
    const { state: disabled } = useDisableStateStore()
    const { setIsLibraryOpen } = useUIStore()
    const [isCollapsed, setIsCollapsed] = useState(false)

    function ser() {
        setCompose((current) => {
            current.addService(new Service({
                name: generateRandomName()
            }))
        })
        toast.success("Service added to playground", { icon: '🚀' });
    }

    function net() {
        setCompose((current) => {
            current.addNetwork(new Network({ name: generateRandomName() }))
        })
        toast.success("Network added to playground", { icon: '🌐' });
    }

    function env() {
        setCompose((current) => {
            current.envs.add(new Env(generateRandomName().toUpperCase(), ""))
        })
        toast.success("Environment variable added", { icon: '🔑' });
    }

    async function handleSave() {
        try {
            await save(compose)
            toast.success("saved")
        } catch (e) {
            toast.error('error')
            console.error(e)
        }
    }

    return (
        <div className="flex flex-col gap-6 p-6 bg-gradient-to-br from-emerald-500/10 via-teal-500/10 to-cyan-500/10 backdrop-blur-2xl border border-emerald-500/10 rounded-3xl shadow-2xl animate-in fade-in slide-in-from-right-4 duration-500 text-slate-300">
            <div
                className="flex items-center justify-between cursor-pointer group"
                onClick={() => setIsCollapsed(!isCollapsed)}
            >
                <h2 className="text-xl font-black tracking-[0.2em] text-white uppercase transition-colors">
                    Docker
                </h2>
                {isCollapsed ? <ChevronDown className="w-5 h-5 text-white" /> : <ChevronUp className="w-5 h-5 text-white" />}
            </div>

            <div className={cn("flex flex-col gap-6 w-full transition-all duration-300", isCollapsed ? "hidden" : "block")}>
                <div className="grid gap-2 grid-cols-2">
                    <Button
                        type='button'
                        className="flex flex-row gap-2 rounded-xl bg-white/5 hover:bg-indigo-500/15 text-white font-bold border border-white/8 shadow-none col-span-2 transition-colors"
                        onClick={() => setIsLibraryOpen(true)}
                    >
                        <Library width={16} className="text-indigo-400" /> Library
                    </Button>
                    <Button type='button' className="flex flex-row gap-2 rounded-xl bg-white/5 hover:bg-emerald-500/15 text-white font-bold border border-white/8 shadow-none transition-colors" onClick={ser}>
                        <Container width={16} className="text-emerald-400" /> Service
                    </Button>
                    <Button type='button' className="flex flex-row gap-2 rounded-xl bg-white/5 hover:bg-emerald-500/15 text-white font-bold border border-white/8 shadow-none transition-colors" onClick={net}>
                        <NetworkIcon width={16} className="text-emerald-400" /> Network
                    </Button>
                    <VolumeWizard />
                    <Button type='button' className="flex flex-row gap-2 rounded-xl bg-white/5 hover:bg-violet-500/15 text-white font-bold border border-white/8 shadow-none transition-colors" onClick={env}>
                        <Key width={16} className="text-violet-400" /> Environment
                    </Button>
                </div>

                <div className="h-[1px] bg-white/5 my-2" />

                <div className="flex flex-col gap-2">
                    <label className='flex flex-row justify-between items-end text-sm font-bold text-slate-400' htmlFor="target">Project ID <QuickToolType message={"Global unique identifier for this deployment"} /></label>
                    <Input name="target" value={compose.name}
                        className="bg-white/5 border-white/10 text-white"
                        onChange={(e) => {
                            setCompose((currentCompose) => {
                                currentCompose.name = e.target.value
                            })
                        }}
                    />
                </div>
                <div className="flex flex-col gap-2">
                    <label className='flex flex-row justify-between items-end text-sm font-bold text-slate-400' htmlFor="target">Version <QuickToolType
                        className="" message={"Docker compose version as been deprecated"} /></label>
                    <Select value={compose.version?.toString() || " "} onValueChange={(value) => {
                        setCompose((c) => {
                            if (value === " ") {
                                c.version = undefined
                            } else {
                                c.version = Number(value) as ComposeVersion
                            }
                        })
                    }}>
                        <SelectTrigger>
                            {compose.version || "Unspecified"}
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value={"3.8"}>3.8</SelectItem>
                            <SelectItem value={"3.7"}>3.7</SelectItem>
                            <SelectItem value={"3.5"}>3.5</SelectItem>
                            <SelectItem value={"3.3"}>3.3</SelectItem>
                            <SelectItem value={"3.2"}>3.2</SelectItem>
                            <SelectItem value={"3.1"}>3.1</SelectItem>
                            <SelectItem value={"3.0"}>3.0</SelectItem>
                            <SelectItem value={" "}>Unspecified</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                {disabled ?
                    <Dialog>
                        <DialogTrigger asChild>
                            <Button type="button" className="w-full">
                                <Save width={20} /> Save
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <div>
                                <EmbedSignin redirectToPlayGround={true} />
                            </div>
                        </DialogContent>
                    </Dialog>
                    :
                    <Button type="button" onClick={() => { handleSave() }} className="w-full py-5 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-white font-black uppercase tracking-widest shadow-lg shadow-emerald-500/20 transition-all active:scale-95">
                        <Save width={18} className="mr-2" /> Save
                    </Button>
                }
            </div>
        </div>
    )
}