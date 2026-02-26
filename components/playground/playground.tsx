import React, { forwardRef, useCallback, useEffect, useImperativeHandle, useMemo, useState } from "react";
import {
    Node,
    XYPosition,
    Dimensions,
    Edge, OnSelectionChangeParams, EdgeChange, Controls, Background, BackgroundVariant,
    ReactFlow,
    useReactFlow,
    MiniMap,
    useNodes
} from "@xyflow/react";
import { useComposeStore } from "@/store/compose";
import ServiceNode from "@/components/playground/node/serviceNode";
import NetworkNode from "@/components/playground/node/networkNode";
import { Binding, Compose, Env, KeyValue, Network, SuperSet, Volume, Service } from "@composecraft/docker-compose-lib";
import { dependencyEdgeStyle, envEdgeStyle, networkEdgeStyle, volumeEdgeStyle, labelEdgeStyle } from "@/components/playground/node/utils";
import ELK from 'elkjs/lib/elk.bundled.js';

import '@xyflow/react/dist/style.css'
import useSelectionStore from "@/store/selection";
import VolumeNode from "@/components/playground/node/volumeNode";
import BindingNode from "@/components/playground/node/bindingNode";
import EnvNode from "@/components/playground/node/envNode";
import usePositionMap from "@/store/metadataMap";
import { handleBackspacePress } from "./playgroundUtils";
import LabelNode from "./node/labelNode";
import toast from "react-hot-toast";

export type NodeData = {
    position: XYPosition,
    dimension?: Dimensions
}

export interface PlaygroundHandle {
    onLayout: (direction: string) => void;
    setHideControls: (hide: boolean) => void;
}

export interface PlaygroundProps {
    hideControlsByDefault?: boolean;
}

const AutoCenter = () => {
    const { setCenter, getNode } = useReactFlow();
    const { selectedId } = useSelectionStore();

    useEffect(() => {
        if (selectedId) {
            const node = getNode(selectedId);
            if (node && node.position) {
                const width = node.measured?.width || 200;
                const height = node.measured?.height || 200;
                const x = node.position.x + width / 2;
                const y = node.position.y + height / 2;
                setCenter(x, y, { zoom: 1.1, duration: 800 });
            }
        }
    }, [selectedId, setCenter, getNode]);

    return null;
};

const FitViewOnAdd = () => {
    const { fitView } = useReactFlow();
    const nodes = useNodes();
    const prevCount = React.useRef(nodes.length);

    useEffect(() => {
        if (nodes.length > prevCount.current) {
            // Slight delay to ensure new node is rendered with its dimensions
            setTimeout(() => {
                fitView({ padding: 0.2, duration: 800 });
            }, 50);
        }
        prevCount.current = nodes.length;
    }, [nodes.length, fitView]);

    return null;
};

