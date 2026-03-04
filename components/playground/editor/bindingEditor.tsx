import useSelectionStore from "@/store/selection";
import { useComposeStore } from "@/store/compose";
import { Binding } from "expanse-docker-lib";
import { Input } from "@/components/ui/input";

export default function BindingEditor() {

    const { selectedId } = useSelectionStore();
    const { compose, setCompose } = useComposeStore();

    function getBinding(): Binding | null {
        let result: Binding | null = null;
        compose.services.forEach((service) => {
            const found = service.bindings.get("id", selectedId);
            if (found) {
                result = found;
            }
        })
        return result
    }

    const binding = getBinding();
    if (!binding) return null;


    return (
        <form className="flex flex-col gap-5">
            <p className="text-2xl font-semibold">Binding</p>
            <div className="flex flex-col gap-5 w-full">
                <div className="flex flex-col gap-2">
                    <label htmlFor="target">Target</label>
                    <Input name="target" value={binding?.target}
                        onChange={(e) => {
                            setCompose((oldCompose) => {
                                oldCompose.services.forEach((service) => {
                                    service.bindings.forEach((binding) => {
                                        if (binding.id === selectedId) {
                                            const t = service.bindings.get("id", binding.id)
                                            if (t) {
                                                t.target = e.target.value
                                            }
                                        }
                                    })
                                })
                            })
                        }}
                    />
                </div>
                <div className="flex flex-col gap-2">
                    <label htmlFor="source">Source</label>
                    <Input name="source"
                        //@ts-ignore
                        value={binding?.source}
                        onChange={(e) => {
                            setCompose((oldCompose) => {
                                oldCompose.services.forEach((service) => {
                                    service.bindings.forEach((binding) => {
                                        if (binding.id === selectedId) {
                                            const t = service.bindings.get("id", binding.id)
                                            if (t) {
                                                t.source = e.target.value
                                            }
                                        }
                                    })
                                })
                            })
                        }}
                    />
                </div>
            </div>
        </form>
    )
}