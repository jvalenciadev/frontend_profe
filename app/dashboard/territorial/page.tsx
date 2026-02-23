'use client';

import { Map, Building2, Layers, Globe, ArrowRight, Compass, GraduationCap, Camera } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import Link from 'next/link';
import { motion } from 'framer-motion';

import { useAbility } from '@/hooks/useAbility';

export default function TerritorialDashboard() {
    const { can } = useAbility();

    const modules = [
        {
            title: 'Departamentos',
            description: 'Unidades territoriales de primer nivel. Gestión de abreviaciones y estados regionales.',
            icon: Globe,
            href: '/dashboard/territorial/departamentos',
            color: 'bg-blue-500/10 text-blue-600',
            border: 'hover:border-blue-200',
            permission: { action: 'read', subject: 'Departamentos' }
        },
        {
            title: 'Provincias',
            description: 'División política intermedia. Administración de nombres y estados provinciales.',
            icon: Compass,
            href: '/dashboard/territorial/provincias',
            color: 'bg-orange-500/10 text-orange-600',
            border: 'hover:border-orange-200',
            permission: { action: 'read', subject: 'provincia' }
        },
        {
            title: 'Sedes Académicas',
            description: 'Administración de centros físicos, horarios de atención y datos de contacto.',
            icon: Building2,
            href: '/dashboard/territorial/sedes',
            color: 'bg-emerald-500/10 text-emerald-600',
            border: 'hover:border-emerald-200',
            permission: { action: 'read', subject: 'Sede' }
        },
        {
            title: 'Galerías',
            description: 'Banco de imágenes y recursos visuales para la identificación de sedes.',
            icon: Camera,
            href: '/dashboard/territorial/galerias',
            color: 'bg-cyan-500/10 text-cyan-600',
            border: 'hover:border-cyan-200',
            permission: { action: 'read', subject: 'Galeria' }
        },
        {
            title: 'Distritos',
            description: 'Subdivisiones administrativas por departamento. Gestión de códigos SIE.',
            icon: Layers,
            href: '/dashboard/territorial/distritos',
            color: 'bg-purple-500/10 text-purple-600',
            border: 'hover:border-purple-200',
            permission: { action: 'read', subject: 'distrito' }
        },
        {
            title: 'Unidades Académicas',
            description: 'Centros integrados al mapa educativo por distrito. Gestión de códigos SIE institucionales.',
            icon: GraduationCap,
            href: '/dashboard/territorial/unidades-academicas',
            color: 'bg-rose-500/10 text-rose-600',
            border: 'hover:border-rose-200',
            permission: { action: 'read', subject: 'unidad_educativa' }
        }
    ];

    const filteredModules = modules.filter(module =>
        can(module.permission.action, module.permission.subject)
    );

    return (
        <div className="space-y-10">
            <div className="space-y-1">
                <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.3em] text-primary mb-3">
                    <Map className="w-4 h-4" />
                    <span>Infraestructura del Sistema</span>
                </div>
                <h1 className="text-4xl font-black tracking-tighter text-foreground uppercase leading-none">Gestión Territorial</h1>
                <p className="text-sm font-medium text-muted-foreground max-w-lg">
                    Panel de control para la configuración geográfica y operativa de la plataforma PROFE.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {filteredModules.map((module, idx) => (
                    <motion.div
                        key={module.title}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.1 }}
                    >
                        <Link href={module.href}>
                            <Card className={`p-8 hover:shadow-2xl transition-all h-full border-border/40 group ${module.border}`}>
                                <div className="space-y-6">
                                    <div className={`w-14 h-14 rounded-2xl ${module.color} flex items-center justify-center transition-transform group-hover:scale-110`}>
                                        <module.icon className="w-8 h-8" />
                                    </div>
                                    <div className="space-y-2">
                                        <h3 className="text-xl font-black tracking-tighter uppercase">{module.title}</h3>
                                        <p className="text-xs font-medium text-muted-foreground leading-relaxed italic">
                                            {module.description}
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-primary pt-4 group-hover:translate-x-2 transition-transform">
                                        Explorar Módulo <ArrowRight className="w-3 h-3" />
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
