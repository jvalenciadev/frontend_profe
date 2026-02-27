'use client';

import { useState, useEffect, useCallback } from 'react';
import {
    mapPersonaService,
    mapCargoService,
    mapCategoriaService,
    mapNivelService,
    mapSubsistemaService,
    MapPersona,
    MapCatalogo,
} from '@/services/mapPersonaService';
import { Card } from '@/components/ui/Card';
import {
    Users,
    Search,
    Filter,
    ChevronLeft,
    ChevronRight,
    User,
    Briefcase,
    BookOpen,
    Layers,
    LayoutGrid,
    Phone,
    Mail,
    Activity,
    X,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const ESTADO_COLORS: Record<string, string> = {
    activo: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
    inactivo: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
    eliminado: 'bg-rose-500/10 text-rose-600 border-rose-500/20',
};

function PersonaCard({ persona }: { persona: MapPersona }) {
    const fullName = [persona.apellido1, persona.apellido2, persona.nombre1, persona.nombre2]
        .filter(Boolean)
        .join(' ');

    const initials = [persona.nombre1?.[0], persona.apellido1?.[0]]
        .filter(Boolean)
        .join('')
        .toUpperCase() || '?';

    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
        >
            <Card className="group p-5 rounded-[24px] border-border/40 bg-card hover:border-primary/30 transition-all hover:shadow-xl hover:shadow-primary/5">
                {/* Avatar + estado */}
                <div className="flex items-start justify-between mb-4">
                    <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center font-black text-lg group-hover:bg-primary group-hover:text-white transition-all select-none">
                        {initials}
                    </div>
                    <span className={cn(
                        'text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full border',
                        ESTADO_COLORS[persona.estado] ?? 'bg-muted text-muted-foreground border-border'
                    )}>
                        {persona.estado}
                    </span>
                </div>

                {/* Nombre y CI */}
                <h3 className="text-sm font-black uppercase tracking-tight text-foreground leading-tight mb-1 group-hover:text-primary transition-colors">
                    {fullName || '(Sin nombre)'}
                </h3>
                <p className="text-[10px] font-bold text-muted-foreground mb-4">
                    CI: {persona.ci}{persona.complemento ? `-${persona.complemento}` : ''}
                </p>

                {/* Tags de categorías */}
                <div className="flex flex-wrap gap-1.5 mb-4">
                    {persona.cargo && (
                        <span className="flex items-center gap-1 text-[9px] font-black uppercase tracking-wide bg-primary/5 text-primary px-2 py-1 rounded-lg">
                            <Briefcase className="w-2.5 h-2.5" />
                            {persona.cargo.nombre}
                        </span>
                    )}
                    {persona.categoria && (
                        <span className="flex items-center gap-1 text-[9px] font-black uppercase tracking-wide bg-violet-500/10 text-violet-600 px-2 py-1 rounded-lg">
                            <LayoutGrid className="w-2.5 h-2.5" />
                            {persona.categoria.nombre}
                        </span>
                    )}
                    {persona.nivel && (
                        <span className="flex items-center gap-1 text-[9px] font-black uppercase tracking-wide bg-amber-500/10 text-amber-600 px-2 py-1 rounded-lg">
                            <Layers className="w-2.5 h-2.5" />
                            {persona.nivel.nombre}
                        </span>
                    )}
                    {persona.subsistema && (
                        <span className="flex items-center gap-1 text-[9px] font-black uppercase tracking-wide bg-cyan-500/10 text-cyan-600 px-2 py-1 rounded-lg">
                            <BookOpen className="w-2.5 h-2.5" />
                            {persona.subsistema.nombre}
                        </span>
                    )}
                </div>

                {/* Contacto */}
                <div className="pt-3 border-t border-border/40 space-y-1">
                    {persona.correo && persona.correo !== 'sincorreo' && (
                        <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                            <Mail className="w-3 h-3 shrink-0" />
                            <span className="truncate">{persona.correo}</span>
                        </div>
                    )}
                    {persona.celular > 0 && (
                        <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                            <Phone className="w-3 h-3 shrink-0" />
                            <span>{persona.celular}</span>
                        </div>
                    )}
                </div>
            </Card>
        </motion.div>
    );
}

