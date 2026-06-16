"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogTrigger, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { dockerSearch, pullDockerImage } from "@/actions/dockerActions"
import { useComposeStore } from "@/store/compose"
import { Container, Search, Download, Rocket, RefreshCw, Star, Loader2 } from "lucide-react"
import toast from "react-hot-toast"

interface DockerImage {
    Name: string
    Description: string
    StarCount: number
    IsOfficial: boolean
    IsAutomated: boolean
}

export default function ImageSearchDialog({ children }: { children: React.ReactNode }) {
    const [open, setOpen] = useState(false)
    const [query, setQuery] = useState("")
    const [images, setImages] = useState<DockerImage[]>([])
    const [searching, setSearching] = useState(false)
    const [pulling, setPulling] = useState<string | null>(null)
    const [pulledImages, setPulledImages] = useState<Set<string>>(new Set())

    const { addServiceFromImage } = useComposeStore()

    useEffect(() => {
        if (!open) {
            setQuery("")
            setImages([])
            setPulledImages(new Set())
        }
    }, [open])

    const handleSearch = async () => {
        if (!query.trim()) return
        setSearching(true)
        const res = await dockerSearch(query)
        if (res.error) {
            toast.error(res.error)
        } else {
            setImages(res.results)
        }
        setSearching(false)
    }

    useEffect(() => {
        if (!query.trim() || query.trim().length < 2) {
            setImages([])
            return
        }
        const timer = setTimeout(handleSearch, 500)
        return () => clearTimeout(timer)
    }, [query])

    const handlePull = async (imageName: string) => {
        setPulling(imageName)
        const res = await pullDockerImage(imageName)
        if (res.success) {
            toast.success(`Pulled: ${imageName}`)
            setPulledImages(prev => new Set(prev).add(imageName))
        } else {
            toast.error(res.error || "Pull failed")
        }
        setPulling(null)
    }

    const handleDeploy = async (imageName: string) => {
        await addServiceFromImage(imageName)
        toast.success(`${imageName} added to canvas`)
        setOpen(false)
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {children}
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col glass border-white/20 p-0">
                <DialogTitle className="sr-only">Search Docker Images</DialogTitle>
                <div className="p-6 border-b border-white/5">
                    <div className="flex items-center gap-3">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                            <Input
                                value={query}
                                onChange={e => setQuery(e.target.value)}
                                placeholder="Search Docker Hub for images..."
                                className="pl-10 bg-white/5 border-white/10 text-white placeholder-slate-600"
                                autoFocus
                                onKeyDown={e => e.key === 'Enter' && handleSearch()}
                            />
                        </div>
                        <Button
                            onClick={handleSearch}
                            disabled={searching || !query.trim()}
                            className="bg-indigo-500 hover:bg-indigo-600 text-white"
                        >
                            {searching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                        </Button>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-2">
                    {images.length === 0 && query.trim().length >= 2 && !searching && (
                        <div className="text-center py-8 text-slate-500">
                            No images found for "{query}"
                        </div>
                    )}
                    {images.map(img => (
                        <div key={img.Name}
                            className="flex items-start justify-between p-4 bg-white/5 border border-white/5 rounded-xl hover:border-indigo-500/30 transition-all">
                            <div className="flex items-start gap-3 min-w-0 flex-1">
                                <div className="p-2 rounded-lg bg-indigo-500/10 border border-indigo-500/20 shrink-0">
                                    <Container className="w-4 h-4 text-indigo-400" />
                                </div>
                                <div className="min-w-0 flex-1">
                                    <div className="flex items-center gap-2">
                                        <div className="font-bold text-sm text-white truncate">{img.Name}</div>
                                        {img.IsOfficial && (
                                            <span className="text-[8px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 shrink-0">
                                                Official
                                            </span>
                                        )}
                                    </div>
                                    <div className="text-[10px] text-slate-500 line-clamp-2 mt-1">{img.Description || "No description"}</div>
                                    <div className="flex items-center gap-4 mt-2">
                                        <div className="flex items-center gap-1">
                                            <Star className="w-3 h-3 text-amber-400" />
                                            <span className="text-[9px] text-amber-400 font-bold">{img.StarCount?.toLocaleString()}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="flex gap-2 shrink-0 ml-3">
                                <Button
                                    onClick={() => handleDeploy(img.Name)}
                                    className="bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/30 text-emerald-400 text-xs gap-1"
                                    title="Deploy to canvas"
                                >
                                    <Rocket className="w-3 h-3" /> Deploy
                                </Button>
                                <Button
                                    onClick={() => handlePull(img.Name)}
                                    disabled={pulling === img.Name || pulledImages.has(img.Name)}
                                    className="bg-indigo-500/20 hover:bg-indigo-500/30 border border-indigo-500/30 text-indigo-400 text-xs"
                                    title="Pull image"
                                >
                                    {pulling === img.Name ? (
                                        <RefreshCw className="w-3 h-3 animate-spin" />
                                    ) : pulledImages.has(img.Name) ? (
                                        <span className="text-[10px]">Pulled</span>
                                    ) : (
                                        <Download className="w-3 h-3" />
                                    )}
                                </Button>
                            </div>
                        </div>
                    ))}
                </div>
            </DialogContent>
        </Dialog>
    )
}
