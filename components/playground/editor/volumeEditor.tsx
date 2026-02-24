import useSelectionStore from "@/store/selection";
import { useComposeStore } from "@/store/compose";
import { Volume } from "@composecraft/docker-compose-lib";
import { Input } from "@/components/ui/input";

export default function VolumeEditor() {

    const { selectedId } = useSelectionStore();
    const { compose, setCompose } = useComposeStore();

    function getVolume(): Volume | undefined {
        return compose.volumes.get("id", selectedId)
    }

    return (
        <form className="flex flex-col gap-6 p-6 bg-[#0a0d14]/90 backdrop-blur-2xl border border-white/10 rounded-3xl shadow-2xl animate-in fade-in slide-in-from-right-4 duration-500 text-slate-300">
            <h2 className="text-3xl font-black tracking-tighter text-white flex items-center gap-2 drop-shadow-md">
                Volume
            </h2>
            <div className="flex flex-col gap-6 w-full mt-2">
                <div className="flex flex-col gap-2">
                    <label className="text-sm font-bold text-slate-400" htmlFor="target">Name</label>
                    <Input name="target" value={getVolume()?.name}
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
            </div>
        </form>
    )
}