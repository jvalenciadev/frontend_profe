'use client';

import { useProfe } from '@/contexts/ProfeContext';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Hammer, Lock, Clock, ShieldCheck, Settings } from 'lucide-react';
import { getImageUrl } from '@/lib/utils';

export default function MaintenanceGuard({ children }: { children: React.ReactNode }) {
    const { config, isLoading } = useProfe();
    const pathname = usePathname();

    // El mantenimiento no aplica al dashboard para que los admins puedan desactivarlo
    const isDashboard = pathname?.startsWith('/dashboard') || pathname?.startsWith('/login');

    if (!isLoading && config?.mantenimiento && !isDashboard) {
        return (
            <div className="fixed inset-0 z-[9999] bg-[#0a0a0a] flex items-center justify-center p-6 overflow-hidden">
                {/* Background Decor */}
                <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
                    <div className="absolute -top-[20%] -left-[10%] w-[60%] h-[60%] bg-primary/20 blur-[120px] rounded-full animate-pulse" />
                    <div className="absolute -bottom-[20%] -right-[10%] w-[60%] h-[60%] bg-blue-600/10 blur-[120px] rounded-full" />
                </div>

                <div className="relative z-10 max-w-4xl w-full text-center space-y-12">
                    {/* Animated Icon */}
                    <motion.div
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ duration: 0.8, ease: "easeOut" }}
                        className="relative inline-block"
                    >
                        <div className="absolute inset-0 bg-primary/20 blur-3xl rounded-full" />
                        <div className="relative w-32 h-32 md:w-48 md:h-48 rounded-[40px] bg-gradient-to-br from-primary/20 to-transparent border border-white/10 flex items-center justify-center backdrop-blur-xl">
                            <Hammer className="w-16 h-16 md:w-24 md:h-24 text-primary animate-bounce" />
                        </div>

                        <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                            className="absolute -top-4 -right-4 w-12 h-12 md:w-16 md:h-16 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md flex items-center justify-center"
                        >
                            <Settings className="w-6 h-6 md:w-8 md:h-8 text-primary/60" />
                        </motion.div>
                    </motion.div>

                    {/* Text Content */}
                    <div className="space-y-6">
                        <motion.div
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: 0.2 }}
                        >
                            <h1 className="text-5xl md:text-7xl font-black text-white uppercase tracking-tighter leading-none">
                                Plataforma en <br />
                                <span className="text-primary italic">Mantenimiento</span>
                            </h1>
                        </motion.div>

                        <motion.p
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: 0.4 }}
                            className="text-lg md:text-xl text-slate-400 font-medium max-w-2xl mx-auto leading-relaxed border-l-4 border-primary/30 pl-6 text-left"
                        >
                            {config?.nombre || 'PROFE'} está realizando actualizaciones críticas para mejorar su experiencia técnica y pedagógica. Volveremos a estar en línea muy pronto.
                        </motion.p>
                    </div>

                    {/* Stats/Info Cards */}
                    <motion.div
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.6 }}
                        className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6"
                    >
                        {[
                            { icon: Clock, label: 'Regreso Estriado', val: 'Muy Pronto' },
                            { icon: Lock, label: 'Acceso Restringido', val: 'Sólo Admin' },
                            { icon: ShieldCheck, label: 'Estado Seguridad', val: 'Verificado' }
                        ].map((item, i) => (
                            <div key={i} className="p-6 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-sm flex flex-col items-center gap-2">
                                <item.icon className="w-5 h-5 text-primary mb-1" />
                                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">{item.label}</span>
                                <span className="text-sm font-bold text-white uppercase">{item.val}</span>
                            </div>
                        ))}
                    </motion.div>

                    {/* Institutional Footer */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 1 }}
                        className="pt-10 flex flex-col items-center gap-4"
                    >
                        {config?.logoPrincipal && (
                            <img
                                src={getImageUrl(config.logoPrincipal)}
                                alt="Logo"
                                className="h-12 md:h-16 object-contain opacity-50 grayscale hover:grayscale-0 transition-all duration-700"
                            />
                        )}
                        <p className="text-[10px] font-black uppercase tracking-[0.4em] text-primary/40 leading-loose">
                            Ministerio de Educación • Estado Plurinacional de Bolivia
                        </p>
                    </motion.div>
                </div>
            </div>
        );
    }

    return <>{children}</>;
}
