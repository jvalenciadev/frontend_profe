'use client';

import { Users, Briefcase, Users2, ArrowRight, UserPlus, Contact } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

import { useAbility } from '@/hooks/useAbility';

export default function RRHHDashboard() {
    const { can } = useAbility();

    const modules = [
        {
            title: 'Gestión de Cargos',
            description: 'Definición de roles administrativos y académicos dentro de la estructura institucional.',
            icon: Briefcase,
            href: '/dashboard/rrhh/cargos',
            color: 'bg-primary/10 text-primary',
            border: 'hover:border-primary/20',
            permission: { action: 'read', subject: 'Cargo' }
        },
        {
            title: 'Banco Profesional',
            description: 'Repositorio de perfiles, currículums y postulantes calificados para la institución.',
            icon: Users2,
            href: '/dashboard/rrhh/banco',
            color: 'bg-primary/10 text-primary',
            border: 'hover:border-primary/20',
            permission: { action: 'read', subject: 'bp_posgrado' }
        },
        {
            title: 'Asignaciones',
            description: 'Control de personal asignado a departamentos y sedes específicas.',
            icon: Contact,
            href: '#',
            color: 'bg-orange-500/10 text-orange-600',
            border: 'opacity-50 cursor-not-allowed',
            soon: true
            // Asignaciones no tiene sujeto definido en AVAILABLE_SUBJECTS aún, 
            // pero lo dejamos visible o podrías asignarle uno genérico.
        }
    ];

    const filteredModules = modules.filter(module => {
        if (!module.permission) return true; // Asignaciones se muestra por ahora
        return can(module.permission.action, module.permission.subject);
    });

    return (
        <div className="space-y-10">
            <div className="space-y-1">
                <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.3em] text-primary mb-3">
                    <Users className="w-4 h-4" />
                    <span>Recursos Humanos</span>
                </div>
                <h1 className="text-4xl font-black tracking-tighter text-foreground uppercase leading-none">Capital Humano</h1>
                <p className="text-sm font-medium text-muted-foreground max-w-lg">
                    Gestión estratégica del personal, reclutamiento y estructura organizacional del Programa.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {filteredModules.map((module, idx) => (
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
                                    <span className="absolute top-4 right-4 bg-muted px-2 py-0.5 rounded text-[8px] font-black uppercase">En desarrollo</span>
                                )}
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
                                        Gestionar Personal <ArrowRight className="w-3 h-3" />
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
