'use client';

import { useState, useEffect, useMemo } from 'react';
import {
    evaluationService,
    EvaluationPeriod,
    EvaluacionCuestionario,
    EvaluacionAdmins,
    EvaluacionIntento,
    EscalaLikertKey,
    ESCALA_LIKERT_VALORES,
    TipoPregunta,
} from '@/services/evaluationService';
import { departmentService } from '@/services/departmentService';
import { useAbility } from '@/hooks/useAbility';
import { Modal } from '@/components/Modal';
import { Card } from '@/components/ui/Card';
import {
    ClipboardSignature,
    Search,
    UserCheck,
    Download,
    Eye,
    Star,
    AlertCircle,
    CheckCircle2,
    FileText,
    Loader2,
    Building2,
    CalendarCheck,
    Clock,
    Timer,
    Users,
    ChevronRight,
    Award,
    Sparkles,
    Briefcase,
    Check,
    X,
    Filter,
    CheckSquare,
    Circle,
    ToggleLeft,
    AlignLeft,
    ShieldAlert,
    ListChecks,
    Lock,
    Maximize2,
    Minimize2,
    HelpCircle,
    Calendar,
    Shuffle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import Link from 'next/link';
import MathRenderer from '@/components/aula/MathRenderer';

const ESCALA_OPCIONES: { key: EscalaLikertKey; label: string; points: number; color: string; activeBg: string }[] = [
    { key: 'SIEMPRE', label: 'SIEMPRE', points: 100, color: 'text-emerald-500 border-emerald-500', activeBg: 'bg-emerald-600 text-white border-emerald-600 shadow-md shadow-emerald-500/20' },
    { key: 'CASI_SIEMPRE', label: 'CASI SIEMPRE', points: 80, color: 'text-blue-500 border-blue-500', activeBg: 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-500/20' },
    { key: 'ALGUNAS_VECES', label: 'ALGUNAS VECES', points: 60, color: 'text-amber-500 border-amber-500', activeBg: 'bg-amber-600 text-white border-amber-600 shadow-md shadow-amber-500/20' },
    { key: 'CASI_NUNCA', label: 'CASI NUNCA', points: 40, color: 'text-orange-500 border-orange-500', activeBg: 'bg-orange-600 text-white border-orange-600 shadow-md shadow-orange-500/20' },
    { key: 'NUNCA', label: 'NUNCA', points: 20, color: 'text-rose-500 border-rose-500', activeBg: 'bg-rose-600 text-white border-rose-600 shadow-md shadow-rose-500/20' },
];

export default function EvaluarPersonalPage() {
    const { user, isSuperAdmin, can } = useAbility();

    // Filtros y estados de navegación
    const [selectedPeriod, setSelectedPeriod] = useState<string>('');
    const [periods, setPeriods] = useState<EvaluationPeriod[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [activeTab, setActiveTab] = useState<'mis-asignaciones' | 'todo-el-personal'>('mis-asignaciones');

    const [misAsignaciones, setMisAsignaciones] = useState<EvaluacionAdmins[]>([]);
    const [misEvaluacionesPropias, setMisEvaluacionesPropias] = useState<EvaluacionAdmins[]>([]);
    const [allUsersToEvaluate, setAllUsersToEvaluate] = useState<any[]>([]);
    const [cuestionarios, setCuestionarios] = useState<EvaluacionCuestionario[]>([]);
    const [departments, setDepartments] = useState<any[]>([]);
    const [selectedDept, setSelectedDept] = useState<string>(user?.tenantId || '');

    // Modal de Evaluación Interactiva (supervisor evalúa a subordinado)
    const [isEvaluationModalOpen, setIsEvaluationModalOpen] = useState(false);
    const [selectedAsignacion, setSelectedAsignacion] = useState<EvaluacionAdmins | null>(null);
    const [selectedCuestionario, setSelectedCuestionario] = useState<EvaluacionCuestionario | null>(null);
    const [currentIntento, setCurrentIntento] = useState<EvaluacionIntento | null>(null);
    const [respuestasMap, setRespuestasMap] = useState<Record<string, { escalaTexto: EscalaLikertKey | string; puntaje: number; observacion?: string }>>({});
    const [submitting, setSubmitting] = useState(false);
    const [timeLeftSeconds, setTimeLeftSeconds] = useState<number | null>(null);

    // Modal de Cuestionario Personal (el usuario se autoevalúa en Pantalla Completa)
    const [isSelfEvalModalOpen, setIsSelfEvalModalOpen] = useState(false);
    const [selfAsignacion, setSelfAsignacion] = useState<EvaluacionAdmins | null>(null);
    const [isStartConfirmModalOpen, setIsStartConfirmModalOpen] = useState(false);
    const [pendingAsignacion, setPendingAsignacion] = useState<EvaluacionAdmins | null>(null);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [cheatWarnings, setCheatWarnings] = useState(0);

    // Modal de Consolidado
    const [isConsolidadoModalOpen, setIsConsolidadoModalOpen] = useState(false);
    const [consolidadoData, setConsolidadoData] = useState<any>(null);
    const [loadingConsolidado, setLoadingConsolidado] = useState(false);
    const loadPeriodData = async (periodId?: string, deptId?: string) => {
        const pId = periodId || selectedPeriod;
        if (!pId) return;
        const targetTenant = isSuperAdmin ? (deptId !== undefined ? deptId : selectedDept) : (user?.tenantId || '');
        try {
            setLoading(true);
            const [misAsign, misEval, allUsers, cuestList] = await Promise.all([
                evaluationService.getMisPendientes(pId).catch(() => []),
                evaluationService.getMisEvaluaciones(pId).catch(() => []),
                evaluationService.getUsersToEvaluate(targetTenant, pId).catch(() => []),
                evaluationService.getCuestionarios(pId).catch(() => []),
            ]);

            setMisAsignaciones(misAsign || []);
            setMisEvaluacionesPropias(misEval || []);
            setAllUsersToEvaluate(allUsers || []);
            setCuestionarios(cuestList || []);
        } catch (error) {
            console.error('Error loading period data:', error);
            toast.error('Error al cargar personal asignado');
        } finally {
            setLoading(false);
        }
    };

    const loadInitialData = async () => {
        try {
            setLoading(true);
            const [pData, dData] = await Promise.all([
                evaluationService.getPeriods().catch(() => []),
                isSuperAdmin ? departmentService.getAll().catch(() => []) : Promise.resolve([]),
            ]);

            // Filtrar solo períodos activos y cuya fechaFin no haya pasado
            const now = new Date();
            const validPeriods = (pData || []).filter((p: any) => {
                if (!p.activo) return false;
                if (p.fechaFin && new Date(p.fechaFin) < now) return false;
                return true;
            });
            setPeriods(validPeriods);
            setDepartments(dData || []);

            const active = validPeriods.length > 0 ? (validPeriods.find((p: any) => p.activo) || validPeriods[0]) : null;
            if (active) {
                setSelectedPeriod(active.id);
                const targetTenant = isSuperAdmin ? selectedDept : (user?.tenantId || '');
                const [misAsign, misEval, allUsers, cuestList] = await Promise.all([
                    evaluationService.getMisPendientes(active.id).catch(() => []),
                    evaluationService.getMisEvaluaciones(active.id).catch(() => []),
                    evaluationService.getUsersToEvaluate(targetTenant, active.id).catch(() => []),
                    evaluationService.getCuestionarios(active.id).catch(() => []),
                ]);

                setMisAsignaciones(misAsign || []);
                setMisEvaluacionesPropias(misEval || []);
                setAllUsersToEvaluate(allUsers || []);
                setCuestionarios(cuestList || []);
            }
        } catch (error) {
            toast.error('Error al inicializar periodos de evaluación');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadInitialData();
    }, [user?.id, user?.tenantId, isSuperAdmin]);

    const handlePeriodChange = (newPeriodId: string) => {
        setSelectedPeriod(newPeriodId);
        loadPeriodData(newPeriodId);
    };

    const handleDeptChange = (newDeptId: string) => {
        setSelectedDept(newDeptId);
        loadPeriodData(selectedPeriod, newDeptId);
    };

    // Cuenta regresiva del temporizador
    useEffect(() => {
        if (timeLeftSeconds === null || timeLeftSeconds <= 0) return;

        const interval = setInterval(() => {
            setTimeLeftSeconds(prev => {
                if (prev === null || prev <= 1) {
                    clearInterval(interval);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(interval);
    }, [timeLeftSeconds]);

    // Auto-envío obligatorio al expirar el tiempo
    useEffect(() => {
        if (timeLeftSeconds === 0 && isSelfEvalModalOpen && !submitting && currentIntento) {
            toast.error('¡Tiempo límite alcanzado! Finalizando evaluación...');
            handleSubmitSelfEval(true);
        }
    }, [timeLeftSeconds, isSelfEvalModalOpen, submitting, currentIntento]);

    // Detección de cambio de pestaña / pérdida de foco (Integridad Académica)
    useEffect(() => {
        if (!isSelfEvalModalOpen || submitting) return;

        const handleVisibilityChange = () => {
            if (document.hidden) {
                setCheatWarnings(prev => {
                    const next = prev + 1;
                    if (next >= 3) {
                        toast.error('¡Violación de integridad! Has salido de la pantalla 3 veces. Auto-enviando examen...');
                        handleSubmitSelfEval(true);
                    } else {
                        toast.warning(`⚠️ Advertencia de Seguridad (${next}/3): Has salido de la pantalla del examen. Al acumular 3 advertencias el examen se cerrará automáticamente.`);
                    }
                    return next;
                });
            }
        };

        const handleBeforeUnload = (e: BeforeUnloadEvent) => {
            e.preventDefault();
            e.returnValue = 'Tienes un examen en curso.';
            return e.returnValue;
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);
        window.addEventListener('beforeunload', handleBeforeUnload);

        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            window.removeEventListener('beforeunload', handleBeforeUnload);
        };
    }, [isSelfEvalModalOpen, submitting]);

    // Entorno Seguro de Examen: Bloqueo de copia y atajos
    useEffect(() => {
        if (!isSelfEvalModalOpen) return;

        const handleKeyDown = (e: KeyboardEvent) => {
            if (
                (e.ctrlKey || e.metaKey) &&
                ['c', 'v', 'x', 'u', 's', 'a', 'p'].includes(e.key.toLowerCase())
            ) {
                e.preventDefault();
                toast.warning('Acción bloqueada en Modo Examen.');
            }
            if (
                e.key === 'F12' ||
                e.key === 'PrintScreen' ||
                ((e.ctrlKey || e.metaKey) && e.shiftKey && ['i', 'j', 'c', 's'].includes(e.key.toLowerCase()))
            ) {
                e.preventDefault();
                toast.warning('Acción bloqueada por seguridad del examen.');
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isSelfEvalModalOpen]);

    // Criterios activos del Periodo para la asignación evaluada según su Cargo
    const activeCriterios = useMemo(() => {
        const period = periods.find(p => p.id === selectedPeriod);
        if (!period || !period.criterios || period.criterios.length === 0) return [];

        const targetCargoId = selectedAsignacion?.cargoId 
            || selectedAsignacion?.cargo?.id 
            || selectedAsignacion?.evaluado?.cargoPostulacionId 
            || selectedAsignacion?.evaluado?.cargoPostulacion?.id;

        if (targetCargoId) {
            return period.criterios.filter(c => {
                const tieneCargosConfigurados = c.cargos && c.cargos.length > 0;
                if (!tieneCargosConfigurados) return true; // Criterio general
                return c.cargos!.some(cg => cg.cargoId === targetCargoId || (cg as any).cargo?.id === targetCargoId);
            });
        }

        return period.criterios;
    }, [selectedPeriod, selectedAsignacion, periods]);

    // Agrupación de misEvaluacionesPropias en tarjetas consolidadas (una por cuestionario/cargo)
    const misEvaluacionesAgrupadas = useMemo(() => {
        // Separar autoevaluación de evaluaciones de supervisores
        const autoAsig = misEvaluacionesPropias.filter(
            a => a.tipoEvaluacion === 'AUTOEVALUACION' || a.evaluadorId === a.evaluadoId
        );
        const supervisorAsigs = misEvaluacionesPropias.filter(
            a => a.tipoEvaluacion !== 'AUTOEVALUACION' && a.evaluadorId !== a.evaluadoId
        );

        // Agrupar evaluaciones de supervisores por cuestionarioId (o cargoId como fallback)
        const grupos: Map<string, {
            key: string;
            autoAsig: EvaluacionAdmins | null;
            supervisorAsigs: EvaluacionAdmins[];
        }> = new Map();

        // Registrar autoevaluaciones
        autoAsig.forEach(a => {
            const key = a.cuestionarioId || a.cargoId || a.id;
            if (!key) return;
            if (!grupos.has(key)) grupos.set(key, { key, autoAsig: null, supervisorAsigs: [] });
            grupos.get(key)!.autoAsig = a;
        });

        // Registrar evaluaciones de supervisores
        supervisorAsigs.forEach(a => {
            const key = a.cuestionarioId || a.cargoId || a.id;
            if (!key) return;
            if (!grupos.has(key)) grupos.set(key, { key, autoAsig: null, supervisorAsigs: [] });
            grupos.get(key)!.supervisorAsigs.push(a);
        });

        return Array.from(grupos.values());
    }, [misEvaluacionesPropias]);

    // Iniciar o Continuar Evaluación de una Asignación por el Supervisor
    const handleStartEvaluation = async (asignacion: EvaluacionAdmins) => {
        const period = periods.find(p => p.id === selectedPeriod);
        if (!period) {
            toast.error('Selecciona un periodo activo primero');
            return;
        }

        setSelectedAsignacion(asignacion);
        setRespuestasMap({});
        setTimeLeftSeconds(null);

        // Obtener criterios del periodo aplicables estrictamente al cargo del evaluado
        const targetCargoId = asignacion.cargoId 
            || asignacion.cargo?.id 
            || asignacion.evaluado?.cargoPostulacionId 
            || asignacion.evaluado?.cargoPostulacion?.id;

        const periodCriterios = (period.criterios || []).filter(c => {
            const tieneCargosConfigurados = c.cargos && c.cargos.length > 0;
            if (!tieneCargosConfigurados) return true;
            if (!targetCargoId) return false;
            return c.cargos!.some(cg => cg.cargoId === targetCargoId || (cg as any).cargo?.id === targetCargoId);
        });

        if (periodCriterios.length === 0) {
            toast.error('No hay criterios configurados en este periodo para el cargo de este funcionario.');
            return;
        }

        // Obtener el cuestionario si existe para consultar su nota
        let cuest = asignacion.cuestionario;
        if (!cuest && asignacion.cuestionarioId) {
            cuest = cuestionarios.find(c => c.id === asignacion.cuestionarioId);
        }
        if (!cuest && asignacion.cargoId) {
            cuest = cuestionarios.find(c => c.cargos?.some(cg => cg.cargoId === asignacion.cargoId));
        }
        setSelectedCuestionario(cuest || null);

        try {
            setSubmitting(true);
            // Iniciar o recuperar intento
            const intento = await evaluationService.iniciarIntento(asignacion.id);
            setCurrentIntento(intento);

            // Evaluación de desempeño del supervisor: No usa temporizador de minutos, se rige por el periodo
            setTimeLeftSeconds(null);

            // Si ya hay respuestas previas guardadas en el intento o en la asignación, cargarlas en el mapa
            const initialMap: Record<string, any> = {};
            const respuestasDisponibles = (intento?.respuestas && intento.respuestas.length > 0)
                ? intento.respuestas
                : (asignacion.intentos?.flatMap((i: any) => i.respuestas || []) || []);

            respuestasDisponibles.forEach((r: any) => {
                if (r?.subcriterioId) {
                    initialMap[r.subcriterioId] = {
                        escalaTexto: r.escalaTexto,
                        puntaje: r.puntaje,
                        observacion: r.observacion,
                    };
                }
            });
            setRespuestasMap(initialMap);

            setIsEvaluationModalOpen(true);
        } catch (error: any) {
            const msg = error.response?.data?.message || 'Error al iniciar la evaluación';
            toast.error(msg);
        } finally {
            setSubmitting(false);
        }
    };

    // Marcar respuesta Likert o Selección
    const handleSelectOption = (subcriterioId: string, escalaKey: EscalaLikertKey | string, puntaje: number) => {
        setRespuestasMap(prev => ({
            ...prev,
            [subcriterioId]: {
                ...prev[subcriterioId],
                escalaTexto: escalaKey,
                puntaje: puntaje,
            },
        }));
    };

    // Helper para identificar si un criterio es un cuestionario/examen que rinde el propio funcionario
    const isCriterioCuestionarioPersonal = (crit: any) => {
        if (!crit) return false;
        if (crit.cuestionarios && crit.cuestionarios.length > 0) return true;
        if (cuestionarios.some(c => c.criterioId === crit.id)) return true;
        if (!crit.subcriterios || crit.subcriterios.length === 0) return true;
        return crit.subcriterios.some((s: any) => s.tipoPregunta && s.tipoPregunta !== 'LIKERT');
    };

    // Calcular estadísticas en tiempo real y desglose ponderado por criterio
    const currentEvaluationStats = useMemo(() => {
        if (!activeCriterios || activeCriterios.length === 0) {
            return {
                totalSubcriterios: 0,
                totalRespondidos: 0,
                promedioActual: 0,
                progreso: 0,
                totalPonderado: 0,
                desglosePorCriterio: {} as Record<string, {
                    totalSub: number;
                    respondidos: number;
                    promedioBase: number;
                    peso: number;
                    aportePonderado: number;
                    isAutonomo: boolean;
                }>,
            };
        }

        let totalSub = 0;
        let sumaPuntajes = 0;
        let respondidos = 0;
        let totalPonderado = 0;
        const desglosePorCriterio: Record<string, {
            totalSub: number;
            respondidos: number;
            promedioBase: number;
            peso: number;
            aportePonderado: number;
            isAutonomo: boolean;
        }> = {};

        activeCriterios.forEach(cr => {
            const isAutonomo = isCriterioCuestionarioPersonal(cr);
            const crId = cr.id || cr.nombre;
            const peso = Number(cr.pesoPorcentaje) || 0;

            if (isAutonomo) {
                const notaAutonoma = Number(selectedAsignacion?.puntajeFinal) || 0;
                const aporte = peso > 0 ? Number(((notaAutonoma * peso) / 100).toFixed(2)) : 0;
                totalPonderado += aporte;
                desglosePorCriterio[crId] = {
                    totalSub: (cr.subcriterios || []).length,
                    respondidos: (cr.subcriterios || []).length,
                    promedioBase: notaAutonoma,
                    peso,
                    aportePonderado: aporte,
                    isAutonomo: true,
                };
                return;
            }

            let crTotalSub = 0;
            let crSuma = 0;
            let crRespondidos = 0;

            (cr.subcriterios || []).forEach(sub => {
                totalSub++;
                crTotalSub++;
                const resp = sub.id ? respuestasMap[sub.id] : undefined;
                if (resp && resp.puntaje !== undefined) {
                    sumaPuntajes += resp.puntaje;
                    crSuma += resp.puntaje;
                    respondidos++;
                    crRespondidos++;
                }
            });

            const crPromedio = crRespondidos > 0 ? Number((crSuma / crRespondidos).toFixed(2)) : 0;
            const crAporte = peso > 0 ? Number(((crPromedio * peso) / 100).toFixed(2)) : 0;
            totalPonderado += crAporte;

            desglosePorCriterio[crId] = {
                totalSub: crTotalSub,
                respondidos: crRespondidos,
                promedioBase: crPromedio,
                peso,
                aportePonderado: crAporte,
                isAutonomo: false,
            };
        });

        const promedioSimple = respondidos > 0 ? Number((sumaPuntajes / respondidos).toFixed(2)) : 0;
        const progreso = totalSub > 0 ? Math.round((respondidos / totalSub) * 100) : 100;
        const sumaPesos = activeCriterios.reduce((acc, c) => acc + (Number(c.pesoPorcentaje) || 0), 0);
        const notaFinalPonderada = sumaPesos > 0 ? Number(totalPonderado.toFixed(2)) : promedioSimple;

        return {
            totalSubcriterios: totalSub,
            totalRespondidos: respondidos,
            promedioActual: notaFinalPonderada,
            progreso,
            totalPonderado: notaFinalPonderada,
            sumaPesos,
            desglosePorCriterio,
        };
    }, [activeCriterios, respuestasMap, cuestionarios, selectedAsignacion]);

    // Guardar y Finalizar Evaluación
    const handleSubmitEvaluation = async (finalizar: boolean = true) => {
        if (!currentIntento || !selectedAsignacion) return;

        if (finalizar && currentEvaluationStats.totalRespondidos < currentEvaluationStats.totalSubcriterios) {
            toast.warning(`Debes calificar todos los indicadores antes de finalizar (${currentEvaluationStats.totalRespondidos}/${currentEvaluationStats.totalSubcriterios})`);
            return;
        }

        try {
            setSubmitting(true);
            const respuestasPayload = Object.entries(respuestasMap).map(([subId, val]) => ({
                subcriterioId: subId,
                escalaTexto: val.escalaTexto as EscalaLikertKey,
                puntaje: val.puntaje,
                observacion: val.observacion,
            }));

            const res = await evaluationService.responderIntento({
                intentoId: currentIntento.id,
                respuestas: respuestasPayload,
                finalizar,
            });

            // Actualizar reactivamente la asignación en memoria inmediata
            if (res && selectedAsignacion) {
                setMisAsignaciones(prev => prev.map(a => {
                    if (a.id === selectedAsignacion.id) {
                        return {
                            ...a,
                            estadoEvaluacion: finalizar ? 'COMPLETADO' : 'EN_PROCESO',
                            puntajeFinal: res.puntajeCalculado ?? a.puntajeFinal,
                            intentos: a.intentos ? [res.intento, ...a.intentos.filter((i: any) => i.id !== res.intento.id)] : [res.intento],
                        };
                    }
                    return a;
                }));
            }

            toast.success(finalizar ? '¡Evaluación completada y nota registrada con éxito!' : 'Progreso guardado correctamente');
            setIsEvaluationModalOpen(false);
            await loadPeriodData();
        } catch (error: any) {
            const msg = error.response?.data?.message || 'Error al registrar la evaluación';
            toast.error(msg);
        } finally {
            setSubmitting(false);
        }
    };

    // Helper para resolver el porcentaje de progreso evaluado de una asignación
    const getAsignacionProgreso = (asig: EvaluacionAdmins) => {
        const period = periods.find(p => p.id === selectedPeriod);
        const crits = period?.criterios?.filter(cr => !asig.cargoId || !cr.cargos?.length || cr.cargos.some(cg => cg.cargoId === asig.cargoId)) || [];

        let totalSub = 0;
        crits.forEach(cr => {
            if (isCriterioCuestionarioPersonal(cr)) return;
            totalSub += (cr.subcriterios || []).length;
        });

        if (asig.estadoEvaluacion === 'COMPLETADO') {
            return { porcentaje: 100, respondidos: totalSub, total: totalSub };
        }

        // Consolidar respuestas únicas de todos los intentos de esta asignación
        const todasRespuestas = asig.intentos?.flatMap((i: any) => i.respuestas || []) || [];
        const uniqueSubcriterios = new Set(todasRespuestas.map((r: any) => r.subcriterioId));
        const respondidos = uniqueSubcriterios.size;

        if (totalSub > 0) {
            const porcentaje = Math.min(100, Math.round((respondidos / totalSub) * 100));
            return { porcentaje, respondidos, total: totalSub };
        }

        return { porcentaje: asig.estadoEvaluacion === 'EN_PROCESO' ? 50 : 0, respondidos, total: totalSub };
    };

    // Helper para formatear la última fecha de evaluación o actividad
    const getUltimaFechaEvaluacion = (asig: EvaluacionAdmins) => {
        const ultimoIntento = asig.intentos?.[0] || asig.intentos?.slice(-1)[0];
        const fechaRaw = ultimoIntento?.fechaFin || ultimoIntento?.fechaInicio || (asig as any).updatedAt || (asig as any).createdAt;
        if (!fechaRaw) return null;

        const d = new Date(fechaRaw);
        if (isNaN(d.getTime())) return null;

        return d.toLocaleDateString('es-BO', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    // Algoritmo Fisher-Yates para barajado aleatorio
    const shuffleArray = <T,>(array: T[]): T[] => {
        const arr = [...array];
        for (let i = arr.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [arr[i], arr[j]] = [arr[j], arr[i]];
        }
        return arr;
    };

    // Preparar cuestionario para evaluación (mezcla aleatoria de preguntas y opciones si está configurado)
    const prepareCuestionarioForEvaluation = (cuest: EvaluacionCuestionario): EvaluacionCuestionario => {
        if (!cuest.criterio || !cuest.criterio.subcriterios || cuest.criterio.subcriterios.length === 0) {
            return cuest;
        }

        let subcs = cuest.criterio.subcriterios.map(sub => {
            // Si randomPreguntas está activo y tiene opciones, barajar también las opciones
            if (cuest.randomPreguntas && sub.opciones && sub.opciones.length > 1) {
                return {
                    ...sub,
                    opciones: shuffleArray(sub.opciones),
                };
            }
            return sub;
        });

        // Si randomPreguntas está activo, barajar las preguntas
        if (cuest.randomPreguntas) {
            subcs = shuffleArray(subcs);
        }

        // Si tiene límite máximo de preguntas a mostrar
        if (cuest.maxPreguntas && cuest.maxPreguntas > 0 && cuest.maxPreguntas < subcs.length) {
            subcs = subcs.slice(0, cuest.maxPreguntas);
        }

        return {
            ...cuest,
            criterio: {
                ...cuest.criterio,
                subcriterios: subcs,
            },
        };
    };

    // Helper para resolver el cuestionario completo con su criterio y preguntas
    const resolveCuestionarioWithCriterio = (asig: EvaluacionAdmins) => {
        let cuest = asig.cuestionario
            || cuestionarios.find(c => c.id === asig.cuestionarioId)
            || (asig.cargoId ? cuestionarios.find(c => c.cargos?.some(cg => cg.cargoId === asig.cargoId)) : undefined);

        if (!cuest) return null;

        // Si el cuestionario no tiene subcriterios cargados pero tiene criterioId, buscar en periodos
        if (!cuest.criterio?.subcriterios?.length) {
            const allCriterios = periods.flatMap(p => p.criterios || []);
            const critFound = allCriterios.find(cr => cr.id === cuest?.criterioId)
                || (asig.cargoId ? allCriterios.find(cr => cr.cargos?.some(cg => cg.cargoId === asig.cargoId)) : undefined);

            if (critFound) {
                cuest = {
                    ...cuest,
                    criterio: critFound,
                };
            }
        }
        return cuest;
    };

    // Solicitar confirmación previa antes de iniciar el examen
    const handlePromptStartSelfEval = (asig: EvaluacionAdmins) => {
        const rawCuest = resolveCuestionarioWithCriterio(asig);
        if (!rawCuest || !rawCuest.criterio?.subcriterios?.length) {
            toast.error('Este cuestionario no tiene preguntas configuradas aún.');
            return;
        }

        if (rawCuest.estado === 'inactivo') {
            toast.warning('Esta evaluación se encuentra deshabilitada temporalmente por la administración.');
            return;
        }

        // Preparar cuestionario con barajado aleatorio de preguntas y opciones si corresponde
        const cuest = prepareCuestionarioForEvaluation(rawCuest);
        setPendingAsignacion(asig);
        setSelectedCuestionario(cuest);
        setIsStartConfirmModalOpen(true);
    };

    // Confirmar e iniciar examen en pantalla completa
    const handleConfirmStartSelfEval = async () => {
        if (!pendingAsignacion || !selectedCuestionario) return;
        setIsStartConfirmModalOpen(false);
        await handleStartSelfEval(pendingAsignacion, selectedCuestionario);

        // Activar pantalla completa si está disponible
        try {
            if (document.documentElement.requestFullscreen) {
                document.documentElement.requestFullscreen().catch(() => { });
                setIsFullscreen(true);
            }
        } catch (err) {
            // Ignorar si el navegador bloquea fullscreen programático
        }
    };

    // Alternar modo pantalla completa
    const handleToggleFullscreen = () => {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen?.().then(() => setIsFullscreen(true)).catch(() => { });
        } else {
            document.exitFullscreen?.().then(() => setIsFullscreen(false)).catch(() => { });
        }
    };

    // Cerrar modal de examen
    const handleCloseSelfEvalModal = () => {
        if (document.fullscreenElement) {
            document.exitFullscreen?.().catch(() => { });
        }
        setIsFullscreen(false);
        setIsSelfEvalModalOpen(false);
    };

    // Abrir cuestionario personal (el usuario autenticado lo completa él mismo)
    const handleStartSelfEval = async (asig: EvaluacionAdmins, preparedCuest?: EvaluacionCuestionario) => {
        setSelfAsignacion(asig);
        setRespuestasMap({});
        setTimeLeftSeconds(null);

        const cuest = preparedCuest || (selectedCuestionario ? selectedCuestionario : prepareCuestionarioForEvaluation(resolveCuestionarioWithCriterio(asig) as EvaluacionCuestionario));
        setSelectedCuestionario(cuest);

        const subcs = cuest?.criterio?.subcriterios || [];
        if (!cuest || subcs.length === 0) {
            toast.error('Este cuestionario no tiene preguntas configuradas aún.');
            return;
        }

        try {
            setSubmitting(true);
            setCheatWarnings(0);
            const intento = await evaluationService.iniciarIntento(asig.id);
            setCurrentIntento(intento);

            const isActivo = intento.estado === 'EN_CURSO';

            // Sincronización estricta basada en el servidor para intentos activos
            if (isActivo && cuest.tiempoLimiteMinutos && cuest.tiempoLimiteMinutos > 0) {
                const total = cuest.tiempoLimiteMinutos * 60;
                const inicioTimestamp = new Date(intento.fechaInicio).getTime();
                const transcurrido = Math.max(0, Math.floor((Date.now() - inicioTimestamp) / 1000));
                const restante = Math.max(0, total - transcurrido);

                if (restante <= 0) {
                    toast.warning('El tiempo límite para este examen ha concluido en el servidor.');
                    setTimeLeftSeconds(0);
                } else {
                    setTimeLeftSeconds(restante);
                }
            } else {
                setTimeLeftSeconds(null);
            }

            if (intento.respuestas && intento.respuestas.length > 0) {
                const map: Record<string, any> = {};
                intento.respuestas.forEach(r => {
                    map[r.subcriterioId] = { escalaTexto: r.escalaTexto, puntaje: r.puntaje, observacion: r.observacion };
                });
                setRespuestasMap(map);
            }

            setIsSelfEvalModalOpen(true);
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Error al iniciar el cuestionario');
        } finally {
            setSubmitting(false);
        }
    };

    const handleSubmitSelfEval = async (finalizar: boolean = true) => {
        if (!currentIntento || !selfAsignacion) return;
        const subcs = selectedCuestionario?.criterio?.subcriterios || [];
        if (finalizar && Object.keys(respuestasMap).length < subcs.length) {
            toast.warning(`Debes responder todas las preguntas (${Object.keys(respuestasMap).length}/${subcs.length})`);
            return;
        }
        try {
            setSubmitting(true);
            const payload = Object.entries(respuestasMap).map(([subId, val]) => ({
                subcriterioId: subId,
                escalaTexto: val.escalaTexto as EscalaLikertKey,
                puntaje: val.puntaje,
                observacion: val.observacion,
            }));
            await evaluationService.responderIntento({ intentoId: currentIntento.id, respuestas: payload, finalizar });
            toast.success(finalizar ? '¡Cuestionario completado! Nota registrada automáticamente.' : 'Progreso guardado');
            setIsSelfEvalModalOpen(false);
            loadPeriodData();
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Error al guardar el cuestionario');
        } finally {
            setSubmitting(false);
        }
    };

    // Abrir Consolidado Multi-Evaluador
    const handleOpenConsolidado = async (evaluadoId: string) => {
        if (!selectedPeriod) return;
        try {
            setLoadingConsolidado(true);
            setIsConsolidadoModalOpen(true);
            const data = await evaluationService.getConsolidado(evaluadoId, selectedPeriod);
            setConsolidadoData(data);
        } catch (error) {
            toast.error('Error al cargar consolidado del funcionario');
            setIsConsolidadoModalOpen(false);
        } finally {
            setLoadingConsolidado(false);
        }
    };

    // Descargar PDF Oficial
    const handleDownloadPdf = async (asignacionId: string, funcionarioNombre: string) => {
        try {
            toast.info('Generando documento oficial en PDF...');
            const blob = await evaluationService.getEvaluationPdf(asignacionId);
            const url = window.URL.createObjectURL(new Blob([blob], { type: 'application/pdf' }));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `Evaluacion_${funcionarioNombre.replace(/\s+/g, '_')}.pdf`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            toast.success('Documento descargado');
        } catch (error) {
            toast.error('Error al generar PDF de la evaluación');
        }
    };

    // Filtrar lista de personas que debo evaluar (excluyendo mi propia autoevaluación)
    const filteredMisAsignaciones = misAsignaciones.filter(a => {
        if (a.tipoEvaluacion === 'AUTOEVALUACION' || a.evaluadorId === a.evaluadoId || (user?.id && a.evaluadoId === user.id)) {
            return false;
        }
        const nombre = `${a.evaluado?.nombre || ''} ${a.evaluado?.apellidos || ''}`.toLowerCase();
        const cargo = `${a.cargo?.nombre || ''}`.toLowerCase();
        const query = searchTerm.toLowerCase();
        return nombre.includes(query) || cargo.includes(query);
    });

    const filteredAllUsers = allUsersToEvaluate.filter(u => {
        const nombre = `${u.nombre || ''} ${u.apellidos || ''}`.toLowerCase();
        const cargo = `${u.cargoPostulacion?.nombre || u.cargoStr || ''}`.toLowerCase();
        const query = searchTerm.toLowerCase();
        return nombre.includes(query) || cargo.includes(query);
    });

    // Formatear segundos a MM:SS
    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    if (!isSuperAdmin && !can('read', 'EvaluacionPuntaje')) {
        return (
            <div className="p-12 text-center space-y-4 max-w-md mx-auto my-12 bg-card rounded-3xl border border-border/50 shadow-sm">
                <div className="w-16 h-16 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center mx-auto">
                    <ShieldAlert className="w-8 h-8" />
                </div>
                <h2 className="text-xl font-black uppercase text-foreground">Acceso Restringido</h2>
                <p className="text-xs text-muted-foreground leading-relaxed">
                    No cuentas con el permiso requerido (<strong>EvaluacionPuntaje</strong>) para acceder a Evaluar Personal. Si eres evaluador, solicita al Administrador que te asigne el permiso correspondiente.
                </p>
                <Link
                    href="/dashboard/evaluaciones"
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-primary text-primary-foreground text-xs font-black uppercase tracking-wider hover:opacity-90 transition-all"
                >
                    Volver al Módulo
                </Link>
            </div>
        );
    }

    return (
        <div className="p-6 md:p-10 space-y-8 max-w-[1600px] mx-auto min-h-screen">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="space-y-2">
                    <div className="flex items-center gap-3">
                        <div className="p-3 rounded-2xl bg-primary/10 text-primary shadow-inner">
                            <ClipboardSignature className="w-6 h-6" />
                        </div>
                        <h1 className="text-3xl font-black tracking-tight text-foreground uppercase">
                            Evaluación de Personal
                        </h1>
                    </div>
                    <p className="text-muted-foreground text-sm font-medium">
                        Panel de calificación con escala Likert (100, 80, 60, 40, 20), temporizador y promediación de notas.
                    </p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                    {/* Selector de Periodo */}
                    <div className="flex items-center gap-2 bg-card px-4 py-2.5 rounded-2xl border border-border/40 shadow-sm">
                        <CalendarCheck className="w-4 h-4 text-primary flex-shrink-0" />
                        <select
                            value={selectedPeriod}
                            onChange={(e) => handlePeriodChange(e.target.value)}
                            className="bg-transparent border-none text-xs font-bold focus:ring-0 cursor-pointer text-foreground"
                        >
                            {periods.length === 0 && (
                                <option value="" disabled>Sin períodos activos disponibles</option>
                            )}
                            {periods.map(p => (
                                <option key={p.id} value={p.id}>
                                    {p.gestion} - {p.semestre}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Fecha de Conclusión del Periodo Activo */}
                    {(() => {
                        const currentP = periods.find(p => p.id === selectedPeriod);
                        if (!currentP) return null;
                        const fechaFinStr = currentP.fechaFin
                            ? new Date(currentP.fechaFin).toLocaleDateString('es-BO', { day: '2-digit', month: 'long', year: 'numeric' })
                            : null;

                        return (
                            <div className="flex items-center gap-1.5 bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-400 px-3.5 py-2.5 rounded-2xl text-xs font-black shadow-sm">
                                <Calendar className="w-3.5 h-3.5 text-amber-600 flex-shrink-0" />
                                <span>
                                    Concluye: <strong>{fechaFinStr || 'Sin fecha límite'}</strong>
                                </span>
                            </div>
                        );
                    })()}

                    {isSuperAdmin && departments.length > 0 && (
                        <div className="flex items-center gap-2 bg-card px-4 py-2.5 rounded-2xl border border-border/40 shadow-sm">
                            <Building2 className="w-4 h-4 text-primary" />
                            <select
                                value={selectedDept}
                                onChange={(e) => handleDeptChange(e.target.value)}
                                className="bg-transparent border-none text-xs font-semibold focus:ring-0 cursor-pointer text-foreground"
                            >
                                <option value="">Todos los Departamentos</option>
                                {departments.map(d => (
                                    <option key={d.id} value={d.id}>{d.nombre}</option>
                                ))}
                            </select>
                        </div>
                    )}
                </div>
            </div>

            {/* Selector de Pestañas */}
            {periods.length === 0 && !loading ? (
                <div className="flex flex-col items-center justify-center gap-4 py-24 border-2 border-dashed border-border/40 rounded-3xl text-center">
                    <div className="w-14 h-14 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
                        <Lock className="w-7 h-7" />
                    </div>
                    <div className="space-y-1">
                        <p className="font-black text-foreground uppercase tracking-wide text-sm">Sin períodos activos</p>
                        <p className="text-xs text-muted-foreground max-w-xs leading-relaxed">
                            No existe ningún período de evaluación activo en este momento o todos han concluido su fecha límite. Comuníquese con el Administrador para activar un nuevo período.
                        </p>
                    </div>
                </div>
            ) : (
            <div className="flex items-center gap-3 border-b border-border/40 pb-4">
                <button
                    onClick={() => setActiveTab('mis-asignaciones')}
                    className={cn(
                        "flex items-center gap-2 px-5 py-2.5 rounded-2xl text-xs font-black uppercase tracking-wider transition-all",
                        activeTab === 'mis-asignaciones'
                            ? "bg-primary text-primary-foreground shadow-md shadow-primary/20"
                            : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                    )}
                >
                    <UserCheck className="w-4 h-4" />
                    Personal que debo Evaluar ({filteredMisAsignaciones.length})
                </button>

                <button
                    onClick={() => setActiveTab('todo-el-personal')}
                    className={cn(
                        "flex items-center gap-2 px-5 py-2.5 rounded-2xl text-xs font-black uppercase tracking-wider transition-all",
                        activeTab === 'todo-el-personal'
                            ? "bg-primary text-primary-foreground shadow-md shadow-primary/20"
                            : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                    )}
                >
                    <Users className="w-4 h-4" />
                    Consolidado General ({allUsersToEvaluate.length})
                </button>
            </div>
            )}

            {/* Buscador */}
            <div className="relative w-full sm:w-96">
                <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                    type="text"
                    placeholder="Buscar por nombre o cargo..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-11 pr-4 py-2.5 rounded-2xl border border-border/40 bg-card text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 shadow-sm"
                />
            </div>

            {/* TAB 1: PERSONAL QUE DEBO EVALUAR */}
            {activeTab === 'mis-asignaciones' && (
                <div className="bg-card rounded-3xl border border-border/40 shadow-sm overflow-hidden">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-20 gap-3">
                            <Loader2 className="w-8 h-8 text-primary animate-spin" />
                            <p className="text-xs font-semibold text-muted-foreground">Cargando personal asignado...</p>
                        </div>
                    ) : filteredMisAsignaciones.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20 text-center space-y-3">
                            <UserCheck className="w-12 h-12 text-muted-foreground/30" />
                            <p className="text-base font-bold text-foreground">No tienes evaluaciones pendientes en este periodo</p>
                            <p className="text-xs text-muted-foreground max-w-sm">
                                Cuando te asignen personal para calificar, aparecerán listados aquí.
                            </p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-xs">
                                <thead className="bg-secondary/40 border-b border-border/30 text-muted-foreground uppercase text-[10px] font-black tracking-wider">
                                    <tr>
                                        <th className="py-4 px-6">Funcionario a Evaluar</th>
                                        <th className="py-4 px-6">Cargo</th>
                                        <th className="py-4 px-6">Cuestionario Asignado</th>
                                        <th className="py-4 px-6">Estado / Avance / Última Fecha</th>
                                        <th className="py-4 px-6 text-right">Acción</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border/20">
                                    {filteredMisAsignaciones.map((asig) => {
                                        const ultimaFecha = getUltimaFechaEvaluacion(asig);
                                        return (
                                            <tr key={asig.id} className="hover:bg-secondary/20 transition-colors">
                                                <td className="py-4 px-6">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-9 h-9 rounded-2xl bg-primary/10 text-primary font-black flex items-center justify-center text-xs">
                                                            {asig.evaluado?.nombre?.charAt(0)}{asig.evaluado?.apellidos?.charAt(0)}
                                                        </div>
                                                        <div>
                                                            <p className="font-bold text-foreground">{asig.evaluado?.nombre} {asig.evaluado?.apellidos}</p>
                                                            <span className="text-[10px] text-muted-foreground">{asig.evaluado?.correo}</span>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="py-4 px-6 font-semibold text-foreground">
                                                    {asig.cargo?.nombre || asig.evaluado?.cargoPostulacion?.nombre || 'General / Sin Cargo'}
                                                </td>
                                                <td className="py-4 px-6 text-muted-foreground">
                                                    {asig.cuestionario?.titulo || 'Cuestionario Estándar'}
                                                </td>
                                                <td className="py-4 px-6">
                                                    {asig.estadoEvaluacion === 'COMPLETADO' ? (
                                                        <div className="space-y-1">
                                                            <span className="text-emerald-600 font-bold flex items-center gap-1.5 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 rounded-full w-fit">
                                                                <CheckCircle2 className="w-3.5 h-3.5" />
                                                                COMPLETADO
                                                            </span>
                                                            <div className="flex items-center gap-2 pl-1">
                                                                <span className="text-[10px] text-emerald-600 font-bold">
                                                                    100% Evaluado
                                                                </span>
                                                            </div>
                                                            {ultimaFecha && (
                                                                <span className="text-[10px] text-muted-foreground flex items-center gap-1 pl-1 pt-0.5 font-medium">
                                                                    <Calendar className="w-3 h-3 text-primary/70 flex-shrink-0" />
                                                                    {ultimaFecha}
                                                                </span>
                                                            )}
                                                        </div>
                                                    ) : (() => {
                                                        const prog = getAsignacionProgreso(asig);
                                                        return (
                                                            <div className="space-y-1.5 min-w-[140px]">
                                                                <div className="flex items-center gap-2">
                                                                    <span className={cn(
                                                                        "px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider",
                                                                        asig.estadoEvaluacion === 'EN_PROCESO'
                                                                            ? "bg-amber-500/10 text-amber-600 border border-amber-500/20"
                                                                            : "bg-secondary text-muted-foreground"
                                                                    )}>
                                                                        {asig.estadoEvaluacion}
                                                                    </span>
                                                                    <span className="text-[10px] font-black text-amber-600">
                                                                        {prog.porcentaje}%
                                                                    </span>
                                                                </div>
                                                                <div className="w-full bg-secondary/80 h-1.5 rounded-full overflow-hidden">
                                                                    <div
                                                                        className="bg-amber-500 h-full rounded-full transition-all duration-300"
                                                                        style={{ width: `${prog.porcentaje}%` }}
                                                                    />
                                                                </div>
                                                                {prog.total > 0 && (
                                                                    <span className="text-[9px] text-muted-foreground block">
                                                                        {prog.respondidos} de {prog.total} respondidos
                                                                    </span>
                                                                )}
                                                                {ultimaFecha && (
                                                                    <span className="text-[10px] text-muted-foreground flex items-center gap-1 pt-0.5 font-medium">
                                                                        <Clock className="w-3 h-3 text-amber-500/70 flex-shrink-0" />
                                                                        {ultimaFecha}
                                                                    </span>
                                                                )}
                                                            </div>
                                                        );
                                                    })()}
                                                </td>
                                                <td className="py-4 px-6 text-right">
                                                    <div className="flex items-center justify-end gap-2">
                                                        <button
                                                            onClick={() => handleStartEvaluation(asig)}
                                                            className={cn(
                                                                "px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-1.5 transition-all shadow-sm",
                                                                asig.estadoEvaluacion === 'COMPLETADO'
                                                                    ? "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                                                                    : "bg-primary text-primary-foreground hover:opacity-90 shadow-primary/20"
                                                            )}
                                                        >
                                                            <Sparkles className="w-3.5 h-3.5" />
                                                            {asig.estadoEvaluacion === 'COMPLETADO' ? 'Revisar / Reevaluar' : 'Calificar'}
                                                        </button>

                                                        {asig.estadoEvaluacion === 'COMPLETADO' && (
                                                            <button
                                                                onClick={() => handleDownloadPdf(asig.id, `${asig.evaluado?.nombre}_${asig.evaluado?.apellidos}`)}
                                                                className="p-2 rounded-xl bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-colors"
                                                                title="Descargar PDF Oficial"
                                                            >
                                                                <Download className="w-4 h-4" />
                                                            </button>
                                                        )}

                                                        <button
                                                            onClick={() => handleOpenConsolidado(asig.evaluadoId)}
                                                            className="p-2 rounded-xl bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-colors"
                                                            title="Ver Consolidado Multi-Evaluador"
                                                        >
                                                            <Eye className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}

            {/* Sección: MIS CUESTIONARIOS DE EVALUACIÓN PERSONAL */}
            {activeTab === 'mis-asignaciones' && misEvaluacionesPropias.length > 0 && (
                <div className="space-y-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-xl bg-violet-500/10 text-violet-500">
                            <FileText className="w-5 h-5" />
                        </div>
                        <div>
                            <h2 className="text-base font-black uppercase text-foreground">
                                Mis Cuestionarios de Evaluación Personal
                            </h2>
                            <p className="text-xs text-muted-foreground">Cuestionarios que debes completar personalmente. Tu nota se calcula de forma automática.</p>
                        </div>
                        <span className="ml-auto px-3 py-1 rounded-full bg-violet-500/10 text-violet-600 text-xs font-black">
                            {misEvaluacionesPropias.length} pendiente(s)
                        </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                        {misEvaluacionesAgrupadas.map((grupo) => {
                            const asig = grupo.autoAsig || grupo.supervisorAsigs[0];
                            if (!asig) return null;
                            const cuest = resolveCuestionarioWithCriterio(asig);
                            const subcriterios = cuest?.criterio?.subcriterios || [];

                            // ── Datos del Examen Personal (autoevaluación) ──
                            const autoAsig = grupo.autoAsig;
                            const intentosExamen = autoAsig?.intentos || [];
                            const ultimoIntentoExamen = intentosExamen[0]; // ordenados desc
                            const isExamenCompleted = autoAsig?.estadoEvaluacion === 'COMPLETADO';
                            const notaExamen = autoAsig?.puntajeFinal ?? ultimoIntentoExamen?.puntajeObtenido ?? null;

                            // ── Datos de Evaluadores (supervisores) ──
                            const supervisores = grupo.supervisorAsigs;
                            const totalSupervisores = supervisores.length;
                            const supervisoresCompletados = supervisores.filter(s => s.estadoEvaluacion === 'COMPLETADO');
                            const totalCompletados = supervisoresCompletados.length;
                            const notasSupervisores = supervisoresCompletados
                                .map(s => s.puntajeFinal)
                                .filter((n): n is number => n !== null && n !== undefined);
                            const promedioSupervisores = notasSupervisores.length > 0
                                ? Math.round((notasSupervisores.reduce((a, b) => a + b, 0) / notasSupervisores.length) * 100) / 100
                                : null;

                            // ── Cálculo de Nota Ponderada Consolidada ──
                            const period = periods.find(p => p.id === selectedPeriod);
                            const crits = (period?.criterios || []).filter(cr =>
                                !asig.cargoId || !cr.cargos?.length || cr.cargos.some(cg => cg.cargoId === asig.cargoId)
                            );

                            let notaFinalPonderada = 0;
                            let totalPesosCalculados = 0;
                            let todosLosCriteriosListos = crits.length > 0;

                            crits.forEach(cr => {
                                const isExamen = isCriterioCuestionarioPersonal(cr);
                                const peso = cr.pesoPorcentaje || 0;
                                if (isExamen) {
                                    if (notaExamen !== null) {
                                        notaFinalPonderada += (notaExamen * peso) / 100;
                                        totalPesosCalculados += peso;
                                    } else {
                                        todosLosCriteriosListos = false;
                                    }
                                } else {
                                    if (promedioSupervisores !== null) {
                                        notaFinalPonderada += (promedioSupervisores * peso) / 100;
                                        totalPesosCalculados += peso;
                                    } else {
                                        todosLosCriteriosListos = false;
                                    }
                                }
                            });

                            const notaFinalRedondeada = Math.round(notaFinalPonderada * 100) / 100;

                            return (
                                <motion.div
                                    key={asig.id}
                                    layout
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className={cn(
                                        "bg-card rounded-3xl border p-6 shadow-sm flex flex-col justify-between gap-4 transition-all",
                                        todosLosCriteriosListos ? "border-emerald-500/30" : "border-violet-500/30 hover:border-violet-500/50"
                                    )}
                                >
                                    <div className="space-y-3">
                                        <div className="flex items-start justify-between gap-2">
                                            <div>
                                                <h3 className="font-black text-sm uppercase text-foreground leading-tight break-words">
                                                    {cuest?.titulo || 'Cuestionario de Evaluación'}
                                                </h3>
                                                <span className="text-[11px] text-violet-500 font-semibold block mt-0.5">
                                                    {asig.cargo?.nombre || 'Cargo General'}
                                                </span>
                                            </div>
                                            {todosLosCriteriosListos ? (
                                                <div className="text-right">
                                                    <span className="text-[9px] font-black uppercase text-muted-foreground block leading-tight mb-0.5">Nota Final Total</span>
                                                    <span className="px-3 py-1 rounded-full text-xs font-black bg-emerald-500/10 text-emerald-600 flex items-center gap-1 shadow-sm">
                                                        <Award className="w-3.5 h-3.5" />
                                                        {notaFinalRedondeada}%
                                                    </span>
                                                </div>
                                            ) : totalPesosCalculados > 0 ? (
                                                <div className="text-right">
                                                    <span className="text-[9px] font-black uppercase text-muted-foreground block leading-tight mb-0.5">Avance Ponderado</span>
                                                    <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-amber-500/10 text-amber-600 flex items-center gap-1">
                                                        <Sparkles className="w-3 h-3" />
                                                        {notaFinalRedondeada}%
                                                    </span>
                                                </div>
                                            ) : (
                                                <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-violet-500/10 text-violet-600">
                                                    PENDIENTE
                                                </span>
                                            )}
                                        </div>

                                        {cuest?.descripcion && (
                                            <p className="text-xs text-muted-foreground leading-relaxed">{cuest.descripcion}</p>
                                        )}

                                        {/* Estado de Evaluaciones de Supervisión */}
                                        {totalSupervisores > 0 && (
                                            <div className="p-2.5 rounded-2xl bg-secondary/40 border border-border/30 flex items-center justify-between text-xs">
                                                <div className="flex items-center gap-2">
                                                    <Users className="w-4 h-4 text-primary flex-shrink-0" />
                                                    <span className="font-bold text-[11px] text-foreground">
                                                        Supervisión institucional
                                                    </span>
                                                </div>
                                                <span className={cn(
                                                    "px-2 py-0.5 rounded-md text-[10px] font-black",
                                                    totalCompletados === totalSupervisores && totalSupervisores > 0
                                                        ? "bg-emerald-500/10 text-emerald-600"
                                                        : "bg-amber-500/10 text-amber-600"
                                                )}>
                                                    {totalCompletados} de {totalSupervisores} evaluaciones completadas
                                                </span>
                                            </div>
                                        )}

                                        {/* Desglose Ponderado de Criterios (Anónimo y en Porcentajes) */}
                                        {crits.length > 0 && (
                                            <div className="space-y-2">
                                                <div className="flex items-center justify-between">
                                                    <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">
                                                        Composición de la Calificación
                                                    </span>
                                                    <span className="text-[9px] font-bold text-muted-foreground">
                                                        Aporte / Peso
                                                    </span>
                                                </div>
                                                {crits.map((cr, ci) => {
                                                    const isExamen = isCriterioCuestionarioPersonal(cr);
                                                    const peso = cr.pesoPorcentaje || 0;
                                                    const isEvaluated = isExamen ? isExamenCompleted : (totalCompletados > 0 && promedioSupervisores !== null);
                                                    const notaBase = isExamen ? (notaExamen ?? 0) : (promedioSupervisores ?? 0);
                                                    const aporte = isEvaluated ? Math.round(((notaBase * peso) / 100) * 100) / 100 : 0;

                                                    return (
                                                        <div key={cr.id || ci} className={cn(
                                                            "p-3 rounded-2xl flex items-center justify-between gap-3 transition-all",
                                                            isEvaluated
                                                                ? "bg-secondary/40 border border-border/30"
                                                                : "bg-secondary/20 border border-dashed border-border/40"
                                                        )}>
                                                            <div className="flex items-start gap-2.5 min-w-0 flex-1">
                                                                <div className={cn(
                                                                    "w-7 h-7 rounded-xl flex items-center justify-center flex-shrink-0 text-xs font-black mt-0.5",
                                                                    isEvaluated
                                                                        ? (isExamen ? "bg-violet-500/10 text-violet-600" : "bg-emerald-500/10 text-emerald-600")
                                                                        : "bg-secondary text-muted-foreground"
                                                                )}>
                                                                    {isExamen ? <FileText className="w-3.5 h-3.5" /> : <Award className="w-3.5 h-3.5" />}
                                                                </div>
                                                                <div className="min-w-0 flex-1">
                                                                    <span className="text-xs font-bold text-foreground block leading-snug break-words">
                                                                        {cr.nombre}
                                                                    </span>
                                                                    <div className="text-[10px] font-semibold flex items-center gap-1.5 mt-1">
                                                                        {isEvaluated ? (
                                                                            <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                                                                                <CheckCircle2 className="w-3 h-3" />
                                                                                Rendimiento: {notaBase}%
                                                                            </span>
                                                                        ) : (
                                                                            <span className="text-amber-600 dark:text-amber-400 flex items-center gap-1">
                                                                                <Clock className="w-3 h-3" />
                                                                                {isExamen ? 'Pendiente de rendir' : 'Pendiente de evaluación'}
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            </div>

                                                            <div className="text-right flex-shrink-0 self-center">
                                                                <span className={cn(
                                                                    "px-2.5 py-1 rounded-xl text-xs font-black inline-block",
                                                                    isEvaluated
                                                                        ? "bg-emerald-500/10 text-emerald-600 border border-emerald-500/20"
                                                                        : "bg-secondary text-muted-foreground border border-border/30"
                                                                )}>
                                                                    {isEvaluated ? `+${aporte}%` : '0%'} <span className="text-[9px] font-bold text-muted-foreground opacity-80">/ {peso}%</span>
                                                                </span>
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        )}

                                        {/* Criterio y Resumen de Examen Confidencial */}
                                        {cuest?.criterio && (
                                            <div className="p-3.5 rounded-2xl bg-secondary/30 border border-border/30 space-y-2">
                                                <div className="flex items-center justify-between">
                                                    <span className="text-[10px] font-black uppercase text-muted-foreground">
                                                        {cuest.criterio.nombre}
                                                    </span>
                                                    <span className="px-2 py-0.5 rounded-md text-[9px] font-black uppercase bg-violet-500/10 text-violet-600">
                                                        Modo Examen
                                                    </span>
                                                </div>
                                                <div className="flex items-center justify-between gap-2">
                                                    <div className="flex items-center gap-2 text-xs font-bold text-foreground">
                                                        <Sparkles className="w-4 h-4 text-violet-500 flex-shrink-0" />
                                                        <span>
                                                            {cuest.maxPreguntas && cuest.maxPreguntas < subcriterios.length
                                                                ? `${cuest.maxPreguntas} de ${subcriterios.length} preguntas`
                                                                : `${subcriterios.length} pregunta(s)`}
                                                        </span>
                                                    </div>
                                                    {cuest.randomPreguntas && (
                                                        <span className="px-2 py-0.5 rounded-md text-[9px] font-black uppercase bg-amber-500/10 text-amber-600 flex items-center gap-1">
                                                            <Shuffle className="w-2.5 h-2.5" /> Aleatorio
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="text-[10px] text-muted-foreground italic">
                                                    Las preguntas se despliegan al iniciar el intento bajo entorno seguro anti-copia.
                                                </p>
                                            </div>
                                        )}

                                        <div className="grid grid-cols-2 gap-2 text-[10px] text-muted-foreground">
                                            <div className="flex items-center gap-1.5 bg-secondary/30 p-2 rounded-xl">
                                                <Clock className="w-3.5 h-3.5 text-primary flex-shrink-0" />
                                                <span>{cuest?.tiempoLimiteMinutos ? `${cuest.tiempoLimiteMinutos} min` : 'Sin límite'}</span>
                                            </div>
                                            <div className="flex items-center gap-1.5 bg-secondary/30 p-2 rounded-xl">
                                                <Timer className="w-3.5 h-3.5 text-primary flex-shrink-0" />
                                                <span>
                                                    {intentosExamen.length === 0
                                                        ? `0 / ${cuest?.maxIntentos || 1} intentos`
                                                        : `${intentosExamen.length} / ${cuest?.maxIntentos || 1} intento(s)`
                                                    }
                                                </span>
                                            </div>
                                        </div>

                                        {/* Estado del Cuestionario */}
                                        {cuest?.estado === 'inactivo' && (
                                            <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center gap-2 text-[11px] text-rose-600 dark:text-rose-400 font-bold">
                                                <ShieldAlert className="w-3.5 h-3.5 flex-shrink-0" />
                                                <span>Evaluación deshabilitada temporalmente por el Administrador</span>
                                            </div>
                                        )}

                                        {/* Fecha Límite de Disponibilidad */}
                                        {asig.periodo?.fechaFin && cuest?.estado !== 'inactivo' && (
                                            <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center gap-2 text-[11px] text-amber-700 dark:text-amber-400 font-bold">
                                                <Calendar className="w-3.5 h-3.5 text-amber-600 flex-shrink-0" />
                                                <span>Disponible hasta: {new Date(asig.periodo.fechaFin).toLocaleDateString('es-BO', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                                            </div>
                                        )}
                                    </div>

                                    <button
                                        type="button"
                                        onClick={() => handlePromptStartSelfEval(autoAsig || asig)}
                                        disabled={submitting || cuest?.estado === 'inactivo'}
                                        className={cn(
                                            "w-full py-2.5 rounded-2xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-sm",
                                            cuest?.estado === 'inactivo'
                                                ? "bg-secondary text-muted-foreground cursor-not-allowed opacity-60 border border-border/40"
                                                : isExamenCompleted
                                                    ? "bg-secondary text-secondary-foreground hover:bg-secondary/80 cursor-pointer"
                                                    : "bg-primary text-primary-foreground hover:opacity-90 shadow-primary/20 cursor-pointer"
                                        )}
                                    >
                                        {submitting ? (
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                        ) : cuest?.estado === 'inactivo' ? (
                                            <Lock className="w-4 h-4" />
                                        ) : (
                                            <Sparkles className="w-4 h-4" />
                                        )}
                                        {cuest?.estado === 'inactivo'
                                            ? 'Evaluación Deshabilitada'
                                            : isExamenCompleted
                                                ? 'Revisar / Volver a Rendir'
                                                : 'Iniciar Cuestionario'}
                                    </button>
                                </motion.div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* TAB 2: CONSOLIDADO GENERAL (TODO EL PERSONAL) */}
            {activeTab === 'todo-el-personal' && (
                <div className="bg-card rounded-3xl border border-border/40 shadow-sm overflow-hidden">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-20 gap-3">
                            <Loader2 className="w-8 h-8 text-primary animate-spin" />
                            <p className="text-xs font-semibold text-muted-foreground">Cargando personal institucional...</p>
                        </div>
                    ) : filteredAllUsers.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20 text-center space-y-3">
                            <Users className="w-12 h-12 text-muted-foreground/30" />
                            <p className="text-base font-bold text-foreground">No se encontró personal en este periodo</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-xs">
                                <thead className="bg-secondary/40 border-b border-border/30 text-muted-foreground uppercase text-[10px] font-black tracking-wider">
                                    <tr>
                                        <th className="py-4 px-6">Funcionario</th>
                                        <th className="py-4 px-6">Cargo Institucional</th>
                                        <th className="py-4 px-6">Departamento / Sede</th>
                                        <th className="py-4 px-6">Promedio Consolidado</th>
                                        <th className="py-4 px-6 text-right">Acciones</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border/20">
                                    {filteredAllUsers.map((usr) => (
                                        <tr key={usr.id} className="hover:bg-secondary/20 transition-colors">
                                            <td className="py-4 px-6">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-9 h-9 rounded-2xl bg-secondary text-secondary-foreground font-black flex items-center justify-center text-xs">
                                                        {usr.nombre?.charAt(0)}{usr.apellidos?.charAt(0)}
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-foreground">{usr.nombre} {usr.apellidos}</p>
                                                        <span className="text-[10px] text-muted-foreground">CI: {usr.ci || 'S/N'}</span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="py-4 px-6 font-semibold text-foreground">
                                                {usr.cargoPostulacion?.nombre || usr.cargoStr || 'Sin Cargo'}
                                            </td>
                                            <td className="py-4 px-6 text-muted-foreground">
                                                {usr.tenant?.nombre || 'Central'}
                                            </td>
                                            <td className="py-4 px-6">
                                                {usr.evaluacionesRecibidas && usr.evaluacionesRecibidas.length > 0 ? (
                                                    <span className="text-emerald-600 font-bold flex items-center gap-1.5 bg-emerald-500/10 px-3 py-1 rounded-full w-fit">
                                                        <Award className="w-3.5 h-3.5" />
                                                        {usr.evaluacionesRecibidas[0].puntajeFinal ?? 'En proceso'} pts
                                                    </span>
                                                ) : (
                                                    <span className="text-muted-foreground text-[11px] italic">Sin evaluaciones</span>
                                                )}
                                            </td>
                                            <td className="py-4 px-6 text-right">
                                                <button
                                                    onClick={() => handleOpenConsolidado(usr.id)}
                                                    className="px-4 py-2 rounded-xl bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-colors text-xs font-bold flex items-center gap-1.5 ml-auto"
                                                >
                                                    <Eye className="w-3.5 h-3.5" /> Ver Detalle Consolidado
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}

            {/* MODAL DE CALIFICACIÓN INTERACTIVA CON TEMPORIZADOR Y ESCALA LIKERT */}
            <Modal
                isOpen={isEvaluationModalOpen}
                onClose={() => setIsEvaluationModalOpen(false)}
                title="Evaluación de Desempeño"
                size="xl"
            >
                {selectedAsignacion && activeCriterios.length > 0 && (
                    <div className="space-y-6 px-1 pt-1">
                        {/* Cabecera del Evaluado & Temporizador */}
                        <div className="p-5 rounded-3xl bg-secondary/30 border border-border/40 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                            <div className="space-y-1">
                                <span className="text-[10px] font-black uppercase tracking-wider text-primary">Funcionario Evaluado</span>
                                <h3 className="text-base font-black text-foreground uppercase">
                                    {selectedAsignacion.evaluado?.nombre} {selectedAsignacion.evaluado?.apellidos}
                                </h3>
                                <p className="text-xs text-muted-foreground">
                                    Cargo: <strong>{selectedAsignacion.cargo?.nombre || selectedAsignacion.evaluado?.cargoPostulacion?.nombre || 'General'}</strong>
                                </p>
                            </div>

                            <div className="flex items-center gap-4">
                                <div className="bg-card px-4 py-2 rounded-2xl border border-border/40 text-left">
                                    <span className="text-[9px] font-bold uppercase text-muted-foreground flex items-center gap-1">
                                        <CalendarCheck className="w-3 h-3 text-primary" /> Periodo Activo
                                    </span>
                                    <div className="text-xs font-black text-foreground mt-0.5">
                                        {periods.find(p => p.id === selectedPeriod)?.gestion} - {periods.find(p => p.id === selectedPeriod)?.periodo}
                                    </div>
                                    {periods.find(p => p.id === selectedPeriod)?.fechaFin && (
                                        <span className="text-[10px] text-amber-600 font-bold block mt-0.5">
                                            Hasta: {new Date(periods.find(p => p.id === selectedPeriod)!.fechaFin!).toLocaleDateString('es-BO', { day: '2-digit', month: 'short' })}
                                        </span>
                                    )}
                                </div>

                                <div className="bg-card px-4 py-2 rounded-2xl border border-border/40 text-right">
                                    <span className="text-[9px] font-bold uppercase text-muted-foreground">Avance de Calificación</span>
                                    <div className="text-lg font-black text-primary leading-none mt-0.5">
                                        {currentEvaluationStats.totalRespondidos} / {currentEvaluationStats.totalSubcriterios} <span className="text-xs font-bold text-muted-foreground">indicadores</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Barra de Escala Informativa */}
                        <div className="p-3 rounded-2xl bg-card border border-border/40 flex items-center justify-between text-[10px] font-bold overflow-x-auto gap-2">
                            <span className="text-muted-foreground uppercase flex-shrink-0">Escala Cualitativa de Calificación:</span>
                            <div className="flex items-center gap-2">
                                {ESCALA_OPCIONES.map(e => (
                                    <span key={e.key} className={cn("px-3 py-1 rounded-xl border font-bold flex items-center gap-1", e.color)}>
                                        {e.label}
                                    </span>
                                ))}
                            </div>
                        </div>

                        {/* Criterios y Preguntas */}
                        <div className="space-y-6">
                            {activeCriterios.map((criterio, cIdx) => {
                                const critStats = currentEvaluationStats.desglosePorCriterio[criterio.id || criterio.nombre];
                                return (
                                    <div key={criterio.id || cIdx} className="space-y-4 p-5 rounded-3xl bg-card border border-border/40 shadow-sm">
                                        <div className="flex flex-wrap items-center justify-between border-b border-border/30 pb-3 gap-2">
                                            <div className="flex items-center gap-2">
                                                <span className="w-6 h-6 rounded-lg bg-primary text-primary-foreground flex items-center justify-center text-xs font-black">
                                                    {cIdx + 1}
                                                </span>
                                                <h4 className="text-xs font-black uppercase text-foreground">
                                                    {criterio.nombre}
                                                </h4>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                {criterio.pesoPorcentaje > 0 && (
                                                    <span className="text-[10px] font-black text-violet-600 dark:text-violet-400 bg-violet-500/10 border border-violet-500/20 px-2.5 py-1 rounded-xl">
                                                        Peso: {criterio.pesoPorcentaje}%
                                                    </span>
                                                )}
                                                {critStats && !critStats.isAutonomo && (
                                                    <span className="text-[10px] font-bold text-muted-foreground bg-secondary px-3 py-1 rounded-xl">
                                                        {critStats.respondidos} de {critStats.totalSub} calificados
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        <div className="space-y-4">
                                            {/* SI ES UN CRITERIO DE CUESTIONARIO / EXAMEN AUTÓNOMO DEL FUNCIONARIO */}
                                            {isCriterioCuestionarioPersonal(criterio) ? (() => {
                                                const yaRealizoExamen = selectedAsignacion.puntajeFinal !== null && selectedAsignacion.puntajeFinal !== undefined;
                                                return (
                                                    <div className="p-5 rounded-2xl bg-violet-500/5 border border-violet-500/20 space-y-3">
                                                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                                            <div className="space-y-1">
                                                                <div className="flex items-center gap-2 text-violet-600 dark:text-violet-400">
                                                                    <FileText className="w-4 h-4 flex-shrink-0" />
                                                                    <span className="text-xs font-black uppercase tracking-wider">
                                                                        Cuestionario de Evaluación por Cargo (Examen Autónomo)
                                                                    </span>
                                                                </div>
                                                                <p className="text-xs text-muted-foreground">
                                                                    Este cuestionario técnico es rendido de forma personal y confidencial por el funcionario.
                                                                    El evaluador no califica estas preguntas; la nota se procesa e integra automáticamente en el sistema institucional.
                                                                </p>
                                                            </div>

                                                            <div className="flex flex-wrap items-center gap-2 flex-shrink-0">
                                                                <div className="px-3.5 py-1.5 rounded-xl bg-violet-500/10 border border-violet-500/20 text-violet-600 dark:text-violet-400 text-xs font-black flex items-center gap-1.5 shadow-sm">
                                                                    <Sparkles className="w-3.5 h-3.5" />
                                                                    Peso: {criterio.pesoPorcentaje || 50}%
                                                                </div>

                                                                {yaRealizoExamen ? (
                                                                    <div className="px-3.5 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-black flex items-center gap-1.5 shadow-sm">
                                                                        <CheckCircle2 className="w-3.5 h-3.5" />
                                                                        Ya realizó su evaluación
                                                                    </div>
                                                                ) : (
                                                                    <div className="px-3.5 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 text-xs font-black flex items-center gap-1.5 shadow-sm">
                                                                        <Clock className="w-3.5 h-3.5" />
                                                                        Pendiente por el funcionario
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            })() : (
                                                /* SI ES UN CRITERIO DE DESEMPEÑO INSTITUCIONAL (CALIFICADO POR EL SUPERVISOR CON LIKERT) */
                                                criterio.subcriterios?.map((sub, sIdx) => {
                                                    const subId = sub.id || `${cIdx}-${sIdx}`;
                                                    const respuestaActual = respuestasMap[subId];
                                                    const tipo = sub.tipoPregunta || 'LIKERT';

                                                    return (
                                                        <div key={subId} className="p-4 rounded-2xl bg-secondary/20 border border-border/20 space-y-3">
                                                            <div className="flex items-start justify-between gap-3">
                                                                <div className="space-y-1 flex-1 min-w-0">
                                                                    <div className="flex items-center gap-2">
                                                                        <span className="text-[10px] font-mono text-muted-foreground">{sub.codigo || `IND-${cIdx + 1}.${sIdx + 1}`}</span>
                                                                        <span className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded bg-secondary text-muted-foreground">
                                                                            {tipo}
                                                                        </span>
                                                                    </div>
                                                                    <div className="text-xs font-bold text-foreground leading-relaxed pt-0.5">
                                                                        <MathRenderer text={sub.indicador} className="prose prose-sm dark:prose-invert max-w-none font-bold" />
                                                                    </div>
                                                                </div>
                                                                {respuestaActual?.escalaTexto && (
                                                                    <span className="text-xs font-black text-primary bg-primary/10 px-2.5 py-0.5 rounded-full flex-shrink-0">
                                                                        {respuestaActual.escalaTexto}
                                                                    </span>
                                                                )}
                                                            </div>

                                                            {/* Escala Likert para el Evaluador */}
                                                            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 pt-1">
                                                                {ESCALA_OPCIONES.map((opt) => {
                                                                    const isSelected = respuestaActual?.escalaTexto === opt.key;
                                                                    return (
                                                                        <button
                                                                            key={opt.key}
                                                                            type="button"
                                                                            onClick={() => handleSelectOption(subId, opt.key, opt.points)}
                                                                            className={cn(
                                                                                "p-3 rounded-xl border text-[10px] font-bold uppercase transition-all duration-150 flex items-center justify-center gap-1.5 relative min-h-[44px]",
                                                                                isSelected
                                                                                    ? `${opt.activeBg} ring-2 ring-primary/40 shadow-lg scale-[1.02]`
                                                                                    : "bg-card border-border/50 text-muted-foreground hover:bg-secondary"
                                                                            )}
                                                                        >
                                                                            {isSelected && <Check className="w-3.5 h-3.5 flex-shrink-0" />}
                                                                            <span>{opt.label}</span>
                                                                        </button>
                                                                    );
                                                                })}
                                                            </div>
                                                        </div>
                                                    );
                                                })
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Botones de Acción */}
                        <div className="flex items-center justify-between pt-4 border-t border-border/40">
                            <span className="text-xs font-semibold text-muted-foreground">
                                Indicadores completados: <strong>{currentEvaluationStats.totalRespondidos}</strong> de <strong>{currentEvaluationStats.totalSubcriterios}</strong>
                            </span>

                            <div className="flex items-center gap-3">
                                <button
                                    type="button"
                                    onClick={() => handleSubmitEvaluation(false)}
                                    disabled={submitting}
                                    className="px-4 py-2 rounded-2xl border border-border bg-card text-xs font-bold uppercase text-foreground hover:bg-secondary"
                                >
                                    Guardar Borrador
                                </button>
                                <button
                                    type="button"
                                    onClick={() => handleSubmitEvaluation(true)}
                                    disabled={submitting || currentEvaluationStats.totalRespondidos < currentEvaluationStats.totalSubcriterios}
                                    className="px-6 py-2.5 rounded-2xl bg-primary text-primary-foreground text-xs font-black uppercase tracking-wider flex items-center gap-2 disabled:opacity-50 shadow-md shadow-primary/20"
                                >
                                    {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                                    Finalizar y Registrar Evaluación
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </Modal>

            {/* MODAL DE CONSOLIDADO MULTI-EVALUADOR */}
            <Modal
                isOpen={isConsolidadoModalOpen}
                onClose={() => setIsConsolidadoModalOpen(false)}
                title="Consolidado de Evaluaciones"
                size="lg"
            >
                {loadingConsolidado ? (
                    <div className="py-20 flex flex-col items-center justify-center gap-3">
                        <Loader2 className="w-8 h-8 text-primary animate-spin" />
                        <p className="text-xs font-semibold text-muted-foreground">Cargando consolidado multi-evaluador...</p>
                    </div>
                ) : consolidadoData && (
                    <div className="space-y-6 pt-2">
                        <div className="p-5 rounded-3xl bg-secondary/30 border border-border/40 flex items-center justify-between">
                            <div>
                                <span className="text-[10px] font-black uppercase tracking-wider text-primary">Funcionario Evaluado</span>
                                <h3 className="text-lg font-black text-foreground uppercase">
                                    {consolidadoData.evaluado?.nombre} {consolidadoData.evaluado?.apellidos}
                                </h3>
                                <p className="text-xs text-muted-foreground">
                                    Cargo: <strong>{consolidadoData.evaluado?.cargoPostulacion?.nombre || 'General'}</strong>
                                </p>
                            </div>

                            <div className="text-right bg-card px-5 py-3 rounded-2xl border border-border/40 shadow-sm">
                                <span className="text-[10px] font-bold uppercase text-muted-foreground">Promedio Global</span>
                                <div className="text-2xl font-black text-emerald-600 mt-0.5">
                                    {consolidadoData.promedioGlobal} <span className="text-xs font-semibold text-muted-foreground">/ 100 pts</span>
                                </div>
                            </div>
                        </div>

                        {/* Desglose por Evaluador */}
                        <div className="space-y-3">
                            <h4 className="text-xs font-black uppercase text-foreground">
                                Evaluaciones Realizadas ({consolidadoData.evaluaciones?.length || 0})
                            </h4>

                            <div className="space-y-2">
                                {consolidadoData.evaluaciones?.map((ev: any) => (
                                    <div key={ev.id} className="p-4 rounded-2xl bg-card border border-border/40 flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary font-bold flex items-center justify-center text-xs">
                                                {ev.evaluador?.nombre?.charAt(0)}{ev.evaluador?.apellidos?.charAt(0)}
                                            </div>
                                            <div>
                                                <p className="text-xs font-bold text-foreground">{ev.evaluador?.nombre} {ev.evaluador?.apellidos}</p>
                                                <span className="text-[10px] text-muted-foreground uppercase font-semibold">Rol: {ev.tipoEvaluacion}</span>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-4">
                                            <span className="text-xs font-bold text-emerald-600 bg-emerald-500/10 px-3 py-1 rounded-full">
                                                {ev.puntajeFinal ?? 'Pendiente'} pts
                                            </span>
                                            <button
                                                onClick={() => handleDownloadPdf(ev.id, `${consolidadoData.evaluado?.nombre}_${ev.evaluador?.nombre}`)}
                                                className="p-1.5 text-muted-foreground hover:text-primary transition-colors"
                                                title="Descargar PDF de esta evaluación"
                                            >
                                                <Download className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
            </Modal>

            {/* MODAL DE CONFIRMACIÓN PREVIA AL EXAMEN */}
            <Modal
                isOpen={isStartConfirmModalOpen}
                onClose={() => setIsStartConfirmModalOpen(false)}
                title="Confirmación de Inicio de Evaluación"
                size="md"
            >
                {pendingAsignacion && (
                    <div className="space-y-6 pt-2">
                        <div className="flex items-start gap-4 p-4 rounded-2xl bg-primary/5 border border-primary/20">
                            <div className="p-3 rounded-2xl bg-primary/10 text-primary flex-shrink-0">
                                <ShieldAlert className="w-6 h-6" />
                            </div>
                            <div className="space-y-1">
                                <h4 className="text-sm font-black uppercase text-foreground">
                                    ¿Estás seguro de iniciar la evaluación?
                                </h4>
                                <p className="text-xs text-muted-foreground leading-relaxed">
                                    Al confirmar, se iniciará el intento oficial, el temporizador comenzará a correr y se activará el entorno seguro en pantalla completa.
                                </p>
                            </div>
                        </div>

                        {/* Detalles de la prueba */}
                        <div className="p-4 rounded-2xl bg-card border border-border/40 space-y-2.5 text-xs">
                            <div className="flex items-center justify-between pb-2 border-b border-border/20">
                                <span className="text-muted-foreground font-semibold">Cuestionario:</span>
                                <span className="font-black text-foreground uppercase">{selectedCuestionario?.titulo || 'Evaluación Técnica'}</span>
                            </div>
                            <div className="flex items-center justify-between pb-2 border-b border-border/20">
                                <span className="text-muted-foreground font-semibold">Cargo Evaluado:</span>
                                <span className="font-bold text-primary">{pendingAsignacion.cargo?.nombre || 'Cargo General'}</span>
                            </div>
                            <div className="flex items-center justify-between pb-2 border-b border-border/20">
                                <span className="text-muted-foreground font-semibold">Tiempo Límite:</span>
                                <span className="font-bold text-foreground flex items-center gap-1">
                                    <Clock className="w-3.5 h-3.5 text-primary" />
                                    {selectedCuestionario?.tiempoLimiteMinutos ? `${selectedCuestionario.tiempoLimiteMinutos} minutos` : 'Sin límite de tiempo'}
                                </span>
                            </div>
                            <div className="flex items-center justify-between pb-2 border-b border-border/20">
                                <span className="text-muted-foreground font-semibold">Preguntas a Rendir:</span>
                                <span className="font-bold text-foreground flex items-center gap-1.5">
                                    <ListChecks className="w-3.5 h-3.5 text-primary" />
                                    {selectedCuestionario?.criterio?.subcriterios?.length || 0} preguntas
                                    {selectedCuestionario?.randomPreguntas && (
                                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center gap-0.5">
                                            <Sparkles className="w-2.5 h-2.5" /> Aleatorio
                                        </span>
                                    )}
                                </span>
                            </div>
                            <div className="flex items-center justify-between pb-2 border-b border-border/20">
                                <span className="text-muted-foreground font-semibold">Intentos Permitidos:</span>
                                <span className="font-bold text-foreground">
                                    {selectedCuestionario?.maxIntentos || 1} intento(s)
                                </span>
                            </div>
                            {pendingAsignacion.periodo?.fechaFin && (
                                <div className="flex items-center justify-between text-amber-700 dark:text-amber-400 font-bold">
                                    <span className="flex items-center gap-1">
                                        <Calendar className="w-3.5 h-3.5 text-amber-600" /> Fecha Límite de Entrega:
                                    </span>
                                    <span>
                                        {new Date(pendingAsignacion.periodo.fechaFin).toLocaleDateString('es-BO', { day: '2-digit', month: 'long', year: 'numeric' })}
                                    </span>
                                </div>
                            )}
                        </div>

                        <div className="p-3 rounded-xl bg-secondary/30 border border-border/30 text-[11px] text-muted-foreground flex items-center gap-2">
                            <Lock className="w-4 h-4 text-primary flex-shrink-0" />
                            <span>Durante el examen no se permite copiar texto ni utilizar atajos externos.</span>
                        </div>

                        {/* Botones de Confirmación */}
                        <div className="flex items-center justify-end gap-3 pt-2">
                            <button
                                type="button"
                                onClick={() => setIsStartConfirmModalOpen(false)}
                                className="px-4 py-2.5 rounded-2xl border border-border bg-card text-xs font-bold uppercase text-foreground hover:bg-secondary transition-colors"
                            >
                                Cancelar / Volver
                            </button>
                            <button
                                type="button"
                                onClick={handleConfirmStartSelfEval}
                                disabled={submitting}
                                className="px-6 py-2.5 rounded-2xl bg-primary text-primary-foreground text-xs font-black uppercase tracking-wider flex items-center gap-2 shadow-md shadow-primary/20 hover:opacity-90 transition-all"
                            >
                                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Maximize2 className="w-4 h-4" />}
                                Sí, Iniciar Evaluación
                            </button>
                        </div>
                    </div>
                )}
            </Modal>

            {/* VISTA / MODAL DE CUESTIONARIO EN PANTALLA COMPLETA INSTITUCIONAL */}
            {isSelfEvalModalOpen && selfAsignacion && selectedCuestionario && selectedCuestionario.criterio && (() => {
                const isReadOnly = currentIntento?.estado !== 'EN_CURSO';

                return (
                    <div
                        onCopy={(e) => { e.preventDefault(); toast.warning('Acción bloqueada: No está permitido copiar preguntas en Modo Examen.'); }}
                        onCut={(e) => { e.preventDefault(); }}
                        onPaste={(e) => { e.preventDefault(); }}
                        onContextMenu={(e) => { e.preventDefault(); toast.warning('Menú contextual desactivado en Modo Examen.'); }}
                        className="fixed inset-0 z-[9999] w-screen h-screen bg-background flex flex-col select-none overflow-hidden"
                    >
                        {/* BARRA SUPERIOR INSTITUCIONAL FIJA */}
                        <div className="bg-card border-b border-border/40 px-6 py-4 flex items-center justify-between gap-4 shadow-sm flex-shrink-0">
                            <div className="flex items-center gap-3">
                                <div className="p-2.5 rounded-2xl bg-primary/10 text-primary">
                                    <ClipboardSignature className="w-5 h-5" />
                                </div>
                                <div>
                                    <div className="flex items-center gap-2">
                                        <h2 className="text-sm font-black uppercase tracking-tight text-foreground">
                                            {selectedCuestionario.titulo}
                                        </h2>
                                        {isReadOnly ? (
                                            <span className="px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 flex items-center gap-1">
                                                <CheckCircle2 className="w-3 h-3" /> Modo Revisión (Finalizado)
                                            </span>
                                        ) : (
                                            <span className="px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase bg-primary/10 text-primary border border-primary/20 flex items-center gap-1">
                                                <Lock className="w-3 h-3" /> Modo Examen Seguro
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-xs text-muted-foreground">
                                        Criterio: <strong>{selectedCuestionario.criterio.nombre}</strong> • Cargo: <strong>{selfAsignacion.cargo?.nombre || 'General'}</strong>
                                        {selfAsignacion.periodo?.fechaFin && (
                                            <> • <span className="text-amber-600 font-bold">
                                                Disponible hasta: {new Date(selfAsignacion.periodo.fechaFin).toLocaleDateString('es-BO', { day: '2-digit', month: 'long', year: 'numeric' })}
                                            </span></>
                                        )}
                                    </p>
                                </div>
                            </div>

                            {/* Temporizador, Advertencias y Contadores */}
                            <div className="flex items-center gap-3 md:gap-4">
                                {cheatWarnings > 0 && !isReadOnly && (
                                    <div className="px-3 py-1.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-600 text-xs font-black flex items-center gap-1.5 animate-pulse">
                                        <ShieldAlert className="w-4 h-4" />
                                        <span>Advertencia: {cheatWarnings}/3</span>
                                    </div>
                                )}

                                {!isReadOnly && timeLeftSeconds !== null && (
                                    <div className={cn(
                                        "px-4 py-2 rounded-2xl flex items-center gap-2 text-xs font-black tracking-wider border",
                                        timeLeftSeconds < 180
                                            ? "bg-rose-500/10 text-rose-600 border-rose-500/30 animate-pulse"
                                            : "bg-primary/10 text-primary border-primary/20"
                                    )}>
                                        <Timer className="w-4 h-4" />
                                        <span>{formatTime(timeLeftSeconds)}</span>
                                    </div>
                                )}

                                <div className="bg-secondary/40 px-4 py-2 rounded-2xl border border-border/40 text-right hidden sm:block">
                                    <span className="text-[9px] font-bold uppercase text-muted-foreground">
                                        {isReadOnly ? 'Puntaje Obtenido' : 'Progreso'}
                                    </span>
                                    <div className="text-xs font-black text-primary leading-none mt-0.5">
                                        {isReadOnly
                                            ? `${currentIntento?.puntajeObtenido ?? selfAsignacion.puntajeFinal ?? '—'} pts`
                                            : `${Object.keys(respuestasMap).length} / ${selectedCuestionario.criterio.subcriterios?.length || 0} respondidas`
                                        }
                                    </div>
                                </div>

                                <button
                                    type="button"
                                    onClick={handleToggleFullscreen}
                                    className="p-2.5 rounded-2xl bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-colors"
                                    title="Alternar Pantalla Completa"
                                >
                                    <Maximize2 className="w-4 h-4" />
                                </button>

                                <button
                                    type="button"
                                    onClick={handleCloseSelfEvalModal}
                                    className="px-4 py-2 rounded-2xl bg-secondary text-secondary-foreground hover:bg-secondary/80 text-xs font-bold uppercase transition-colors"
                                >
                                    {isReadOnly ? 'Cerrar' : 'Salir'}
                                </button>
                            </div>
                        </div>

                        {/* CUERPO CENTRAL DE PREGUNTAS (SCROLLABLE) */}
                        <div className="flex-1 overflow-y-auto p-6 md:p-10 max-w-4xl mx-auto w-full space-y-6">
                            {/* Instrucciones */}
                            {selectedCuestionario.descripcion && (
                                <div className="p-4 rounded-2xl bg-card border border-border/40 text-xs text-muted-foreground italic flex items-center gap-2">
                                    <HelpCircle className="w-4 h-4 text-primary flex-shrink-0" />
                                    <span>{selectedCuestionario.descripcion}</span>
                                </div>
                            )}

                            {/* Lista de Preguntas */}
                            <div className="space-y-5 pb-8">
                                {selectedCuestionario.criterio.subcriterios?.map((sub, sIdx) => {
                                    const subId = sub.id || `self-${sIdx}`;
                                    const respuestaActual = respuestasMap[subId];
                                    const tipo = sub.tipoPregunta || 'LIKERT';

                                    return (
                                        <div key={subId} className="p-6 rounded-3xl bg-card border border-border/40 shadow-sm space-y-4 transition-all">
                                            <div className="flex items-start justify-between gap-3">
                                                <div className="space-y-1">
                                                    <div className="flex items-center gap-2">
                                                        <span className="w-6 h-6 rounded-xl bg-primary text-primary-foreground flex items-center justify-center text-xs font-black">
                                                            {sIdx + 1}
                                                        </span>
                                                        <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-lg bg-secondary text-muted-foreground">
                                                            {tipo}
                                                        </span>
                                                    </div>
                                                    <div className="text-sm font-bold text-foreground leading-relaxed pt-1">
                                                        <MathRenderer text={sub.indicador} className="prose prose-sm dark:prose-invert max-w-none font-bold" />
                                                    </div>
                                                </div>
                                                {respuestaActual && (
                                                    <span className="text-xs font-black text-primary bg-primary/10 px-3 py-1 rounded-full flex-shrink-0 flex items-center gap-1">
                                                        {/* Solo mostrar puntos en LIKERT/VF donde el cliente los conoce */}
                                                        {(tipo === 'LIKERT' || tipo === 'VERDADERO_FALSO') ? (
                                                            <>{respuestaActual.puntaje} pts</>
                                                        ) : (
                                                            <><Check className="w-3.5 h-3.5" /> Respondida</>
                                                        )}
                                                    </span>
                                                )}
                                            </div>

                                            {/* Opciones según tipo de pregunta */}
                                            {tipo === 'LIKERT' && (
                                                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 pt-1">
                                                    {ESCALA_OPCIONES.map((opt) => {
                                                        const isSelected = respuestaActual?.escalaTexto === opt.key;
                                                        return (
                                                            <button
                                                                key={opt.key}
                                                                type="button"
                                                                disabled={isReadOnly}
                                                                onClick={() => !isReadOnly && handleSelectOption(subId, opt.key, opt.points)}
                                                                className={cn(
                                                                    "p-3 rounded-2xl border text-[11px] font-bold uppercase transition-all flex flex-col items-center justify-center gap-0.5",
                                                                    isSelected ? opt.activeBg : "bg-card border-border/50 text-muted-foreground hover:bg-secondary",
                                                                    isReadOnly && "cursor-default"
                                                                )}
                                                            >
                                                                <span>{opt.label}</span>
                                                                <span className="text-[9px] opacity-80">{opt.points} pts</span>
                                                            </button>
                                                        );
                                                    })}
                                                </div>
                                            )}

                                            {tipo === 'VERDADERO_FALSO' && (
                                                <div className="grid grid-cols-2 gap-3 pt-1">
                                                    {[
                                                        { key: 'VERDADERO', label: 'Verdadero', pts: 100, activeClass: 'bg-emerald-600 text-white border-emerald-600 shadow-md shadow-emerald-500/20' },
                                                        { key: 'FALSO', label: 'Falso', pts: 0, activeClass: 'bg-rose-600 text-white border-rose-600 shadow-md shadow-rose-500/20' },
                                                    ].map(opt => {
                                                        const isSelected = respuestaActual?.escalaTexto === opt.key;
                                                        return (
                                                            <button
                                                                key={opt.key}
                                                                type="button"
                                                                disabled={isReadOnly}
                                                                onClick={() => !isReadOnly && handleSelectOption(subId, opt.key, opt.pts)}
                                                                className={cn(
                                                                    "p-3.5 rounded-2xl border text-xs font-black uppercase transition-all flex items-center justify-center gap-2",
                                                                    isSelected ? opt.activeClass : "bg-card border-border/50 text-muted-foreground hover:bg-secondary",
                                                                    isReadOnly && "cursor-default"
                                                                )}
                                                            >
                                                                {opt.label}
                                                            </button>
                                                        );
                                                    })}
                                                </div>
                                            )}

                                            {(tipo === 'OPCION_UNICA' || tipo === 'SELECCION_MULTIPLE') && sub.opciones && sub.opciones.length > 0 && (
                                                <div className="space-y-2 pt-1">
                                                    {sub.opciones.map((opt, oIdx) => {
                                                        const isSelected = respuestaActual?.escalaTexto === (opt.id || opt.texto);
                                                        return (
                                                            <button
                                                                key={opt.id || oIdx}
                                                                type="button"
                                                                disabled={isReadOnly}
                                                                onClick={() => !isReadOnly && handleSelectOption(subId, opt.id || opt.texto, 0)}
                                                                className={cn(
                                                                    "w-full text-left p-3.5 rounded-2xl border text-xs font-semibold transition-all flex items-center justify-between gap-3",
                                                                    isSelected
                                                                        ? "bg-primary text-primary-foreground border-primary shadow-md shadow-primary/20"
                                                                        : "bg-card border-border/50 text-foreground hover:bg-secondary",
                                                                    isReadOnly && "cursor-default"
                                                                )}
                                                            >
                                                                <div className="flex-1">
                                                                    <MathRenderer text={opt.texto} className="inline-block" />
                                                                </div>
                                                                {isSelected && <Check className="w-4 h-4 flex-shrink-0" />}
                                                            </button>
                                                        );
                                                    })}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* BARRA INFERIOR DE ACCIÓN FIJA */}
                        <div className="bg-card border-t border-border/40 px-6 py-4 flex items-center justify-between gap-4 flex-shrink-0 shadow-lg">
                            <span className="text-xs font-semibold text-muted-foreground">
                                {isReadOnly ? (
                                    <>Visualizando respuestas del intento registrado.</>
                                ) : (
                                    <>Respondidas: <strong className="text-foreground">{Object.keys(respuestasMap).length}</strong> de <strong className="text-foreground">{selectedCuestionario.criterio.subcriterios?.length || 0}</strong></>
                                )}
                            </span>

                            <div className="flex items-center gap-3">
                                {isReadOnly ? (
                                    <button
                                        type="button"
                                        onClick={handleCloseSelfEvalModal}
                                        className="px-8 py-2.5 rounded-2xl bg-secondary text-secondary-foreground text-xs font-black uppercase tracking-wider hover:bg-secondary/80 transition-colors"
                                    >
                                        Cerrar Revisión
                                    </button>
                                ) : (
                                    <>
                                        <button
                                            type="button"
                                            onClick={() => handleSubmitSelfEval(false)}
                                            disabled={submitting}
                                            className="px-5 py-2.5 rounded-2xl border border-border bg-card text-xs font-bold uppercase text-foreground hover:bg-secondary transition-colors"
                                        >
                                            Guardar Borrador
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => handleSubmitSelfEval(true)}
                                            disabled={submitting || Object.keys(respuestasMap).length < (selectedCuestionario.criterio.subcriterios?.length || 0)}
                                            className="px-7 py-2.5 rounded-2xl bg-primary text-primary-foreground text-xs font-black uppercase tracking-wider flex items-center gap-2 disabled:opacity-50 shadow-md shadow-primary/20 hover:opacity-90 transition-all"
                                        >
                                            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                                            Finalizar y Registrar Nota
                                        </button>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                );
            })()}
        </div>
    );
}