const getDbEnvVars = (source: Service, dbServiceName: string): Record<string, string> | null => {
    const image = (source.image?.name || "").toLowerCase();

    const getSourceEnv = (keys: string[]): string => {
        if (!source.environment) return "";
        for (const k of keys) {
            const found = Array.from(source.environment).find(e => e.key === k);
            if (found?.value) return found.value;
        }
        return "";
    };

    if (image.includes("mariadb") || image.includes("mysql")) {
        const rootPwd = getSourceEnv(["MARIADB_ROOT_PASSWORD", "MYSQL_ROOT_PASSWORD"]);
        const dbName = getSourceEnv(["MARIADB_DATABASE", "MYSQL_DATABASE"]);
        const dbUser = getSourceEnv(["MARIADB_USER", "MYSQL_USER"]) || "root";
        const dbPwd = getSourceEnv(["MARIADB_USER", "MYSQL_USER"])
            ? getSourceEnv(["MARIADB_PASSWORD", "MYSQL_PASSWORD"])
            : rootPwd;
        const resolvedDb = dbName || "app";

        return {
            WORDPRESS_DB_HOST: dbServiceName,
            WORDPRESS_DB_USER: dbUser,
            WORDPRESS_DB_PASSWORD: dbPwd || rootPwd,
            WORDPRESS_DB_NAME: resolvedDb,
            DB_SERVER: dbServiceName,
            DB_USER: dbUser,
            DB_PASSWD: dbPwd || rootPwd,
            DB_NAME: resolvedDb,
            MYSQL_HOST: dbServiceName,
            MYSQL_USER: dbUser,
            MYSQL_PASSWORD: dbPwd || rootPwd,
            MYSQL_DATABASE: resolvedDb,
        };
    }
    if (image.includes("postgres")) {
        const pgUser = getSourceEnv(["POSTGRES_USER"]) || "postgres";
        const pgPwd = getSourceEnv(["POSTGRES_PASSWORD"]);
        const pgDb = getSourceEnv(["POSTGRES_DB"]) || pgUser;
        return {
            POSTGRES_HOST: dbServiceName,
            POSTGRES_USER: pgUser,
            POSTGRES_PASSWORD: pgPwd,
            POSTGRES_DB: pgDb,
            DATABASE_URL: `postgresql://${pgUser}:${pgPwd}@${dbServiceName}:5432/${pgDb}`,
        };
    }
    if (image.includes("mongo")) {
        const mongoUser = getSourceEnv(["MONGO_INITDB_ROOT_USERNAME", "MONGO_USER"]);
        const mongoPwd = getSourceEnv(["MONGO_INITDB_ROOT_PASSWORD", "MONGO_PASSWORD"]);
        const mongoDb = getSourceEnv(["MONGO_INITDB_DATABASE"]) || "app";
        const auth = mongoUser ? `${mongoUser}:${mongoPwd}@` : "";
        return {
            MONGO_HOST: dbServiceName,
            MONGO_PORT: "27017",
            MONGODB_URI: `mongodb://${auth}${dbServiceName}:27017/${mongoDb}`,
            MONGO_INITDB_DATABASE: mongoDb,
        };
    }
    if (image.includes("redis")) {
        const redisPwd = getSourceEnv(["REDIS_PASSWORD", "REQUIREPASS"]);
        return {
            REDIS_HOST: dbServiceName,
            REDIS_PORT: "6379",
            REDIS_URL: redisPwd
                ? `redis://:${redisPwd}@${dbServiceName}:6379`
                : `redis://${dbServiceName}:6379`,
        };
    }
    return null;
};

const handleDbAutoInject = (source: Service, target: Service) => {
    const sourceImage = (source.image?.name || "").toLowerCase();
    const isDatabase = sourceImage.includes('db') || sourceImage.includes('sql') ||
        sourceImage.includes('mongo') || sourceImage.includes('redis') ||
        sourceImage.includes('postgres') || sourceImage.includes('maria') ||
        sourceImage.includes('mysql');

    if (isDatabase) {
        const dbMeta = usePositionMap.getState().dbNodeMeta.get(source.id);
        const shouldOverwrite = dbMeta?.overwriteEnvVars ?? true;
        
        const envVars = getDbEnvVars(source, source.name);
        if (envVars) {
            if (!target.environment) {
                target.environment = new SuperSet<Readonly<Env>>();
            }
            
            if (shouldOverwrite) {
                const dbKeys = new Set(Object.keys(envVars));
                const toRemove = Array.from(target.environment).filter(e => dbKeys.has(e.key));
                toRemove.forEach(e => target.environment!.delete(e));
            }

            Object.entries(envVars).forEach(([key, value]) => {
                if (value !== "") {
                    if (shouldOverwrite || !Array.from(target.environment!).some(e => e.key === key)) {
                        target.environment!.add(new Env(key, value));
                    }
                }
            });
            return true;
        }
    }
    return false;
};