export default function MagisterioPage() {
    const [data, setData] = useState<{ data: MapPersona[]; total: number; totalPages: number }>({
        data: [], total: 0, totalPages: 0,
    });
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [search, setSearch] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [showFilters, setShowFilters] = useState(false);

    // catálogos
    const [cargos, setCargos] = useState<MapCatalogo[]>([]);
    const [categorias, setCategorias] = useState<MapCatalogo[]>([]);
    const [niveles, setNiveles] = useState<MapCatalogo[]>([]);
    const [subsistemas, setSubsistemas] = useState<MapCatalogo[]>([]);

    // filtros seleccionados
    const [carId, setCarId] = useState('');
    const [catId, setCatId] = useState('');
    const [nivId, setNivId] = useState('');
    const [subId, setSubId] = useState('');
    const [estado, setEstado] = useState('');

    const LIMIT = 18;

    // Debounce search
    useEffect(() => {
        const t = setTimeout(() => {
            setDebouncedSearch(search);
            setPage(1);
        }, 400);
        return () => clearTimeout(t);
    }, [search]);

    // Cargar catálogos al montar
    useEffect(() => {
        Promise.all([
            mapCargoService.getAll(),
            mapCategoriaService.getAll(),
            mapNivelService.getAll(),
            mapSubsistemaService.getAll(),
        ]).then(([c, cat, niv, sub]) => {
            setCargos(c);
            setCategorias(cat);
            setNiveles(niv);
            setSubsistemas(sub);
        }).catch(() => toast.error('Error al cargar catálogos'));
    }, []);

    // Cargar personas
    const loadPersonas = useCallback(async () => {
        try {
            setLoading(true);
            const result = await mapPersonaService.getAll({
                search: debouncedSearch || undefined,
                carId: carId || undefined,
                catId: catId || undefined,
                nivId: nivId || undefined,
                subId: subId || undefined,
                estado: estado || undefined,
                page,
                limit: LIMIT,
            });
            setData(result);
        } catch {
            toast.error('Error al cargar el personal');
        } finally {
            setLoading(false);
        }
    }, [debouncedSearch, carId, catId, nivId, subId, estado, page]);

    useEffect(() => {
        loadPersonas();
    }, [loadPersonas]);

    const clearFilters = () => {
        setCarId(''); setCatId(''); setNivId(''); setSubId(''); setEstado('');
        setSearch(''); setPage(1);
    };

    const hasFilters = carId || catId || nivId || subId || estado || debouncedSearch;

    return (
        <div className="space-y-8 max-w-[1400px] mx-auto">

            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                    <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.3em] text-primary">
                        <Users className="w-4 h-4" />
                        <span>Recursos Humanos</span>
                    </div>
                    <h1 className="text-4xl font-black tracking-tighter text-foreground uppercase leading-none">
                        Personal <span className="text-primary italic">Magisterio</span>
                    </h1>
                    <p className="text-sm font-medium text-muted-foreground">
                        {loading ? 'Cargando...' : `${data.total.toLocaleString()} registros encontrados`}
                    </p>
                </div>

                <button
                    onClick={() => setShowFilters(v => !v)}
                    className={cn(
                        'h-12 px-6 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center gap-2 transition-all border',
                        showFilters
                            ? 'bg-primary text-white border-primary shadow-lg shadow-primary/30'
                            : 'bg-card text-foreground border-border hover:border-primary/40'
                    )}
                >
                    <Filter className="w-4 h-4" />
                    Filtros
                    {hasFilters && (
                        <span className="w-5 h-5 rounded-full bg-white/20 text-[9px] font-black flex items-center justify-center">
                            ✓
                        </span>
                    )}
                </button>
            </div>

            {/* Barra de búsqueda */}
            <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                    type="text"
                    placeholder="Buscar por nombre, apellido o correo..."
                    className="w-full h-14 pl-12 pr-4 rounded-2xl bg-card border border-border focus:border-primary transition-all shadow-sm outline-none text-sm font-bold placeholder:text-muted-foreground/50"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />
                {search && (
                    <button onClick={() => setSearch('')} className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                        <X className="w-4 h-4" />
                    </button>
                )}
            </div>

            {/* Panel de filtros */}
            <AnimatePresence>
                {showFilters && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="overflow-hidden"
                    >
                        <Card className="p-6 rounded-2xl border-border/40 bg-card">
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                                {/* Cargo */}
                                <div className="space-y-1.5">
                                    <label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-1">
                                        <Briefcase className="w-3 h-3" /> Cargo
                                    </label>
                                    <select
                                        className="w-full h-10 px-3 rounded-xl bg-muted/30 border border-border focus:border-primary outline-none text-xs font-bold transition-all"
                                        value={carId}
                                        onChange={(e) => { setCarId(e.target.value); setPage(1); }}
                                    >
                                        <option value="">Todos</option>
                                        {cargos.map(c => (
                                            <option key={c.id} value={c.id}>{c.nombre}</option>
                                        ))}
                                    </select>
                                </div>

                                {/* Categoría */}
                                <div className="space-y-1.5">
                                    <label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-1">
                                        <LayoutGrid className="w-3 h-3" /> Categoría
                                    </label>
                                    <select
                                        className="w-full h-10 px-3 rounded-xl bg-muted/30 border border-border focus:border-primary outline-none text-xs font-bold transition-all"
                                        value={catId}
                                        onChange={(e) => { setCatId(e.target.value); setPage(1); }}
                                    >
                                        <option value="">Todas</option>
                                        {categorias.map(c => (
                                            <option key={c.id} value={c.id}>{c.nombre}</option>
                                        ))}
                                    </select>
                                </div>

                                {/* Nivel */}
                                <div className="space-y-1.5">
                                    <label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-1">
                                        <Layers className="w-3 h-3" /> Nivel
                                    </label>
                                    <select
                                        className="w-full h-10 px-3 rounded-xl bg-muted/30 border border-border focus:border-primary outline-none text-xs font-bold transition-all"
                                        value={nivId}
                                        onChange={(e) => { setNivId(e.target.value); setPage(1); }}
                                    >
                                        <option value="">Todos</option>
                                        {niveles.map(n => (
                                            <option key={n.id} value={n.id}>{n.nombre}</option>
                                        ))}
                                    </select>
                                </div>

                                {/* Subsistema */}
                                <div className="space-y-1.5">
                                    <label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-1">
                                        <BookOpen className="w-3 h-3" /> Subsistema
                                    </label>
                                    <select
                                        className="w-full h-10 px-3 rounded-xl bg-muted/30 border border-border focus:border-primary outline-none text-xs font-bold transition-all"
                                        value={subId}
                                        onChange={(e) => { setSubId(e.target.value); setPage(1); }}
                                    >
                                        <option value="">Todos</option>
                                        {subsistemas.map(s => (
                                            <option key={s.id} value={s.id}>{s.nombre}</option>
                                        ))}
                                    </select>
                                </div>

                                {/* Estado */}
                                <div className="space-y-1.5">
                                    <label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-1">
                                        <Activity className="w-3 h-3" /> Estado
                                    </label>
                                    <select
                                        className="w-full h-10 px-3 rounded-xl bg-muted/30 border border-border focus:border-primary outline-none text-xs font-bold transition-all"
                                        value={estado}
                                        onChange={(e) => { setEstado(e.target.value); setPage(1); }}
                                    >
                                        <option value="">Todos</option>
                                        <option value="activo">Activo</option>
                                        <option value="inactivo">Inactivo</option>
                                    </select>
                                </div>
                            </div>

                            {hasFilters && (
                                <div className="mt-4 pt-4 border-t border-border/40 flex justify-end">
                                    <button
                                        onClick={clearFilters}
                                        className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-rose-500 hover:text-rose-600 transition-colors"
                                    >
                                        <X className="w-3 h-3" /> Limpiar filtros
                                    </button>
                                </div>
                            )}
                        </Card>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Grid de personas */}
            {loading && data.data.length === 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
                    {Array(12).fill(0).map((_, i) => (
                        <Card key={i} className="h-52 animate-pulse bg-muted/20 rounded-[24px] border-border/40" />
                    ))}
                </div>
            ) : data.data.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-24 text-center">
                    <div className="w-20 h-20 rounded-3xl bg-muted/50 flex items-center justify-center mb-6">
                        <User className="w-10 h-10 text-muted-foreground" />
                    </div>
                    <h3 className="text-xl font-black uppercase tracking-tight mb-2">Sin resultados</h3>
                    <p className="text-sm text-muted-foreground">No se encontró personal con los filtros seleccionados.</p>
                    {hasFilters && (
                        <button onClick={clearFilters} className="mt-4 text-xs font-black text-primary hover:underline">
                            Limpiar filtros
                        </button>
                    )}
                </div>
            ) : (
                <AnimatePresence mode="popLayout">
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
                        {data.data.map((persona) => (
                            <PersonaCard key={persona.id} persona={persona} />
                        ))}
                    </div>
                </AnimatePresence>
            )}

            {/* Paginación */}
            {data.totalPages > 1 && (
                <div className="flex items-center justify-between pt-4 border-t border-border/40">
                    <p className="text-xs font-bold text-muted-foreground">
                        Página <span className="text-foreground">{page}</span> de <span className="text-foreground">{data.totalPages}</span>
                    </p>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setPage(p => Math.max(1, p - 1))}
                            disabled={page === 1}
                            className="h-9 w-9 rounded-xl border border-border flex items-center justify-center text-muted-foreground hover:border-primary hover:text-primary transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                            <ChevronLeft className="w-4 h-4" />
                        </button>

                        {Array.from({ length: Math.min(5, data.totalPages) }, (_, i) => {
                            const p = Math.max(1, Math.min(page - 2, data.totalPages - 4)) + i;
                            return (
                                <button
                                    key={p}
                                    onClick={() => setPage(p)}
                                    className={cn(
                                        'h-9 w-9 rounded-xl border text-xs font-black transition-all',
                                        p === page
                                            ? 'bg-primary text-white border-primary'
                                            : 'border-border text-muted-foreground hover:border-primary hover:text-primary'
                                    )}
                                >
                                    {p}
                                </button>
                            );
                        })}

                        <button
                            onClick={() => setPage(p => Math.min(data.totalPages, p + 1))}
                            disabled={page === data.totalPages}
                            className="h-9 w-9 rounded-xl border border-border flex items-center justify-center text-muted-foreground hover:border-primary hover:text-primary transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                            <ChevronRight className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
