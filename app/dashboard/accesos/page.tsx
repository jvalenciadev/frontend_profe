'use client';

import { ShieldCheck, Users, Shield, Key, ArrowRight, Lock, ShieldAlert } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

export default function AccesosDashboard() {
    const modules = [
        {
            title: 'Gestión de Usuarios',
            description: 'Administración de cuentas, perfiles de usuario y asignaciones departamentales.',
            icon: Users,
            href: '/dashboard/usuarios',
            color: 'bg-blue-500/10 text-blue-600',
            border: 'hover:border-blue-200'
        },
        {
            title: 'Roles del Sistema',
            description: 'Definición de perfiles de acceso (Admin, Consultor, etc.) y jerarquías.',
            icon: Shield,
            href: '/dashboard/roles',
            color: 'bg-purple-500/10 text-purple-600',
            border: 'hover:border-purple-200'
        },
        {
            title: 'Permisos Atómicos',
            description: 'Control granular sobre acciones (CRUD) y módulos específicos del sistema.',
            icon: Key,
            href: '/dashboard/permisos',
            color: 'bg-amber-500/10 text-amber-600',
            border: 'hover:border-amber-200'
        }
    ];

    return (
        <div className="space-y-10">
            <div className="space-y-1">
                <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.3em] text-primary mb-3">
                    <ShieldCheck className="w-4 h-4" />
                    <span>Seguridad e Identidad</span>
                </div>
                <h1 className="text-4xl font-black tracking-tighter text-foreground uppercase leading-none">Gestión de Accesos</h1>
                <p className="text-sm font-medium text-muted-foreground max-w-lg">
                    Control centralizado de identidades, roles y políticas de seguridad basadas en CASL.
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
                                        Configurar Seguridad <ArrowRight className="w-3 h-3" />
                                    </div>
                                </div>
                            </Card>
                        </Link>
                    </motion.div>
                ))}
            </div>

            {/* Security Notice */}
            <div className="bg-indigo-500/5 border border-indigo-500/10 p-8 rounded-[32px] flex flex-col md:flex-row items-center gap-6">
                <div className="w-16 h-16 rounded-2xl bg-white shadow-sm flex items-center justify-center shrink-0">
                    <Lock className="w-8 h-8 text-indigo-500" />
                </div>
                <div className="space-y-1 text-center md:text-left">
                    <h4 className="text-sm font-black uppercase tracking-tight">Arquitectura de Seguridad RBAC + ABAC</h4>
                    <p className="text-xs font-medium text-muted-foreground">
                        El sistema utiliza una validación híbrida. Los ROLES definen agrupaciones lógicas, mientras que los PERMISOS controlan el acceso a nivel de API y UI mediante CASL.
                    </p>
                </div>
            </div>
        </div>
    );
}
