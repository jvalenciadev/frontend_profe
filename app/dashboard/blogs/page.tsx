'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { ImageUpload } from '@/components/ui/ImageUpload';
import { useAuth } from '@/contexts/AuthContext';
import { blogService, type Blog } from '@/services/blogService';
import { departmentService } from '@/services/departmentService';
import { Search, Plus, Filter, MoreHorizontal, Calendar, Clock, MapPin, CheckCircle2, ChevronRight, AlertCircle, FileText, Trash2, Edit, X, RefreshCw, BarChart3, Newspaper, Image as ImageIcon, MoreVertical } from 'lucide-react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { ConfirmModal } from '@/components/ConfirmModal';
import { Modal } from '@/components/Modal';

export default function BlogsPage() {
    const { user, isSuperAdmin } = useAuth();
    const [blogs, setBlogs] = useState<Blog[]>([]);

    // Helper para extraer imagen de forma segura
    const getBlogImage = (imagenes: any): string => {
        if (!imagenes) return '';

        try {
            if (Array.isArray(imagenes) && imagenes.length > 0) return imagenes[0];

            if (typeof imagenes === 'string') {
                if (imagenes.trim().startsWith('[')) {
                    const parsed = JSON.parse(imagenes);
                    if (Array.isArray(parsed) && parsed.length > 0) return parsed[0];
                }
                return imagenes;
            }

            if (typeof imagenes === 'object') {
                const values = Object.values(imagenes);
                if (values.length > 0) return values[0] as string;
            }
        } catch (e) {
            console.error('Error parsing image:', e);
            return typeof imagenes === 'string' ? imagenes : '';
        }
        return '';
    };

    const [departamentos, setDepartamentos] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [editingBlog, setEditingBlog] = useState<Blog | null>(null);
    const [formData, setFormData] = useState({
        titulo: '',
        descripcion: '',
        tipo: 'NOTICIA',
        fecha: new Date().toISOString().split('T')[0],
        estado: 'ACTIVO',
        imagen: '',
        tenantId: ''
    });
    const [isDeleting, setIsDeleting] = useState<string | null>(null);
    const [isConfirmingSave, setIsConfirmingSave] = useState(false);

    useEffect(() => {
        loadData();
    }, []);

    useEffect(() => {
        if (user) loadMetadata();
    }, [user, isSuperAdmin]);

    const loadMetadata = async () => {
        try {
            const depts = await departmentService.getAll();

            if (isSuperAdmin()) {
                setDepartamentos(depts);
            } else if (user?.tenantId) {
                const myDept = depts.filter((d: any) => d.id === user.tenantId);
                setDepartamentos(myDept);
            } else {
                setDepartamentos([]);
            }
        } catch (error) {
            console.error('Error loading metadata:', error);
        }
    };

    const loadData = async () => {
        try {
            setLoading(true);
            const data = await blogService.getAll();
            setBlogs(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error('Error loading data:', error);
            toast.error('Error al cargar los blogs');
        } finally {
            setLoading(false);
        }
    };

    const handleOpenModal = (blog?: Blog) => {
        if (blog) {
            setEditingBlog(blog);

            // Extraer la primera imagen usando el helper robusto
            const primeraImagen = getBlogImage(blog.imagenes);

            setFormData({
                titulo: blog.titulo,
                descripcion: blog.descripcion || '',
                tipo: blog.tipo || 'NOTICIA',
                fecha: blog.fecha ? blog.fecha.split('T')[0] : new Date().toISOString().split('T')[0],
                estado: blog.estado || 'ACTIVO',
                imagen: primeraImagen,
                tenantId: (blog as any).tenantId || ''
            });
        } else {
            setEditingBlog(null);
            resetForm();
        }
        setIsModalOpen(true);
    };

    const resetForm = () => {
        setFormData({
            titulo: '',
            descripcion: '',
            tipo: 'NOTICIA',
            fecha: new Date().toISOString().split('T')[0],
            estado: 'ACTIVO',
            imagen: '',
            tenantId: isSuperAdmin() ? '' : (user?.tenantId || '')
        });
    };

    const handleSubmit = async () => {
        try {
            setIsLoading(true);

            // Convertir imagen (string) a imagenes (array) para el backend
            const { imagen, ...rest } = formData;
            const payload = {
                ...rest,
                imagenes: imagen ? [imagen] : [],
                fecha: new Date(formData.fecha).toISOString(),
                tenantId: formData.tenantId || null
            };

            if (editingBlog) {
                await blogService.update(editingBlog.id, payload);
                toast.success('Blog actualizado exitosamente');
            } else {
                await blogService.create(payload);
                toast.success('Blog creado exitosamente');
            }
            setIsModalOpen(false);
            setIsConfirmingSave(false);
            loadData();
        } catch (error) {
            console.error('Error saving:', error);
            toast.error('Error al guardar el blog');
        } finally {
            setIsLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        try {
            setIsLoading(true);
            await blogService.delete(id);
            toast.success('Blog eliminado');
            setIsDeleting(null);
            loadData();
        } catch (error) {
            console.error('Error deleting:', error);
            toast.error('Error al eliminar el blog');
        } finally {
            setIsLoading(false);
        }
    };

    const filteredBlogs = (blogs || []).filter(b => {
        const term = searchTerm.toLowerCase();
        return (b.titulo?.toLowerCase() || '').includes(term) ||
            (b.descripcion?.toLowerCase() || '').includes(term);
    });

    return (
        <div className="min-h-screen bg-background p-8">
            {/* Header Institucional */}
            <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div className="space-y-2">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-primary flex items-center justify-center text-white shadow-lg shadow-primary/20">
                            <FileText className="w-6 h-6" />
                        </div>
                        <h1 className="text-3xl font-black tracking-tight uppercase italic text-foreground leading-none">
                            Blogs & <span className="text-primary/70">Noticias</span>
                        </h1>
                    </div>
                    <p className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground ml-1">Portal Informativo Institucional</p>
                </div>

                <div className="flex items-center gap-3">
                    <div className="relative group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                        <input
                            type="text"
                            placeholder="Buscar artículos..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="h-12 pl-12 pr-6 rounded-2xl bg-card border border-border focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all outline-none text-[11px] font-bold uppercase tracking-widest min-w-[300px]"
                        />
                    </div>
                    <button
                        onClick={() => handleOpenModal()}
                        className="h-12 px-6 rounded-2xl bg-primary text-white font-black text-[10px] uppercase tracking-widest flex items-center gap-2 hover:opacity-90 transition-all shadow-lg shadow-primary/20"
                    >
                        <Plus className="w-5 h-5" />
                        Nuevo Artículo
                    </button>
                </div>
            </div>

            {/* Grid de Blogs */}
            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {Array(6).fill(0).map((_, i) => (
                        <Card key={i} className="h-[400px] animate-pulse bg-muted/20 border-border/40" />
                    ))}
                </div>
            ) : filteredBlogs.length === 0 ? (
                <div className="py-32 flex flex-col items-center justify-center text-center opacity-30">
                    <FileText className="w-16 h-16 mb-4" />
                    <p className="text-[11px] font-black uppercase tracking-widest">No se encontraron artículos</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredBlogs.map((blog) => (
                        <Card key={blog.id} className="group overflow-hidden border-border/40 bg-card hover:border-primary/40 transition-all flex flex-col hover:shadow-2xl hover:shadow-primary/5 rounded-[2rem]">
                            {/* Imagen de Portada */}
                            <div className="relative aspect-[16/10] overflow-hidden bg-muted">
                                {(() => {
                                    const imageUrl = getBlogImage(blog.imagenes);
                                    return imageUrl ? (
                                        <img
                                            src={imageUrl}
                                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                                            alt={blog.titulo}
                                            onError={(e) => { e.currentTarget.style.display = 'none'; }}
                                        />
                                    ) : (
                                        <div className="w-full h-full flex flex-col items-center justify-center text-muted-foreground/20">
                                            <ImageIcon className="w-12 h-12 mb-2" />
                                            <span className="text-[10px] font-black uppercase">Sin Imagen</span>
                                        </div>
                                    );
                                })()}
                                <div className="absolute top-4 left-4 flex gap-2">
                                    <span className="px-3 py-1.5 rounded-xl bg-black/40 backdrop-blur-md text-white text-[9px] font-black uppercase tracking-widest border border-white/10">
                                        {blog.tipo || 'NOTICIA'}
                                    </span>
                                </div>
                                <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <div className="flex gap-2">
                                        <button onClick={() => handleOpenModal(blog)} className="p-2.5 rounded-xl bg-white/90 backdrop-blur-sm text-primary shadow-xl hover:scale-110 active:scale-90 transition-all border border-primary/10">
                                            <Edit className="w-4 h-4" />
                                        </button>
                                        <button onClick={() => setIsDeleting(blog.id)} className="p-2.5 rounded-xl bg-white/90 backdrop-blur-sm text-destructive shadow-xl hover:scale-110 active:scale-90 transition-all border border-destructive/10">
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Contenido */}
                            <div className="p-6 flex-1 flex flex-col space-y-4">
                                <div className="flex items-center gap-3 text-[9px] font-black uppercase tracking-widest text-muted-foreground">
                                    <div className="flex items-center gap-1.5">
                                        <Calendar className="w-3.5 h-3.5 text-primary" />
                                        {blog.fecha ? new Date(blog.fecha).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' }) : 'Sin Fecha'}
                                    </div>
                                    <div className="w-1 h-1 rounded-full bg-border" />
                                    <span>{blog.estado}</span>
                                    {(blog as any).tenant && (
                                        <>
                                            <div className="w-1 h-1 rounded-full bg-border" />
                                            <span className="text-primary/60">{(blog as any).tenant.nombre}</span>
                                        </>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <h3 className="text-xl font-black uppercase italic tracking-tighter text-foreground group-hover:text-primary transition-colors leading-none">
                                        {blog.titulo}
                                    </h3>
                                    <p className="text-xs text-muted-foreground line-clamp-3 leading-relaxed font-medium">
                                        {blog.descripcion || 'Sin descripción disponible.'}
                                    </p>
                                </div>

                                <div className="pt-4 mt-auto border-t border-border/40 flex items-center justify-between">
                                    <span className="text-[10px] font-black text-primary uppercase tracking-widest group-hover:translate-x-1 transition-transform cursor-pointer">
                                        Leer más →
                                    </span>
                                    <div className="w-8 h-8 rounded-full border border-border flex items-center justify-center opacity-30 group-hover:opacity-100 transition-opacity">
                                        <MoreVertical className="w-4 h-4" />
                                    </div>
                                </div>
                            </div>
                        </Card>
                    ))}
                </div>
            )}

            {/* Modal de Blogs */}
            <AnimatePresence>
                {isModalOpen && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsModalOpen(false)} className="absolute inset-0 bg-black/60 backdrop-blur-xl" />
                        <motion.div initial={{ opacity: 0, scale: 0.9, y: 30 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 30 }} className="relative w-full max-w-4xl max-h-[90vh] overflow-hidden shadow-2xl flex flex-col">
                            <Card className="border-none shadow-3xl rounded-[2.5rem] overflow-hidden flex flex-col flex-1 min-h-0 bg-card">
                                <div className="p-8 border-b border-border flex items-center justify-between bg-primary text-white flex-none">
                                    <div className="flex items-center gap-6">
                                        <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center">
                                            <Newspaper className="w-8 h-8" />
                                        </div>
                                        <div>
                                            <h2 className="text-2xl font-black uppercase italic tracking-tighter">
                                                {editingBlog ? 'Actualizar' : 'Redactar'} <span className="opacity-60">Entrada</span>
                                            </h2>
                                            <p className="text-[10px] font-black uppercase tracking-[0.4em] opacity-60 leading-none mt-2">Gestión de Contenidos Institucionales</p>
                                        </div>
                                    </div>
                                    <button onClick={() => setIsModalOpen(false)} className="p-4 rounded-3xl hover:bg-white/10 transition-colors">
                                        <X className="w-8 h-8" />
                                    </button>
                                </div>

                                <form onSubmit={(e) => { e.preventDefault(); setIsConfirmingSave(true); }} className="flex flex-col flex-1 min-h-0 overflow-hidden">
                                    <div className="flex-1 overflow-y-auto p-8 custom-scrollbar space-y-8">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                            <div className="space-y-6">
                                                <div className="space-y-2">
                                                    <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">Título del Artículo *</label>
                                                    <input
                                                        type="text"
                                                        required
                                                        value={formData.titulo}
                                                        onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
                                                        className="w-full h-14 px-5 rounded-2xl bg-muted/30 border border-border focus:border-primary transition-all outline-none text-xs font-bold shadow-sm"
                                                        placeholder="Escriba un título impactante..."
                                                    />
                                                </div>

                                                <div className="grid grid-cols-2 gap-4">
                                                    <div className="space-y-2">
                                                        <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">Tipo</label>
                                                        <select
                                                            value={formData.tipo}
                                                            onChange={(e) => setFormData({ ...formData, tipo: e.target.value })}
                                                            className="w-full h-14 px-5 rounded-2xl bg-muted/30 border border-border focus:border-primary transition-all outline-none text-xs font-bold"
                                                        >
                                                            <option value="NOTICIA">Noticia</option>
                                                            <option value="EVENTO">Evento</option>
                                                            <option value="TUTORIAL">Tutorial</option>
                                                            <option value="COMUNICADO">Comunicado</option>
                                                        </select>
                                                    </div>
                                                    <div className="space-y-2">
                                                        <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">Fecha</label>
                                                        <input
                                                            type="date"
                                                            value={formData.fecha}
                                                            onChange={(e) => setFormData({ ...formData, fecha: e.target.value })}
                                                            className="w-full h-14 px-5 rounded-2xl bg-muted/30 border border-border focus:border-primary transition-all outline-none text-xs font-bold"
                                                        />
                                                    </div>
                                                </div>

                                                <div className="space-y-2">
                                                    <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">Sede / Departamento</label>
                                                    <select
                                                        value={formData.tenantId}
                                                        onChange={(e) => setFormData({ ...formData, tenantId: e.target.value })}
                                                        className="w-full h-14 px-5 rounded-2xl bg-muted/30 border border-border focus:border-primary transition-all outline-none text-xs font-bold shadow-sm disabled:opacity-50"
                                                        disabled={!isSuperAdmin()}
                                                    >
                                                        {isSuperAdmin() && <option value="">Sede Central / Global</option>}
                                                        {departamentos.map(d => (
                                                            <option key={d.id} value={d.id}>{d.nombre}</option>
                                                        ))}
                                                    </select>
                                                </div>

                                                <div className="space-y-2">
                                                    <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">Estado</label>
                                                    <div className="flex gap-4">
                                                        {['ACTIVO', 'INACTIVO'].map((s) => (
                                                            <button
                                                                key={s}
                                                                type="button"
                                                                onClick={() => setFormData({ ...formData, estado: s })}
                                                                className={cn(
                                                                    "flex-1 h-12 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all",
                                                                    formData.estado === s ? "bg-primary text-white border-primary shadow-lg shadow-primary/20" : "bg-muted/30 border-border text-muted-foreground hover:bg-muted"
                                                                )}
                                                            >
                                                                {s}
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="flex flex-col h-full">
                                                <div className="space-y-2 flex-1 flex flex-col">
                                                    <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">Descripción / Contenido</label>
                                                    <textarea
                                                        value={formData.descripcion}
                                                        onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                                                        className="w-full flex-1 px-5 py-4 rounded-2xl bg-muted/30 border border-border focus:border-primary transition-all outline-none text-xs font-medium resize-none shadow-sm leading-relaxed"
                                                        placeholder="Describa el contenido del artículo aquí..."
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        {/* Subida de Imágenes (Simulado para MVP) */}
                                        <ImageUpload
                                            value={formData.imagen}
                                            onChange={(url) => setFormData({ ...formData, imagen: url })}
                                            tableName="blogs"
                                            label="Imagen de Portada del Artículo"
                                        />

                                    </div>
                                    <div className="p-6 border-t border-border/40 bg-card/95 backdrop-blur-sm">
                                        <div className="flex gap-4">
                                            <button
                                                type="button"
                                                onClick={() => setIsModalOpen(false)}
                                                className="h-14 px-8 rounded-2xl border border-border text-[11px] font-black uppercase tracking-widest hover:bg-muted transition-all"
                                            >
                                                Cancelar
                                            </button>
                                            <button
                                                type="submit"
                                                disabled={isLoading}
                                                className="flex-1 h-14 rounded-2xl bg-primary text-white text-[11px] font-black uppercase tracking-widest shadow-xl shadow-primary/20 hover:opacity-95 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                                            >
                                                <Plus className="w-5 h-5" />
                                                {isLoading ? 'Procesando...' : editingBlog ? 'Actualizar Contenido' : 'Publicar Artículo'}
                                            </button>
                                        </div>
                                    </div>
                                </form>
                            </Card>
                        </motion.div>
                    </div>
                )
                }
            </AnimatePresence >

            <ConfirmModal
                isOpen={!!isDeleting}
                onClose={() => setIsDeleting(null)}
                onConfirm={() => isDeleting && handleDelete(isDeleting)}
                title="¿Eliminar este artículo?"
                description="Esta acción eliminará permanentemente la publicación. Esta operación no se puede deshacer."
                confirmText="Sí, eliminar"
                cancelText="Mantener artículo"
                type="danger"
                isLoading={isLoading}
            />

            <ConfirmModal
                isOpen={isConfirmingSave}
                onClose={() => setIsConfirmingSave(false)}
                onConfirm={handleSubmit}
                title={editingBlog ? "¿Actualizar Artículo?" : "¿Publicar Artículo?"}
                description={editingBlog
                    ? "Se aplicarán los cambios realizados al artículo de blog. La información se actualizará en todo el sistema."
                    : "El artículo será publicado y estará disponible para todos los usuarios."
                }
                confirmText={editingBlog ? "Confirmar Actualización" : "Confirmar Publicación"}
                cancelText="Seguir editando"
                type="info"
                isLoading={isLoading}
            />
        </div >
    );
}
