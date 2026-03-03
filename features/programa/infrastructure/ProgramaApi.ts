import api from '@/lib/api';
import { Programa, PaginatedProgramas } from '../domain/Programa';

export const ProgramaApi = {
  getAll: async (params?: any): Promise<Programa[]> => {
    const response = await api.get<PaginatedProgramas>('/programas-clean', { params });
    return Array.isArray(response.data.data) ? response.data.data : (Array.isArray(response.data) ? response.data : []); 
  },

  getById: async (id: string): Promise<Programa> => {
    const response = await api.get<Programa>(`/programas-clean/${id}`);
    return response.data;
  },

  create: async (data: Partial<Programa>): Promise<Programa> => {
    const response = await api.post<Programa>('/programas-clean', data);
    return response.data;
  },

  update: async (id: string, data: Partial<Programa>): Promise<Programa> => {
    const response = await api.put<Programa>(`/programas-clean/${id}`, data);
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/programas-clean/${id}`);
  }
};
