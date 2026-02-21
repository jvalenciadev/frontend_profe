'use client';

import { useState, useEffect } from 'react';
import {
    BookOpen,
    Plus,
    Search,
    Edit2,
    Trash2,
    Eye,
    Clock,
    DollarSign,
    LayoutGrid,
    CheckCircle2,
    XCircle,
    Activity,
    Award
} from 'lucide-react';
import { Can } from '@/components/Can';
import api from '@/lib/api';
import { Programa } from '@/types';
import { Card } from '@/components/ui/Card';
import { motion, AnimatePresence } from 'framer-motion';
import { StatusBadge } from '@/components/StatusBadge';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

export default function ProgramasPage() {
    const [programas, setProgramas] = useState<Programa[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterEstado, setFilterEstado] = useState('');
    const [filterTipo, setFilterTipo] = useState('');

    useEffect(() => {
        loadProgramas();
    }, []);

    const loadProgramas = async () => {
        try {
            setIsLoading(true);
            const { data } = await api.get<Programa[]>('/programas-maestros');
            setProgramas(data);
        } catch (err: any) {
            console.error('Error loading programas:', err);
            toast.error('Error al cargar los programas académicos');
        } finally {
            setIsLoading(false);
        }
    };

    const filteredProgramas = programas.filter(p => {
        const matchesSearch = p.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (p.codigo || '').toLowerCase().includes(searchTerm.toLowerCase());
        const matchesEstado = filterEstado ? (filterEstado === 'activo' ? p.estadoInscripcion : !p.estadoInscripcion) : true;
        const matchesTipo = filterTipo ? p.tipoId === filterTipo : true;
        return matchesSearch && matchesEstado && matchesTipo;
    });

    return (
        <div className="p-6 md:p-10 space-y-8 max-w-[1600px] mx-auto min-h-screen">
            {/* Header Premium */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="space-y-2">
                    <div className="flex items-center gap-3">
                        <div className="p-3 rounded-2xl bg-indigo-500/10 text-indigo-600 shadow-inner">
                            <BookOpen className="w-6 h-6" />
                        </div>
                        <h1 className="text-3xl font-black tracking-tight text-foreground uppercase">
                            Programas <span className="text-primary italic">Académicos</span>
                        </h1>
                    </div>
                    <p className="text-muted-foreground text-sm font-medium ml-1">
                        Gestión centralizada de la oferta de formación y capacitación institucional.
                    </p>
                </div>

                <Can action="create" subject="Programa">
                    <button className="h-14 px-8 rounded-2xl bg-primary text-white font-black text-xs uppercase tracking-[0.2em] hover:shadow-2xl hover:shadow-primary/40 active:scale-95 transition-all flex items-center gap-3 shrink-0">
                        <Plus className="w-5 h-5" />
                        Nuevo Programa
                    </button>
                </Can>
            </div>

            {/* Filtros de Alta Jerarquía */}
            <Card className="p-2 border-border/40 bg-card/30 backdrop-blur-md">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
                    <div className="relative md:col-span-2">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <input
                            type="text"
                            placeholder="Buscar programa por nombre o código..."
                            className="w-full h-12 pl-12 pr-4 rounded-xl bg-muted/30 border border-border/50 focus:border-primary transition-all outline-none text-sm font-bold"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <select
                        className="h-12 px-4 rounded-xl bg-muted/30 border border-border/50 focus:border-primary transition-all outline-none text-xs font-bold text-foreground cursor-pointer"
                        value={filterEstado}
                        onChange={(e) => setFilterEstado(e.target.value)}
                    >
                        <option value="">TODOS LOS ESTADOS</option>
                        <option value="activo">ACTIVOS</option>
                        <option value="inactivo">INACTIVOS</option>
                    </select>
                    <select
                        className="h-12 px-4 rounded-xl bg-muted/30 border border-border/50 focus:border-primary transition-all outline-none text-xs font-bold text-foreground cursor-pointer"
                        value={filterTipo}
                        onChange={(e) => setFilterTipo(e.target.value)}
                    >
                        <option value="">TODOS LOS TIPOS</option>
                        <option value="diplomado">DIPLOMADOS</option>
                        <option value="curso">CURSOS</option>
                        <option value="taller">TALLERES</option>
                    </select>
                </div>
            </Card>

            {/* Grid de Programas */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                <AnimatePresence mode='popLayout'>
                    {isLoading ? (
                        Array(8).fill(0).map((_, i) => (
                            <Card key={i} className="h-64 animate-pulse bg-muted/20 border-border/40 rounded-[32px]" />
                        ))
                    ) : filteredProgramas.length === 0 ? (
                        <div className="col-span-full py-20 text-center space-y-4 opacity-40">
                            <div className="flex justify-center"><Search className="w-12 h-12" /></div>
                            <p className="text-sm font-black uppercase tracking-[0.2em]">No se encontraron programas registrados</p>
                        </div>
                    ) : (
                        filteredProgramas.map((programa) => (
                            <motion.div
                                key={programa.id}
                                layout
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.9 }}
                            >
                                <Card className="group relative border-border/40 overflow-hidden bg-card hover:border-primary/40 transition-all p-6 rounded-[32px] shadow-sm hover:shadow-2xl hover:shadow-primary/5 flex flex-col h-full">
                                    <div className="flex justify-between items-start mb-6">
                                        <div className="p-4 rounded-2xl bg-indigo-500/5 text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-all shadow-inner">
                                            <Award className="w-8 h-8" />
                                        </div>
                                        <div className="flex flex-col items-end gap-2">
                                            <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground bg-muted/50 px-3 py-1 rounded-full border border-border/50">
                                                {programa.codigo || 'S/C'}
                                            </span>
                                            <StatusBadge status={programa.estadoInscripcion ? 'ACTIVO' : 'INACTIVO'} showIcon={false} />
                                        </div>
                                    </div>

                                    <div className="space-y-4 flex-1">
                                        <div className="space-y-1">
                                            <h3 className="text-base font-black tracking-tight text-foreground uppercase group-hover:text-primary transition-colors line-clamp-2">
                                                {programa.nombre}
                                            </h3>
                                            <span className="inline-block text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-600 border border-amber-500/10">
                                                {programa.tipoId || 'Programa'}
                                            </span>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4 py-4 border-y border-border/40">
                                            <div className="space-y-1">
                                                <p className="text-[8px] font-black text-muted-foreground uppercase tracking-widest">Inversión</p>
                                                <div className="flex items-center gap-1 text-primary">
                                                    <DollarSign className="w-3 h-3 font-bold" />
                                                    <span className="text-[12px] font-black">{programa.costo.toLocaleString()} <span className="text-[8px] font-bold uppercase">Bs</span></span>
                                                </div>
                                            </div>
                                            <div className="space-y-1">
                                                <p className="text-[8px] font-black text-muted-foreground uppercase tracking-widest">Carga Horaria</p>
                                                <div className="flex items-center gap-1 text-indigo-500">
                                                    <Clock className="w-3 h-3" />
                                                    <span className="text-[10px] font-black">{programa.cargaHoraria} <span className="text-[8px] font-bold">Hrs</span></span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="pt-6 flex items-center justify-end gap-2">
                                        <Can action="read" subject="Programa">
                                            <button className="p-2.5 rounded-xl bg-muted/50 text-muted-foreground hover:bg-primary hover:text-white transition-all">
                                                <Eye className="w-4 h-4" />
                                            </button>
                                        </Can>
                                        <Can action="update" subject="Programa">
                                            <button className="p-2.5 rounded-xl bg-primary/5 text-primary hover:bg-primary hover:text-white transition-all">
                                                <Edit2 className="w-4 h-4" />
                                            </button>
                                        </Can>
                                        <Can action="delete" subject="Programa">
                                            <button className="p-2.5 rounded-xl bg-rose-500/5 text-rose-500 hover:bg-rose-500 hover:text-white transition-all">
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </Can>
                                    </div>
                                </Card>
                            </motion.div>
                        ))
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}
