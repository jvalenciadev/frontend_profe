'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { aulaCategoriaService } from '@/services/aulaCategoriaService';
import {
    Tag, Plus, Search, Edit3, Trash2,
    Layers, BookOpen, RefreshCw, X,
    CheckCircle2, Trophy, Shield, Settings2,
    ChevronRight, Percent, Zap, Database,
    ListChecks, ArrowRight, Info, AlertTriangle
} from 'lucide-react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

type Tab = 'config-global' | 'por-modulo';

interface TipoConConfig {
    id: string;
    nombre: string;
    notaMaxima?: number;
    mod_tipos_calificacion: ConfigItem[];
}

interface ConfigItem {
    id: string;
    tipoProgramaId: string;
    nombre: string;
    peso: number;
    esEvalFinal: boolean;
    orden: number;
    estado: string;
}

interface Modulo {
    id: string;
    nombre: string;
    programaDos?: {
        nombre: string;
        tipo?: { id: string; nombre: string; notaMaxima?: number }
    };
    mod_categorias_calif?: { id: string; config: ConfigItem }[];
}

interface CategoriaModulo {
    id: string;
    nombre: string;
    peso: number;
    ponderacion: number;
    esEvalFinal: boolean;
    configId: string;
}

export default function CategoriasPage() {
    const [activeTab, setActiveTab] = useState<Tab>('config-global');

    // ─── Config Global ────────────────────────────────────────
    const [tipos, setTipos] = useState<TipoConConfig[]>([]);
    const [selectedTipo, setSelectedTipo] = useState<TipoConConfig | null>(null);
    const [configLoading, setConfigLoading] = useState(true);

    // ─── Por Módulo ───────────────────────────────────────────
    const [modulos, setModulos] = useState<Modulo[]>([]);
    const [selectedModulo, setSelectedModulo] = useState<Modulo | null>(null);
    const [categorias, setCategorias] = useState<CategoriaModulo[]>([]);
    const [moduloLoading, setModuloLoading] = useState(false);
    const [catLoading, setCatLoading] = useState(false);
    const [searchMod, setSearchMod] = useState('');

    // ─── Modal ────────────────────────────────────────────────
    const [modalMode, setModalMode] = useState<'create-config' | 'edit-config' | 'create-cat' | 'edit-cat' | null>(null);
    const [editingItem, setEditingItem] = useState<any>(null);
    const [form, setForm] = useState({ nombre: '', peso: 25, esEvalFinal: false });

    // ─── Aplicar config ───────────────────────────────────────
    const [applyModal, setApplyModal] = useState(false);
    const [applyModuloId, setApplyModuloId] = useState('');

    // ═══════════════════════════════════════════════════════════
    // LOADERS
    // ═══════════════════════════════════════════════════════════

    const loadTipos = useCallback(async () => {
        setConfigLoading(true);
        try {
            const data = await aulaCategoriaService.getTiposConConfig();
            setTipos(data);
            if (data.length > 0 && !selectedTipo) setSelectedTipo(data[0]);
        } catch {
            toast.error('Error al cargar tipos de programa');
        } finally {
            setConfigLoading(false);
        }
    }, [selectedTipo]);

    const loadModulos = useCallback(async () => {
        setModuloLoading(true);
        try {
            const data = await aulaCategoriaService.getAllModulos(
                searchMod ? { search: searchMod } : undefined
            );
            setModulos(data);
        } catch {
            toast.error('Error al cargar módulos');
        } finally {
            setModuloLoading(false);
        }
    }, [searchMod]);

    const loadCategorias = async (moduloId: string) => {
        setCatLoading(true);
        try {
            const data = await aulaCategoriaService.getAll(moduloId);
            setCategorias(data);
        } catch {
            toast.error('Error al cargar categorías del módulo');
        } finally {
            setCatLoading(false);
        }
    };

    useEffect(() => { loadTipos(); }, []);
    useEffect(() => {
        if (activeTab === 'por-modulo') loadModulos();
    }, [activeTab, searchMod]);

    // ═══════════════════════════════════════════════════════════
    // HANDLERS — CONFIG GLOBAL
    // ═══════════════════════════════════════════════════════════

    const openCreateConfig = () => {
        setForm({ nombre: '', peso: 25, esEvalFinal: false });
        setEditingItem(null);
        setModalMode('create-config');
    };

    const openEditConfig = (item: ConfigItem) => {
        setForm({ nombre: item.nombre, peso: item.peso, esEvalFinal: item.esEvalFinal });
        setEditingItem(item);
        setModalMode('edit-config');
    };

    const handleSubmitConfig = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedTipo) return;
        setConfigLoading(true);
        try {
            if (modalMode === 'edit-config' && editingItem) {
                await aulaCategoriaService.updateConfig(editingItem.id, {
                    nombre: form.nombre,
                    peso: form.peso,
                    esEvalFinal: form.esEvalFinal,
                });
                toast.success('Configuración actualizada');
            } else {
                await aulaCategoriaService.createConfig(selectedTipo.id, {
                    nombre: form.nombre,
                    peso: form.peso,
                    esEvalFinal: form.esEvalFinal,
                });
                toast.success('Categoría de calificación creada');
            }
            setModalMode(null);
            await loadTipos();
            // Re-select updated tipo
            const refreshed = await aulaCategoriaService.getTiposConConfig();
            setTipos(refreshed);
            const updated = refreshed.find((t: TipoConConfig) => t.id === selectedTipo.id);
            if (updated) setSelectedTipo(updated);
        } catch (err: any) {
            toast.error(err?.response?.data?.message || 'Error al guardar');
        } finally {
            setConfigLoading(false);
        }
    };

    const handleDeleteConfig = async (id: string) => {
        if (!window.confirm('¿Eliminar esta categoría de configuración?')) return;
        try {
            await aulaCategoriaService.deleteConfig(id);
            toast.success('Categoría eliminada');
            const refreshed = await aulaCategoriaService.getTiposConConfig();
            setTipos(refreshed);
            const updated = refreshed.find((t: TipoConConfig) => t.id === selectedTipo?.id);
            if (updated) setSelectedTipo(updated);
        } catch {
            toast.error('Error al eliminar');
        }
    };

    // ═══════════════════════════════════════════════════════════
    // HANDLERS — POR MÓDULO
    // ═══════════════════════════════════════════════════════════

    const handleSelectModulo = (mod: Modulo) => {
        setSelectedModulo(mod);
        loadCategorias(mod.id);
    };

    const openCreateCat = () => {
        setForm({ nombre: '', peso: 25, esEvalFinal: false });
        setEditingItem(null);
        setModalMode('create-cat');
    };

    const openEditCat = (cat: CategoriaModulo) => {
        setForm({ nombre: cat.nombre, peso: cat.ponderacion, esEvalFinal: cat.esEvalFinal });
        setEditingItem(cat);
        setModalMode('edit-cat');
    };

    const handleSubmitCat = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedModulo) return;
        setCatLoading(true);
        try {
            if (modalMode === 'edit-cat' && editingItem) {
                await aulaCategoriaService.update(editingItem.id, {
                    nombre: form.nombre,
                    ponderacion: form.peso,
                    esEvalFinal: form.esEvalFinal,
                });
                toast.success('Categoría actualizada');
            } else {
                await aulaCategoriaService.create(selectedModulo.id, {
                    nombre: form.nombre,
                    ponderacion: form.peso,
                    esEvalFinal: form.esEvalFinal,
                });
                toast.success('Categoría creada en el módulo');
            }
            setModalMode(null);
            await loadCategorias(selectedModulo.id);
        } catch (err: any) {
            toast.error(err?.response?.data?.message || 'Error al guardar');
        } finally {
            setCatLoading(false);
        }
    };

    const handleDeleteCat = async (id: string) => {
        if (!window.confirm('¿Eliminar esta categoría del módulo?')) return;
        setCatLoading(true);
        try {
            await aulaCategoriaService.delete(id);
            toast.success('Categoría eliminada');
            if (selectedModulo) await loadCategorias(selectedModulo.id);
        } catch {
            toast.error('Error al eliminar');
        } finally {
            setCatLoading(false);
        }
    };

    const handleAplicarConfig = async () => {
        if (!applyModuloId || !selectedTipo) return;
        try {
            const result = await aulaCategoriaService.aplicarConfigAModulo(applyModuloId, selectedTipo.id);
            toast.success(`Se aplicaron ${result.aplicadas} categorías al módulo`);
            setApplyModal(false);
            setApplyModuloId('');
        } catch (err: any) {
            toast.error(err?.response?.data?.message || 'Error al aplicar');
        }
    };

    // ═══════════════════════════════════════════════════════════
    // COMPUTED
    // ═══════════════════════════════════════════════════════════

    const selectedConfigs = selectedTipo?.mod_tipos_calificacion ?? [];
    const totalPesoConfig = selectedConfigs.reduce((s, c) => s + c.peso, 0);
    const totalPesoCat = categorias.reduce((s, c) => s + (c.ponderacion ?? 0), 0);
    const filteredModulos = modulos.filter(m =>
        m.nombre?.toLowerCase().includes(searchMod.toLowerCase()) ||
        m.programaDos?.nombre?.toLowerCase().includes(searchMod.toLowerCase())
    );

    const modalOpen = modalMode !== null;

    // ═══════════════════════════════════════════════════════════
    // RENDER
    // ═══════════════════════════════════════════════════════════
    return (
        <div className="min-h-screen bg-background p-6 lg:p-10">

            {/* ─── HEADER ─────────────────────────────────────────── */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10">
                <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-[2rem] bg-primary flex items-center justify-center text-white shadow-xl shadow-primary/20">
                        <Database className="w-7 h-7" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-black uppercase italic tracking-tight text-foreground leading-none">
                            Categorías de <span className="text-primary">Calificación</span>
                        </h1>
                        <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-muted-foreground mt-2">
                            Configuración Global por Tipo · Gestión por Módulo
                        </p>
                    </div>
                </div>
            </div>

            {/* ─── TABS ───────────────────────────────────────────── */}
            <div className="flex gap-2 mb-8 bg-muted/40 p-1.5 rounded-2xl w-fit">
                {([
                    { id: 'config-global', label: 'Config Global por Tipo', icon: Settings2 },
                    { id: 'por-modulo', label: 'Por Módulo', icon: BookOpen },
                ] as const).map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={cn(
                            'flex items-center gap-2.5 px-6 py-3 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all',
                            activeTab === tab.id
                                ? 'bg-primary text-white'
                                : 'text-muted-foreground hover:text-foreground'
                        )}
                    >
                        <tab.icon className="w-4 h-4" />
                        {tab.label}
                    </button>
                ))}
            </div>

            <AnimatePresence mode="wait">
                {/* ═══════════════════════════════════════════════════════
                    TAB 1: CONFIG GLOBAL
                    ═══════════════════════════════════════════════════════ */}
                {activeTab === 'config-global' && (
                    <motion.div
                        key="config-global"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.15 }}
                        className="grid grid-cols-1 lg:grid-cols-12 gap-8"
                    >
                        {/* Left: Tipos de programa */}
                        <div className="lg:col-span-4 space-y-4">
                            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground px-1">
                                Tipos de Programa
                            </p>
                            <div className="space-y-2 overflow-y-auto max-h-[600px] pr-1">
                                {configLoading && tipos.length === 0 ? (
                                    <div className="flex items-center justify-center py-16 opacity-30">
                                        <RefreshCw className="w-8 h-8 animate-spin" />
                                    </div>
                                ) : tipos.map(tipo => (
                                    <button
                                        key={tipo.id}
                                        onClick={() => setSelectedTipo(tipo)}
                                        className={cn(
                                            'w-full p-5 rounded-2xl border text-left flex items-center justify-between gap-4 transition-all group',
                                            selectedTipo?.id === tipo.id
                                                ? 'bg-primary border-primary text-white shadow-xl shadow-primary/20'
                                                : 'bg-card border-border hover:border-primary/50'
                                        )}
                                    >
                                        <div className="flex items-center gap-3 min-w-0">
                                            <div className={cn(
                                                'w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0',
                                                selectedTipo?.id === tipo.id ? 'bg-white/20' : 'bg-primary/10 text-primary'
                                            )}>
                                                <Trophy className="w-4 h-4" />
                                            </div>
                                            <div className="min-w-0">
                                                <p className="text-xs font-black truncate">{tipo.nombre}</p>
                                                <p className={cn('text-[9px] font-bold mt-0.5',
                                                    selectedTipo?.id === tipo.id ? 'text-white/60' : 'text-muted-foreground'
                                                )}>
                                                    {tipo.mod_tipos_calificacion?.length ?? 0} categorías
                                                </p>
                                            </div>
                                        </div>
                                        <ChevronRight className={cn('w-4 h-4 flex-shrink-0 transition-transform',
                                            selectedTipo?.id === tipo.id ? 'text-white rotate-90' : 'text-muted-foreground/40'
                                        )} />
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Right: Config del tipo seleccionado */}
                        <div className="lg:col-span-8 space-y-6">
                            {selectedTipo ? (
                                <>
                                    {/* Stats Row */}
                                    <div className="grid grid-cols-3 gap-4">
                                        <div className="p-5 rounded-2xl bg-gradient-to-br from-primary to-primary/80 text-white border-none shadow-xl">
                                            <p className="text-[9px] font-black uppercase tracking-widest opacity-60 mb-1">Categorías</p>
                                            <h3 className="text-4xl font-black">{selectedConfigs.length}</h3>
                                        </div>
                                        <div className="p-5 rounded-2xl bg-card border border-border">
                                            <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground mb-1">Peso Total</p>
                                            <div className="flex items-end gap-1.5">
                                                <h3 className={cn('text-4xl font-black', totalPesoConfig > (selectedTipo.notaMaxima || 100) ? 'text-rose-500' : totalPesoConfig === (selectedTipo.notaMaxima || 100) ? 'text-emerald-500' : 'text-primary')}>
                                                    {totalPesoConfig}
                                                </h3>
                                                <span className="text-xs font-bold text-muted-foreground mb-1">/ {selectedTipo.notaMaxima || 100} pts</span>
                                            </div>
                                            <div className="w-full h-1.5 bg-muted rounded-full mt-2 overflow-hidden">
                                                <div
                                                    className={cn('h-full transition-all duration-500', totalPesoConfig > (selectedTipo.notaMaxima || 100) ? 'bg-rose-500' : totalPesoConfig === (selectedTipo.notaMaxima || 100) ? 'bg-emerald-500' : 'bg-primary')}
                                                    style={{ width: `${Math.min(100, (totalPesoConfig / (selectedTipo.notaMaxima || 100)) * 100)}%` }}
                                                />
                                            </div>
                                        </div>
                                        <div className="p-5 rounded-2xl bg-card border border-border flex flex-col justify-between">
                                            <Info className="w-4 h-4 text-primary" />
                                            <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">
                                                {totalPesoConfig === (selectedTipo.notaMaxima || 100) ? '✓ Config completa' : `Falta ${(selectedTipo.notaMaxima || 100) - totalPesoConfig} pts`}
                                            </p>
                                            <button
                                                onClick={() => setApplyModal(true)}
                                                className="w-full flex items-center justify-center gap-2 py-2 rounded-xl bg-primary/5 text-primary text-[10px] font-black uppercase tracking-widest hover:bg-primary/10 transition-all border border-primary/10"
                                            >
                                                <Zap className="w-3.5 h-3.5" /> Aplicar a Módulo
                                            </button>
                                        </div>
                                    </div>

                                    {/* Table */}
                                    <div className="bg-card rounded-[2rem] border border-border/40 overflow-hidden">
                                        <div className="flex items-center justify-between px-8 py-5 border-b border-border/40 bg-muted/20">
                                            <div>
                                                <h3 className="text-sm font-black uppercase tracking-tight">
                                                    {selectedTipo.nombre}
                                                </h3>
                                                <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest mt-0.5">
                                                    Estándares Globales
                                                </p>
                                            </div>
                                            <button
                                                onClick={openCreateConfig}
                                                className="flex items-center gap-2 h-10 px-5 rounded-xl bg-primary text-white text-[10px] font-black uppercase tracking-widest hover:bg-primary/90 transition-all shadow-md shadow-primary/20"
                                            >
                                                <Plus className="w-4 h-4" /> Nueva
                                            </button>
                                        </div>
                                        <table className="w-full text-left">
                                            <thead>
                                                <tr className="border-b border-border/40">
                                                    <th className="px-8 py-4 text-[9px] font-black uppercase tracking-widest text-muted-foreground">Nombre</th>
                                                    <th className="px-6 py-4 text-[9px] font-black uppercase tracking-widest text-muted-foreground text-center">Peso</th>
                                                    <th className="px-6 py-4 text-[9px] font-black uppercase tracking-widest text-muted-foreground text-center">Eval Final</th>
                                                    <th className="px-6 py-4 text-[9px] font-black uppercase tracking-widest text-muted-foreground text-right">Acciones</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-border/30">
                                                <AnimatePresence>
                                                    {selectedConfigs.length === 0 ? (
                                                        <tr>
                                                            <td colSpan={4} className="px-8 py-16 text-center">
                                                                <div className="flex flex-col items-center gap-3 opacity-25">
                                                                    <Tag className="w-10 h-10" />
                                                                    <p className="text-[10px] font-black uppercase tracking-widest">Sin categorías configuradas</p>
                                                                    <p className="text-xs text-muted-foreground">Crea la primera para este tipo de programa</p>
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    ) : selectedConfigs.map((cfg, i) => (
                                                        <motion.tr
                                                            key={cfg.id}
                                                            initial={{ opacity: 0, y: 8 }}
                                                            animate={{ opacity: 1, y: 0 }}
                                                            transition={{ delay: i * 0.04 }}
                                                            className="group hover:bg-muted/20 transition-all"
                                                        >
                                                            <td className="px-8 py-5">
                                                                <div className="flex items-center gap-3">
                                                                    <div className="w-8 h-8 rounded-lg bg-primary/5 text-primary flex items-center justify-center font-black text-xs">
                                                                        {cfg.nombre.charAt(0)}
                                                                    </div>
                                                                    <p className="text-sm font-black text-foreground">{cfg.nombre}</p>
                                                                </div>
                                                            </td>
                                                            <td className="px-6 py-5 text-center">
                                                                <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-primary/5 text-primary font-black text-xs border border-primary/10">
                                                                    <Percent className="w-3 h-3" />{cfg.peso}
                                                                </span>
                                                            </td>
                                                            <td className="px-6 py-5 text-center">
                                                                {cfg.esEvalFinal ? (
                                                                    <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-amber-50 text-amber-600 font-black text-[9px] uppercase tracking-widest border border-amber-100">
                                                                        <Shield className="w-3 h-3" /> Final
                                                                    </span>
                                                                ) : (
                                                                    <span className="text-muted-foreground/30 font-bold text-xs">—</span>
                                                                )}
                                                            </td>
                                                            <td className="px-6 py-5 text-right">
                                                                <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                                    <button onClick={() => openEditConfig(cfg)} className="w-9 h-9 rounded-xl bg-primary/5 text-primary flex items-center justify-center hover:bg-primary hover:text-white transition-all">
                                                                        <Edit3 className="w-3.5 h-3.5" />
                                                                    </button>
                                                                    <button onClick={() => handleDeleteConfig(cfg.id)} className="w-9 h-9 rounded-xl bg-rose-50 text-rose-500 flex items-center justify-center hover:bg-rose-500 hover:text-white transition-all">
                                                                        <Trash2 className="w-3.5 h-3.5" />
                                                                    </button>
                                                                </div>
                                                            </td>
                                                        </motion.tr>
                                                    ))}
                                                </AnimatePresence>
                                            </tbody>
                                        </table>
                                    </div>
                                </>
                            ) : (
                                <div className="flex items-center justify-center h-72 opacity-20">
                                    <p className="text-[11px] font-black uppercase tracking-widest">Selecciona un tipo de programa</p>
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}

                {/* ═══════════════════════════════════════════════════════
                    TAB 2: POR MÓDULO
                    ═══════════════════════════════════════════════════════ */}
                {activeTab === 'por-modulo' && (
                    <motion.div
                        key="por-modulo"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.15 }}
                        className="grid grid-cols-1 lg:grid-cols-12 gap-8"
                    >
                        {/* Left: Módulos */}
                        <div className="lg:col-span-4 space-y-4">
                            <div className="relative group">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                                <input
                                    type="text"
                                    placeholder="Buscar módulo..."
                                    value={searchMod}
                                    onChange={e => setSearchMod(e.target.value)}
                                    className="w-full h-11 pl-11 pr-4 rounded-xl bg-card border border-border outline-none focus:border-primary text-xs font-bold transition-all"
                                />
                            </div>
                            <div className="space-y-2 overflow-y-auto max-h-[580px] pr-1">
                                {moduloLoading ? (
                                    <div className="flex items-center justify-center py-16 opacity-30">
                                        <RefreshCw className="w-8 h-8 animate-spin" />
                                    </div>
                                ) : filteredModulos.length === 0 ? (
                                    <div className="flex flex-col items-center py-16 opacity-20 gap-3">
                                        <BookOpen className="w-10 h-10" />
                                        <p className="text-[10px] font-black uppercase tracking-widest">Sin módulos</p>
                                    </div>
                                ) : filteredModulos.map(m => (
                                    <button
                                        key={m.id}
                                        onClick={() => handleSelectModulo(m)}
                                        className={cn(
                                            'w-full p-4 rounded-2xl border text-left flex items-start gap-3 transition-all group',
                                            selectedModulo?.id === m.id
                                                ? 'bg-primary border-primary text-white shadow-xl shadow-primary/20'
                                                : 'bg-card border-border hover:border-primary/50'
                                        )}
                                    >
                                        <div className={cn(
                                            'w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0',
                                            selectedModulo?.id === m.id ? 'bg-white/20' : 'bg-primary/10 text-primary'
                                        )}>
                                            <BookOpen className="w-4 h-4" />
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <p className={cn('text-[8px] font-black uppercase tracking-widest mb-0.5',
                                                selectedModulo?.id === m.id ? 'text-white/60' : 'text-primary'
                                            )}>
                                                {m.programaDos?.nombre ?? 'Programa'}
                                            </p>
                                            <p className="text-xs font-black leading-tight truncate">{m.nombre}</p>
                                            <div className="flex items-center gap-1.5 mt-1">
                                                <span className={cn('text-[8px] font-bold',
                                                    selectedModulo?.id === m.id ? 'text-white/50' : 'text-muted-foreground'
                                                )}>
                                                    {m.mod_categorias_calif?.length ?? 0} categorías
                                                </span>
                                            </div>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Right: Categorías del módulo */}
                        <div className="lg:col-span-8 space-y-6">
                            {selectedModulo ? (
                                <>
                                    <div className="grid grid-cols-3 gap-4">
                                        <div className="p-5 rounded-2xl bg-gradient-to-br from-primary to-primary/80 text-white shadow-xl col-span-1">
                                            <p className="text-[9px] font-black uppercase tracking-widest opacity-60 mb-1">Categorías</p>
                                            <h3 className="text-4xl font-black">{categorias.length}</h3>
                                        </div>
                                        <div className="p-5 rounded-2xl bg-card border border-border">
                                            <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground mb-1">Peso Total</p>
                                            <div className="flex items-end gap-1.5">
                                                <h3 className={cn('text-4xl font-black', totalPesoCat > (selectedModulo.programaDos?.tipo?.notaMaxima || 100) ? 'text-rose-500' : totalPesoCat === (selectedModulo.programaDos?.tipo?.notaMaxima || 100) ? 'text-emerald-500' : 'text-primary')}>
                                                    {totalPesoCat}
                                                </h3>
                                                <span className="text-xs font-bold text-muted-foreground mb-1">/ {selectedModulo.programaDos?.tipo?.notaMaxima || 100} pts</span>
                                            </div>
                                            <div className="w-full h-1.5 bg-muted rounded-full mt-2 overflow-hidden">
                                                <div className={cn('h-full transition-all duration-500', totalPesoCat > (selectedModulo.programaDos?.tipo?.notaMaxima || 100) ? 'bg-rose-500' : totalPesoCat === (selectedModulo.programaDos?.tipo?.notaMaxima || 100) ? 'bg-emerald-500' : 'bg-primary')} style={{ width: `${Math.min(100, (totalPesoCat / (selectedModulo.programaDos?.tipo?.notaMaxima || 100)) * 100)}%` }} />
                                            </div>
                                        </div>
                                        <div className="p-5 rounded-2xl bg-card border border-border flex flex-col justify-between">
                                            <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground mb-2">Tipo Programa</p>
                                            <p className="text-xs font-black text-foreground">
                                                {selectedModulo.programaDos?.tipo?.nombre ?? '—'}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="bg-card rounded-[2rem] border border-border/40 overflow-hidden">
                                        <div className="flex items-center justify-between px-8 py-5 border-b border-border/40 bg-muted/20">
                                            <div>
                                                <h3 className="text-sm font-black uppercase tracking-tight">{selectedModulo.nombre}</h3>
                                                <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest mt-0.5">
                                                    Parametrización Específica por Módulo
                                                </p>
                                            </div>
                                            <button
                                                onClick={openCreateCat}
                                                className="flex items-center gap-2 h-10 px-5 rounded-xl bg-primary text-white text-[10px] font-black uppercase tracking-widest hover:bg-primary/90 transition-all shadow-md shadow-primary/20"
                                            >
                                                <Plus className="w-4 h-4" /> Nueva Categoría
                                            </button>
                                        </div>
                                        <table className="w-full text-left">
                                            <thead>
                                                <tr className="border-b border-border/40">
                                                    <th className="px-8 py-4 text-[9px] font-black uppercase tracking-widest text-muted-foreground">Nombre</th>
                                                    <th className="px-6 py-4 text-[9px] font-black uppercase tracking-widest text-muted-foreground text-center">Pts</th>
                                                    <th className="px-6 py-4 text-[9px] font-black uppercase tracking-widest text-muted-foreground text-center">Tipo</th>
                                                    <th className="px-6 py-4 text-[9px] font-black uppercase tracking-widest text-muted-foreground text-right">Acciones</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-border/30">
                                                <AnimatePresence>
                                                    {catLoading ? (
                                                        <tr>
                                                            <td colSpan={4} className="px-8 py-16 text-center">
                                                                <RefreshCw className="w-6 h-6 animate-spin mx-auto opacity-30" />
                                                            </td>
                                                        </tr>
                                                    ) : categorias.length === 0 ? (
                                                        <tr>
                                                            <td colSpan={4} className="px-8 py-16 text-center">
                                                                <div className="flex flex-col items-center gap-3 opacity-20">
                                                                    <ListChecks className="w-10 h-10" />
                                                                    <p className="text-[10px] font-black uppercase tracking-widest">Sin categorías en este módulo</p>
                                                                    <p className="text-xs">Crea una o aplica la config del tipo de programa</p>
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    ) : categorias.map((cat, i) => (
                                                        <motion.tr
                                                            key={cat.id}
                                                            initial={{ opacity: 0, y: 8 }}
                                                            animate={{ opacity: 1, y: 0 }}
                                                            transition={{ delay: i * 0.04 }}
                                                            className="group hover:bg-muted/20 transition-all"
                                                        >
                                                            <td className="px-8 py-5">
                                                                <div className="flex items-center gap-3">
                                                                    <div className="w-8 h-8 rounded-lg bg-primary/5 text-primary flex items-center justify-center font-black text-xs">
                                                                        {cat.nombre.charAt(0)}
                                                                    </div>
                                                                    <p className="text-sm font-black">{cat.nombre}</p>
                                                                </div>
                                                            </td>
                                                            <td className="px-6 py-5 text-center">
                                                                <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-primary/5 text-primary font-black text-xs border border-primary/10">
                                                                    <Percent className="w-3 h-3" />{cat.ponderacion}
                                                                </span>
                                                            </td>
                                                            <td className="px-6 py-5 text-center">
                                                                {cat.esEvalFinal ? (
                                                                    <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-amber-50 text-amber-600 font-black text-[9px] uppercase tracking-widest border border-amber-100">
                                                                        <Shield className="w-3 h-3" /> Final
                                                                    </span>
                                                                ) : (
                                                                    <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-50 text-slate-500 font-black text-[9px] uppercase tracking-widest border border-slate-100">
                                                                        Parcial
                                                                    </span>
                                                                )}
                                                            </td>
                                                            <td className="px-6 py-5 text-right">
                                                                <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                                    <button onClick={() => openEditCat(cat)} className="w-9 h-9 rounded-xl bg-primary/5 text-primary flex items-center justify-center hover:bg-primary hover:text-white transition-all">
                                                                        <Edit3 className="w-3.5 h-3.5" />
                                                                    </button>
                                                                    <button onClick={() => handleDeleteCat(cat.id)} className="w-9 h-9 rounded-xl bg-rose-50 text-rose-500 flex items-center justify-center hover:bg-rose-500 hover:text-white transition-all">
                                                                        <Trash2 className="w-3.5 h-3.5" />
                                                                    </button>
                                                                </div>
                                                            </td>
                                                        </motion.tr>
                                                    ))}
                                                </AnimatePresence>
                                            </tbody>
                                        </table>
                                    </div>
                                </>
                            ) : (
                                <div className="flex items-center justify-center h-72 opacity-20">
                                    <p className="text-[11px] font-black uppercase tracking-widest">Selecciona un módulo</p>
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ═══════════════════════════════════════════════════════
                MODAL CRUD (Shared for config and categories)
                ═══════════════════════════════════════════════════════ */}
            <AnimatePresence>
                {modalOpen && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setModalMode(null)}
                            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                        />
                        <motion.div
                            initial={{ scale: 0.92, opacity: 0, y: 24 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.92, opacity: 0, y: 24 }}
                            className="relative w-full max-w-md bg-card rounded-[2.5rem] shadow-2xl border border-border p-10"
                        >
                            <div className="flex items-center justify-between mb-8">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-primary text-white flex items-center justify-center">
                                        <Tag className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <h2 className="text-lg font-black uppercase italic tracking-tight">
                                            {(modalMode === 'edit-config' || modalMode === 'edit-cat') ? 'Editar' : 'Nueva'}{' '}
                                            <span className="text-primary">Categoría</span>
                                        </h2>
                                        <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest mt-0.5">
                                            {(modalMode === 'create-config' || modalMode === 'edit-config')
                                                ? `Tipo: ${selectedTipo?.nombre}`
                                                : `Módulo: ${selectedModulo?.nombre}`
                                            }
                                        </p>
                                    </div>
                                </div>
                                <button onClick={() => setModalMode(null)} className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center hover:bg-muted/80 transition-all">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <form
                                onSubmit={(modalMode === 'create-config' || modalMode === 'edit-config')
                                    ? handleSubmitConfig
                                    : handleSubmitCat
                                }
                                className="space-y-5"
                            >
                                <div className="space-y-1.5">
                                    <label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">Nombre de la Categoría *</label>
                                    <input
                                        required
                                        type="text"
                                        placeholder="Ej: Producto Académico, Evaluación Final..."
                                        value={form.nombre}
                                        onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))}
                                        className="w-full h-13 px-5 rounded-2xl bg-muted/40 border-2 border-transparent focus:border-primary/20 focus:bg-card outline-none transition-all font-bold text-sm"
                                    />
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">Puntaje / Ponderación (pts) *</label>
                                    <div className="relative">
                                        <input
                                            required
                                            type="number"
                                            min={1}
                                            max={modalMode?.includes('config') ? (selectedTipo?.notaMaxima || 100) : (selectedModulo?.programaDos?.tipo?.notaMaxima || 100)}
                                            value={form.peso}
                                            onChange={e => setForm(f => ({ ...f, peso: parseInt(e.target.value) || 0 }))}
                                            className="w-full h-14 px-6 rounded-2xl bg-muted/40 border-2 border-transparent focus:border-primary/20 focus:bg-card outline-none transition-all font-black text-3xl text-center pr-12"
                                        />
                                        <span className="absolute right-5 top-1/2 -translate-y-1/2 font-black text-muted-foreground text-lg">pts</span>
                                    </div>
                                    <div className="flex justify-between text-[9px] font-bold text-muted-foreground mt-1">
                                        <span>Disponible: {(modalMode?.includes('config') ? (selectedTipo?.notaMaxima || 100) : (selectedModulo?.programaDos?.tipo?.notaMaxima || 100)) - ((modalMode?.includes('config')) ? totalPesoConfig : totalPesoCat) + (editingItem ? form.peso : 0)} pts</span>
                                        <span>Total actual: {(modalMode?.includes('config')) ? totalPesoConfig : totalPesoCat} pts</span>
                                    </div>
                                </div>

                                <label className="flex items-center gap-3 p-4 rounded-2xl bg-muted/30 cursor-pointer hover:bg-muted/50 transition-all border-2 border-transparent has-[:checked]:border-amber-400/30 has-[:checked]:bg-amber-50/50">
                                    <input
                                        type="checkbox"
                                        checked={form.esEvalFinal}
                                        onChange={e => setForm(f => ({ ...f, esEvalFinal: e.target.checked }))}
                                        className="w-5 h-5 rounded-lg accent-amber-500"
                                    />
                                    <div>
                                        <p className="text-xs font-black">Es Evaluación Final</p>
                                        <p className="text-[9px] text-muted-foreground font-medium">Marca esta categoría como el cuestionario o producto final del módulo</p>
                                    </div>
                                    <Shield className={cn('w-5 h-5 ml-auto flex-shrink-0 transition-colors', form.esEvalFinal ? 'text-amber-500' : 'text-muted-foreground/20')} />
                                </label>

                                <div className="flex gap-3 pt-4">
                                    <button
                                        type="button"
                                        onClick={() => setModalMode(null)}
                                        className="flex-1 h-13 rounded-2xl border border-border text-[10px] font-black uppercase tracking-widest hover:bg-muted transition-all"
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={configLoading || catLoading}
                                        className="flex-[2] h-13 rounded-2xl bg-primary text-white text-[10px] font-black uppercase tracking-widest shadow-xl shadow-primary/20 hover:bg-primary/90 transition-all flex items-center justify-center gap-2.5 disabled:opacity-50"
                                    >
                                        <CheckCircle2 className="w-5 h-5" />
                                        {(modalMode === 'edit-config' || modalMode === 'edit-cat') ? 'Guardar Cambios' : 'Crear Categoría'}
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* ═══════════════════════════════════════════════════════
                MODAL: APLICAR CONFIG A MÓDULO
                ═══════════════════════════════════════════════════════ */}
            <AnimatePresence>
                {applyModal && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setApplyModal(false)}
                            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                        />
                        <motion.div
                            initial={{ scale: 0.92, opacity: 0, y: 24 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.92, opacity: 0, y: 24 }}
                            className="relative w-full max-w-md bg-card rounded-[2.5rem] shadow-2xl border border-border p-10"
                        >
                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-10 h-10 rounded-xl bg-primary text-white flex items-center justify-center">
                                    <Zap className="w-5 h-5" />
                                </div>
                                <div>
                                    <h2 className="text-lg font-black uppercase italic tracking-tight">
                                        Aplicar <span className="text-primary">Config</span>
                                    </h2>
                                    <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">
                                        Tipo: {selectedTipo?.nombre}
                                    </p>
                                </div>
                            </div>

                            <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 flex items-start gap-3 mb-6">
                                <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                                <p className="text-xs text-amber-700 font-medium">
                                    Se crearán instancias de <strong>{selectedConfigs.length} categorías</strong> en el módulo seleccionado. Las categorías ya existentes serán omitidas.
                                </p>
                            </div>

                            <div className="space-y-2 mb-6">
                                <label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">Seleccionar Módulo *</label>
                                <select
                                    value={applyModuloId}
                                    onChange={e => setApplyModuloId(e.target.value)}
                                    className="w-full h-13 px-5 rounded-2xl bg-muted/40 border-2 border-transparent focus:border-primary/20 focus:bg-card outline-none font-bold text-sm"
                                >
                                    <option value="">-- Seleccionar módulo --</option>
                                    {modulos.map(m => (
                                        <option key={m.id} value={m.id}>
                                            {m.programaDos?.nombre} → {m.nombre}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="flex gap-3">
                                <button onClick={() => setApplyModal(false)} className="flex-1 h-13 rounded-2xl border border-border text-[10px] font-black uppercase tracking-widest hover:bg-muted transition-all">
                                    Cancelar
                                </button>
                                <button
                                    disabled={!applyModuloId}
                                    onClick={handleAplicarConfig}
                                    className="flex-[2] h-13 rounded-2xl bg-primary text-white text-[10px] font-black uppercase tracking-widest shadow-xl shadow-primary/20 hover:bg-primary/90 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                                >
                                    <ArrowRight className="w-4 h-4" /> Aplicar Config
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
