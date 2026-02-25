"use client"

import { create } from 'zustand';
import { Compose, Translator, Service, Env, Binding, Image, PortMapping, SuperSet } from "@composecraft/docker-compose-lib";
import { generateRandomName } from "@/lib/utils";
import { registerCompose } from "@/actions/userActions";
import useComposeIdStore from "@/store/composeId";
import toast from "react-hot-toast";
import usePositionMap from "@/store/metadataMap";
import { extractMetadata } from "@/lib/metadata";
import useDisableStateStore from "@/store/disabled";
import { TemplateService } from "@/types/library";
import { useSystemStore } from "@/store/systemStore";

interface ComposeState {
    compose: Compose;
    tick: number;
    setCompose: (updater: (currentCompose: Compose) => void) => Promise<boolean>;
    replaceCompose: (newCompose: Compose, options?: { disableSave?: boolean }) => void;
    addServiceFromTemplate: (template: TemplateService) => Promise<void>;
}

export async function save(compose: Compose) {
    const { id: composeId, setId } = useComposeIdStore.getState();
    const translator = new Translator(compose)
    const id = await registerCompose(
        translator.toDict(),
        extractMetadata(compose, usePositionMap.getState().positionMap),
        composeId
    )
    setId(id)
}

// Debounce helper for saving
let saveTimeout: NodeJS.Timeout | null = null;
const debouncedSave = (compose: Compose) => {
    if (saveTimeout) clearTimeout(saveTimeout);
    saveTimeout = setTimeout(() => {
        toast.promise(
            save(compose),
            {
                loading: 'Saving...',
                success: "Saved",
                error: "Error on save"
            }
        );
    }, 2000);
};

export const useComposeStore = create<ComposeState>((set, get) => {
    return {
        compose: new Compose({ name: generateRandomName() }),
        tick: 0,
        setCompose: async (updater: (currentCompose: Compose) => void) => {
            const { state: disabledSave } = useDisableStateStore.getState();
            const { compose, tick } = get();

            const previousHash = compose.hash();
            updater(compose);
            const newHash = compose.hash();
            const hasChanged = newHash !== previousHash;

            if (hasChanged) {
                set({ tick: tick + 1 });
                if (!disabledSave) {
                    debouncedSave(compose);
                }
            }
            return hasChanged;
        },
        replaceCompose: (newCompose: Compose, options?: { disableSave?: boolean }) => {
            const { state: disabledSaveGlobal } = useDisableStateStore.getState();
            const disableSave = options?.disableSave ?? disabledSaveGlobal;

            if (!newCompose.name) {
                newCompose.name = generateRandomName();
            }

            set({ compose: newCompose, tick: get().tick + 1 });

            if (!disableSave) {
                debouncedSave(newCompose);
            }
        },
        addServiceFromTemplate: async (template: TemplateService) => {
            const { setCompose } = useComposeStore.getState();
            await setCompose((compose) => {
                const [imageName, imageTag] = template.image.split(':');

                const newEnvironment = new SuperSet<Readonly<Env>>();
                const newPorts: PortMapping[] = [];
                const newBindings = new SuperSet<Binding>();

                if (template.env_vars) {
                    Object.entries(template.env_vars).forEach(([key, value]) => {
                        newEnvironment.add(new Env(key, value));
                    });
                }

                if (template.default_ports) {
                    const { usedPorts } = useSystemStore.getState();
                    template.default_ports.forEach(p => {
                        const [hostPortStr, containerPortStr] = p.split(':');
                        let hostPort = parseInt(hostPortStr);
                        const containerPort = parseInt(containerPortStr);

                        if (usedPorts.includes(hostPort)) {
                            let newPort = hostPort + 1;
                            while (usedPorts.includes(newPort)) {
                                newPort++;
                            }
                            console.log(`Port ${hostPort} in use. Reassigning to ${newPort}`);
                            hostPort = newPort;
                            useSystemStore.setState({ usedPorts: [...usedPorts, hostPort] });
                        }
                        newPorts.push(new PortMapping({ hostPort, containerPort }));
                    });
                }

                if (template.volumes) {
                    template.volumes.forEach(v => {
                        const [source, target] = v.split(':');
                        newBindings.add(new Binding({ source, target }));
                    });
                }

                const newService = new Service({
                    name: template.name.toLowerCase() + "_" + generateRandomName().substring(0, 4),
                    image: new Image({ name: imageName, tag: imageTag }),
                    environment: newEnvironment.size > 0 ? newEnvironment : undefined,
                    ports: newPorts.length > 0 ? newPorts : undefined,
                    bindings: newBindings.size > 0 ? newBindings : undefined
                });

                compose.addService(newService);
                toast.success(`${template.name} added to compose`);
            });
        }
    };
});
