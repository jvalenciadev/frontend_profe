import api from '@/lib/api';

export const ESCALA_LIKERT_VALORES = {
    SIEMPRE: 100,
    CASI_SIEMPRE: 80,
    ALGUNAS_VECES: 60,
    CASI_NUNCA: 40,
    NUNCA: 20,
} as const;

export type EscalaLikertKey = keyof typeof ESCALA_LIKERT_VALORES;

export interface EvaluationPeriod {
    id: string;
    gestion: string;
    semestre: string;
    periodo: string;
    fechaInicio?: string;
    fechaFin?: string;
    activo: boolean;
    cuestionarios?: EvaluacionCuestionario[];
    criterios?: EvaluacionCriterio[];
}

export type TipoPregunta = 'LIKERT' | 'OPCION_UNICA' | 'SELECCION_MULTIPLE' | 'VERDADERO_FALSO';

export interface EvaluacionOpcion {
    id?: string;
    subcriterioId?: string;
    texto: string;
    esCorrecta: boolean;
    orden?: number;
}

export interface EvaluacionSubcriterio {
    id?: string;
    criterioId?: string;
    codigo?: string;
    indicador: string;
    descripcion?: string;
    tipoPregunta: TipoPregunta;
    pesoPorcentaje: number;
    orden: number;
    opciones?: EvaluacionOpcion[];
}

export interface EvaluacionCriterioCargo {
    id?: string;
    criterioId?: string;
    cargoId: string;
    cargo?: { id: string; nombre: string };
}

export interface EvaluacionCriterio {
    id?: string;
    periodoId?: string;
    nombre: string;
    descripcion?: string;
    pesoPorcentaje: number;
    orden: number;
    cargos?: EvaluacionCriterioCargo[];
    cargoIds?: string[];
    subcriterios?: EvaluacionSubcriterio[];
    cuestionarios?: EvaluacionCuestionario[];
}

export interface EvaluacionCuestionario {
    id: string;
    periodoId: string;
    criterioId?: string | null;
    titulo: string;
    descripcion?: string;
    tiempoLimiteMinutos?: number | null;
    maxIntentos: number;
    tipoCalculo: 'PROMEDIO_SIMPLE' | 'PONDERADO';
    notaMinima: number;
    maxPreguntas?: number | null;
    randomPreguntas?: boolean;
    estado: string;
    cargos?: { id: string; cargoId: string; cargo: { id: string; nombre: string } }[];
    criterio?: EvaluacionCriterio;
    periodo?: EvaluationPeriod;
}

export interface EvaluacionRespuesta {
    id?: string;
    intentoId?: string;
    subcriterioId: string;
    escalaTexto: EscalaLikertKey;
    puntaje: number;
    observacion?: string;
    subcriterio?: EvaluacionSubcriterio;
}

export interface EvaluacionIntento {
    id: string;
    evaluacionAdminId: string;
    numeroIntento: number;
    fechaInicio: string;
    fechaFin?: string | null;
    tiempoEmpleadoSegundos?: number | null;
    puntajeObtenido?: number | null;
    estado: 'EN_CURSO' | 'FINALIZADO' | 'EXPIRADO_POR_TIEMPO';
    respuestas?: EvaluacionRespuesta[];
}

export interface EvaluacionAdmins {
    id: string;
    periodoId: string;
    cuestionarioId?: string | null;
    evaluadorId: string;
    evaluadoId: string;
    cargoId?: string | null;
    tenantId?: string | null;
    tipoEvaluacion: string;
    estadoEvaluacion: 'PENDIENTE' | 'EN_PROCESO' | 'COMPLETADO' | 'EXPIRADO';
    puntajeFinal?: number | null;
    codigoVerificacion?: string | null;
    qrCode?: string | null;
    observaciones?: string | null;
    evaluador?: any;
    evaluado?: any;
    cargo?: any;
    cuestionario?: EvaluacionCuestionario;
    periodo?: EvaluationPeriod;
    intentos?: EvaluacionIntento[];
}

