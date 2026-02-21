'use client';

import { Shield, Building2, LayoutGrid, ArrowRight, Settings2, Globe, Share2 } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

export default function ProfeDashboard() {
    const modules = [
        {
            title: 'Datos Institucionales',
            description: 'Configuración global de la identidad institucional: Nombre, Misión, Visión y Redes.',
            icon: Building2,
            href: '/dashboard/profe/configuracion',
            color: 'bg-primary/10 text-primary',
            border: 'hover:border-primary/20'
        },
        {
            title: 'Presencia Digital',
            description: 'Gestión de banners, logos y recursos multimedia para la plataforma pública.',
            icon: Globe,
            href: '/dashboard/profe/configuracion', // Both point to the same page but different contexts
            color: 'bg-emerald-500/10 text-emerald-600',
            border: 'hover:border-emerald-200'
        },
        {
            title: 'Configuración de Sistema',
            description: 'Parámetros técnicos de la plataforma y llaves de integración externas.',
            icon: Settings2,
            href: '#',
            color: 'bg-slate-500/10 text-slate-600',
            border: 'opacity-50 cursor-not-allowed',
            soon: true
        }
    ];

    return (
        <div className="space-y-10">
            <div className="space-y-1">
                <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.3em] text-primary mb-3">
                    <Shield className="w-4 h-4" />
                    <span>Administración del Programa</span>
                </div>
                <h1 className="text-4xl font-black tracking-tighter text-foreground uppercase leading-none">Módulo PROFE</h1>
                <p className="text-sm font-medium text-muted-foreground max-w-lg">
                    Panel de administración central para la identidad corporativa y configuración de alto nivel de la plataforma.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {modules.map((module, idx) => (
                    <motion.div
                        key={module.title}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.1 }}
                    >
                        <Link href={module.href}>
                            <Card className={cn(
                                "p-8 hover:shadow-2xl transition-all h-full border-border/40 group relative flex flex-col justify-between",
                                module.border
                            )}>
                                {module.soon && (
                                    <span className="absolute top-4 right-4 bg-muted px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest">En desarrollo</span>
                                )}
                                <div className="space-y-6">
                                    <div className={`w-14 h-14 rounded-2xl ${module.color} flex items-center justify-center transition-transform group-hover:scale-110 shadow-inner`}>
                                        <module.icon className="w-8 h-8" />
                                    </div>
                                    <div className="space-y-2">
                                        <h3 className="text-lg font-black tracking-tighter uppercase">{module.title}</h3>
                                        <p className="text-[10px] font-medium text-muted-foreground leading-relaxed italic">
                                            {module.description}
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-2 text-[8px] font-black uppercase tracking-widest text-primary pt-4 group-hover:translate-x-2 transition-transform">
                                        Acceder <ArrowRight className="w-3 h-3" />
                                    </div>
                                </div>
                            </Card>
                        </Link>
                    </motion.div>
                ))}
            </div>

            {/* Quick Stats or Info */}
            <div className="bg-primary/5 p-10 rounded-[40px] border border-primary/10 flex flex-col md:flex-row gap-10 items-center">
                <div className="space-y-4 flex-1">
                    <h2 className="text-2xl font-black uppercase tracking-tight">Presencia unificada</h2>
                    <p className="text-sm font-medium text-muted-foreground leading-relaxed">
                        Los cambios realizados en este módulo se reflejan automáticamente en la página principal, los reportes PDF y los correos electrónicos enviados por el sistema.
                    </p>
                </div>
                <div className="grid grid-cols-2 gap-4 w-full md:w-auto">
                    <div className="bg-white p-6 rounded-3xl shadow-sm border border-border/40 text-center">
                        <p className="text-2xl font-black text-primary">v1.0</p>
                        <p className="text-[10px] font-bold text-muted-foreground uppercase">Versión</p>
                    </div>
                    <div className="bg-white p-6 rounded-3xl shadow-sm border border-border/40 text-center">
                        <p className="text-2xl font-black text-emerald-600">Alta</p>
                        <p className="text-[10px] font-bold text-muted-foreground uppercase">Disponibilidad</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
