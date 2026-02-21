'use client';

import { Megaphone, Calendar, LayoutGrid, Bell, ArrowRight, Share2, MessageSquare } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

export default function ComunicacionDashboard() {
    const modules = [
        {
            title: 'Gestión de Eventos',
            description: 'Organización de seminarios, webinars y encuentros presenciales.',
            icon: Calendar,
            href: '/dashboard/eventos',
            color: 'bg-rose-500/10 text-rose-600',
            border: 'hover:border-rose-200'
        },
        {
            title: 'Blog de Noticias',
            description: 'Publicación de artículos, tutoriales y novedades académicas.',
            icon: LayoutGrid,
            href: '/dashboard/blogs',
            color: 'bg-indigo-500/10 text-indigo-600',
            border: 'hover:border-indigo-200'
        },
        {
            title: 'Comunicados Oficiales',
            description: 'Difusión de circulares, avisos urgentes y notificaciones institucionales.',
            icon: Bell,
            href: '/dashboard/comunicados',
            color: 'bg-amber-500/10 text-amber-600',
            border: 'hover:border-amber-200'
        }
    ];

    return (
        <div className="space-y-10">
            <div className="space-y-1">
                <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.3em] text-primary mb-3">
                    <Megaphone className="w-4 h-4" />
                    <span>Canales de Comunicación</span>
                </div>
                <h1 className="text-4xl font-black tracking-tighter text-foreground uppercase leading-none">Comunicación</h1>
                <p className="text-sm font-medium text-muted-foreground max-w-lg">
                    Plataforma de difusión para mantener informada a la comunidad académica y administrativa.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {modules.map((module, idx) => (
                    <motion.div
                        key={module.title}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: idx * 0.1 }}
                    >
                        <Link href={module.href}>
                            <Card className={cn(
                                "p-8 hover:shadow-2xl transition-all h-full border-border/40 group flex flex-col justify-between",
                                module.border
                            )}>
                                <div className="space-y-6">
                                    <div className={`w-14 h-14 rounded-2xl ${module.color} flex items-center justify-center transition-transform group-hover:scale-110`}>
                                        <module.icon className="w-8 h-8" />
                                    </div>
                                    <div className="space-y-2">
                                        <h3 className="text-lg font-black tracking-tighter uppercase">{module.title}</h3>
                                        <p className="text-[10px] font-medium text-muted-foreground leading-relaxed italic">
                                            {module.description}
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-2 text-[8px] font-black uppercase tracking-widest text-primary pt-4 group-hover:translate-x-2 transition-transform">
                                        Ver Contenido <ArrowRight className="w-3 h-3" />
                                    </div>
                                </div>
                            </Card>
                        </Link>
                    </motion.div>
                ))}
            </div>
        </div>
    );
}
