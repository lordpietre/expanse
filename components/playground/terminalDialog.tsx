"use client"

import React, { useState, useRef, useEffect, useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { execDockerCommand } from "@/actions/dockerActions";
import { Terminal as TerminalIcon, Send, Loader2, ChevronRight, Maximize2 } from "lucide-react";
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
    const [command, setCommand] = useState("");
    const [isExecuting, setIsExecuting] = useState(false);
    const terminalRef = useRef<HTMLDivElement>(null);
    const xtermRef = useRef<Terminal | null>(null);
    const fitAddonRef = useRef<FitAddon | null>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    // Initialize xterm.js
    useEffect(() => {
        if (!terminalRef.current || xtermRef.current) return;

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
        fitAddon.fit();

        term.writeln("\x1b[1;32mWelcome to Expanse Terminal\x1b[0m");
        term.writeln(`\x1b[2mConnected to: ${containerName}\x1b[0m`);
        term.writeln("\x1b[2mType a command below to execute...\x1b[0m\r\n");

        xtermRef.current = term;
        fitAddonRef.current = fitAddon;

        return () => {
            term.dispose();
            xtermRef.current = null;
        };
    }, [open, containerName]);

    // Handle resizing
    useEffect(() => {
        const handleResize = () => {
            fitAddonRef.current?.fit();
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Refit when open status changes
    useEffect(() => {
        if (open) {
            setTimeout(() => {
                fitAddonRef.current?.fit();
                inputRef.current?.focus();
            }, 100);
        }
    }, [open]);

    const handleExecute = async (e?: React.FormEvent) => {
        e?.preventDefault();
        if (!command.trim() || isExecuting || !xtermRef.current) return;

        const currentCmd = command.trim();
        const term = xtermRef.current;

        // Display command in terminal
        term.write(`\r\n\x1b[1;32m➜\x1b[0m \x1b[1m${currentCmd}\x1b[0m\r\n`);

        setCommand("");
        setIsExecuting(true);

        try {
            const res = await execDockerCommand(containerId, currentCmd);
            if (res.success) {
                // Handle results that might contain multiple lines
                const lines = (res.output || "").split('\n');
                lines.forEach(line => term.writeln(line));
            } else {
                term.write(`\x1b[31mError: ${res.error || "Execution failed"}\x1b[0m\r\n`);
            }
        } catch (error: any) {
            term.write(`\x1b[31mUnexpected Error: ${error.message || "Unknown error"}\x1b[0m\r\n`);
        } finally {
            setIsExecuting(false);
            inputRef.current?.focus();
        }
    };

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
                        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                        <span className="text-[10px] text-slate-500 uppercase font-black tracking-widest">Active Session</span>
                    </div>
                </DialogHeader>

                <div className="flex flex-col h-[500px] bg-black/40 relative">
                    {/* Terminal Area */}
                    <div
                        ref={terminalRef}
                        className="flex-grow p-4 overflow-hidden"
                    />

                    {/* Input Area */}
                    <form
                        onSubmit={handleExecute}
                        className="p-4 bg-slate-900/30 border-t border-emerald-500/10 flex items-center gap-3"
                    >
                        <div className="flex-grow relative group">
                            <ChevronRight className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-500/30 group-focus-within:text-emerald-500 transition-colors" />
                            <input
                                ref={inputRef}
                                type="text"
                                value={command}
                                onChange={(e) => setCommand(e.target.value)}
                                disabled={isExecuting}
                                placeholder="Type command here..."
                                className="w-full bg-black/60 border border-white/5 rounded-xl py-3 pl-10 pr-4 text-xs font-mono text-emerald-400 placeholder:text-slate-700 outline-none focus:border-emerald-500/20 focus:ring-1 focus:ring-emerald-500/20 transition-all shadow-inner"
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={isExecuting || !command.trim()}
                            className="p-3 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-30 disabled:bg-slate-800 rounded-xl transition-all shadow-lg shadow-emerald-500/10 flex items-center justify-center min-w-[48px]"
                        >
                            {isExecuting ? <Loader2 className="w-4 h-4 text-white animate-spin" /> : <Send className="w-4 h-4 text-white" />}
                        </button>
                    </form>

                    {/* Decor Overlay */}
                    <div className="absolute top-0 left-0 right-0 h-8 bg-gradient-to-b from-black/20 to-transparent pointer-events-none" />
                </div>
            </DialogContent>
        </Dialog>
    );
}
