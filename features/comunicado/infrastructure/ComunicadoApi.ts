import api from '@/lib/api';
import { Comunicado, PaginatedComunicados } from '../domain/Comunicado';

export const ComunicadoApi = {
  getAll: async (params?: any): Promise<Comunicado[]> => {
    const response = await api.get<PaginatedComunicados>('/comunicados', { params });
    return Array.isArray(response.data.data) ? response.data.data : (Array.isArray(response.data) ? response.data : []);
  },

  getById: async (id: string): Promise<Comunicado> => {
    const response = await api.get<Comunicado>(`/comunicados/${id}`);
    return response.data;
  },

  create: async (data: Partial<Comunicado>): Promise<Comunicado> => {
    const response = await api.post<Comunicado>('/comunicados', data);
    return response.data;
  },

  update: async (id: string, data: Partial<Comunicado>): Promise<Comunicado> => {
    const response = await api.put<Comunicado>(`/comunicados/${id}`, data);
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/comunicados/${id}`);
  }
};
