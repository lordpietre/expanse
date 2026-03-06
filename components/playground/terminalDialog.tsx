"use client"

import React, { useState, useRef, useEffect, useCallback } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { execDockerCommand } from "@/actions/dockerActions";
import { Terminal as TerminalIcon, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Terminal } from "xterm";
import { FitAddon } from "xterm-addon-fit";
import "xterm/css/xterm.css";

interface TerminalDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    containerId: string;
    containerName: string;
}

export default function TerminalDialog({ open, onOpenChange, containerId, containerName }: TerminalDialogProps) {
    const [isExecuting, setIsExecuting] = useState(false);

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-[900px] w-[90vw] bg-[hsl(222,47%,5%)] border-emerald-500/10 p-0 overflow-hidden shadow-2xl rounded-[1.5rem]">
                <DialogHeader className="p-4 bg-slate-900/50 border-b border-emerald-500/10 flex flex-row items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-1.5 bg-emerald-500/10 rounded-lg">
                            <TerminalIcon className="w-4 h-4 text-emerald-400" />
                        </div>
                        <DialogTitle className="text-sm font-bold text-slate-300">
                            Expanse TTY: <span className="text-emerald-400">{containerName}</span>
                        </DialogTitle>
                    </div>
                    <div className="flex items-center gap-2">
                        {isExecuting && <Loader2 className="w-3 h-3 text-emerald-400 animate-spin" />}
                        <div className={cn("w-2 h-2 rounded-full animate-pulse", isExecuting ? "bg-amber-500" : "bg-emerald-500")} />
                        <span className="text-[10px] text-slate-500 uppercase font-black tracking-widest">{isExecuting ? 'Executing...' : 'Active Session'}</span>
                    </div>
                </DialogHeader>

                <div className="flex flex-col h-[500px] bg-black/40 relative">
                    {/* Render inner shell only when dialog is open to ensure ref is attached */}
                    {open && (
                        <TerminalShell
                            containerId={containerId}
                            containerName={containerName}
                            isExecutingStatus={isExecuting}
                            setExecutingStatus={setIsExecuting}
                        />
                    )}

                    {/* Decor Overlay */}
                    <div className="absolute top-0 left-0 right-0 h-8 bg-gradient-to-b from-black/20 to-transparent pointer-events-none" />
                </div>
            </DialogContent>
        </Dialog>
    );
}

function TerminalShell({
    containerId,
    containerName,
    isExecutingStatus,
    setExecutingStatus
}: {
    containerId: string;
    containerName: string;
    isExecutingStatus: boolean;
    setExecutingStatus: (v: boolean) => void;
}) {
    const terminalRef = useRef<HTMLDivElement>(null);
    const xtermRef = useRef<Terminal | null>(null);
    const cmdBuf = useRef("");
    const isExecutingRef = useRef(false);

    // Keep ref in sync
    useEffect(() => {
        isExecutingRef.current = isExecutingStatus;
    }, [isExecutingStatus]);

    const executeCommand = useCallback(async (cmd: string, term: Terminal) => {
        setExecutingStatus(true);
        try {
            const res = await execDockerCommand(containerId, cmd);
            if (res.success) {
                const lines = (res.output || "").split('\n');
                lines.forEach(line => term.writeln(line));
            } else {
                term.write(`\r\n\x1b[31mError: ${res.error || "Execution failed"}\x1b[0m\r\n`);
            }
        } catch (error: any) {
            term.write(`\r\n\x1b[31mUnexpected Error: ${error.message || "Unknown error"}\x1b[0m\r\n`);
        } finally {
            term.write("\x1b[1;32m➜\x1b[0m ");
            setExecutingStatus(false);
            setTimeout(() => term.focus(), 10);
        }
    }, [containerId, setExecutingStatus]);

    useEffect(() => {
        if (!terminalRef.current) return;

        const term = new Terminal({
            cursorBlink: true,
            fontSize: 12,
            fontFamily: '"JetBrains Mono", "Fira Code", monospace',
            theme: {
                background: 'transparent',
                foreground: '#cbd5e1',
                cursor: '#10b981',
                selectionBackground: 'rgba(16, 185, 129, 0.3)',
                black: '#0f172a',
                red: '#f43f5e',
                green: '#10b981',
                yellow: '#f59e0b',
                blue: '#3b82f6',
                magenta: '#8b5cf6',
                cyan: '#06b6d4',
                white: '#f8fafc',
            },
            allowProposedApi: true
        });

        const fitAddon = new FitAddon();
        term.loadAddon(fitAddon);

        term.open(terminalRef.current);

        // Initial fit with small delay to ensure container size is final
        setTimeout(() => fitAddon.fit(), 50);

        term.writeln("\x1b[1;32mWelcome to Expanse Terminal\x1b[0m");
        term.writeln(`\x1b[2mConnected to: ${containerName}\x1b[0m`);
        term.writeln("\x1b[2mType a command below to execute...\x1b[0m\r\n");
        term.write("\x1b[1;32m➜\x1b[0m ");

        term.onData((data) => {
            if (isExecutingRef.current) return;

            if (data === '\r') {
                const currentCmd = cmdBuf.current.trim();
                cmdBuf.current = "";
                term.write('\r\n');

                if (currentCmd) {
                    executeCommand(currentCmd, term);
                } else {
                    term.write("\x1b[1;32m➜\x1b[0m ");
                }
            } else if (data === '\x7f' || data === '\b') {
                if (cmdBuf.current.length > 0) {
                    cmdBuf.current = cmdBuf.current.slice(0, -1);
                    term.write('\b \b');
                }
            } else if (data.startsWith('\x1b')) {
                return;
            } else {
                cmdBuf.current += data;
                term.write(data);
            }
        });

        xtermRef.current = term;

        const handleResize = () => fitAddon.fit();
        window.addEventListener('resize', handleResize);

        // Autofocus
        setTimeout(() => term.focus(), 150);

        return () => {
            window.removeEventListener('resize', handleResize);
            term.dispose();
            xtermRef.current = null;
        };
    }, [containerName, executeCommand]);

    return (
        <div ref={terminalRef} className="flex-grow p-4 overflow-hidden h-full" />
    );
}
