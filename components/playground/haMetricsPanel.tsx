"use client"

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Server, Database, Network, Activity } from "lucide-react";
import { useExecutionStore } from "@/store/execution";

interface HaMetricsPanelProps {
    minReplicas?: number;
    maxReplicas?: number;
}

export function HaMetricsPanel({ minReplicas = 1, maxReplicas = 1 }: HaMetricsPanelProps) {
    const { serviceStatuses } = useExecutionStore();

    const runningInstances = Object.values(serviceStatuses).filter(s => s.status === 'running').length;
    const totalInstances = Object.keys(serviceStatuses).length;
    const isHealthy = runningInstances === totalInstances && totalInstances >= minReplicas;

    const hasLoadBalancer = Object.keys(serviceStatuses).some(name =>
        name.toLowerCase().includes('lb') || name.toLowerCase().includes('haproxy')
    );
    const hasConnectionPool = Object.keys(serviceStatuses).some(name =>
        name.toLowerCase().includes('pgbouncer')
    );
    const hasDatabase = Object.keys(serviceStatuses).some(name =>
        name.toLowerCase().includes('db') || name.toLowerCase().includes('postgres')
    );

    return (
        <Card className="mt-4 border-emerald-500/20 bg-emerald-500/5">
            <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Activity className="w-4 h-4 text-emerald-500" />
                    HA Metrics
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center gap-2">
                        <Server className="w-4 h-4 text-slate-500" />
                        <div>
                            <div className="text-xl font-bold">{runningInstances}/{totalInstances}</div>
                            <p className="text-xs text-slate-500">Instances</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <Badge variant={isHealthy ? "success" : "warning"} className="text-xs">
                            {isHealthy ? "Healthy" : "Degraded"}
                        </Badge>
                    </div>
                </div>

                <div className="space-y-2">
                    <div className="text-xs font-medium text-slate-400">HA Components</div>
                    <div className="flex flex-wrap gap-2">
                        {hasLoadBalancer && (
                            <Badge variant="outline" className="text-xs gap-1">
                                <Network className="w-3 h-3" /> HAProxy
                            </Badge>
                        )}
                        {hasConnectionPool && (
                            <Badge variant="outline" className="text-xs gap-1">
                                <Database className="w-3 h-3" /> PgBouncer
                            </Badge>
                        )}
                        {hasDatabase && (
                            <Badge variant="outline" className="text-xs gap-1">
                                <Server className="w-3 h-3" /> PostgreSQL
                            </Badge>
                        )}
                    </div>
                </div>

                <div className="space-y-1 text-xs text-slate-500">
                    <div>Min replicas: {minReplicas}</div>
                    <div>Max replicas: {maxReplicas}</div>
                </div>

                {totalInstances > 0 && (
                    <div className="pt-2 border-t border-emerald-500/10">
                        <div className="space-y-1">
                            {Object.entries(serviceStatuses).map(([name, status]) => (
                                <div key={name} className="flex items-center justify-between text-xs">
                                    <span className="text-slate-400 font-mono truncate max-w-[150px]">{name}</span>
                                    <Badge
                                        variant={status.status === 'running' ? "success" : "destructive"}
                                        className="text-[10px]"
                                    >
                                        {status.status}
                                    </Badge>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}