export const evaluationService = {
    // ── Periodos (Admin) ──
    getPeriods: async () => {
        const response = await api.get<EvaluationPeriod[]>('/evaluations/periodos');
        return response.data;
    },

    createPeriod: async (data: Partial<EvaluationPeriod>) => {
        const response = await api.post<EvaluationPeriod>('/evaluations/periodos', data);
        return response.data;
    },

    updatePeriod: async (id: string, data: Partial<EvaluationPeriod>) => {
        const response = await api.put<EvaluationPeriod>(`/evaluations/periodos/${id}`, data);
        return response.data;
    },

    togglePeriod: async (id: string, active: boolean) => {
        const response = await api.patch(`/evaluations/periodos/${id}/toggle`, { activo: active });
        return response.data;
    },

    deletePeriod: async (id: string) => {
        const response = await api.delete(`/evaluations/periodos/${id}`);
        return response.data;
    },

    // ── Cuestionarios por Cargo ──
    getCuestionarios: async (periodoId?: string) => {
        const response = await api.get<EvaluacionCuestionario[]>('/evaluations/cuestionarios', {
            params: { periodoId },
        });
        return response.data;
    },

    getCuestionariosByCargo: async (cargoId: string, periodoId?: string) => {
        const response = await api.get<EvaluacionCuestionario[]>(`/evaluations/cuestionarios/cargo/${cargoId}`, {
            params: { periodoId },
        });
        return response.data;
    },

    getCuestionarioById: async (id: string) => {
        const response = await api.get<EvaluacionCuestionario>(`/evaluations/cuestionarios/${id}`);
        return response.data;
    },

    createCuestionario: async (data: any) => {
        const response = await api.post<EvaluacionCuestionario>('/evaluations/cuestionarios', data);
        return response.data;
    },

    updateCuestionario: async (id: string, data: any) => {
        const response = await api.put<EvaluacionCuestionario>(`/evaluations/cuestionarios/${id}`, data);
        return response.data;
    },

    deleteCuestionario: async (id: string) => {
        const response = await api.delete(`/evaluations/cuestionarios/${id}`);
        return response.data;
    },

    // ── Asignaciones (Matriz Quién Evalúa a Quién) ──
    getAsignaciones: async (tenantId?: string, periodoId?: string) => {
        const response = await api.get<EvaluacionAdmins[]>('/evaluations/asignaciones', {
            params: { tenantId, periodoId },
        });
        return response.data;
    },

    getMisPendientes: async (periodoId?: string) => {
        const response = await api.get<EvaluacionAdmins[]>('/evaluations/asignaciones/mis-pendientes', {
            params: { periodoId },
        });
        return response.data;
    },

    getMisEvaluaciones: async (periodoId?: string) => {
        const response = await api.get<EvaluacionAdmins[]>('/evaluations/asignaciones/mis-evaluaciones', {
            params: { periodoId },
        });
        return response.data;
    },

    getMyEvaluations: async (periodoId?: string) => {
        const response = await api.get<EvaluacionAdmins[]>('/evaluations/asignaciones/mis-evaluaciones', {
            params: { periodoId },
        });
        return response.data;
    },

    getAsignacionById: async (id: string) => {
        const response = await api.get<EvaluacionAdmins>(`/evaluations/asignaciones/${id}`);
        return response.data;
    },

    createAsignacion: async (data: any) => {
        const response = await api.post<EvaluacionAdmins>('/evaluations/asignaciones', data);
        return response.data;
    },

    createAsignacionesMasivas: async (asignaciones: any[]) => {
        const response = await api.post<{ creadas: number }>('/evaluations/asignaciones/masivas', {
            asignaciones,
        });
        return response.data;
    },

    deleteAsignacion: async (id: string) => {
        const response = await api.delete(`/evaluations/asignaciones/${id}`);
        return response.data;
    },

    // ── Intentos y Respuestas (Temporizador y Escala Likert) ──
    iniciarIntento: async (evaluacionAdminId: string) => {
        const response = await api.post<EvaluacionIntento>('/evaluations/intentos/iniciar', {
            evaluacionAdminId,
        });
        return response.data;
    },

    getIntentoById: async (id: string) => {
        const response = await api.get<EvaluacionIntento>(`/evaluations/intentos/${id}`);
        return response.data;
    },

    responderIntento: async (data: {
        intentoId: string;
        respuestas: {
            subcriterioId: string;
            escalaTexto: EscalaLikertKey;
            puntaje: number;
            observacion?: string;
        }[];
        finalizar?: boolean;
    }) => {
        const response = await api.post<{
            intento: EvaluacionIntento;
            puntajeCalculado: number;
            asignacionActualizada: EvaluacionAdmins;
        }>('/evaluations/intentos/responder', data);
        return response.data;
    },

    getConsolidado: async (evaluadoId: string, periodoId: string) => {
        const response = await api.get<{
            evaluado: any;
            periodo: EvaluationPeriod;
            evaluaciones: EvaluacionAdmins[];
            promedioGlobal: number;
            totalEvaluadores: number;
        }>(`/evaluations/consolidado/${evaluadoId}/${periodoId}`);
        return response.data;
    },

    // ── Usuarios & Compatibilidad ──
    getUsersToEvaluate: async (tenantId: string, periodoId: string) => {
        const response = await api.get(`/evaluations/usuarios?tenantId=${tenantId}&periodoId=${periodoId}`);
        return response.data;
    },

    getEvaluationPdf: async (id: string) => {
        const response = await api.get(`/evaluations/pdf/${id}`, { responseType: 'blob' });
        return response.data;
    },

    verifyEvaluation: async (code: string) => {
        const response = await api.get(`/evaluations/verify/${code}`);
        return response.data;
    },
};
