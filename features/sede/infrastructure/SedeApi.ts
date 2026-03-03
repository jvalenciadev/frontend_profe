import api from '@/lib/api';
import { Sede, PaginatedSedes } from '../domain/Sede';

export const SedeApi = {
  getAll: async (params?: any): Promise<Sede[]> => {
    const response = await api.get<PaginatedSedes>('/sedes', { params });
    return Array.isArray(response.data.data) ? response.data.data : (Array.isArray(response.data) ? response.data : []);
  },

  getById: async (id: string): Promise<Sede> => {
    const response = await api.get<Sede>(`/sedes/${id}`);
    return response.data;
  },

  create: async (data: Partial<Sede>): Promise<Sede> => {
    const response = await api.post<Sede>('/sedes', data);
    return response.data;
  },

  update: async (id: string, data: Partial<Sede>): Promise<Sede> => {
    const response = await api.put<Sede>(`/sedes/${id}`, data);
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/sedes/${id}`);
  }
};
