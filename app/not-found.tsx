'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import {
    Search,
    ChevronLeft,
    Home,
    Infinity as InfinityIcon,
    AlertCircle,
    Compass,
    Unplug
} from 'lucide-react';

export default function NotFound() {
    return (
        <div className="min-h-screen bg-background flex items-center justify-center p-6 relative overflow-hidden">
            {/* Arid Background Elements */}
            <div className="absolute top-0 left-0 w-full h-full">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/10 blur-[120px] rounded-full animate-pulse" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-500/10 blur-[120px] rounded-full animate-pulse decoration-delay-2000" />
            </div>

            <div className="relative z-10 w-full max-w-2xl flex flex-col items-center text-center">
                {/* 404 Glitch Number */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="relative mb-8"
                >
                    <h1 className="text-[12rem] md:text-[18rem] font-black leading-none tracking-tighter text-foreground/5 select-none animate-pulse">
                        404
                    </h1>
                    <div className="absolute inset-0 flex items-center justify-center">
                        <motion.div
                            animate={{
                                rotateY: [0, 180, 360],
                                scale: [1, 1.1, 1]
                            }}
                            transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                            className="p-8 rounded-[3rem] bg-card border border-border shadow-2xl shadow-primary/20 backdrop-blur-xl"
                        >
                            <Unplug className="w-20 h-20 text-primary stroke-[2.5]" />
                        </motion.div>
                    </div>
                </motion.div>

                {/* Error Message */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.2 }}
                    className="space-y-4 mb-12"
                >
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary mb-4">
                        <AlertCircle className="w-3.5 h-3.5" />
                        <span className="text-[10px] font-black uppercase tracking-[0.2em]">Error de Redirección</span>
                    </div>

                    <h2 className="text-4xl md:text-5xl font-black tracking-tighter text-foreground uppercase italic underline decoration-8 decoration-primary/10 underline-offset-8 mb-6">
                        Módulo no <span className="text-primary">Disponible</span>
                    </h2>

                    <p className="text-muted-foreground text-sm font-medium max-w-sm mx-auto leading-relaxed">
                        Parece que has intentado acceder a un segmento de la infraestructura que no existe o ha sido reubicado.
                    </p>
                </motion.div>

                {/* Action Buttons */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto"
                >
                    <button
                        onClick={() => window.history.back()}
                        className="w-full sm:w-auto h-14 px-8 rounded-2xl bg-muted/50 border border-border hover:bg-muted text-foreground transition-all flex items-center justify-center gap-3 group"
                    >
                        <ChevronLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-foreground">Regresar</span>
                    </button>

                    <Link
                        href="/dashboard"
                        className="w-full sm:w-auto h-14 px-10 rounded-2xl bg-primary text-white font-black text-xs uppercase tracking-[0.2em] shadow-xl shadow-primary/20 hover:opacity-90 active:scale-95 transition-all flex items-center justify-center gap-3"
                    >
                        <Home className="w-5 h-5" />
                        Ir al Dashboard
                    </Link>
                </motion.div>

                {/* System Stats (Purely Aesthetic) */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 0.4 }}
                    transition={{ delay: 0.6 }}
                    className="mt-20 pt-10 border-t border-border/10 w-full flex justify-between items-center text-[8px] font-black text-muted-foreground uppercase tracking-[0.3em]"
                >
                    <div className="flex items-center gap-2">
                        <Compass className="w-3 h-3" />
                        <span>Geo-Coordinates: Unknown</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <InfinityIcon className="w-3 h-3" />
                        <span>PROGRAMA PROFE Core v4.5.0</span>
                    </div>
                </motion.div>
            </div>

            {/* Scanning Effect Overlay */}
            <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_center,_transparent_0%,_rgba(0,0,0,0.02)_100%)]" />
            <div className="absolute top-0 left-0 w-full h-1 bg-primary/20 animate-scan pointer-events-none" />
        </div>
    );
}
