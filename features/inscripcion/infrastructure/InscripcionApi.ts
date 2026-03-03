import api from '@/lib/api';
import { Inscripcion, PaginatedInscripcions } from '../domain/Inscripcion';

export const InscripcionApi = {
  getAll: async (params?: any): Promise<Inscripcion[]> => {
    const response = await api.get<PaginatedInscripcions>('/inscripciones-clean', { params });
    return Array.isArray(response.data.data) ? response.data.data : (Array.isArray(response.data) ? response.data : []); 
  },

  getById: async (id: string): Promise<Inscripcion> => {
    const response = await api.get<Inscripcion>(`/inscripciones-clean/${id}`);
    return response.data;
  },

  create: async (data: Partial<Inscripcion>): Promise<Inscripcion> => {
    const response = await api.post<Inscripcion>('/inscripciones-clean', data);
    return response.data;
  },

  update: async (id: string, data: Partial<Inscripcion>): Promise<Inscripcion> => {
    const response = await api.put<Inscripcion>(`/inscripciones-clean/${id}`, data);
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/inscripciones-clean/${id}`);
  }
};
