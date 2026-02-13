'use client';

import { useState, useEffect } from 'react';
import { galeriaService } from '@/services/galeriaService';
import { sedeService } from '@/services/sedeService';
import { Modal } from '@/components/Modal';
import { Card } from '@/components/ui/Card';
import {
    Plus,
    Edit2,
    Trash2,
    Search,
    Image as ImageIcon,
    Building2,
    AlertCircle,
    Layout
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { Can } from '@/components/Can';

export default function GaleriasPage() {
    const [galerias, setGalerias] = useState<any[]>([]);
    const [sedes, setSedes] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isDeleting, setIsDeleting] = useState<string | null>(null);
    const [editingGaleria, setEditingGaleria] = useState<any>(null);
    const [formData, setFormData] = useState({
        titulo: '',
        descripcion: '',
        imagen: '',
        sedeId: '',
    });

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            const [galData, sedesData] = await Promise.all([
                galeriaService.getAll(),
                sedeService.getAll()
            ]);
            setGalerias(galData);
            setSedes(sedesData);
        } catch (error) {
            console.error('Error loading data:', error);
            toast.error('Error en el enlace con el catálogo de galerías');
        } finally {
            setLoading(false);
        }
    };

    const handleOpenModal = (gal: any = null) => {
        if (gal) {
            setEditingGaleria(gal);
            setFormData({
                titulo: gal.titulo,
                descripcion: gal.descripcion || '',
                imagen: gal.imagen,
                sedeId: gal.sedeId || '',
            });
        } else {
            setEditingGaleria(null);
            setFormData({
                titulo: '',
                descripcion: '',
                imagen: '',
                sedeId: sedes[0]?.id || '',
            });
        }
        setIsModalOpen(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (editingGaleria) {
                await galeriaService.update(editingGaleria.id, formData);
                toast.success('Galería actualizada correctamente');
            } else {
                await galeriaService.create(formData);
                toast.success('Nueva entrada de galería registrada');
            }
            setIsModalOpen(false);
            loadData();
        } catch (error) {
            console.error('Error saving galeria:', error);
            toast.error('Fallo en el protocolo de guardado');
        }
    };

    const handleDelete = async (id: string) => {
        try {
            await galeriaService.delete(id);
            toast.success('Entrada de galería removida');
            setIsDeleting(null);
            loadData();
        } catch (error) {
            console.error('Error deleting galeria:', error);
            toast.error('Error en la baja del registro');
        }
    };

    const filteredGalerias = galerias.filter(g =>
        g.titulo.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-10 pb-20">
            {/* Header */}
            <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8">
                <div className="space-y-1">
                    <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.3em] text-primary mb-3">
                        <ImageIcon className="w-4 h-4" />
                        <span>Catálogo Visual</span>
                    </div>
                    <h1 className="text-4xl font-black tracking-tighter text-foreground uppercase leading-none">Galerías</h1>
                    <p className="text-sm font-medium text-muted-foreground max-w-lg">
                        Gestión de imágenes y recursos visuales asociados a las sedes académicas.
                    </p>
                </div>

                <div className="flex items-center gap-4">
                    <div className="relative group hidden md:block">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                        <input
                            type="text"
                            placeholder="Buscar título..."
                            className="h-14 pl-12 pr-6 rounded-2xl bg-card border border-border focus:border-primary focus:ring-8 focus:ring-primary/5 transition-all outline-none text-xs font-bold w-64"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>

                    <Can action="create" subject="Galeria">
                        <button
                            onClick={() => handleOpenModal()}
                            className="h-14 px-8 rounded-2xl bg-primary text-white font-black text-xs uppercase tracking-[0.2em] shadow-2xl shadow-primary/20 hover:opacity-95 active:scale-95 transition-all flex items-center gap-3 shrink-0"
                        >
                            <Plus className="w-5 h-5" />
                            Añadir Imagen
                        </button>
                    </Can>
                </div>
            </div>

            {/* Grid Display */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {loading && galerias.length === 0 ? (
                    Array(4).fill(0).map((_, i) => (
                        <div key={i} className="h-64 rounded-3xl bg-card border border-border animate-pulse" />
                    ))
                ) : (
                    <AnimatePresence mode="popLayout">
                        {filteredGalerias.map((gal) => (
                            <motion.div
                                key={gal.id}
                                layout
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                className="group"
                            >
                                <Card className="p-0 overflow-hidden border-border bg-card hover:border-primary/40 transition-all duration-300 shadow-xl shadow-black/[0.02]">
                                    <div className="relative aspect-video bg-muted overflow-hidden">
                                        {gal.imagen ? (
                                            <img
                                                src={gal.imagen}
                                                alt={gal.titulo}
                                                className="w-full h-full object-cover transition-transform group-hover:scale-110 duration-500"
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center">
                                                <ImageIcon className="w-12 h-12 text-muted-foreground/20" />
                                            </div>
                                        )}
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

                                        <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-all translate-y-[-10px] group-hover:translate-y-0">
                                            <Can action="update" subject="Galeria">
                                                <button
                                                    onClick={() => handleOpenModal(gal)}
                                                    className="w-9 h-9 rounded-xl bg-white/90 backdrop-blur-sm text-foreground hover:bg-white hover:text-primary transition-all shadow-lg"
                                                >
                                                    <Edit2 className="w-4 h-4 mx-auto" />
                                                </button>
                                            </Can>
                                            <Can action="delete" subject="Galeria">
                                                <button
                                                    onClick={() => setIsDeleting(gal.id)}
                                                    className="w-9 h-9 rounded-xl bg-white/90 backdrop-blur-sm text-foreground hover:bg-white hover:text-rose-600 transition-all shadow-lg"
                                                >
                                                    <Trash2 className="w-4 h-4 mx-auto" />
                                                </button>
                                            </Can>
                                        </div>
                                    </div>

                                    <div className="p-6 space-y-3">
                                        <div className="space-y-1">
                                            <h3 className="text-base font-black tracking-tight text-foreground uppercase truncate">
                                                {gal.titulo}
                                            </h3>
                                            {gal.sede && (
                                                <div className="flex items-center gap-1.5">
                                                    <Building2 className="w-3 h-3 text-primary" />
                                                    <span className="text-[10px] font-bold text-muted-foreground uppercase">{gal.sede.nombre}</span>
                                                </div>
                                            )}
                                        </div>
                                        <p className="text-[11px] text-muted-foreground line-clamp-2 italic">
                                            {gal.descripcion || 'Sin descripción adicional.'}
                                        </p>
                                    </div>
                                </Card>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                )}
            </div>

            {/* MODAL */}
            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={editingGaleria ? 'Actualizar Galería' : 'Nueva Entrada Visual'}
            >
                <form onSubmit={handleSubmit} className="space-y-8">
                    <div className="grid grid-cols-1 gap-6">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">Sede Asociada</label>
                            <select
                                className="w-full h-14 px-6 rounded-2xl bg-card border border-border focus:border-primary focus:ring-8 focus:ring-primary/5 transition-all outline-none text-[11px] font-black text-foreground uppercase tracking-tight appearance-none ring-inset"
                                value={formData.sedeId}
                                onChange={(e) => setFormData({ ...formData, sedeId: e.target.value })}
                                required
                            >
                                <option value="">Seleccionar Sede (Opcional)</option>
                                {sedes.map(s => (
                                    <option key={s.id} value={s.id}>{s.nombre}</option>
                                ))}
                            </select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">Título de la Imagen</label>
                            <input
                                type="text"
                                className="w-full h-14 px-6 rounded-2xl bg-card border border-border focus:border-primary focus:ring-8 focus:ring-primary/5 transition-all outline-none text-sm font-black text-foreground uppercase tracking-tight"
                                placeholder="p. ej. VISTA FRONTAL SEDE"
                                value={formData.titulo}
                                onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">URL de la Imagen</label>
                            <input
                                type="text"
                                className="w-full h-14 px-6 rounded-2xl bg-card border border-border focus:border-primary focus:ring-8 focus:ring-primary/5 transition-all outline-none text-sm font-bold text-foreground"
                                placeholder="https://ejemplo.com/foto.jpg"
                                value={formData.imagen}
                                onChange={(e) => setFormData({ ...formData, imagen: e.target.value })}
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">Descripción</label>
                            <textarea
                                className="w-full px-6 py-4 rounded-2xl bg-card border border-border focus:border-primary focus:ring-8 focus:ring-primary/5 transition-all outline-none text-sm font-medium text-foreground min-h-[100px]"
                                placeholder="Detalles de la imagen..."
                                value={formData.descripcion}
                                onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                            />
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-6 border-t border-border">
                        <button
                            type="button"
                            onClick={() => setIsModalOpen(false)}
                            className="h-14 px-8 rounded-2xl text-[11px] font-black uppercase tracking-widest text-muted-foreground hover:text-foreground transition-all"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            className="h-14 px-10 rounded-2xl bg-primary text-white font-black text-[11px] uppercase tracking-[0.2em] shadow-2xl shadow-primary/20 hover:opacity-90 transition-all"
                        >
                            {editingGaleria ? 'Propagar Cambios' : 'Registrar Imagen'}
                        </button>
                    </div>
                </form>
            </Modal>

            {/* DELETE */}
            <Modal
                isOpen={!!isDeleting}
                onClose={() => setIsDeleting(null)}
                title="Baja de Recurso Visual"
            >
                <div className="space-y-8 text-center py-6">
                    <div className="w-20 h-20 rounded-[2.2rem] bg-destructive/10 text-destructive flex items-center justify-center mx-auto border-2 border-destructive/20 shadow-xl shadow-destructive/10">
                        <AlertCircle className="w-10 h-10" />
                    </div>
                    <div className="space-y-3">
                        <h3 className="text-2xl font-black tracking-tighter text-foreground uppercase">¿Remover Imagen?</h3>
                        <p className="text-[13px] text-muted-foreground px-10 leading-relaxed font-bold italic opacity-70">
                            "Esta acción eliminará el registro visual del catálogo de la sede."
                        </p>
                    </div>
                    <div className="flex flex-col gap-3 px-8">
                        <button
                            onClick={() => isDeleting && handleDelete(isDeleting)}
                            className="h-14 w-full rounded-2xl bg-destructive text-white font-black text-xs uppercase tracking-[0.2em] shadow-xl shadow-destructive/20 hover:opacity-90 active:scale-95 transition-all"
                        >
                            Confirmar Baja
                        </button>
                        <button
                            onClick={() => setIsDeleting(null)}
                            className="h-14 w-full rounded-2xl text-[11px] font-black uppercase tracking-widest text-muted-foreground hover:text-foreground transition-all"
                        >
                            Abortar Proceso
                        </button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}
