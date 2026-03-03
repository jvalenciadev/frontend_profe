import api from '@/lib/api';
import { Distrito, PaginatedDistritos } from '../domain/Distrito';

export const DistritoApi = {
  getAll: async (params?: any): Promise<Distrito[]> => {
    const response = await api.get<PaginatedDistritos>('/distritos', { params });
    return Array.isArray(response.data.data) ? response.data.data : (Array.isArray(response.data) ? response.data : []);
  },

  getById: async (id: string): Promise<Distrito> => {
    const response = await api.get<Distrito>(`/distritos/${id}`);
    return response.data;
  },

  create: async (data: Partial<Distrito>): Promise<Distrito> => {
    const response = await api.post<Distrito>('/distritos', data);
    return response.data;
  },

  update: async (id: string, data: Partial<Distrito>): Promise<Distrito> => {
    const response = await api.put<Distrito>(`/distritos/${id}`, data);
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/distritos/${id}`);
  }
};
