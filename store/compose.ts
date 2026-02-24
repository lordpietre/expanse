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

export const useComposeStore = create<ComposeState>((set) => {
    let lastCallTime = Date.now()

    const shouldPerformCustom = () => {
        return Date.now() - lastCallTime > 3000;
    };

    return {
        compose: new Compose({ name: generateRandomName() }),
        tick: 0,
        setCompose: (updater: (currentCompose: Compose) => void) => {
            return new Promise((resolve) => {
                set((state) => {
                    const { state: disabledSave } = useDisableStateStore.getState();
                    const previousHash = state.compose.hash()
                    updater(state.compose);
                    const newHash = state.compose.hash()
                    const hasCHanged = newHash !== previousHash
                    // Only save if not explicitly disabled
                    if (!disabledSave) {
                        setTimeout(() => {
                            const a = shouldPerformCustom()
                            if (a && hasCHanged) {
                                toast.promise(
                                    save(state.compose),
                                    {
                                        loading: 'Saving...',
                                        success: "Saved",
                                        error: "Error on save"
                                    }
                                )
                            }
                        }, 3000)
                    }

                    lastCallTime = Date.now();
                    // Resolve the promise immediately with the hasCHanged value
                    resolve(hasCHanged);
                    return { compose: state.compose, tick: state.tick + 1 };
                });
            });
        },
        replaceCompose: (newCompose: Compose) => {
            set((state) => {
                const { state: disabledSave } = useDisableStateStore.getState();
                const previousHash = state.compose.hash()
                const hasCHanged = newCompose.hash() === previousHash
                lastCallTime = Date.now();

                if (!newCompose.name) {
                    newCompose.name = generateRandomName()
                }

                // Only save if not explicitly disabled
                if (!disabledSave) {
                    if (hasCHanged) {
                        setTimeout(() => {
                            toast.promise(
                                save(newCompose),
                                {
                                    loading: 'Saving...',
                                    success: "Saved",
                                    error: "Error on save"
                                }
                            )
                        }, 3000)
                    }
                }

                // Return the new state
                return { compose: newCompose, tick: state.tick + 1 };
            });
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
