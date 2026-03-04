import useSelectionStore from "@/store/selection";
import { useComposeStore } from "@/store/compose";
import { Env } from "expanse-docker-lib";
import { Input } from "@/components/ui/input";
import { Key } from "lucide-react";

export default function EnvEditor() {

    const { selectedId } = useSelectionStore();
    const { compose, setCompose } = useComposeStore();

    function getEnv(): Env | null {
        const env = compose.envs.get("id", selectedId)
        if (env) {
            return env
        }
        return null;
    }

    const env = getEnv();
    if (!env) return null;

    return (
        <form className="flex flex-col gap-6 p-6 glass border-white/40 rounded-3xl shadow-2xl animate-in fade-in slide-in-from-right-4 duration-500">
            <h2 className="text-3xl font-black tracking-tighter text-slate-800 flex items-center gap-2">
                <Key className="w-8 h-8 text-violet-500" />
                Environment
            </h2>
            <div className="flex flex-col gap-5 w-full">
                <div className="flex flex-col gap-2">
                    <label htmlFor="target">key</label>
                    <Input name="target" value={env.key}
                        onChange={(e) => {
                            setCompose(() => {
                                env.key = e.target.value
                            })
                        }}
                    />
                </div>
            </div>
            <div className="flex flex-col gap-5 w-full">
                <div className="flex flex-col gap-2">
                    <label htmlFor="target">Value</label>
                    <Input name="target" value={env.value}
                        onChange={(e) => {
                            setCompose(() => {
                                env.value = e.target.value
                            })
                        }}
                    />
                </div>
            </div>
        </form>
    )
}