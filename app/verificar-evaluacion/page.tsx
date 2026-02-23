'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
    CheckCircle2, XCircle, ShieldCheck, User, Calendar,
    Award, FileText, Verified, Info, ArrowLeft,
} from 'lucide-react';
import Link from 'next/link';
import { evaluationService } from '@/services/evaluationService';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { getImageUrl } from '@/lib/utils';

/* --- Helpers --- */
const IMG = (src: string) => getImageUrl(src);

function VerificationContent() {
    const searchParams = useSearchParams();
    const code = searchParams?.get('code') || '';

    const [isLoading, setIsLoading] = useState(true);
    const [result, setResult] = useState<any>(null);

    useEffect(() => {
        if (!code) {
            setIsLoading(false);
            return;
        }

        evaluationService.verifyEvaluation(code)
            .then(res => {
                setResult(res);
            })
            .catch(err => {
                console.error('Verification error:', err);
                setResult({ valid: false, message: 'Ocurrió un error al verificar el código.' });
            })
            .finally(() => {
                setIsLoading(false);
            });
    }, [code]);

    if (!code) {
        return (
            <div className="min-h-[80vh] flex items-center justify-center p-6">
                <Card className="max-w-md w-full p-10 text-center space-y-6">
                    <div className="w-20 h-20 bg-amber-100 text-amber-600 rounded-3xl flex items-center justify-center mx-auto">
                        <Info className="w-10 h-10" />
                    </div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight uppercase">Código Ausente</h1>
                    <p className="text-slate-500 font-medium text-sm">No se ha proporcionado un código de verificación para validar.</p>
                    <Link href="/">
                        <Button variant="outline" className="w-full">Volver al Inicio</Button>
                    </Link>
                </Card>
            </div>
        );
    }

    if (isLoading) {
        return (
            <div className="min-h-[80vh] flex items-center justify-center">
                <div className="flex flex-col items-center gap-6">
                    <div className="w-16 h-16 border-4 border-primary-600 border-t-transparent rounded-full animate-spin" />
                    <p className="text-xs font-black text-primary-600 uppercase tracking-[0.3em] animate-pulse">Verificando Código...</p>
                </div>
            </div>
        );
    }

    const { valid, evaluation, message } = result || {};

    return (
        <div className="max-w-4xl mx-auto space-y-12 pb-20">
            {/* Header Section */}
            <div className="flex flex-col items-center text-center space-y-4">
                <div className="inline-flex items-center gap-3 px-4 py-2 bg-white dark:bg-slate-800 rounded-full shadow-sm border border-slate-200 dark:border-slate-700">
                    <ShieldCheck className="w-4 h-4 text-emerald-500" />
                    <span className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">Sistema Oficial de Verificación PROFE</span>
                </div>
                <h1 className="text-5xl font-black text-slate-900 dark:text-white tracking-tighter uppercase leading-none">
                    Hoja de Concepto <br />
                    <span className="text-primary-600">Verificación Digital.</span>
                </h1>
            </div>

            <AnimatePresence mode="wait">
                {!valid ? (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-white dark:bg-slate-800 rounded-[3rem] p-12 border border-red-100 dark:border-red-900/30 shadow-2xl shadow-red-500/10 text-center space-y-8"
                    >
                        <div className="w-24 h-24 bg-red-50 dark:bg-red-900/20 text-red-500 rounded-full flex items-center justify-center mx-auto">
                            <XCircle className="w-16 h-16" />
                        </div>
                        <div className="space-y-2">
                            <h3 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight uppercase">Documento No Válido</h3>
                            <p className="text-slate-500 dark:text-slate-400 font-medium max-w-sm mx-auto">
                                {message || 'El código ingresado no corresponde a ninguna evaluación oficial registrada en nuestro sistema.'}
                            </p>
                        </div>
                        <div className="pt-4 flex flex-col sm:flex-row gap-4 justify-center">
                            <Button onClick={() => window.location.reload()} size="lg">Reintentar</Button>
                            <Link href="/">
                                <Button variant="outline" size="lg">Volver</Button>
                            </Link>
                        </div>
                    </motion.div>
                ) : (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="space-y-8"
                    >
                        {/* Success Banner */}
                        <div className="bg-emerald-600 rounded-[3rem] p-10 text-white flex flex-col md:flex-row items-center gap-8 relative overflow-hidden shadow-2xl shadow-emerald-600/20">
                            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32 blur-3xl opacity-20" />
                            <div className="w-20 h-20 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center shrink-0">
                                <CheckCircle2 className="w-12 h-12" />
                            </div>
                            <div className="space-y-1 text-center md:text-left">
                                <p className="text-[10px] font-black uppercase tracking-[0.3em] opacity-80">Estado del Documento</p>
                                <h3 className="text-4xl font-black uppercase tracking-tight">Verificación Exitosa</h3>
                                <p className="text-emerald-100 font-medium italic text-sm">Este documento es auténtico y legalmente reconocido por el Ministerio de Educación.</p>
                            </div>
                            <div className="md:ml-auto">
                                <div className="bg-white/20 px-6 py-3 rounded-2xl backdrop-blur-md border border-white/20">
                                    <p className="text-[9px] font-black uppercase tracking-widest opacity-80 mb-1">Cód. Verificación</p>
                                    <p className="text-2xl font-black tracking-widest">{code}</p>
                                </div>
                            </div>
                        </div>

                        {/* Evaluation Info */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <Card className="p-10 space-y-8" hover={false}>
                                <div className="flex items-center gap-4 text-primary-600">
                                    <User className="w-6 h-6" />
                                    <h4 className="text-sm font-black uppercase tracking-widest">Información del Evaluado</h4>
                                </div>
                                <div className="space-y-6">
                                    <div className="flex items-center gap-5">
                                        {evaluation.user?.imagen ? (
                                            <img src={IMG(evaluation.user.imagen)} className="w-20 h-20 rounded-2xl object-cover border-4 border-slate-50 dark:border-slate-700" alt="User" />
                                        ) : (
                                            <div className="w-20 h-20 bg-slate-100 dark:bg-slate-700 rounded-2xl flex items-center justify-center text-slate-400">
                                                <User className="w-10 h-10" />
                                            </div>
                                        )}
                                        <div className="space-y-1">
                                            <h5 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight leading-none">
                                                {evaluation.user?.nombre} {evaluation.user?.apellidos}
                                            </h5>
                                            <p className="text-[11px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                                                Docente / Administrativo
                                            </p>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-6 pt-4 border-t border-slate-100 dark:border-slate-700">
                                        <div className="space-y-1">
                                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Cédula / ID</p>
                                            <p className="text-sm font-bold text-slate-800 dark:text-slate-200">{evaluation.user?.username || '—'}</p>
                                        </div>
                                        <div className="space-y-1">
                                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Institución</p>
                                            <p className="text-[10px] font-bold text-slate-800 dark:text-slate-200 leading-tight">ESFM TECNOLÓGICO EL ALTO</p>
                                        </div>
                                    </div>
                                </div>
                            </Card>

                            <Card className="p-10 space-y-8" hover={false}>
                                <div className="flex items-center gap-4 text-primary-600">
                                    <Award className="w-6 h-6" />
                                    <h4 className="text-sm font-black uppercase tracking-widest">Resultado de Evaluación</h4>
                                </div>
                                <div className="flex flex-col items-center justify-center h-full gap-4 pb-4 px-4 overflow-visible">
                                    <div className="relative">
                                        <svg className="w-32 h-32 transform -rotate-90 overflow-visible">
                                            <circle cx="64" cy="64" r="56" stroke="currentColor" strokeWidth="10" fill="transparent" className="text-slate-100 dark:text-slate-700" />
                                            <circle cx="64" cy="64" r="56" stroke="currentColor" strokeWidth="10" fill="transparent" strokeDasharray={352} strokeDashoffset={352 - (352 * Math.min(evaluation.puntajeTotal, 100)) / 100} className="text-primary-600" />
                                        </svg>
                                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                                            <span className="text-4xl font-black text-slate-900 dark:text-white">{evaluation.puntajeTotal}</span>
                                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Puntos</span>
                                        </div>
                                    </div>
                                    <div className="text-center space-y-1">
                                        <p className="text-[10px] font-medium text-slate-500 uppercase tracking-wider">Periodo Académico</p>
                                        <div className="px-3 py-1 bg-primary-50 dark:bg-primary-900/20 text-primary-600 rounded-lg font-black text-[10px] uppercase tracking-widest">
                                            {evaluation.periodoEval?.periodo} ({evaluation.periodoEval?.gestion})
                                        </div>
                                    </div>
                                </div>
                            </Card>
                        </div>

                        {/* Scores Table */}
                        <Card className="p-10" hover={false}>
                            <div className="flex items-center gap-4 text-primary-600 mb-10">
                                <FileText className="w-6 h-6" />
                                <h4 className="text-sm font-black uppercase tracking-widest">Desglose de Calificaciones</h4>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {(evaluation.puntajes || []).map((p: any, i: number) => (
                                    <div key={i} className="flex items-center gap-4 p-5 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-100 dark:border-slate-800">
                                        <div className="w-8 h-8 rounded-lg bg-white dark:bg-slate-800 flex items-center justify-center text-primary-600 font-black text-xs shadow-sm">
                                            {i + 1}
                                        </div>
                                        <div className="flex-1">
                                            <h5 className="font-black text-slate-900 dark:text-white uppercase tracking-tight text-[11px] line-clamp-1">{p.criterio?.nombre}</h5>
                                            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                                                Máximo: {p.criterio?.puntajeMaximo}
                                            </p>
                                        </div>
                                        <div className="w-10 h-10 bg-primary-600 text-white rounded-xl flex items-center justify-center shadow-lg shadow-primary-600/20">
                                            <span className="text-sm font-black">{p.puntaje}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <div className="mt-10 pt-8 border-t border-slate-100 dark:border-slate-700 flex flex-col sm:flex-row items-center justify-between text-slate-400 dark:text-slate-500 text-[10px] font-black uppercase tracking-widest gap-4">
                                <div className="flex items-center gap-2">
                                    <Calendar className="w-3.5 h-3.5" />
                                    Emisión: {evaluation.createdAt ? new Date(evaluation.createdAt).toLocaleDateString('es-ES') : '--/--/----'}
                                </div>
                                <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-500">
                                    <Verified className="w-3.5 h-3.5" />
                                    Certificación Acreditada por UGPSEP-SI
                                </div>
                            </div>
                        </Card>

                        <div className="pt-10 flex justify-center gap-6 print:hidden">
                            <Link href="/">
                                <Button variant="outline" size="lg" className="px-10 rounded-[2rem] flex items-center gap-3">
                                    <ArrowLeft className="w-4 h-4" /> Inicio
                                </Button>
                            </Link>
                            <Button onClick={() => window.print()} size="lg" className="px-10 rounded-[2rem] flex items-center gap-3">
                                <FileText className="w-4 h-4" /> Imprimir Verificación
                            </Button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Footer Disclaimer */}
            <div className="max-w-xl mx-auto text-center space-y-4 pt-10 opacity-60">
                <p className="text-[9px] text-slate-400 font-bold uppercase tracking-[0.2em] leading-relaxed">
                    Este sistema es propiedad del Ministerio de Educación de Bolivia. Cualquier alteración de esta información constituye un delito penado por la ley.
                </p>
                <div className="flex justify-center gap-6 text-[8px] font-black text-slate-300 dark:text-slate-600 uppercase tracking-[0.4em]">
                    <span>PROFE v2.0</span>
                    <span>AGETIC ACCREDITED</span>
                    <span>SIE: 00000999</span>
                </div>
            </div>
        </div>
    );
}

export default function VerificationPage() {
    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900 selection:bg-primary-500 selection:text-white transition-colors duration-500">
            {/* Ambient Background */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
                <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/2 w-[800px] h-[800px] bg-primary-500/5 rounded-full blur-[120px]" />
                <div className="absolute bottom-0 left-0 translate-y-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-indigo-500/5 rounded-full blur-[120px]" />
            </div>

            <div className="relative z-10 pt-20 px-6">
                <Suspense fallback={
                    <div className="min-h-[80vh] flex items-center justify-center">
                        <div className="w-16 h-16 border-4 border-primary-600 border-t-transparent rounded-full animate-spin" />
                    </div>
                }>
                    <VerificationContent />
                </Suspense>
            </div>
        </div>
    );
}
