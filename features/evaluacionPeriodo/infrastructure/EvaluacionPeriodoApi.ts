import api from '@/lib/api';
import { EvaluacionPeriodo, PaginatedEvaluacionPeriodos } from '../domain/EvaluacionPeriodo';

export const EvaluacionPeriodoApi = {
  getAll: async (params?: any): Promise<EvaluacionPeriodo[]> => {
    const response = await api.get<PaginatedEvaluacionPeriodos>('/evaluacion-periodos', { params });
    return Array.isArray(response.data.data) ? response.data.data : (Array.isArray(response.data) ? response.data : []);
  },

  getById: async (id: string): Promise<EvaluacionPeriodo> => {
    const response = await api.get<EvaluacionPeriodo>(`/evaluacion-periodos/${id}`);
    return response.data;
  },

  create: async (data: Partial<EvaluacionPeriodo>): Promise<EvaluacionPeriodo> => {
    const response = await api.post<EvaluacionPeriodo>('/evaluacion-periodos', data);
    return response.data;
  },

  update: async (id: string, data: Partial<EvaluacionPeriodo>): Promise<EvaluacionPeriodo> => {
    const response = await api.put<EvaluacionPeriodo>(`/evaluacion-periodos/${id}`, data);
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/evaluacion-periodos/${id}`);
  }
};
