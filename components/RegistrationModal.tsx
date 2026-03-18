'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    X, User, CreditCard, Upload, Calendar, ArrowRight, CheckCircle2,
    AlertCircle, Search, MapPin, Clock, Building2, UserCircle
} from 'lucide-react';
import { toast } from 'sonner';
import { publicService } from '@/services/publicService';
import { uploadService } from '@/services/uploadService';
import { cn } from '@/lib/utils';

interface RegistrationModalProps {
    isOpen: boolean;
    onClose: () => void;
    program?: any;
}

export default function RegistrationModal({ isOpen, onClose, program }: RegistrationModalProps) {
    const [step, setStep] = useState(1);
    const [isLoading, setIsLoading] = useState(false);
    const [isSearching, setIsSearching] = useState(false);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    // Form data
    const [ci, setCi] = useState('');
    const [complemento, setComplemento] = useState('');
    const [persona, setPersona] = useState<any>(null);

    // Additional data
    const [datosInscripcion, setDatosInscripcion] = useState({
        licenciatura: '',
        unidadEducativa: '',
        nivel: '',
        subsistema: '',
        materia: ''
    });

    // Payment data
    const [baucher, setBaucher] = useState({
        nroDeposito: '',
        monto: program?.costo || '',
        fecha: new Date().toISOString().split('T')[0],
        imagen: ''
    });
    const [selectedFile, setSelectedFile] = useState<File | null>(null);

    useEffect(() => {
        if (program) {
            setBaucher(prev => ({ ...prev, monto: program.costo }));
        }
    }, [program]);

    const handleSearch = async () => {
        if (!ci) return toast.error('Ingrese su CI');

        setIsSearching(true);
        try {
            const data = await publicService.checkPersona(ci, complemento);
            if (data) {
                setPersona(data);
                toast.success('Datos encontrados');
                setStep(2);
            } else {
                toast.error('No se encontró a la persona. Verifique sus datos o contacte a soporte.');
            }
        } catch (error) {
            toast.error('Error al buscar datos');
        } finally {
            setIsSearching(false);
        }
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const validation = uploadService.validateFile(file);
        if (!validation.valid) {
            return toast.error(validation.error);
        }

        setSelectedFile(file);
        try {
            const res = await publicService.uploadBaucher(file);
            if (res.success) {
                setBaucher(prev => ({ ...prev, imagen: res.data.path }));
                toast.success('Baucher subido correctamente');
            }
        } catch (error) {
            toast.error('Error al subir el archivo');
        }
    };

    const handleSubmit = async () => {
        if (!baucher.imagen || !baucher.nroDeposito) {
            return toast.error('Complete los datos del pago');
        }

        setIsLoading(true);
        try {
            const res = await publicService.registerInscripcion({
                personaId: persona.id,
                programaId: program.id,
                turnoId: program.turnos?.[0]?.id || program.turno?.id, // Depende de la data
                sedeId: program.sedeId || program.sede?.id,
                baucher,
                datosAdicionales: datosInscripcion
            });

            if (res.success) {
                setStep(4);
                toast.success('Inscripción exitosa');
            }
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Error al procesar inscripción');
        } finally {
            setIsLoading(false);
        }
    };

    if (!isOpen || !mounted) return null;

    return (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-slate-950/40 backdrop-blur-xl"
                onClick={onClose}
            />

            <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                className="relative w-full max-w-4xl bg-white dark:bg-slate-900 rounded-[3rem] overflow-hidden shadow-3xl border border-slate-200 dark:border-white/5"
            >
                {/* Header */}
                <div className="flex items-center justify-between p-8 border-b border-slate-100 dark:border-white/5">
                    <div>
                        <h2 className="text-2xl font-black uppercase tracking-tighter">Inscripción Académica</h2>
                        <p className="text-[10px] font-black text-primary-600 uppercase tracking-widest mt-1">
                            {program?.nombre || 'Portal de Registro'}
                        </p>
                    </div>
                    <button onClick={onClose} className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-white/5 flex items-center justify-center hover:bg-red-50 hover:text-red-500 transition-all">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <div className="flex flex-col lg:flex-row min-h-[500px]">
                    {/* Stepper Sidebar */}
                    <div className="lg:w-72 bg-slate-50 dark:bg-white/[0.02] p-8 border-r border-slate-100 dark:border-white/5">
                        <div className="space-y-6">
                            {[
                                { s: 1, l: 'Verificación', i: UserCircle },
                                { s: 2, l: 'Datos Académicos', i: Building2 },
                                { s: 3, l: 'Pago y Confirmación', i: CreditCard },
                                { s: 4, l: 'Finalización', i: CheckCircle2 }
                            ].map((item) => (
                                <div key={item.s} className={cn(
                                    "flex items-center gap-4 transition-all duration-500",
                                    step >= item.s ? "text-primary-600" : "text-slate-300 dark:text-slate-700"
                                )}>
                                    <div className={cn(
                                        "w-10 h-10 rounded-xl flex items-center justify-center transition-all",
                                        step === item.s ? "bg-primary-600 text-white shadow-lg" :
                                            step > item.s ? "bg-primary-100 text-primary-600" : "bg-slate-100 dark:bg-white/5"
                                    )}>
                                        <item.i className="w-5 h-5" />
                                    </div>
                                    <span className="text-[11px] font-black uppercase tracking-widest">{item.l}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Content Area */}
                    <div className="flex-1 p-10">
                        <AnimatePresence mode="wait">
                            {step === 1 && (
                                <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-8">
                                    <div className="space-y-4">
                                        <h3 className="text-3xl font-black uppercase tracking-tight">Identificación</h3>
                                        <p className="text-slate-500 dark:text-slate-400">Ingrese su documento de identidad para validar su registro profesional.</p>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2">Cédula de Identidad</label>
                                            <input
                                                type="text"
                                                value={ci}
                                                onChange={(e) => setCi(e.target.value)}
                                                className="w-full h-16 px-6 rounded-2xl bg-slate-50 dark:bg-white/5 border-2 border-transparent focus:border-primary-600 outline-none transition-all font-bold text-lg"
                                                placeholder="Ej. 8472931"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2">Complemento (Opcional)</label>
                                            <input
                                                type="text"
                                                value={complemento}
                                                onChange={(e) => setComplemento(e.target.value)}
                                                className="w-full h-16 px-6 rounded-2xl bg-slate-50 dark:bg-white/5 border-2 border-transparent focus:border-primary-600 outline-none transition-all font-bold text-lg"
                                                placeholder="Ej. 1A"
                                            />
                                        </div>
                                    </div>

                                    <button
                                        onClick={handleSearch}
                                        disabled={isSearching}
                                        className="w-full h-16 rounded-2xl bg-primary-600 text-white font-black uppercase tracking-widest flex items-center justify-center gap-4 hover:brightness-110 disabled:opacity-50 transition-all"
                                    >
                                        {isSearching ? 'Buscando...' : 'Verificar Identidad'} <Search className="w-5 h-5" />
                                    </button>
                                </motion.div>
                            )}

                            {step === 2 && persona && (
                                <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-8">
                                    <div className="p-6 rounded-3xl bg-primary-50 dark:bg-primary-900/10 border border-primary-500/10 flex items-center gap-6">
                                        <div className="w-16 h-16 rounded-2xl bg-primary-600 flex items-center justify-center text-white"><User className="w-8 h-8" /></div>
                                        <div>
                                            <h4 className="text-xl font-black uppercase tracking-tighter">{persona.nombre} {persona.apellidoPaterno}</h4>
                                            <p className="text-[10px] font-bold text-primary-600 uppercase tracking-widest">Documento Verificado ✓</p>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2">Unidad Educativa</label>
                                            <input
                                                type="text"
                                                value={datosInscripcion.unidadEducativa}
                                                onChange={(e) => setDatosInscripcion({ ...datosInscripcion, unidadEducativa: e.target.value })}
                                                className="w-full h-14 px-6 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/10 outline-none focus:border-primary-600 transition-all font-medium"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2">Nivel / Subsistema</label>
                                            <input
                                                type="text"
                                                value={datosInscripcion.nivel}
                                                onChange={(e) => setDatosInscripcion({ ...datosInscripcion, nivel: e.target.value })}
                                                className="w-full h-14 px-6 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/10 outline-none focus:border-primary-600 transition-all font-medium"
                                            />
                                        </div>
                                    </div>

                                    <div className="flex gap-4">
                                        <button onClick={() => setStep(1)} className="px-10 h-16 rounded-2xl bg-slate-100 dark:bg-white/5 font-black uppercase tracking-widest hover:bg-slate-200 transition-all">Atrás</button>
                                        <button onClick={() => setStep(3)} className="flex-1 h-16 rounded-2xl bg-primary-600 text-white font-black uppercase tracking-widest hover:brightness-110 transition-all">Siguiente Paso</button>
                                    </div>
                                </motion.div>
                            )}

                            {step === 3 && (
                                <motion.div key="step3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-8">
                                    <div className="space-y-4">
                                        <h3 className="text-3xl font-black uppercase tracking-tight">Registro de Pago</h3>
                                        <div className="flex items-center gap-4 text-primary-600 bg-primary-50 dark:bg-primary-900/20 p-4 rounded-2xl">
                                            <AlertCircle className="w-5 h-5" />
                                            <span className="text-xs font-bold uppercase tracking-widest">Inversión del programa: {program?.costo} Bs.</span>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                        <div className="space-y-6">
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2">Nro de Depósito / Operación</label>
                                                <input
                                                    type="text"
                                                    value={baucher.nroDeposito}
                                                    onChange={(e) => setBaucher({ ...baucher, nroDeposito: e.target.value })}
                                                    className="w-full h-14 px-6 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/10 focus:border-primary-600 transition-all font-bold"
                                                    placeholder="0000000"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2">Fecha de Pago</label>
                                                <input
                                                    type="date"
                                                    value={baucher.fecha}
                                                    onChange={(e) => setBaucher({ ...baucher, fecha: e.target.value })}
                                                    className="w-full h-14 px-6 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/10 focus:border-primary-600 transition-all font-bold"
                                                />
                                            </div>
                                        </div>

                                        <div className="relative group">
                                            <input type="file" id="baucher-upload" className="hidden" onChange={handleFileUpload} accept="image/*" />
                                            <label htmlFor="baucher-upload" className="flex flex-col items-center justify-center aspect-video rounded-3xl border-2 border-dashed border-slate-200 dark:border-white/10 hover:border-primary-600 transition-all cursor-pointer bg-slate-50 dark:bg-white/[0.01]">
                                                {baucher.imagen ? (
                                                    <img src={baucher.imagen.startsWith('http') ? baucher.imagen : `${process.env.NEXT_PUBLIC_VIEWS_API_URL?.replace(':3005', ':3000')}/uploads/${baucher.imagen}`} className="w-full h-full object-cover rounded-[1.4rem]" alt="Preview" />
                                                ) : (
                                                    <>
                                                        <Upload className="w-10 h-10 text-slate-300 mb-4" />
                                                        <span className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Subir Comprobante</span>
                                                    </>
                                                )}
                                            </label>
                                        </div>
                                    </div>

                                    <div className="flex gap-4 pt-4">
                                        <button onClick={() => setStep(2)} className="px-10 h-16 rounded-2xl bg-slate-100 dark:bg-white/5 font-black uppercase tracking-widest hover:bg-slate-200 transition-all">Atrás</button>
                                        <button
                                            onClick={handleSubmit}
                                            disabled={isLoading}
                                            className="flex-1 h-16 rounded-2xl bg-primary-600 text-white font-black uppercase tracking-widest hover:brightness-110 disabled:opacity-50 transition-all flex items-center justify-center gap-4"
                                        >
                                            {isLoading ? 'Procesando...' : 'Finalizar Inscripción'} <ArrowRight className="w-5 h-5" />
                                        </button>
                                    </div>
                                </motion.div>
                            )}

                            {step === 4 && (
                                <motion.div key="step4" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center justify-center h-full space-y-12 py-10">
                                    <div className="relative">
                                        <div className="absolute inset-0 bg-green-500/20 blur-[50px] animate-pulse" />
                                        <div className="w-32 h-32 rounded-full bg-green-500 text-white flex items-center justify-center relative z-10 shadow-3xl">
                                            <CheckCircle2 className="w-16 h-16" />
                                        </div>
                                    </div>
                                    <div className="text-center space-y-4">
                                        <h3 className="text-4xl font-black uppercase tracking-tighter">¡Registro Exitoso!</h3>
                                        <p className="text-slate-500 max-w-sm mx-auto">Su solicitud está siendo procesada. Una vez validado el baucher, podrá acceder plenamente.</p>
                                    </div>
                                    <button onClick={onClose} className="px-16 py-6 rounded-2xl bg-slate-950 text-white font-black uppercase tracking-widest hover:brightness-110 transition-all">
                                        Cerrar y Continuar
                                    </button>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}
