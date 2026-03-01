"use client"

import { create } from 'zustand';
import { Compose, Translator, Service, Env, Binding, Image, PortMapping, SuperSet, KeyValue } from "expanse-docker-lib";
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

interface ComposeState {
    compose: Compose;
    tick: number;
    setCompose: (updater: (currentCompose: Compose) => void) => Promise<boolean>;
    replaceCompose: (newCompose: Compose, options?: { disableSave?: boolean }) => void;
    addServiceFromTemplate: (template: TemplateService) => Promise<void>;
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
                // For related services (like "db") we try to keep the exact name if it's short, 
                // but for main ones we add a random suffix to avoid collisions.
                const finalName = isRelated && baseName.length < 8 ? baseName : baseName + "_" + generateRandomName().substring(0, 4);

                return new Service({
                    name: finalName,
                    image: new Image({ name: imageName, tag: imageTag }),
                    environment: newEnvironment.size > 0 ? newEnvironment : undefined,
                    ports: newPorts.length > 0 ? newPorts : undefined,
                    bindings: newBindings.size > 0 ? newBindings : undefined,
                    labels: tmp.logo ? [new KeyValue("com.expanse.logo", tmp.logo)] : undefined
                });
            };

            await setCompose((compose) => {
                const mainService = createService(template);
                compose.addService(mainService);

                if (template.related_services) {
                    template.related_services.forEach(rel => {
                        const relService = createService(rel, true);
                        compose.addService(relService);
                        // Automatically make the main service depend on the related one
                        mainService.depends_on.push(relService);
                    });
                }

                toast.success(`${template.name} added to compose`);
            });
        }
    };
});
