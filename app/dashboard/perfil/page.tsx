'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { userService } from '@/services/userService';
import { Card } from '@/components/ui/Card';
import {
    User as UserIcon,
    Mail,
    Shield,
    MapPin,
    Calendar,
    Camera,
    Lock,
    Key,
    Save,
    Infinity as InfinityIcon,
    Briefcase,
    Activity,
    ChevronRight,
    Fingerprint
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

export default function PerfilPage() {
    const { user, logout, updateUser } = useAuth();
    const [isLoading, setIsLoading] = useState(false);
    const [formData, setFormData] = useState({
        nombre: '',
        apellidos: '',
        correo: '',
        password: '',
        newPassword: '',
        confirmPassword: '',
        // Personal Info
        imagen: '',
        genero: 'No prefiero decirlo',
        licenciatura: '',
        direccion: '',
        curriculum: '',
        fechaNacimiento: '',
        estadoCivil: '',
        facebook: '',
        tiktok: '',
        cargo: '',
        celular: 0
    });

    useEffect(() => {
        if (user) {
            setFormData(prev => ({
                ...prev,
                nombre: user.nombre || '',
                apellidos: user.apellidos || '',
                correo: user.correo || user.email || '',
                imagen: user.imagen || '',
                genero: user.genero || 'No prefiero decirlo',
                licenciatura: user.licenciatura || '',
                direccion: user.direccion || '',
                curriculum: user.curriculum || '',
                fechaNacimiento: user.fechaNacimiento || '',
                estadoCivil: user.estadoCivil || '',
                facebook: user.facebook || '',
                tiktok: user.tiktok || '',
                cargo: user.cargo || '',
                celular: user.celular || 0
            }));
        }
    }, [user]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        if (formData.newPassword && formData.newPassword !== formData.confirmPassword) {
            toast.error('Las contraseñas nuevas no coinciden');
            setIsLoading(false);
            return;
        }

        try {
            const updateData: any = {
                nombre: formData.nombre,
                apellidos: formData.apellidos,
                correo: formData.correo,
                imagen: formData.imagen,
                genero: formData.genero,
                licenciatura: formData.licenciatura,
                direccion: formData.direccion,
                curriculum: formData.curriculum,
                fechaNacimiento: formData.fechaNacimiento,
                estadoCivil: formData.estadoCivil,
                facebook: formData.facebook,
                tiktok: formData.tiktok,
                cargo: formData.cargo,
                celular: formData.celular
            };

            if (formData.newPassword) {
                updateData.password = formData.newPassword;
            }

            const res = await userService.updateProfile(updateData);
            updateUser(res);
            toast.success('Perfil actualizado con éxito en la matriz');
            setFormData(prev => ({ ...prev, password: '', newPassword: '', confirmPassword: '' }));
        } catch (error) {
            console.error('Error updating profile:', error);
            toast.error('Fallo en la sincronización del perfil');
        } finally {
            setIsLoading(false);
        }
    };

    if (!user) return (
        <div className="flex items-center justify-center min-h-[60vh]">
            <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
        </div>
    );

    const getRoleName = (r: any) => {
        if (typeof r === 'string') return r;
        if (r && 'role' in r) return r.role.name;
        return r.name || 'Desconocido';
    };

    return (
        <div className="max-w-[1400px] mx-auto space-y-12 pb-20">
            {/* Header Section: Premium Studio */}
            <div className="flex flex-col md:flex-row items-center gap-10 mt-10">
                <div className="relative group">
                    <div className="w-44 h-44 rounded-[3.5rem] bg-card border-2 border-border shadow-2xl flex items-center justify-center overflow-hidden transition-transform duration-500 group-hover:scale-[1.02]">
                        {user.imagen ? (
                            <img src={user.imagen} alt="Profile" className="w-full h-full object-cover" />
                        ) : (
                            <div className="w-full h-full bg-primary/5 flex items-center justify-center">
                                <span className="text-5xl font-black text-primary">
                                    {user.nombre?.charAt(0)}{user.apellidos?.charAt(0)}
                                </span>
                            </div>
                        )}
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer">
                            <Camera className="w-8 h-8 text-white" />
                        </div>
                    </div>
                    <div className="absolute -bottom-2 -right-2 w-12 h-12 rounded-2xl bg-card shadow-xl flex items-center justify-center border border-border">
                        <Activity className="w-5 h-5 text-emerald-500" />
                    </div>
                </div>

                <div className="text-center md:text-left space-y-4 flex-1">
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/5 border border-primary/10 mb-2">
                        <Fingerprint className="w-3.5 h-3.5 text-primary" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-primary">ID: {user.id.slice(0, 8)}...</span>
                    </div>
                    <h1 className="text-3xl font-black tracking-tighter text-foreground uppercase leading-tight">
                        {user.nombre} <span className="text-primary">{user.apellidos}</span>
                    </h1>
                    <div className="flex flex-wrap items-center justify-center md:justify-start gap-6 text-muted-foreground">
                        <div className="flex items-center gap-2">
                            <Briefcase className="w-4 h-4" />
                            <span className="text-xs font-bold uppercase tracking-widest">{user.cargo || 'Especialista Operativo'}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <MapPin className="w-4 h-4" />
                            <span className="text-xs font-bold uppercase tracking-widest">{user.tenant?.nombre || 'Gobierno Central'}</span>
                        </div>
                        <div className="flex items-center gap-2 text-primary font-black">
                            <div className={cn(
                                "w-2 h-2 rounded-full animate-pulse",
                                (user.estado === 'ACTIVO' || user.activo) ? "bg-emerald-500" : "bg-rose-500"
                            )} />
                            <span className="text-xs uppercase tracking-widest">
                                {user.estado || (user.activo ? 'OPERATIVO' : 'BLOQUEADO')}
                            </span>
                        </div>
                    </div>
                </div>

                <div className="flex gap-4">
                    <button onClick={logout} className="h-14 px-8 rounded-2xl bg-card border border-border text-muted-foreground font-black text-[10px] uppercase tracking-widest hover:bg-destructive/10 hover:text-destructive transition-all shadow-sm">
                        Desconectar
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                {/* Left Column: Form Settings */}
                <div className="lg:col-span-2 space-y-10">
                    <Card className="p-10 border-border/40 shadow-2xl shadow-black/[0.03] bg-card">
                        <div className="flex items-center gap-4 mb-10 pb-6 border-b border-border">
                            <div className="w-12 h-12 rounded-2xl bg-primary/5 flex items-center justify-center text-primary border border-primary/10">
                                <UserIcon className="w-6 h-6" />
                            </div>
                            <div className="space-y-1">
                                <h2 className="text-md font-black uppercase tracking-tighter text-foreground leading-none">Ajustes de Matriz</h2>
                                <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">Configuración de identidad gubernamental</p>
                            </div>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-8">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                                <div className="space-y-1 group">
                                    <label className="text-[9px] font-black text-muted-foreground uppercase tracking-widest ml-1">Nombre de Operador</label>
                                    <input
                                        type="text"
                                        value={formData.nombre}
                                        onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                                        className="w-full h-11 px-4 rounded-xl bg-muted border border-transparent focus:border-primary/20 focus:bg-card transition-all outline-none font-bold text-foreground text-xs"
                                    />
                                </div>
                                <div className="space-y-1 group">
                                    <label className="text-[9px] font-black text-muted-foreground uppercase tracking-widest ml-1">Apellidos</label>
                                    <input
                                        type="text"
                                        value={formData.apellidos}
                                        onChange={(e) => setFormData({ ...formData, apellidos: e.target.value })}
                                        className="w-full h-11 px-4 rounded-xl bg-muted border border-transparent focus:border-primary/20 focus:bg-card transition-all outline-none font-bold text-foreground text-xs"
                                    />
                                </div>
                            </div>

                            <div className="space-y-1 group">
                                <label className="text-[9px] font-black text-muted-foreground uppercase tracking-widest ml-1">Canal de Comunicación (JWT Email)</label>
                                <div className="relative">
                                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/50" />
                                    <input
                                        type="email"
                                        value={formData.correo}
                                        disabled
                                        className="w-full h-11 pl-11 pr-4 rounded-xl bg-muted/50 border border-border text-muted-foreground font-bold outline-none cursor-not-allowed text-xs"
                                    />
                                </div>
                            </div>

                            {/* Extended Personal Info */}
                            <div className="pt-6 border-t border-border">
                                <div className="flex items-center gap-2 mb-6">
                                    <Activity className="w-3.5 h-3.5 text-primary" />
                                    <h4 className="text-[10px] font-black uppercase tracking-widest text-foreground">Información Personal</h4>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                                    <div className="space-y-1 group">
                                        <label className="text-[9px] font-black text-muted-foreground uppercase tracking-widest ml-1">Género</label>
                                        <select
                                            value={formData.genero}
                                            onChange={(e) => setFormData({ ...formData, genero: e.target.value })}
                                            className="w-full h-11 px-4 rounded-xl bg-muted border border-transparent focus:border-primary/20 focus:bg-card transition-all outline-none font-bold text-foreground appearance-none text-xs"
                                        >
                                            <option value="Masculino">Masculino</option>
                                            <option value="Femenino">Femenino</option>
                                            <option value="No prefiero decirlo">No prefiero decirlo</option>
                                        </select>
                                    </div>
                                    <div className="space-y-1 group">
                                        <label className="text-[9px] font-black text-muted-foreground uppercase tracking-widest ml-1">Celular de Contacto</label>
                                        <input
                                            type="number"
                                            value={formData.celular}
                                            onChange={(e) => setFormData({ ...formData, celular: parseInt(e.target.value) })}
                                            className="w-full h-11 px-4 rounded-xl bg-muted border border-transparent focus:border-primary/20 focus:bg-card transition-all outline-none font-bold text-foreground text-xs"
                                        />
                                    </div>
                                    <div className="space-y-1 group">
                                        <label className="text-[9px] font-black text-muted-foreground uppercase tracking-widest ml-1">Fecha de Nacimiento</label>
                                        <input
                                            type="date"
                                            value={formData.fechaNacimiento}
                                            onChange={(e) => setFormData({ ...formData, fechaNacimiento: e.target.value })}
                                            className="w-full h-11 px-4 rounded-xl bg-muted border border-transparent focus:border-primary/20 focus:bg-card transition-all outline-none font-bold text-foreground text-xs"
                                        />
                                    </div>
                                    <div className="space-y-1 group">
                                        <label className="text-[9px] font-black text-muted-foreground uppercase tracking-widest ml-1">Estado Civil</label>
                                        <input
                                            type="text"
                                            value={formData.estadoCivil}
                                            onChange={(e) => setFormData({ ...formData, estadoCivil: e.target.value })}
                                            className="w-full h-11 px-4 rounded-xl bg-muted border border-transparent focus:border-primary/20 focus:bg-card transition-all outline-none font-bold text-foreground text-xs"
                                            placeholder="Soltero/a, Casado/a..."
                                        />
                                    </div>
                                    <div className="md:col-span-2 space-y-1 group">
                                        <label className="text-[9px] font-black text-muted-foreground uppercase tracking-widest ml-1">Dirección Residencial</label>
                                        <input
                                            type="text"
                                            value={formData.direccion}
                                            onChange={(e) => setFormData({ ...formData, direccion: e.target.value })}
                                            className="w-full h-11 px-4 rounded-xl bg-muted border border-transparent focus:border-primary/20 focus:bg-card transition-all outline-none font-bold text-foreground text-xs"
                                        />
                                    </div>
                                    <div className="space-y-1 group">
                                        <label className="text-[9px] font-black text-muted-foreground uppercase tracking-widest ml-1">Especialidad / Licenciatura</label>
                                        <input
                                            type="text"
                                            value={formData.licenciatura}
                                            onChange={(e) => setFormData({ ...formData, licenciatura: e.target.value })}
                                            className="w-full h-11 px-4 rounded-xl bg-muted border border-transparent focus:border-primary/20 focus:bg-card transition-all outline-none font-bold text-foreground text-xs"
                                            placeholder="Ej: Lic. en Educación Especial"
                                        />
                                    </div>
                                    <div className="space-y-1 group">
                                        <label className="text-[9px] font-black text-muted-foreground uppercase tracking-widest ml-1">Cargo Actual</label>
                                        <input
                                            type="text"
                                            value={formData.cargo}
                                            onChange={(e) => setFormData({ ...formData, cargo: e.target.value })}
                                            className="w-full h-11 px-4 rounded-xl bg-muted border border-transparent focus:border-primary/20 focus:bg-card transition-all outline-none font-bold text-foreground text-xs"
                                            placeholder="Ej: Director Regional"
                                        />
                                    </div>
                                    <div className="md:col-span-2 space-y-1 group">
                                        <label className="text-[9px] font-black text-muted-foreground uppercase tracking-widest ml-1">URL de Imagen de Perfil</label>
                                        <div className="relative">
                                            <Camera className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/50" />
                                            <input
                                                type="text"
                                                value={formData.imagen}
                                                onChange={(e) => setFormData({ ...formData, imagen: e.target.value })}
                                                className="w-full h-11 pl-11 pr-4 rounded-xl bg-muted border border-transparent focus:border-primary/20 focus:bg-card transition-all outline-none font-bold text-foreground text-xs"
                                                placeholder="https://ejemplo.com/foto.jpg"
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-1 group">
                                        <label className="text-[9px] font-black text-muted-foreground uppercase tracking-widest ml-1">Facebook URL</label>
                                        <input
                                            type="text"
                                            value={formData.facebook}
                                            onChange={(e) => setFormData({ ...formData, facebook: e.target.value })}
                                            className="w-full h-11 px-4 rounded-xl bg-muted border border-transparent focus:border-primary/20 focus:bg-card transition-all outline-none font-bold text-foreground text-xs"
                                        />
                                    </div>
                                    <div className="space-y-1 group">
                                        <label className="text-[9px] font-black text-muted-foreground uppercase tracking-widest ml-1">TikTok URL</label>
                                        <input
                                            type="text"
                                            value={formData.tiktok}
                                            onChange={(e) => setFormData({ ...formData, tiktok: e.target.value })}
                                            className="w-full h-11 px-4 rounded-xl bg-muted border border-transparent focus:border-primary/20 focus:bg-card transition-all outline-none font-bold text-foreground text-xs"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="pt-6 border-t border-border">
                                <div className="flex items-center gap-2 mb-6">
                                    <Lock className="w-3.5 h-3.5 text-primary" />
                                    <h4 className="text-[10px] font-black uppercase tracking-widest text-foreground">Seguridad Nucleo</h4>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                                    <div className="space-y-1 group">
                                        <label className="text-[9px] font-black text-muted-foreground uppercase tracking-widest ml-1">Nueva Clave</label>
                                        <div className="relative">
                                            <Key className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/50 group-focus-within:text-primary transition-colors" />
                                            <input
                                                type="password"
                                                value={formData.newPassword}
                                                onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
                                                className="w-full h-11 pl-11 pr-4 rounded-xl bg-muted border border-transparent focus:border-primary/20 focus:bg-card transition-all outline-none font-bold text-foreground text-xs"
                                                placeholder="••••••••"
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-1 group">
                                        <label className="text-[9px] font-black text-muted-foreground uppercase tracking-widest ml-1">Confirmar Matriz</label>
                                        <div className="relative">
                                            <Key className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/50 group-focus-within:text-primary transition-colors" />
                                            <input
                                                type="password"
                                                value={formData.confirmPassword}
                                                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                                                className="w-full h-11 pl-11 pr-4 rounded-xl bg-muted border border-transparent focus:border-primary/20 focus:bg-card transition-all outline-none font-bold text-foreground text-xs"
                                                placeholder="••••••••"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="flex justify-end pt-2">
                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    className="h-12 px-8 rounded-xl bg-primary text-white font-black text-[10px] uppercase tracking-[0.2em] shadow-lg shadow-primary/20 hover:opacity-95 active:scale-95 transition-all flex items-center gap-2 disabled:opacity-50"
                                >
                                    {isLoading ? 'Sincronizando...' : (
                                        <>
                                            <Save className="w-4 h-4" />
                                            Actualizar Matriz
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </Card>
                </div>

                {/* Right Column: Information & Roles */}
                <div className="space-y-10">
                    {/* Roles Matrix */}
                    <Card className="p-8 border-border/40 shadow-xl shadow-black/[0.02] bg-card">
                        <div className="flex items-center gap-3 mb-8">
                            <Shield className="w-5 h-5 text-primary" />
                            <h3 className="text-xs font-black uppercase tracking-[0.2em] text-foreground">Perfiles de Acceso</h3>
                        </div>
                        <div className="space-y-4">
                            {user.roles && user.roles.length > 0 ? (
                                user.roles.map((r, i) => (
                                    <div key={i} className="flex items-center justify-between p-4 rounded-2xl bg-muted border border-border group hover:bg-primary/[0.02] transition-colors">
                                        <div className="flex items-center gap-4">
                                            <div className="w-8 h-8 rounded-lg bg-card shadow-sm flex items-center justify-center border border-border text-primary">
                                                <Fingerprint className="w-4 h-4" />
                                            </div>
                                            <span className="text-[11px] font-black uppercase tracking-widest text-foreground/80">{getRoleName(r)}</span>
                                        </div>
                                        <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-all" />
                                    </div>
                                ))
                            ) : (
                                <div className="text-center py-6 text-muted-foreground font-bold uppercase text-[10px] tracking-widest">
                                    Sin perfiles activos
                                </div>
                            )}
                        </div>
                    </Card>

                    {/* Quick Stats */}
                    <Card className="p-8 border-primary/20 bg-foreground text-background overflow-hidden relative group">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/20 blur-[60px] rounded-full -mr-16 -mt-16 group-hover:bg-primary/40 transition-all duration-700" />
                        <div className="relative space-y-6">
                            <div className="flex items-center gap-3">
                                <InfinityIcon className="w-5 h-5 text-primary" />
                                <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-primary-foreground">Resumen Operativo</h3>
                            </div>
                            <div className="grid grid-cols-2 gap-6">
                                <div className="space-y-1">
                                    <p className="text-[8px] font-bold text-muted-foreground uppercase tracking-widest">Capacidades</p>
                                    <p className="text-2xl font-black tracking-tight">{user.permissions?.length || 0}</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-[8px] font-bold text-muted-foreground uppercase tracking-widest">Nodos</p>
                                    <p className="text-2xl font-black tracking-tight">{user.sedes?.length || 0}</p>
                                </div>
                            </div>
                        </div>
                    </Card>

                    {/* Geographical Units */}
                    <Card className="p-8 border-border/40 shadow-xl shadow-black/[0.02] bg-card">
                        <div className="flex items-center gap-3 mb-8">
                            <MapPin className="w-5 h-5 text-primary" />
                            <h3 className="text-xs font-black uppercase tracking-[0.2em] text-foreground">Unidades de Gestión</h3>
                        </div>
                        <div className="space-y-4">
                            {user.sedes && user.sedes.length > 0 ? (
                                user.sedes.map((s, i) => (
                                    <div key={i} className="p-4 rounded-2xl bg-muted border border-border group">
                                        <div className="flex items-center gap-3 mb-1">
                                            <div className="w-6 h-6 rounded-lg bg-card shadow-sm flex items-center justify-center border border-border text-muted-foreground">
                                                <MapPin className="w-3 h-3" />
                                            </div>
                                            <span className="text-[10px] font-black uppercase tracking-widest text-foreground/80">
                                                {s.sede?.nombre || 'Sede Central'}
                                            </span>
                                        </div>
                                        <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest ml-9">
                                            {s.sede?.turno} • {s.sede?.horario}
                                        </p>
                                    </div>
                                ))
                            ) : (
                                <div className="text-center py-6 text-muted-foreground font-bold uppercase text-[10px] tracking-widest border-2 border-dashed border-border rounded-2xl">
                                    Jurisdicción Global
                                </div>
                            )}
                        </div>
                    </Card>

                    {/* Permissions List */}
                    <div className="p-6">
                        <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground mb-6 ml-2">Capacidades del Inyector</h3>
                        <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-primary/10 scrollbar-track-transparent">
                            {user.permissions?.map((p, i) => (
                                <div key={i} className="flex items-center gap-3 text-[10px] font-bold uppercase tracking-widest text-muted-foreground py-0.5">
                                    <div className="w-1 h-1 rounded-full bg-primary/40" />
                                    <span>{(p as any).action} <span className="text-foreground">{(p as any).subject}</span></span>
                                </div>
                            ))}
                            {(!user.permissions || user.permissions.length === 0) && (
                                <p className="text-[9px] font-bold text-muted-foreground/50 uppercase tracking-widest ml-2">Sin capacidades asignadas</p>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
