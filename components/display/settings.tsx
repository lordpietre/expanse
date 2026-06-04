"use client"

import { Input } from "@/components/ui/input";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogClose, DialogContent, DialogFooter, DialogHeader, DialogTrigger } from "@/components/ui/dialog";
import { deleteUser } from "@/actions/userActions";
import { exportAllProjects, exportToGoogleDrive } from "@/actions/backupActions";
import { getLocalSystemInfo, saveRemoteNodeConfig } from "@/actions/systemActions";
import toast from "react-hot-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Cloud, Download, HardDrive, ShieldAlert, Archive, Server, Network, Plus, ExternalLink } from "lucide-react";
import { useEffect } from "react";
import { useTranslations } from "next-intl";


interface settingsInitData {
    email: string
}

interface SystemInfo {
    localIp: string;
    os: string;
    nodeVersion: string;
    interfaces?: Record<string, string[]>;
}

export default function Settings({ init }: { init?: settingsInitData }) {

    const [email,] = useState(init?.email)
    const [confirm, setConfirm] = useState("")
    const [isExporting, setIsExporting] = useState(false)
    const [systemInfo, setSystemInfo] = useState<SystemInfo | null>(null)

    // Remote Node Form State
    const [remoteHost, setRemoteHost] = useState("")
    const [remotePort, setRemotePort] = useState("2375")
    const t = useTranslations('settings')

    useEffect(() => {
        async function fetchSystem() {
            const res = await getLocalSystemInfo();
            if (res.success && res.localIp) {
                setSystemInfo({
                    localIp: res.localIp,
                    os: res.os || "Unknown",
                    nodeVersion: res.nodeVersion || "Unknown",
                    interfaces: res.interfaces
                });
            }
        }
        fetchSystem();
    }, []);

    async function handleDelete() {
        try {
            const res = await deleteUser()
            if (res) {
                window.location.href = "https://form.expanse.com/s/cm40i9zod000hwl0z6005uvwp"
            }
        } catch (e) {
            toast.error(t('errorDeletingAccount'))
            console.error(e)
        }
    }

    async function handleLocalBackup() {
        setIsExporting(true);
        try {
            const res = await exportAllProjects();
            if (res.success && res.data) {
                const blob = new Blob([JSON.stringify(res.data, null, 2)], { type: 'application/json' });
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `expanse-backup-${new Date().toISOString().split('T')[0]}.json`;
                a.click();
                window.URL.revokeObjectURL(url);
                toast.success(t('backupDownloadedSuccessfully'));
            } else {
                toast.error(res.error || t('failedToGenerateBackup'));
            }
        } catch (error) {
            toast.error(t('unexpectedBackupError'));
            console.error(error);
        } finally {
            setIsExporting(false);
        }
    }

    async function handleDriveBackup() {
        toast.loading(t('connectingToGoogleDrive'), { duration: 2000 });
        const res = await exportToGoogleDrive();
        if (!res.success) {
            toast.error(res.error || t('googleDriveConnectionFailed'));
        }
    }

    async function handleSaveRemoteNode() {
        if (!remoteHost) {
            toast.error(t('pleaseEnterHostAddress'));
            return;
        }
        const res = await saveRemoteNodeConfig({
            host: remoteHost,
            port: remotePort
        });
        if (res.success) {
            toast.success(t('remoteNodeAdded', { host: remoteHost }));
            setRemoteHost("");
        } else {
            toast.error(res.error || t('failedToAddRemoteNode'));
        }
    }

    return (
        <section className='flex flex-col gap-6 max-w-4xl mx-auto p-4'>
            <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-emerald-500/10 rounded-xl">
                    <ShieldAlert className="w-6 h-6 text-emerald-500" />
                </div>
                <div>
                    <h1 className="text-2xl font-bold text-white">{t('projectSettings')}</h1>
                    <p className="text-sm text-slate-400">{t('manageAccountBackupsSecurity')}</p>
                </div>
            </div>

            <Tabs defaultValue="general" className="w-full">
                <TabsList className="grid w-full grid-cols-4 bg-slate-900/50 border border-white/5 h-12 p-1">
                    <TabsTrigger value="general" className="data-[state=active]:bg-emerald-500 data-[state=active]:text-white transition-all font-bold">{t('general')}</TabsTrigger>
                    <TabsTrigger value="nodes" className="data-[state=active]:bg-indigo-600 data-[state=active]:text-white transition-all font-bold">{t('nodes')}</TabsTrigger>
                    <TabsTrigger value="backup" className="data-[state=active]:bg-emerald-600 data-[state=active]:text-white transition-all font-bold">{t('backup')}</TabsTrigger>
                    <TabsTrigger value="security" className="data-[state=active]:bg-rose-600 data-[state=active]:text-white transition-all font-bold">{t('account')}</TabsTrigger>
                </TabsList>

                <TabsContent value="general" className="mt-6 animate-in fade-in slide-in-from-top-4 duration-300">
                    <div className="bg-gradient-to-br from-emerald-500/5 via-teal-500/5 to-cyan-500/5 border border-emerald-500/10 rounded-2xl p-6 shadow-xl">
                        <div className='flex flex-col gap-6'>
                            <div className='flex flex-col gap-2'>
                                <label className="text-sm font-bold text-slate-400">{t('accountEmail')}</label>
                                <Input className="w-full bg-white/5 border-white/10 text-white cursor-not-allowed opacity-70" type="email" value={email} disabled />
                                <p className="text-xs text-slate-500 italic">{t('emailManagedByAuth')}</p>
                            </div>
                        </div>
                    </div>
                </TabsContent>

                <TabsContent value="nodes" className="mt-6 animate-in fade-in slide-in-from-top-4 duration-300">
                    <div className="flex flex-col gap-6">
                        {/* Local Master Node */}
                        <div className="bg-gradient-to-br from-emerald-5/10 via-teal-500/10 to-cyan-500/10 border border-emerald-500/10 rounded-2xl p-6 shadow-xl">
                            <div className="flex justify-between items-start mb-6">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-emerald-500/10 rounded-lg">
                                        <Server className="w-5 h-5 text-emerald-500" />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-bold text-white flex items-center gap-2">
                                            {t('masterNode')}
                                            <span className="text-[10px] px-1.5 py-0.5 bg-emerald-500/10 text-emerald-500 rounded border border-emerald-500/20 uppercase">Active</span>
                                        </h3>
                                        <p className="text-xs text-slate-500">{t('currentExpanseInstance')}</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-xs text-slate-500 uppercase font-black">Local IP</p>
                                    <p className="text-sm font-mono text-indigo-400 font-bold">{systemInfo?.localIp || "Detecting..."}</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-3 gap-4">
                                <div className="bg-white/5 p-3 rounded-xl border border-white/5">
                                    <p className="text-[10px] text-slate-500 uppercase font-bold mb-1">{t('architecture')}</p>
                                    <p className="text-sm text-slate-300 font-medium capitalize">{systemInfo?.os}</p>
                                </div>
                                <div className="bg-white/5 p-3 rounded-xl border border-white/5">
                                    <p className="text-[10px] text-slate-500 uppercase font-bold mb-1">{t('engine')}</p>
                                    <p className="text-sm text-slate-300 font-medium">Docker Compose</p>
                                </div>
                                <div className="bg-white/5 p-3 rounded-xl border border-white/5">
                                    <p className="text-[10px] text-slate-500 uppercase font-bold mb-1">{t('runtime')}</p>
                                    <p className="text-sm text-slate-300 font-medium">{systemInfo?.nodeVersion}</p>
                                </div>
                            </div>
                        </div>

                        {/* Remote Nodes Management */}
                        <div className="bg-[#0d1117] border border-white/5 rounded-2xl p-6 shadow-xl">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="p-2 bg-emerald-500/10 rounded-lg">
                                    <Network className="w-5 h-5 text-emerald-500" />
                                </div>
                                <h3 className="text-lg font-bold text-white">{t('remoteDockerNodes')}</h3>
                            </div>

                            <div className="flex flex-col gap-4">
                                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                    <div className="col-span-2">
                                        <label className="text-[10px] uppercase font-bold text-slate-500 ml-1 mb-1 block">{t('nodeAddress')}</label>
                                        <Input
                                            className="bg-white/5 border-white/10 text-white placeholder:text-slate-700"
                                            placeholder="192.168.1.100"
                                            value={remoteHost}
                                            onChange={e => setRemoteHost(e.target.value)}
                                        />
                                    </div>
                                    <div>
                                        <label className="text-[10px] uppercase font-bold text-slate-500 ml-1 mb-1 block">{t('port')}</label>
                                        <Input
                                            className="bg-white/5 border-white/10 text-white"
                                            value={remotePort}
                                            onChange={e => setRemotePort(e.target.value)}
                                        />
                                    </div>
                                    <div className="flex items-end">
                                        <Button
                                            onClick={handleSaveRemoteNode}
                                            className="w-full bg-blue-600 hover:bg-blue-700 font-bold flex gap-2 transition-all"
                                        >
                                            <Plus className="w-4 h-4" /> Add
                                        </Button>
                                    </div>
                                </div>

                                <div className="mt-4 p-4 rounded-xl border border-dashed border-white/10 flex items-center justify-center bg-white/[0.02]">
                                    <p className="text-xs text-slate-500 italic flex items-center gap-2">
                                        <ExternalLink className="w-3 h-3" />
                                        {t('advancedNodeInfo')}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </TabsContent>

                <TabsContent value="backup" className="mt-6 animate-in fade-in slide-in-from-top-4 duration-300">
                    {/* (Existing Backup Content...) */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Local Backup */}
                        <div className="bg-[#0d1117] border border-white/5 rounded-2xl p-6 shadow-xl flex flex-col gap-4">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-emerald-500/10 rounded-lg">
                                    <HardDrive className="w-5 h-5 text-emerald-500" />
                                </div>
                                <h3 className="text-lg font-bold text-white">{t('localBackup')}</h3>
                            </div>
                            <p className="text-sm text-slate-400 leading-relaxed">
                                Download a complete snapshot of all your projects, including Docker Compose definitions and layout metadata.
                            </p>
                            <Button
                                onClick={handleLocalBackup}
                                disabled={isExporting}
                                className="mt-2 w-full bg-emerald-600 hover:bg-emerald-700 font-bold flex gap-2 transition-all shadow-lg shadow-emerald-500/20"
                            >
                                <Download className="w-4 h-4" />
                                {isExporting ? t('exporting') : t('downloadJsonBackup')}
                            </Button>
                        </div>

                        {/* Cloud Backup */}
                        <div className="bg-[#0d1117] border border-white/5 rounded-2xl p-6 shadow-xl flex flex-col gap-4">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-emerald-500/10 rounded-lg">
                                    <Cloud className="w-5 h-5 text-emerald-500" />
                                </div>
                                <h3 className="text-lg font-bold text-white">{t('cloudSync')}</h3>
                            </div>
                            <p className="text-sm text-slate-400 leading-relaxed">
                                Keep your projects synchronized automatically across your devices using Google Drive.
                            </p>
                            <Button
                                onClick={handleDriveBackup}
                                className="mt-2 w-full bg-emerald-500 hover:bg-emerald-600 font-bold flex gap-2 transition-all shadow-lg shadow-emerald-500/20"
                            >
                                <Cloud className="w-4 h-4" />
                                {t('connectGoogleDrive')}
                            </Button>
                        </div>
                    </div>

                    <div className="mt-6 bg-slate-900/40 border border-dashed border-white/10 rounded-2xl p-6 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <Archive className="w-10 h-10 text-slate-600" />
                            <div>
                                <h4 className="font-bold text-slate-300">{t('exportRawVolumes')}</h4>
                                <p className="text-xs text-slate-500">Coming soon: Direct export of persistent container data into TAR archives.</p>
                            </div>
                        </div>
                        <Button variant="outline" disabled className="border-white/10 text-slate-500">{t('enableBeta')}</Button>
                    </div>
                </TabsContent>

                <TabsContent value="security" className="mt-6 animate-in fade-in slide-in-from-top-4 duration-300">
                    <div className="bg-rose-500/5 border border-rose-500/10 rounded-2xl p-8 shadow-xl">
                        <h3 className="text-xl font-bold text-rose-500 mb-4 flex items-center gap-2">
                            <ShieldAlert className="w-5 h-5" />
                            {t('dangerZone')}
                        </h3>
                        <p className="text-slate-400 text-sm mb-6 leading-relaxed">
                            Deleting your account is a permanent action. All your projects, shared links, and deployment configurations will be destroyed immediately. This cannot be undone.
                        </p>
                        <Dialog>
                            <DialogTrigger asChild>
                                <Button variant="destructive" className="bg-rose-600 hover:bg-rose-700 font-bold px-8 shadow-lg shadow-rose-500/20">
                                    {t('deleteMyAccount')}
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="bg-gradient-to-br from-emerald-500/10 via-teal-500/10 to-cyan-500/10 border border-emerald-500/10 text-white">
                                <DialogHeader className="text-xl font-bold text-white">{t('permanentlyDeleteAccount')}</DialogHeader>
                                <div className="flex flex-col gap-4 py-4">
                                    <p className="text-slate-400 text-sm">
                                        This will destroy the account and all data associated with it. <br />
                                        <strong className="text-rose-400">You will lose all your projects.</strong>
                                    </p>
                                    <div className="bg-slate-900/50 p-3 rounded-lg border border-white/5">
                                        <p className="text-xs text-slate-500 mb-2">To confirm, please type exactly:</p>
                                        <p className="text-xs font-mono font-bold text-rose-400 italic cursor-default select-all mb-3">delete my account and loose my data</p>
                                        <Input
                                            className="bg-white/5 border-white/10 text-white placeholder:text-slate-700 focus:ring-rose-500/50"
                                            placeholder="confirm passphrase..."
                                            value={confirm}
                                            onChange={e => setConfirm(e.target.value)}
                                        />
                                    </div>
                                </div>
                                <DialogFooter className="gap-2">
                                    <DialogClose asChild>
                                        <Button variant="ghost" className="hover:bg-white/5 border border-white/5 text-slate-400">
                                            {t('cancel')}
                                        </Button>
                                    </DialogClose>
                                    <Button
                                        type="submit"
                                        onClick={() => (handleDelete())}
                                        disabled={confirm !== "delete my account and loose my data"}
                                        className="bg-rose-600 hover:bg-rose-700 transition-all font-bold px-6 shadow-lg shadow-rose-500/20"
                                    >
                                        {t('yesDeleteEverything')}
                                    </Button>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>
                    </div>
                </TabsContent>
            </Tabs>
        </section>
    )
}