import useSelectionStore from "@/store/selection";
import { useComposeStore } from "@/store/compose";
import { Volume } from "@composecraft/docker-compose-lib";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FolderTree } from "lucide-react";

const VOLUME_DRIVERS = [
    { value: "local", label: "Local", description: "Default Docker volume driver" },
    { value: "nfs", label: "NFS", description: "Network File System" },
    { value: "tmpfs", label: "Tmpfs", description: "Memory-based filesystem" },
    { value: "bind", label: "Bind", description: "Bind mount (host path)" },
];

const MOUNT_TYPES = [
    { value: "volume", label: "Docker Volume", description: "Managed by Docker" },
    { value: "bind", label: "Bind Mount", description: "Host directory" },
    { value: "tmpfs", label: "Tmpfs", description: "Memory filesystem" },
    { value: "npipe", label: "Named Pipe", description: "Windows named pipe" },
];

export default function VolumeEditor() {

    const { selectedId } = useSelectionStore();
    const { compose, setCompose } = useComposeStore();

    function getVolume(): Volume | undefined {
        return compose.volumes.get("id", selectedId)
    }

    return (
        <form className="flex flex-col gap-4 p-4 bg-gradient-to-br from-amber-500/10 via-orange-500/10 to-yellow-500/10 backdrop-blur-2xl border border-amber-500/10 rounded-2xl shadow-xl animate-in fade-in slide-in-from-right-4 duration-500 text-slate-300 w-[280px]">
            <h2 className="text-3xl font-black tracking-tighter text-white flex items-center gap-2 drop-shadow-md">
                <FolderTree className="w-8 h-8 text-amber-500" />
                Volume
            </h2>
            <div className="flex flex-col gap-6 w-full mt-2">
                <div className="flex flex-col gap-2">
                    <label className="text-sm font-bold text-slate-400" htmlFor="target">Volume Name</label>
                    <Input name="target" placeholder="my-volume"
                        value={getVolume()?.name}
                        className="bg-white/5 border-white/10 text-white"
                        onChange={(e) => {
                            setCompose(() => {
                                const vol = getVolume()
                                if (vol) {
                                    vol.name = e.target.value
                                }
                            })
                        }}
                    />
                </div>
                
                <div className="flex flex-col gap-2">
                    <label className="text-sm font-bold text-slate-400">Mount Type</label>
                    <Select 
                        value={getVolume()?.driver || "local"}
                        onValueChange={(value) => {
                            setCompose(() => {
                                const vol = getVolume()
                                if (vol) {
                                    vol.driver = value
                                }
                            })
                        }}
                    >
                        <SelectTrigger className="bg-white/5 border-white/10 text-white">
                            <SelectValue placeholder="Select mount type" />
                        </SelectTrigger>
                        <SelectContent>
                            {MOUNT_TYPES.map((mount) => (
                                <SelectItem key={mount.value} value={mount.value}>
                                    <div className="flex flex-col">
                                        <span className="font-bold">{mount.label}</span>
                                        <span className="text-xs text-slate-500">{mount.description}</span>
                                    </div>
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                {getVolume()?.driver !== "tmpfs" && (
                    <div className="flex flex-col gap-2">
                        <label className="text-sm font-bold text-slate-400">Driver</label>
                        <Select 
                            value={getVolume()?.driver || "local"}
                            onValueChange={(value) => {
                                setCompose(() => {
                                    const vol = getVolume()
                                    if (vol) {
                                        vol.driver = value
                                    }
                                })
                            }}
                        >
                            <SelectTrigger className="bg-white/5 border-white/10 text-white">
                                <SelectValue placeholder="Select driver" />
                            </SelectTrigger>
                            <SelectContent>
                                {VOLUME_DRIVERS.map((driver) => (
                                    <SelectItem key={driver.value} value={driver.value}>
                                        <div className="flex flex-col">
                                            <span className="font-bold">{driver.label}</span>
                                            <span className="text-xs text-slate-500">{driver.description}</span>
                                        </div>
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                )}

                {getVolume()?.driver === "nfs" && (
                    <div className="flex flex-col gap-2">
                        <label className="text-sm font-bold text-slate-400">NFS Options</label>
                        <Input 
                            placeholder="o: addr=192.168.1.1,rw"
                            value={getVolume()?.driver_opts?.find((opt: any) => opt.key === "type")?.value || ""}
                            className="bg-white/5 border-white/10 text-white"
                            onChange={(e) => {
                                setCompose(() => {
                                    const vol = getVolume()
                                    if (vol) {
                                        if (!vol.driver_opts) {
                                            vol.driver_opts = []
                                        }
                                        const typeOpt = vol.driver_opts.find((opt: any) => opt.key === "type")
                                        if (typeOpt) {
                                            typeOpt.value = e.target.value
                                        } else {
                                            vol.driver_opts.push({ id: Math.random().toString(), key: "type", value: e.target.value })
                                        }
                                    }
                                })
                            }}
                        />
                    </div>
                )}
            </div>
        </form>
    )
}