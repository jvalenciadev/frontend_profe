import api from '@/lib/api';
import { EvaluacionPeriodo } from '../domain/EvaluacionPeriodo';

export const EvaluacionPeriodoApi = {
  getAll: async (params?: any): Promise<EvaluacionPeriodo[]> => {
    const response = await api.get<any>('/evaluations/periodos', { params });
    return Array.isArray(response.data?.data)
      ? response.data.data
      : Array.isArray(response.data)
      ? response.data
      : [];
  },

  getById: async (id: string): Promise<EvaluacionPeriodo> => {
    const response = await api.get<EvaluacionPeriodo>(`/evaluations/periodos/${id}`);
    return response.data;
  },

  create: async (data: Partial<EvaluacionPeriodo>): Promise<EvaluacionPeriodo> => {
    const response = await api.post<EvaluacionPeriodo>('/evaluations/periodos', data);
    return response.data;
  },

  update: async (id: string, data: Partial<EvaluacionPeriodo>): Promise<EvaluacionPeriodo> => {
    if (data.activo !== undefined && Object.keys(data).length === 1) {
      const response = await api.patch<EvaluacionPeriodo>(`/evaluations/periodos/${id}/toggle`, { activo: data.activo });
      return response.data;
    }
    const response = await api.put<EvaluacionPeriodo>(`/evaluations/periodos/${id}`, data);
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/evaluations/periodos/${id}`);
  }
};
