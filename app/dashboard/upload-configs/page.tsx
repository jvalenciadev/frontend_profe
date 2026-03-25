'use client';

import { useState, useEffect } from 'react';
import { uploadConfigService } from '@/services/uploadConfigService';
import { Modal } from '@/components/Modal';
import { Card } from '@/components/ui/Card';
import {
    Upload,
    Save,
    Trash2,
    Plus,
    FileText,
    Image as ImageIcon,
    Settings2,
    Shield,
    HardDrive,
    Search,
    RefreshCw,
    Edit2,
    CheckCircle2,
    AlertCircle,
    Maximize,
    Crop,
    Activity
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';

export default function UploadConfigsPage() {
    const [configs, setConfigs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingConfig, setEditingConfig] = useState<any>(null);
    const [formData, setFormData] = useState({
        tableName: '',
        maxSizeMB: 5.0,
        allowedExtensions: 'jpg,jpeg,png,webp',
        minWidth: '',
        maxWidth: '',
        minHeight: '',
        maxHeight: '',
        aspectRatio: '',
        estado: 'activo'
    });

    useEffect(() => {
        loadConfigs();
    }, []);

    const loadConfigs = async () => {
        try {
            setLoading(true);
            const data = await uploadConfigService.getAll();
            setConfigs(data);
        } catch (error) {
            console.error('Error loading configs:', error);
            toast.error('Error al sincronizar configuraciones');
        } finally {
            setLoading(false);
        }
    };

    const handleOpenModal = (config: any = null) => {
        if (config) {
            setEditingConfig(config);
            setFormData({
                tableName: config.tableName,
                maxSizeMB: config.maxSizeMB,
                allowedExtensions: config.allowedExtensions,
                minWidth: config.minWidth || '',
                maxWidth: config.maxWidth || '',
                minHeight: config.minHeight || '',
                maxHeight: config.maxHeight || '',
                aspectRatio: config.aspectRatio || '',
                estado: config.estado || 'activo'
            });
        } else {
            setEditingConfig(null);
            setFormData({
                tableName: '',
                maxSizeMB: 5.0,
                allowedExtensions: 'jpg,jpeg,png,webp',
                minWidth: '',
                maxWidth: '',
                minHeight: '',
                maxHeight: '',
                aspectRatio: '',
                estado: 'activo'
            });
        }
        setIsModalOpen(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (editingConfig) {
                await uploadConfigService.update(editingConfig.id, formData);
                toast.success('Parámetros de carga actualizados');
            } else {
                await uploadConfigService.create(formData);
                toast.success('Nueva regla de carga registrada');
            }
            setIsModalOpen(false);
            loadConfigs();
        } catch (error) {
            console.error('Error saving config:', error);
            toast.error('Fallo en la sincronización de parámetros');
        }
    };

    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [configToDelete, setConfigToDelete] = useState<any>(null);

    const handleDeleteClick = (config: any) => {
        setConfigToDelete(config);
        setIsDeleteModalOpen(true);
    };

    const confirmDelete = async () => {
        if (!configToDelete) return;
        try {
            await uploadConfigService.delete(configToDelete.id);
            toast.success('Configuración removida');
            setIsDeleteModalOpen(false);
            setConfigToDelete(null);
            loadConfigs();
        } catch (error) {
            console.error('Error deleting config:', error);
            toast.error('Error al remover configuración');
        }
    };

    const filteredConfigs = configs.filter(c =>
        c.tableName.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-8 pb-20">
            {/* Header */}
            <div className="flex items-center justify-between gap-3">
                <div className="space-y-1">
                    <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.3em] text-primary">
                        <Settings2 className="w-3 h-3" />
                        Gobernanza de Datos
                    </div>
                    <h1 className="text-4xl font-black tracking-tighter text-foreground uppercase">Upload Configs</h1>
                </div>
                <button
                    onClick={() => handleOpenModal()}
                    className="h-14 px-8 rounded-2xl bg-primary text-white font-black text-xs uppercase tracking-[0.2em] hover:shadow-2xl hover:shadow-primary/40 active:scale-95 transition-all flex items-center gap-2"
                >
                    <Plus className="w-4 h-4" />
                    Nueva Regla
                </button>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="p-6 bg-primary/5 border-primary/10">
                    <div className="flex items-center gap-4">
                        <div className="p-3 rounded-2xl bg-primary text-white">
                            <Shield className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-muted-foreground uppercase">Entidades Protegidas</p>
                            <p className="text-2xl font-black">{configs.length}</p>
                        </div>
                    </div>
                </Card>
                <Card className="p-6 bg-emerald-500/5 border-emerald-500/10">
                    <div className="flex items-center gap-4">
                        <div className="p-3 rounded-2xl bg-emerald-500 text-white">
                            <CheckCircle2 className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-muted-foreground uppercase">Configuraciones Activas</p>
                            <p className="text-2xl font-black">{configs.filter(c => c.estado === 'activo').length}</p>
                        </div>
                    </div>
                </Card>
                <Card className="p-6 bg-amber-500/5 border-amber-500/10">
                    <div className="flex items-center gap-4">
                        <div className="p-3 rounded-2xl bg-amber-500 text-white">
                            <HardDrive className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-muted-foreground uppercase">Límite Global Promedio</p>
                            <p className="text-2xl font-black">
                                {configs.length > 0 ? (configs.reduce((acc, c) => acc + c.maxSizeMB, 0) / configs.length).toFixed(1) : 0} MB
                            </p>
                        </div>
                    </div>
                </Card>
            </div>

            {/* Search */}
            <Card className="p-2 border-border/40 bg-card/50 backdrop-blur-md">
                <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input
                        type="text"
                        placeholder="Filtrar por tabla o contexto..."
                        className="w-full h-12 pl-12 pr-4 rounded-xl bg-transparent outline-none text-[13px] font-bold"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </Card>

            {/* Data Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {loading ? (
                    Array(4).fill(0).map((_, i) => (
                        <Card key={i} className="h-40 animate-pulse bg-muted/20" />
                    ))
                ) : filteredConfigs.map((config) => (
                    <motion.div
                        layout
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        key={config.id}
                    >
                        <Card className="group relative border-border/40 hover:border-primary/30 transition-all overflow-hidden bg-card/80">
                            <div className="p-6 flex items-start gap-4">
                                <div className="p-4 rounded-3xl bg-primary/5 text-primary group-hover:bg-primary group-hover:text-white transition-all">
                                    <FileText className="w-6 h-6" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                        <h3 className="text-lg font-black uppercase tracking-tight text-foreground truncate">{config.tableName}</h3>
                                        <span className={cn(
                                            "px-2 py-0.5 rounded-full text-[8px] font-black uppercase",
                                            config.estado === 'activo' ? "bg-emerald-500/10 text-emerald-500" : "bg-rose-500/10 text-rose-500"
                                        )}>
                                            {config.estado}
                                        </span>
                                    </div>
                                    <div className="flex flex-wrap gap-4 text-[11px] font-bold text-muted-foreground">
                                        <div className="flex items-center gap-1">
                                            <HardDrive className="w-3.5 h-3.5 opacity-40" />
                                            Máx. {config.maxSizeMB} MB
                                        </div>
                                        <div className="flex items-center gap-1 uppercase tracking-widest text-[9px]">
                                            <ImageIcon className="w-3.5 h-3.5 opacity-40" />
                                            {config.allowedExtensions.split(',').length} extensiones
                                        </div>
                                        {(config.maxWidth || config.maxHeight) && (
                                            <div className="flex items-center gap-1">
                                                <Maximize className="w-3.5 h-3.5 opacity-40" />
                                                {config.maxWidth || '?'}x{config.maxHeight || '?'} px
                                            </div>
                                        )}
                                    </div>
                                    <div className="mt-3 flex flex-wrap gap-1">
                                        {config.allowedExtensions.split(',').map((ext: string) => (
                                            <span key={ext} className="px-1.5 py-0.5 rounded bg-muted/50 text-[8px] font-black uppercase text-muted-foreground">
                                                .{ext.trim()}
                                            </span>
                                        ))}
                                    </div>
                                </div>

                                <div className="flex flex-col gap-2">
                                    <button
                                        onClick={() => handleOpenModal(config)}
                                        className="p-2.5 rounded-xl bg-primary/5 text-primary hover:bg-primary hover:text-white transition-all"
                                    >
                                        <Edit2 className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={() => handleDeleteClick(config)}
                                        className="p-2.5 rounded-xl bg-rose-500/5 text-rose-500 hover:bg-rose-500 hover:text-white transition-all"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        </Card>
                    </motion.div>
                ))}
            </div>

            {/* Deletion Confirmation Modal */}
            <Modal
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                title="Confirmar Eliminación"
                size="md"
            >
                <div className="space-y-6">
                    <div className="flex flex-col items-center text-center space-y-4">
                        <div className="w-20 h-20 rounded-[2rem] bg-rose-500/10 flex items-center justify-center text-rose-500">
                            <AlertCircle className="w-10 h-10" />
                        </div>
                        <div>
                            <h3 className="text-xl font-black uppercase text-foreground">¿Está seguro?</h3>
                            <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest leading-relaxed max-w-[280px] mx-auto">
                                Está por eliminar la configuración para la tabla <span className="text-rose-500 font-black">"{configToDelete?.tableName}"</span>. Esta acción no se puede deshacer.
                            </p>
                        </div>
                    </div>

                    <div className="flex gap-3 pt-4 border-t border-border/40">
                        <button
                            onClick={() => setIsDeleteModalOpen(false)}
                            className="flex-1 h-12 rounded-2xl bg-muted text-muted-foreground font-black text-[10px] uppercase tracking-widest hover:bg-muted/80 transition-all"
                        >
                            Cancelar
                        </button>
                        <button
                            onClick={confirmDelete}
                            className="flex-1 h-12 rounded-2xl bg-rose-500 text-white font-black text-[10px] uppercase tracking-widest hover:shadow-xl hover:shadow-rose-500/30 active:scale-95 transition-all flex items-center justify-center gap-2"
                        >
                            <Trash2 className="w-4 h-4" />
                            Eliminar
                        </button>
                    </div>
                </div>
            </Modal>

            {/* CRUD Modal */}
            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={editingConfig ? 'Editar Regla de Carga' : 'Nueva Configuración de Carga'}
                size="xl"
            >
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-1.5 order-1">
                            <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">Contexto / Tabla</label>
                            <input
                                type="text"
                                className="w-full h-12 px-5 rounded-2xl bg-muted/20 border border-border focus:border-primary transition-all outline-none text-sm font-black"
                                placeholder="p. ej. mod_entrega"
                                value={formData.tableName}
                                onChange={(e) => setFormData({ ...formData, tableName: e.target.value })}
                                required
                            />
                        </div>

                        <div className="space-y-1.5 order-2">
                            <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">Peso Máximo (MB)</label>
                            <input
                                type="number"
                                step="0.1"
                                className="w-full h-12 px-5 rounded-2xl bg-muted/20 border border-border focus:border-primary transition-all outline-none text-sm font-black"
                                value={formData.maxSizeMB}
                                onChange={(e) => setFormData({ ...formData, maxSizeMB: parseFloat(e.target.value) })}
                                required
                            />
                        </div>

                        <div className="space-y-1.5 md:col-span-2 order-3">
                            <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">Extensiones Permitidas (separadas por coma)</label>
                            <div className="relative">
                                <Upload className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                <input
                                    type="text"
                                    className="w-full h-12 pl-12 pr-5 rounded-2xl bg-muted/20 border border-border focus:border-primary transition-all outline-none text-sm font-black"
                                    placeholder="jpg, png, pdf, docx"
                                    value={formData.allowedExtensions}
                                    onChange={(e) => setFormData({ ...formData, allowedExtensions: e.target.value })}
                                    required
                                />
                            </div>
                        </div>

                        {/* Image Restrictions Group */}
                        <div className="md:col-span-2 space-y-4 pt-4 order-4 border-t border-border/40">
                            <div className="flex items-center gap-2 text-[10px] font-black uppercase text-primary tracking-widest">
                                <ImageIcon className="w-3.5 h-3.5" />
                                Restricciones de Imagen (Opcional)
                            </div>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <div className="space-y-1">
                                    <label className="text-[9px] font-black text-muted-foreground uppercase tracking-tighter">Ancho Mín.</label>
                                    <input type="number" placeholder="px" className="w-full h-10 px-3 rounded-xl bg-muted/10 border border-border text-xs font-bold outline-none" 
                                        value={formData.minWidth} onChange={(e) => setFormData({...formData, minWidth: e.target.value})} />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[9px] font-black text-muted-foreground uppercase tracking-tighter">Ancho Máx.</label>
                                    <input type="number" placeholder="px" className="w-full h-10 px-3 rounded-xl bg-muted/10 border border-border text-xs font-bold outline-none" 
                                        value={formData.maxWidth} onChange={(e) => setFormData({...formData, maxWidth: e.target.value})} />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[9px] font-black text-muted-foreground uppercase tracking-tighter">Alto Mín.</label>
                                    <input type="number" placeholder="px" className="w-full h-10 px-3 rounded-xl bg-muted/10 border border-border text-xs font-bold outline-none" 
                                        value={formData.minHeight} onChange={(e) => setFormData({...formData, minHeight: e.target.value})} />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[9px] font-black text-muted-foreground uppercase tracking-tighter">Alto Máx.</label>
                                    <input type="number" placeholder="px" className="w-full h-10 px-3 rounded-xl bg-muted/10 border border-border text-xs font-bold outline-none" 
                                        value={formData.maxHeight} onChange={(e) => setFormData({...formData, maxHeight: e.target.value})} />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-[9px] font-black text-muted-foreground uppercase tracking-tighter">Relación de Aspecto</label>
                                    <input type="text" placeholder="16:9, 1:1, 4:3" className="w-full h-10 px-3 rounded-xl bg-muted/10 border border-border text-xs font-bold outline-none" 
                                        value={formData.aspectRatio} onChange={(e) => setFormData({...formData, aspectRatio: e.target.value})} />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[9px] font-black text-muted-foreground uppercase tracking-tighter">Estado</label>
                                    <select className="w-full h-10 px-3 rounded-xl bg-muted/10 border border-border text-xs font-bold outline-none"
                                        value={formData.estado} onChange={(e) => setFormData({...formData, estado: e.target.value})}>
                                        <option value="activo">Activo</option>
                                        <option value="inactivo">Inactivo</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="pt-6 flex justify-end gap-3 border-t border-border/40">
                        <button
                            type="button"
                            onClick={() => setIsModalOpen(false)}
                            className="h-12 px-6 rounded-2xl bg-muted text-muted-foreground font-black text-[10px] uppercase tracking-widest hover:bg-muted/80 transition-all"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            className="h-12 px-10 rounded-2xl bg-primary text-white font-black text-[10px] uppercase tracking-widest hover:shadow-xl hover:shadow-primary/30 active:scale-95 transition-all flex items-center gap-2"
                        >
                            <Save className="w-4 h-4" />
                            Guardar Configuración
                        </button>
                    </div>
                </form>
            </Modal>
        </div>
    );
}
