"use client"

import React, { useState, useRef, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { execDockerCommand } from "@/actions/dockerActions";
import { Terminal, Send, Loader2, ChevronRight, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface TerminalDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    containerId: string;
    containerName: string;
}

export default function TerminalDialog({ open, onOpenChange, containerId, containerName }: TerminalDialogProps) {
    const [command, setCommand] = useState("");
    const [history, setHistory] = useState<{ id: string; type: 'cmd' | 'out' | 'err'; content: string }[]>([]);
    const [isExecuting, setIsExecuting] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [history]);

    useEffect(() => {
        if (open) {
            setTimeout(() => inputRef.current?.focus(), 100);
        }
    }, [open]);

    const handleExecute = async (e?: React.FormEvent) => {
        e?.preventDefault();
        if (!command.trim() || isExecuting) return;

        const currentCmd = command.trim();
        setHistory(prev => [...prev, { id: Math.random().toString(), type: 'cmd', content: currentCmd }]);
        setCommand("");
        setIsExecuting(true);

        try {
            const res = await execDockerCommand(containerId, currentCmd);
            if (res.success) {
                setHistory(prev => [...prev, { id: Math.random().toString(), type: 'out', content: res.output || "" }]);
            } else {
                setHistory(prev => [...prev, { id: Math.random().toString(), type: 'err', content: res.error || "Execution failed" }]);
            }
        } catch (error: any) {
            setHistory(prev => [...prev, { id: Math.random().toString(), type: 'err', content: error.message || "Unexpected error" }]);
        } finally {
            setIsExecuting(false);
            inputRef.current?.focus();
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-[800px] bg-gradient-to-br from-emerald-500/5 via-teal-500/5 to-cyan-500/5 border-emerald-500/10 p-0 overflow-hidden shadow-2xl rounded-[1.5rem]">
                <DialogHeader className="p-4 bg-slate-900/50 border-b border-white/5 flex flex-row items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-1.5 bg-emerald-500/10 rounded-lg">
                            <Terminal className="w-4 h-4 text-emerald-400" />
                        </div>
                        <DialogTitle className="text-sm font-bold text-slate-300">
                            Terminal: <span className="text-emerald-400">{containerName}</span>
                        </DialogTitle>
                    </div>
                </DialogHeader>

                <div className="flex flex-col h-[450px]">
                    <div
                        ref={scrollRef}
                        className="flex-grow p-4 overflow-y-auto font-mono text-xs custom-scrollbar bg-black/20"
                    >
                        {history.length === 0 ? (
                            <div className="text-slate-600 italic">
                                Ready. Type a command to start (e.g., ls, pwd, cat...)
                            </div>
                        ) : (
                            <div className="flex flex-col gap-2">
                                {history.map((item) => (
                                    <div key={item.id} className={cn(
                                        "whitespace-pre-wrap leading-relaxed",
                                        item.type === 'cmd' ? "text-emerald-400 font-bold flex gap-2" :
                                            item.type === 'err' ? "text-rose-400" : "text-slate-300"
                                    )}>
                                        {item.type === 'cmd' && <ChevronRight className="w-3 h-3 mt-0.5 shrink-0" />}
                                        {item.content}
                                    </div>
                                ))}
                                {isExecuting && (
                                    <div className="flex items-center gap-2 text-slate-500 italic animate-pulse">
                                        <Loader2 className="w-3 h-3 animate-spin" />
                                        Thinking...
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    <form
                        onSubmit={handleExecute}
                        className="p-4 bg-slate-900/30 border-t border-white/5 flex items-center gap-3"
                    >
                        <div className="flex-grow relative">
                            <ChevronRight className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-500/50" />
                            <input
                                ref={inputRef}
                                type="text"
                                value={command}
                                onChange={(e) => setCommand(e.target.value)}
                                disabled={isExecuting}
                                placeholder="docker exec command..."
                                className="w-full bg-black/40 border border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-xs font-mono text-white placeholder:text-slate-700 focus:outline-none focus:ring-1 focus:ring-emerald-500/50 transition-all"
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={isExecuting || !command.trim()}
                            className="p-2.5 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 disabled:bg-slate-800 rounded-xl transition-all shadow-lg shadow-emerald-950"
                        >
                            <Send className="w-4 h-4 text-white" />
                        </button>
                    </form>
                </div>
            </DialogContent>
        </Dialog>
    );
}
