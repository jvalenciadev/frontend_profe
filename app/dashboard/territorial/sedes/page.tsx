'use client';

import { useState, useEffect } from 'react';
import { sedeService } from '@/services/sedeService';
import { departmentService } from '@/services/departmentService';
import { Modal } from '@/components/Modal';
import { Card } from '@/components/ui/Card';
import {
    MapPin,
    Plus,
    Edit2,
    Trash2,
    Search,
    Building,
    Phone,
    Calendar,
    Navigation2,
    Clock,
    User,
    AlertCircle,
    Layout
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { Can } from '@/components/Can';

export default function SedesPage() {
    const [sedes, setSedes] = useState<any[]>([]);
    const [departments, setDepartments] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isDeleting, setIsDeleting] = useState<string | null>(null);
    const [editingSede, setEditingSede] = useState<any>(null);
    const [formData, setFormData] = useState({
        nombre: '',
        nombreAbre: '',
        descripcion: '',
        imagen: '',
        departamentoId: '',
        // Responsables
        nombreResp1: '',
        cargoResp1: '',
        imagenResp1: '',
        nombreResp2: '',
        cargoResp2: '',
        imagenResp2: '',
        // Contactos
        contacto1: 0,
        contacto2: 0,
        facebook: '',
        tiktok: '',
        whatsapp: '',
        // Operación
        horario: '',
        turno: '',
        ubicacion: '',
        latitud: 0,
        longitud: 0,
    });

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            const [sedesData, deptsData] = await Promise.all([
                sedeService.getAll(),
                departmentService.getAll()
            ]);
            setSedes(sedesData);
            setDepartments(deptsData);
        } catch (error) {
            console.error('Error loading data:', error);
            toast.error('Fallo en la sincronización de sedes');
        } finally {
            setLoading(false);
        }
    };

    const handleOpenModal = (sede: any = null) => {
        if (sede) {
            setEditingSede(sede);
            setFormData({
                nombre: sede.nombre,
                nombreAbre: sede.nombreAbre || '',
                descripcion: sede.descripcion || '',
                imagen: sede.imagen || '',
                departamentoId: sede.departamentoId,
                nombreResp1: sede.nombreResp1 || '',
                cargoResp1: sede.cargoResp1 || '',
                imagenResp1: sede.imagenResp1 || '',
                nombreResp2: sede.nombreResp2 || '',
                cargoResp2: sede.cargoResp2 || '',
                imagenResp2: sede.imagenResp2 || '',
                contacto1: sede.contacto1,
                contacto2: sede.contacto2 || 0,
                facebook: sede.facebook || '',
                tiktok: sede.tiktok || '',
                whatsapp: sede.whatsapp || '',
                horario: sede.horario,
                turno: sede.turno,
                ubicacion: sede.ubicacion,
                latitud: sede.latitud || 0,
                longitud: sede.longitud || 0,
            });
        } else {
            setEditingSede(null);
            setFormData({
                nombre: '',
                nombreAbre: '',
                descripcion: '',
                imagen: '',
                departamentoId: departments[0]?.id || '',
                nombreResp1: '',
                cargoResp1: '',
                imagenResp1: '',
                nombreResp2: '',
                cargoResp2: '',
                imagenResp2: '',
                contacto1: 0,
                contacto2: 0,
                facebook: '',
                tiktok: '',
                whatsapp: '',
                horario: '',
                turno: '',
                ubicacion: '',
                latitud: 0,
                longitud: 0,
            });
        }
        setIsModalOpen(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (editingSede) {
                await sedeService.update(editingSede.id, formData);
                toast.success('Sede actualizada correctamente');
            } else {
                await sedeService.create(formData);
                toast.success('Nueva sede vinculada');
            }
            setIsModalOpen(false);
            loadData();
        } catch (error) {
            console.error('Error saving sede:', error);
            toast.error('Error en el protocolo de guardado');
        }
    };

    const handleDelete = async (id: string) => {
        try {
            await sedeService.delete(id);
            toast.success('Sede desafiliada');
            setIsDeleting(null);
            loadData();
        } catch (error) {
            console.error('Error deleting sede:', error);
            toast.error('Error en el proceso de baja');
        }
    };

    const filteredSedes = sedes.filter(s =>
        s.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.ubicacion.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-10 pb-20">
            {/* Header */}
            <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8">
                <div className="space-y-1">
                    <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.3em] text-primary mb-3">
                        <Building className="w-4 h-4" />
                        <span>Infraestructura Operativa</span>
                    </div>
                    <h1 className="text-4xl font-black tracking-tighter text-foreground uppercase leading-none">Sedes Académicas</h1>
                    <p className="text-sm font-medium text-muted-foreground max-w-lg">
                        Administración de los núcleos y sedes donde se ejecutan los servicios.
                    </p>
                </div>

                <div className="flex items-center gap-4">
                    <div className="relative group hidden md:block">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                        <input
                            type="text"
                            placeholder="Buscar sede..."
                            className="h-14 pl-12 pr-6 rounded-2xl bg-card border border-border focus:border-primary focus:ring-8 focus:ring-primary/5 transition-all outline-none text-xs font-bold w-64"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>

                    <Can action="create" subject="Sede">
                        <button
                            onClick={() => handleOpenModal()}
                            className="h-14 px-8 rounded-2xl bg-primary text-white font-black text-xs uppercase tracking-[0.2em] shadow-2xl shadow-primary/20 hover:opacity-95 active:scale-95 transition-all flex items-center gap-3 shrink-0"
                        >
                            <Plus className="w-5 h-5" />
                            Añadir Sede
                        </button>
                    </Can>
                </div>
            </div>

            {/* List Display */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                {loading && sedes.length === 0 ? (
                    Array(4).fill(0).map((_, i) => (
                        <div key={i} className="h-48 rounded-3xl bg-card border border-border animate-pulse" />
                    ))
                ) : (
                    <AnimatePresence mode="popLayout">
                        {filteredSedes.map((sede) => (
                            <motion.div
                                key={sede.id}
                                layout
                                initial={{ opacity: 0, scale: 0.98 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.98 }}
                            >
                                <Card className="group overflow-hidden border-border/40 bg-card hover:border-primary/40 transition-all duration-300 shadow-xl shadow-black/[0.02]">
                                    <div className="flex flex-col md:flex-row h-full">
                                        <div className="w-full md:w-48 bg-muted relative overflow-hidden flex items-center justify-center p-8 border-r border-border/40">
                                            <Building className="w-16 h-16 text-primary/20 transition-transform group-hover:scale-110 group-hover:text-primary/30" />
                                            {sede.departamento && (
                                                <div className="absolute top-4 left-4">
                                                    <span className="px-2 py-0.5 bg-primary/10 text-primary text-[8px] font-black uppercase tracking-tighter rounded-md border border-primary/20">
                                                        {sede.departamento.abreviacion}
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex-1 p-8 space-y-6">
                                            <div className="flex items-start justify-between">
                                                <div className="space-y-1">
                                                    <h3 className="text-xl font-black tracking-tighter text-foreground uppercase truncate w-64">
                                                        {sede.nombre}
                                                    </h3>
                                                    <div className="flex items-center gap-2">
                                                        <Navigation2 className="w-3 h-3 text-primary" />
                                                        <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground truncate w-48">
                                                            {sede.ubicacion}
                                                        </span>
                                                    </div>
                                                </div>
                                                <div className="flex gap-1.5 translate-x-4 opacity-0 group-hover:opacity-100 group-hover:translate-x-0 transition-all">
                                                    <Can action="update" subject="Sede">
                                                        <button
                                                            onClick={() => handleOpenModal(sede)}
                                                            className="w-9 h-9 rounded-xl bg-muted text-muted-foreground hover:text-primary hover:bg-card border border-transparent hover:border-border transition-all shadow-sm"
                                                        >
                                                            <Edit2 className="w-4 h-4 mx-auto" />
                                                        </button>
                                                    </Can>
                                                    <Can action="delete" subject="Sede">
                                                        <button
                                                            onClick={() => setIsDeleting(sede.id)}
                                                            className="w-9 h-9 rounded-xl bg-muted text-muted-foreground hover:text-rose-600 hover:bg-card border border-transparent hover:border-border transition-all shadow-sm"
                                                        >
                                                            <Trash2 className="w-4 h-4 mx-auto" />
                                                        </button>
                                                    </Can>
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border/40">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center">
                                                        <Clock className="w-3.5 h-3.5 text-muted-foreground" />
                                                    </div>
                                                    <div className="flex flex-col">
                                                        <span className="text-[8px] font-black text-muted-foreground uppercase leading-none mb-1">Horario</span>
                                                        <span className="text-[10px] font-bold text-foreground leading-none">{sede.horario}</span>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center">
                                                        <Phone className="w-3.5 h-3.5 text-muted-foreground" />
                                                    </div>
                                                    <div className="flex flex-col">
                                                        <span className="text-[8px] font-black text-muted-foreground uppercase leading-none mb-1">Contacto</span>
                                                        <span className="text-[10px] font-bold text-foreground leading-none">{sede.contacto1}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
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
                title={editingSede ? 'Actualizar Sede' : 'Enlazar Nueva Sede'}
                size="lg"
            >
                <form onSubmit={handleSubmit} className="space-y-8 max-h-[70vh] overflow-y-auto px-1 pr-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">Jurisdicción Territorial</label>
                            <select
                                className="w-full h-14 px-6 rounded-2xl bg-card border border-border focus:border-primary focus:ring-8 focus:ring-primary/5 transition-all outline-none text-[11px] font-black text-foreground uppercase tracking-tight appearance-none ring-inset"
                                value={formData.departamentoId}
                                onChange={(e) => setFormData({ ...formData, departamentoId: e.target.value })}
                                required
                            >
                                <option value="">Seleccionar Departamento</option>
                                {departments.map(d => (
                                    <option key={d.id} value={d.id}>{d.nombre}</option>
                                ))}
                            </select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">Nombre de Sede</label>
                            <input
                                type="text"
                                className="w-full h-14 px-6 rounded-2xl bg-card border border-border focus:border-primary focus:ring-8 focus:ring-primary/5 transition-all outline-none text-sm font-black text-foreground uppercase tracking-tight"
                                placeholder="p. ej. SEDE CENTRAL"
                                value={formData.nombre}
                                onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">Nombre Abreviado</label>
                            <input
                                type="text"
                                className="w-full h-14 px-6 rounded-2xl bg-card border border-border focus:border-primary focus:ring-8 focus:ring-primary/5 transition-all outline-none text-sm font-black text-foreground uppercase tracking-tight"
                                placeholder="p. ej. SCZ-CENTRAL"
                                value={formData.nombreAbre}
                                onChange={(e) => setFormData({ ...formData, nombreAbre: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">Descripción / Notas</label>
                            <input
                                type="text"
                                className="w-full h-14 px-6 rounded-2xl bg-card border border-border focus:border-primary focus:ring-8 focus:ring-primary/5 transition-all outline-none text-sm font-black text-foreground tracking-tight"
                                placeholder="Notas adicionales..."
                                value={formData.descripcion}
                                onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">Ubicación / Dirección</label>
                            <input
                                type="text"
                                className="w-full h-14 px-6 rounded-2xl bg-card border border-border focus:border-primary focus:ring-8 focus:ring-primary/5 transition-all outline-none text-sm font-black text-foreground uppercase tracking-tight"
                                placeholder="p. ej. AV. ARCE #2132"
                                value={formData.ubicacion}
                                onChange={(e) => setFormData({ ...formData, ubicacion: e.target.value })}
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">Contacto Telefónico</label>
                            <input
                                type="number"
                                className="w-full h-14 px-6 rounded-2xl bg-card border border-border focus:border-primary focus:ring-8 focus:ring-primary/5 transition-all outline-none text-sm font-black text-foreground uppercase tracking-tight"
                                placeholder="70000000"
                                value={formData.contacto1}
                                onChange={(e) => setFormData({ ...formData, contacto1: parseInt(e.target.value) })}
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">Esquema de Horarios</label>
                            <input
                                type="text"
                                className="w-full h-14 px-6 rounded-2xl bg-card border border-border focus:border-primary focus:ring-8 focus:ring-primary/5 transition-all outline-none text-sm font-black text-foreground tracking-tight"
                                placeholder="p. ej. 08:00 - 18:00"
                                value={formData.horario}
                                onChange={(e) => setFormData({ ...formData, horario: e.target.value })}
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">Descripción de Turnos</label>
                            <input
                                type="text"
                                className="w-full h-14 px-6 rounded-2xl bg-card border border-border focus:border-primary focus:ring-8 focus:ring-primary/5 transition-all outline-none text-sm font-black text-foreground tracking-tight"
                                placeholder="p. ej. MAÑANA/TARDE"
                                value={formData.turno}
                                onChange={(e) => setFormData({ ...formData, turno: e.target.value })}
                                required
                            />
                        </div>

                        {/* Imagen de Sede */}
                        <div className="space-y-2 md:col-span-2">
                            <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">URL Imagen de Sede</label>
                            <input
                                type="text"
                                className="w-full h-14 px-6 rounded-2xl bg-card border border-border focus:border-primary focus:ring-8 focus:ring-primary/5 transition-all outline-none text-sm font-bold text-foreground"
                                placeholder="https://ejemplo.com/sede.jpg"
                                value={formData.imagen}
                                onChange={(e) => setFormData({ ...formData, imagen: e.target.value })}
                            />
                        </div>

                        {/* Contactos Adicionales */}
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">Contacto 2 (Opcional)</label>
                            <input
                                type="number"
                                className="w-full h-14 px-6 rounded-2xl bg-card border border-border focus:border-primary focus:ring-8 focus:ring-primary/5 transition-all outline-none text-sm font-black text-foreground"
                                placeholder="70000001"
                                value={formData.contacto2}
                                onChange={(e) => setFormData({ ...formData, contacto2: parseInt(e.target.value) || 0 })}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">Facebook</label>
                            <input
                                type="text"
                                className="w-full h-14 px-6 rounded-2xl bg-card border border-border focus:border-primary focus:ring-8 focus:ring-primary/5 transition-all outline-none text-sm font-medium text-foreground"
                                placeholder="@sede_facebook"
                                value={formData.facebook}
                                onChange={(e) => setFormData({ ...formData, facebook: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">TikTok</label>
                            <input
                                type="text"
                                className="w-full h-14 px-6 rounded-2xl bg-card border border-border focus:border-primary focus:ring-8 focus:ring-primary/5 transition-all outline-none text-sm font-medium text-foreground"
                                placeholder="@sede_tiktok"
                                value={formData.tiktok}
                                onChange={(e) => setFormData({ ...formData, tiktok: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">WhatsApp (Grupo)</label>
                            <input
                                type="text"
                                className="w-full h-14 px-6 rounded-2xl bg-card border border-border focus:border-primary focus:ring-8 focus:ring-primary/5 transition-all outline-none text-sm font-medium text-foreground"
                                placeholder="https://chat.whatsapp.com/..."
                                value={formData.whatsapp}
                                onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
                            />
                        </div>

                        {/* Coordenadas */}
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">Latitud</label>
                            <input
                                type="number"
                                step="any"
                                className="w-full h-14 px-6 rounded-2xl bg-card border border-border focus:border-primary focus:ring-8 focus:ring-primary/5 transition-all outline-none text-sm font-bold text-foreground"
                                placeholder="-16.5000"
                                value={formData.latitud}
                                onChange={(e) => setFormData({ ...formData, latitud: parseFloat(e.target.value) || 0 })}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">Longitud</label>
                            <input
                                type="number"
                                step="any"
                                className="w-full h-14 px-6 rounded-2xl bg-card border border-border focus:border-primary focus:ring-8 focus:ring-primary/5 transition-all outline-none text-sm font-bold text-foreground"
                                placeholder="-68.1500"
                                value={formData.longitud}
                                onChange={(e) => setFormData({ ...formData, longitud: parseFloat(e.target.value) || 0 })}
                            />
                        </div>

                        {/* Responsable 1 */}
                        <div className="md:col-span-2 pt-4 border-t border-border">
                            <h4 className="text-xs font-black uppercase tracking-widest text-primary mb-4">Responsable Principal</h4>
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">Nombre Completo</label>
                            <input
                                type="text"
                                className="w-full h-14 px-6 rounded-2xl bg-card border border-border focus:border-primary focus:ring-8 focus:ring-primary/5 transition-all outline-none text-sm font-medium text-foreground"
                                placeholder="Lic. Juan Pérez"
                                value={formData.nombreResp1}
                                onChange={(e) => setFormData({ ...formData, nombreResp1: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">Cargo</label>
                            <input
                                type="text"
                                className="w-full h-14 px-6 rounded-2xl bg-card border border-border focus:border-primary focus:ring-8 focus:ring-primary/5 transition-all outline-none text-sm font-medium text-foreground"
                                placeholder="Director de Sede"
                                value={formData.cargoResp1}
                                onChange={(e) => setFormData({ ...formData, cargoResp1: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2 md:col-span-2">
                            <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">URL Imagen</label>
                            <input
                                type="text"
                                className="w-full h-14 px-6 rounded-2xl bg-card border border-border focus:border-primary focus:ring-8 focus:ring-primary/5 transition-all outline-none text-sm font-medium text-foreground"
                                placeholder="https://ejemplo.com/responsable1.jpg"
                                value={formData.imagenResp1}
                                onChange={(e) => setFormData({ ...formData, imagenResp1: e.target.value })}
                            />
                        </div>

                        {/* Responsable 2 */}
                        <div className="md:col-span-2 pt-4 border-t border-border">
                            <h4 className="text-xs font-black uppercase tracking-widest text-primary mb-4">Responsable Secundario (Opcional)</h4>
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">Nombre Completo</label>
                            <input
                                type="text"
                                className="w-full h-14 px-6 rounded-2xl bg-card border border-border focus:border-primary focus:ring-8 focus:ring-primary/5 transition-all outline-none text-sm font-medium text-foreground"
                                placeholder="Lic. María López"
                                value={formData.nombreResp2}
                                onChange={(e) => setFormData({ ...formData, nombreResp2: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">Cargo</label>
                            <input
                                type="text"
                                className="w-full h-14 px-6 rounded-2xl bg-card border border-border focus:border-primary focus:ring-8 focus:ring-primary/5 transition-all outline-none text-sm font-medium text-foreground"
                                placeholder="Subdirector"
                                value={formData.cargoResp2}
                                onChange={(e) => setFormData({ ...formData, cargoResp2: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2 md:col-span-2">
                            <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">URL Imagen</label>
                            <input
                                type="text"
                                className="w-full h-14 px-6 rounded-2xl bg-card border border-border focus:border-primary focus:ring-8 focus:ring-primary/5 transition-all outline-none text-sm font-medium text-foreground"
                                placeholder="https://ejemplo.com/responsable2.jpg"
                                value={formData.imagenResp2}
                                onChange={(e) => setFormData({ ...formData, imagenResp2: e.target.value })}
                            />
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-6 border-t border-border mt-10">
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
                            {editingSede ? 'Salvar Configuración' : 'Activar Sede'}
                        </button>
                    </div>
                </form>
            </Modal>

            {/* DELETE CONFIRMATION */}
            <Modal
                isOpen={!!isDeleting}
                onClose={() => setIsDeleting(null)}
                title="Desafiliación de Sede"
            >
                <div className="space-y-8 text-center py-6">
                    <div className="w-20 h-20 rounded-[2.2rem] bg-destructive/10 text-destructive flex items-center justify-center mx-auto border-2 border-destructive/20 shadow-xl shadow-destructive/10">
                        <AlertCircle className="w-10 h-10" />
                    </div>
                    <div className="space-y-3">
                        <h3 className="text-2xl font-black tracking-tighter text-foreground uppercase">¿Desactivar Sede?</h3>
                        <p className="text-[13px] text-muted-foreground px-10 leading-relaxed font-bold italic opacity-70">
                            "Esta sede dejará de estar disponible para programas y registros de usuarios."
                        </p>
                    </div>
                    <div className="flex flex-col gap-3 px-8">
                        <button
                            onClick={() => isDeleting && handleDelete(isDeleting)}
                            className="h-14 w-full rounded-2xl bg-destructive text-white font-black text-xs uppercase tracking-[0.2em] shadow-xl shadow-destructive/20 hover:opacity-90 active:scale-95 transition-all"
                        >
                            Ejecutar Desafiliación
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
