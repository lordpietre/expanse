"use client"

import { create } from 'zustand';
import { Compose, Translator, Service, Env, Binding, Image, PortMapping, SuperSet, KeyValue, Network } from "expanse-docker-lib";
import { generateRandomName } from "@/lib/utils";
import { registerCompose } from "@/actions/userActions";
import { toPng } from 'html-to-image';
import useComposeIdStore from "@/store/composeId";
import toast from "react-hot-toast";
import usePositionMap from "@/store/metadataMap";
import { extractMetadata } from "@/lib/metadata";
import useDisableStateStore from "@/store/disabled";
import { TemplateService } from "@/types/library";
import { useSystemStore } from "@/store/systemStore";
import useSelectionStore from "@/store/selection";

interface ComposeState {
    compose: Compose;
    tick: number;
    isDirty: boolean;
    setCompose: (updater: (currentCompose: Compose) => void) => Promise<boolean>;
    replaceCompose: (newCompose: Compose, options?: { disableSave?: boolean }) => void;
    addServiceFromTemplate: (template: TemplateService) => Promise<void>;
    resetCompose: () => void;
}

export async function save(compose: Compose) {
    const { id: composeId, setId } = useComposeIdStore.getState();
    const translator = new Translator(compose);
    // Capture screenshot client-side
    let imageBase64: string | undefined = undefined;
    if (typeof document !== 'undefined') {
        try {
            const playgroundElement = document.querySelector('.react-flow__renderer') as HTMLElement;
            if (playgroundElement) {
                imageBase64 = await toPng(playgroundElement, {
                    backgroundColor: '#0a0d14',
                    width: 1200,
                    height: 800,
                    style: {
                        transform: 'scale(1)',
                    }
                });
            }
        } catch (error) {
            console.error("Failed to capture playground screenshot:", error);
        }
    }

    const id = await registerCompose(
        translator.toDict(),
        extractMetadata(compose, usePositionMap.getState().positionMap),
        composeId,
        imageBase64
    );
    setId(id);

    // After successful save, mark as clean
    useComposeStore.setState({ isDirty: false });

    // Persist ID in URL to ensure F5 doesn't lose the project
    if (typeof window !== 'undefined' && id) {
        const url = new URL(window.location.href);
        if (url.searchParams.get('id') !== id) {
            url.searchParams.set('id', id);
            window.history.pushState({}, '', url.toString());
        }
    }
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
        isDirty: false,
        setCompose: async (updater: (currentCompose: Compose) => void) => {
            const { state: disabledSave } = useDisableStateStore.getState();
            const { compose, tick } = get();

            const previousHash = compose.hash();
            updater(compose);
            const newHash = compose.hash();
            const hasChanged = newHash !== previousHash;

            if (hasChanged) {
                set({ tick: tick + 1, isDirty: true });
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

            set({ compose: newCompose, tick: get().tick + 1, isDirty: !disableSave });

            if (!disableSave) {
                debouncedSave(newCompose);
            }
        },
        resetCompose: () => {
            const newCompose = new Compose({ name: generateRandomName() });
            set({
                compose: newCompose,
                tick: get().tick + 1,
                isDirty: false
            });

            // Reset metadata, selection and ID
            useComposeIdStore.getState().setId(undefined);
            useSelectionStore.getState().setSelectedString("");
            usePositionMap.getState().setPositionMap(new Map());
            usePositionMap.getState().setConnectionMap(new Map());

            // Clean URL
            if (typeof window !== 'undefined') {
                const url = new URL(window.location.href);
                url.searchParams.delete('id');
                window.history.replaceState({}, '', url.toString());
            }
        },
        addServiceFromTemplate: async (template: TemplateService) => {
            const { setCompose } = useComposeStore.getState();

            const stackSuffix = generateRandomName().substring(0, 4);

            const createService = (tmp: TemplateService, isRelated = false): Service => {
                const [imageName, imageTag] = tmp.image.split(':');
                const newEnvironment = new SuperSet<Readonly<Env>>();
                const newPorts: PortMapping[] = [];
                const newBindings = new SuperSet<Binding>();

                if (tmp.env_vars) {
                    Object.entries(tmp.env_vars).forEach(([key, value]) => {
                        newEnvironment.add(new Env(key, value));
                    });
                }

                if (tmp.default_ports) {
                    const { usedPorts } = useSystemStore.getState();
                    tmp.default_ports.forEach(p => {
                        const [hostPortStr, containerPortStr] = p.split(':');
                        let hostPort = parseInt(hostPortStr);
                        const containerPort = parseInt(containerPortStr);

                        if (usedPorts.includes(hostPort)) {
                            let newPort = hostPort + 1;
                            while (usedPorts.includes(newPort)) {
                                newPort++;
                            }
                            hostPort = newPort;
                            useSystemStore.setState({ usedPorts: [...usedPorts, hostPort] });
                        }
                        newPorts.push(new PortMapping({ hostPort, containerPort }));
                    });
                }

                if (tmp.volumes) {
                    tmp.volumes.forEach(v => {
                        const [source, target] = v.split(':');
                        newBindings.add(new Binding({ source, target }));
                    });
                }

                const baseName = tmp.name.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
                // Use the consistent stack suffix
                const finalName = isRelated && baseName.length < 8 ? baseName : baseName + "_" + stackSuffix;

                return new Service({
                    name: finalName,
                    image: new Image({ name: imageName, tag: imageTag }),
                    environment: newEnvironment.size > 0 ? newEnvironment : undefined,
                    ports: newPorts.length > 0 ? newPorts : undefined,
                    bindings: newBindings.size > 0 ? newBindings : undefined,
                    labels: tmp.logo ? [new KeyValue("com.expanse.logo", tmp.logo)] : undefined,
                    command: typeof tmp.command === 'string' ? [tmp.command] : tmp.command
                });
            };

            await setCompose((compose) => {
                const addNetwork = !!template.related_services;
                let stackNetwork: Network | undefined;
                if (addNetwork) {
                    const netName = template.name.toLowerCase().replace(/\s+/g, '') + "_net";
                    stackNetwork = new Network({ name: netName });
                    compose.addNetwork(stackNetwork);
                }

                const mainService = createService(template);
                if (stackNetwork) {
                    mainService.networks = new SuperSet<Network>([stackNetwork]);
                }
                compose.addService(mainService);

                const allServices: Service[] = [mainService];
                const nameMap = new Map<string, string>();

                // Add main service to name map
                const mainBaseName = template.name.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
                nameMap.set(mainBaseName, mainService.name);

                if (template.related_services) {
                    template.related_services.forEach(rel => {
                        const relService = createService(rel, true);
                        if (stackNetwork) {
                            relService.networks = new SuperSet<Network>([stackNetwork]);
                        }

                        const baseName = rel.name.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
                        nameMap.set(baseName, relService.name);

                        allServices.push(relService);
                        compose.addService(relService);
                        // Automatically make the main service depend on the related one
                        mainService.depends_on.add(relService);
                    });
                }

                // Update all services (main + related) environment and commands with dynamically generated names
                allServices.forEach(srv => {
                    // Update Environment
                    if (srv.environment) {
                        const updatedEnv = new SuperSet<Readonly<Env>>();
                        srv.environment.forEach(env => {
                            let newValue = env.value;
                            if (newValue && nameMap.has(newValue)) {
                                newValue = nameMap.get(newValue) as string;
                            } else if (newValue) {
                                nameMap.forEach((finalName, originalName) => {
                                    // 1. Replace bracketed placeholders like ${service} -> service_xyz
                                    const placeholderRegex = new RegExp(`\\$\\{${originalName}\\}`, 'g');
                                    newValue = newValue!.replace(placeholderRegex, finalName);

                                    // 2. Replace bare names with boundaries (avoiding protocol schemes)
                                    const bareRegex = new RegExp(`(?<=[@\\/:]|\\s|^)${originalName}(?=[@\\/:]|\\s|$)(?!:\\/\\/)`, 'g');
                                    newValue = newValue!.replace(bareRegex, finalName);
                                });
                            }
                            updatedEnv.add(new Env(env.key, newValue));
                        });
                        srv.environment = updatedEnv;
                    }

                    // Update Command
                    if (srv.command) {
                        if (Array.isArray(srv.command)) {
                            srv.command = (srv.command as string[]).map(cmdPart => {
                                let newPart = cmdPart;
                                nameMap.forEach((finalName, originalName) => {
                                    const placeholderRegex = new RegExp(`\\$\\{${originalName}\\}`, 'g');
                                    newPart = newPart.replace(placeholderRegex, finalName);

                                    const bareRegex = new RegExp(`(?<=[@\\/:]|\\s|^)${originalName}(?=[@\\/:]|\\s|$)(?!:\\/\\/)`, 'g');
                                    newPart = newPart.replace(bareRegex, finalName);
                                });
                                return newPart;
                            });
                        } else {
                            let newCommand = srv.command as unknown as string;
                            nameMap.forEach((finalName, originalName) => {
                                const placeholderRegex = new RegExp(`\\$\\{${originalName}\\}`, 'g');
                                newCommand = newCommand.replace(placeholderRegex, finalName);

                                const bareRegex = new RegExp(`(?<=[@\\/:]|\\s|^)${originalName}(?=[@\\/:]|\\s|$)(?!:\\/\\/)`, 'g');
                                newCommand = newCommand.replace(bareRegex, finalName);
                            });
                            srv.command = newCommand as any;
                        }
                    }
                });
            });

            toast.success(`${template.name} added to compose`);
        },
    };
});
