import api from '@/lib/api';

export interface EvaluationPeriod {
    id: string;
    gestion: string;
    semestre: string;
    periodo: string;
    activo: boolean;
    criterios?: EvaluacionCriterio[];
}

export interface EvaluacionCriterio {
    id: string;
    nombre: string;
    puntajeMaximo: number;
    orden: number;
}

export interface EvaluacionAdmins {
    id: string;
    userId: string;
    periodoId: string;
    tenantId: string;
    puntajeTotal: number;
    codigoVerificacion: string;
    qrCode?: string;
    puntajes?: EvaluacionPuntaje[];
    periodoEval?: EvaluationPeriod;
}

export interface EvaluacionPuntaje {
    criterioId: string;
    puntaje: number;
}

export const evaluationService = {
    // Periodos (Admin)
    getPeriods: async () => {
        const response = await api.get<EvaluationPeriod[]>('/evaluations/periodos');
        return response.data;
    },

    createPeriod: async (data: any) => {
        const response = await api.post<EvaluationPeriod>('/evaluations/periodos', data);
        return response.data;
    },

    togglePeriod: async (id: string, active: boolean) => {
        const response = await api.patch(`/evaluations/periodos/${id}/toggle`, { activo: active });
        return response.data;
    },

    // Evaluaciones
    getUsersToEvaluate: async (tenantId: string, periodoId: string) => {
        const response = await api.get(`/evaluations/usuarios?tenantId=${tenantId}&periodoId=${periodoId}`);
        return response.data;
    },

    createEvaluation: async (data: any) => {
        const response = await api.post<EvaluacionAdmins>('/evaluations', data);
        return response.data;
    },

    getEvaluations: async (tenantId: string) => {
        const response = await api.get<EvaluacionAdmins[]>(`/evaluations?tenantId=${tenantId}`);
        return response.data;
    },

    getMyEvaluations: async () => {
        const response = await api.get<EvaluacionAdmins[]>('/evaluations/my/all');
        return response.data;
    },

    getEvaluationById: async (id: string) => {
        const response = await api.get<EvaluacionAdmins>(`/evaluations/${id}`);
        return response.data;
    },

    getEvaluationPdf: async (id: string) => {
        const response = await api.get(`/evaluations/pdf/${id}`, { responseType: 'blob' });
        return response.data;
    },

    verifyEvaluation: async (code: string) => {
        const response = await api.get(`/evaluations/verify/${code}`);
        return response.data;
    }
};