const Playground = forwardRef<PlaygroundHandle, PlaygroundProps>(({ hideControlsByDefault = false }, ref) => {

    const { compose, setCompose, tick } = useComposeStore();
    const [select, setSelect] = useState("")
    const { positionMap, setPositionMap, connectionMap } = usePositionMap()
    const { setSelectedString } = useSelectionStore()
    const [isDraggable, setIsDraggable] = useState(true)
    const [hideControls, setHideControls] = useState(hideControlsByDefault)

    const updatePosition = useCallback((key: string, newPosition: XYPosition) => {
        const currentEntry = positionMap.get(key);
        if (currentEntry?.position === newPosition) {
            return
        }
        const updatedMap = new Map(positionMap);
        updatedMap.set(key, {
            position: newPosition,
            dimension: currentEntry?.dimension
        });
        setPositionMap(updatedMap);
    }, [positionMap, setPositionMap]);

    useEffect(() => {
        let maxAppY = 150;
        let maxRouterY = 50;
        let maxDbY = 300;
        const centerX = typeof window !== 'undefined' ? (window.innerWidth / 2) - 150 : 400;

        const newMap = new Map(positionMap);
        let hasChanges = false;

        const getOffset = () => Math.floor(Math.random() * 40 - 20);

        compose.services.forEach((service) => {
            if (!newMap.has(service.id)) {
                hasChanges = true;
                const name = service.name.toLowerCase();
                const image = service.image?.name?.toLowerCase() || "";

                if (image.includes("traefik") || image.includes("nginx") || image.includes("haproxy") || image.includes("caddy") || name.includes("router")) {
                    newMap.set(service.id, { position: { x: centerX + getOffset(), y: maxRouterY + getOffset() } });
                    maxRouterY += 50;
                } else if (image.includes("postgres") || image.includes("mysql") || image.includes("redis") || image.includes("mongo") || image.includes("mariadb") || name.includes("db")) {
                    newMap.set(service.id, { position: { x: centerX + getOffset(), y: maxDbY + getOffset() } });
                    maxDbY += 50;
                } else {
                    newMap.set(service.id, { position: { x: centerX + getOffset(), y: maxAppY + getOffset() } });
                    maxAppY += 50;
                }
            }
        });

        compose.networks.forEach((network) => {
            if (!newMap.has(network.id)) {
                hasChanges = true;
                newMap.set(network.id, { position: { x: centerX + 250 + getOffset(), y: 450 + getOffset() } });
            }
        });

        compose.volumes.forEach((volume) => {
            if (!newMap.has(volume.id)) {
                hasChanges = true;
                newMap.set(volume.id, { position: { x: centerX - 250 + getOffset(), y: 450 + getOffset() } });
            }
        });

        if (hasChanges) {
            setPositionMap(newMap);
        }
    }, [compose, positionMap, setPositionMap, tick]);

    const nodeTypes = useMemo(() => (
        {
            service: ServiceNode,
            network: NetworkNode,
            volume: VolumeNode,
            binding: BindingNode,
            env: EnvNode,
            label: LabelNode
        }
    ), [])

    const elk = new ELK();
    const defaultOptions = {
        'elk.algorithm': 'force',
        'elk.force.iterations': '300',
        'elk.force.repulsivePower': '0.5',
        'elk.force.attractivePower': '0.3',
        'elk.spacing.nodeNode': '40',
        'elk.spacing.componentComponent': '30',
        'elk.force.temperature': '0.1',
        'elk.force.gravityConstant': '0.2',
        'elk.force.minDistanceConstant': '2',
        'elk.portConstraints': 'FIXED_SIDE',
        'elk.ports.fixedSide': 'WEST'
    };

    function composeToNodes(compose: Compose): Node[] {
        const result: Node[] = []
        compose.services.forEach((service) => {
            result.push({
                id: service.id,
                position: positionMap.get(service.id)?.position || { x: 10, y: 10 },
                type: "service",
                data: { service },
                draggable: true
            } as Node)
            service.bindings.forEach((binding) => {
                if (!Object.prototype.hasOwnProperty.call(binding.source, "id")) {
                    result.push({
                        id: binding.id,
                        position: positionMap.get(binding.id)?.position || { x: 10, y: 10 },
                        type: "binding",
                        data: { binding },
                        draggable: true
                    } as Node)
                }
            })
            service.labels?.filter(label => !label.key.startsWith('com.composecraft.')).forEach(label => {
                result.push({
                    id: label.id,
                    position: positionMap.get(label.id)?.position || { x: 10, y: 10 },
                    type: "label",
                    data: { label },
                    draggable: true
                })
            })
        })
        compose.networks.forEach((network) => result.push({
            id: network.id,
            position: positionMap.get(network.id)?.position || { x: 10, y: 10 },
            type: "network",
            data: { network },
            draggable: true
        }))
        compose.volumes.forEach((volume) => {
            result.push({
                id: volume.id,
                position: positionMap.get(volume.id)?.position || { x: 10, y: 10 },
                type: "volume",
                data: { volume },
                draggable: true
            })
        })
        compose.envs.forEach((env) => {
            result.push({
                id: env.id,
                position: positionMap.get(env.id)?.position || { x: 10, y: 10 },
                type: "env",
                data: { env },
                draggable: true
            })
        })
        return result;
    }

    function composeToEdge(compose: Compose): Edge[] {
        const result: Edge[] = []
        const connectionMap = usePositionMap.getState().connectionMap;
        const networkPortCounts: Record<string, number> = {};

        compose.services.forEach((service) => {
            service.networks.forEach((network) => {
                const connectionKey = `${service.id}:${network.id}`;
                let targetHandle = connectionMap.get(connectionKey);

                if (!targetHandle) {
                    const portNum = (networkPortCounts[network.id] || 0) + 1;
                    networkPortCounts[network.id] = Math.min(portNum, 7);
                    targetHandle = `port-${networkPortCounts[network.id]}`;
                }

                result.push({
                    id: "edg-" + network.id + service.id,
                    source: service.id,
                    target: network.id,
                    sourceHandle: 'network',
                    targetHandle: targetHandle,
                    ...networkEdgeStyle
                } as Edge)
            })
            service.labels?.filter(label => !label.key.startsWith('com.composecraft.')).forEach(label => {
                result.push({
                    id: "edg-" + label.id + service.id,
                    source: service.id,
                    target: label.id,
                    sourceHandle: 'label',
                    targetHandle: 'label',
                    ...labelEdgeStyle
                } as Edge)
            })
            service.bindings.forEach((binding) => {
                if (!Object.prototype.hasOwnProperty.call(binding.source, "id")) {
                    result.push({
                        id: "edg-" + binding.id + service.id,
                        source: service.id,
                        target: binding.id,
                        sourceHandle: 'volume',
                        targetHandle: 'volume-target',
                        ...volumeEdgeStyle
                    } as Edge)
                } else {
                    const vol = binding.source as Volume
                    result.push({
                        id: "edg-" + vol.id + service.id,
                        source: vol.id,
                        target: service.id,
                        sourceHandle: 'volume',
                        targetHandle: 'volume-target',
                        ...volumeEdgeStyle
                    } as Edge)
                }
            })
            service.depends_on.forEach((targetService) => {
                result.push({
                    id: "edg-" + targetService.id + service.id,
                    source: service.id,
                    target: targetService.id,
                    sourceHandle: 'service',
                    targetHandle: 'service',
                    ...dependencyEdgeStyle
                } as Edge)
            })
            service.environment?.forEach((targetEnv) => {
                result.push({
                    id: "edg-" + targetEnv.id + service.id,
                    source: service.id,
                    target: targetEnv.id,
                    sourceHandle: 'env',
                    targetHandle: 'env',
                    ...envEdgeStyle
                } as Edge)
            })
        })
        return result
    }

    function onLayout() {
        const nodes = composeToNodes(compose);

        setTimeout(() => {
            const graph = {
                id: 'root',
                layoutOptions: defaultOptions,
                children: nodes.map((node) => {
                    const element = window.document.getElementById(node.id);
                    const width = element?.offsetWidth || 200;
                    const height = element?.offsetHeight || 200;
                    return {
                        id: node.id,
                        width,
                        height,
                        x: node.position.x,
                        y: node.position.y,
                    };
                }),
                edges: composeToEdge(compose).map((edge) => ({
                    id: edge.id,
                    sources: [edge.source],
                    targets: [edge.target]
                }))
            };

            elk.layout(graph).then(({ children }) => {
                if (children) {
                    const updates = new Map();
                    children.forEach((node) => {
                        updates.set(node.id, {
                            position: {
                                x: node.x || 0,
                                y: node.y || 0
                            }
                        });
                    });
                    setPositionMap(updates);
                }
            }).catch(error => {
                console.error('ELK layout error:', error);
            });
        }, 0);
    }

    useImperativeHandle(ref, () => ({
        onLayout,
        setHideControls
    }));

    const onNodesChanges = useCallback(
        (changes: any[]) => {
            if (!isDraggable) return;

            changes.forEach((change) => {
                if (change?.type === "position") {
                    if (change?.position?.x && change?.position?.y) {
                        updatePosition(change.id, change.position)
                    }
                }
            })
        },
        [updatePosition, isDraggable]
    )

    const onNodesConnect = async (params: any) => {
        const handleConnection = async (handler: (compose: Compose) => void, forceSuccess = false) => {
            const result = await setCompose(handler)
            if (!result && !forceSuccess) {
                toast.error(`can't assign ${params.targetHandle} handle with ${params.sourceHandle} handle`)
            }
        }

        if (params.sourceHandle === "network") {
            await handleConnection((compose) => {
                const service = compose.services.get("id", params.source)
                const network = compose.networks.get("id", params.target)
                if (service && network && params.targetHandle?.startsWith("port-")) {
                    service.networks.add(network)
                    const { connectionMap, setConnectionMap } = usePositionMap.getState();
                    const newMap = new Map(connectionMap);
                    newMap.set(`${params.source}:${params.target}`, params.targetHandle);
                    setConnectionMap(newMap);
                } else if (service && network && !params.targetHandle) {
                    service.networks.add(network)
                }
            }, true)
        } else if (params.sourceHandle === "service") {
            await handleConnection((compose) => {
                const source = compose.services.get("id", params.source)
                const target = compose.services.get("id", params.target)
                if (source && target) {
                    target.depends_on.add(source);
                    if (handleDbAutoInject(source, target)) {
                        toast.success(`✅ DB env vars from ${source.name} → ${target.name}`);
                    }
                }
            })
        } else if (params.sourceHandle === "volume") {
            await handleConnection((compose) => {
                const sourceService = compose.services.get("id", params.source)
                const targetVolume = compose.volumes.get("id", params.target)
                const sourceVolume = compose.volumes.get("id", params.source)
                const targetService = compose.services.get("id", params.target)

                if (sourceService && targetVolume) {
                    sourceService.bindings.add(new Binding({ source: targetVolume, target: "/data" }))
                } else if (sourceVolume && targetService) {
                    targetService.bindings.add(new Binding({ source: sourceVolume, target: "/data" }))
                }
            })
        } else if (params.sourceHandle === "env") {
            await handleConnection((compose) => {
                const service = compose.services.get("id", params.source)
                const env = compose.envs.get("id", params.target)
                if (service && env) {
                    if (!service.environment) service.environment = new SuperSet<Readonly<Env>>()
                    service.environment.add(env)
                }
            })
        } else if (params.sourceHandle === "label") {
            await handleConnection((compose) => {
                const service = compose.services.get("id", params.source)
                const resultNodes = composeToNodes(compose);
                const targetLabel = resultNodes.find(n => n.id === params.target)?.data.label;
                if (service && targetLabel) {
                    const label = targetLabel as KeyValue;
                    if (!service.labels) service.labels = [];
                    if (!service.labels.find(l => l.id === label.id)) {
                        service.labels.push(label);
                    }
                }
            })
        } else {
            toast.error(`can't assign ${params.targetHandle} handle with ${params.sourceHandle} handle`)
        }
    }

    const handleSelection = (data: OnSelectionChangeParams | EdgeChange[]) => {
        if (Object.prototype.hasOwnProperty.call(data, "nodes")) {
            const selectionParam = data as OnSelectionChangeParams
            if ((selectionParam.nodes.length >= 1)) {
                setSelect(selectionParam.nodes[0].id)
            }
        } else {
            const edgeChange = (data as any[])[0]
            if (edgeChange) setSelect(edgeChange.id)
        }
    }

    const handleKeyPress = (event: KeyboardEvent) => {
        // Ignore if user is typing in an input or textarea
        const target = event.target as HTMLElement;
        if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
            return;
        }

        const keyPressed = event.key;
        switch (keyPressed) {
            case 'Backspace':
            case 'Delete':
                handleBackspacePress(select, setCompose, setSelectedString)
                break;
            default:
                break;
        }
    }

    return (
        <ReactFlow
            nodes={composeToNodes(compose)}
            edges={composeToEdge(compose)}
            nodeTypes={nodeTypes}
            onNodesChange={onNodesChanges}
            onConnect={onNodesConnect}
            onSelectionChange={handleSelection}
            onEdgesChange={handleSelection}
            fitView
            //@ts-ignore
            onKeyDown={handleKeyPress}
            minZoom={Number.NEGATIVE_INFINITY}
            onPaneClick={() => {
                setSelectedString("")
            }}
            colorMode="dark"
            className="bg-gradient-to-br from-emerald-500/5 via-teal-500/5 to-cyan-500/5"
        >
            <AutoCenter />
            <FitViewOnAdd />
            <MiniMap
                className="bg-gradient-to-br from-emerald-500/10 via-teal-500/10 to-cyan-500/10 border border-emerald-500/10 rounded-xl overflow-hidden shadow-2xl"
                maskColor="rgba(255, 255, 255, 0.05)"
                nodeColor={(n) => {
                    if (n.type === 'service') return '#10b981';
                    if (n.type === 'network') return '#14b8a6';
                    if (n.type === 'volume') return '#f59e0b';
                    return '#64748b';
                }}
            />
            <Background id="1" variant={"dots" as BackgroundVariant} gap={12} size={1} color="rgba(74, 222, 128, 0.4)" />
            {!hideControls && <Controls
                onInteractiveChange={(isInteractive) => setIsDraggable(isInteractive)}
            />}
        </ReactFlow>
    )
}
)

export default Playground
