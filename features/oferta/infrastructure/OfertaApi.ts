import api from '@/lib/api';
import { Oferta, PaginatedOfertas } from '../domain/Oferta';

export const OfertaApi = {
  getAll: async (params?: any): Promise<Oferta[]> => {
    const response = await api.get<PaginatedOfertas>('/ofertas-clean', { params });
    return Array.isArray(response.data.data) ? response.data.data : (Array.isArray(response.data) ? response.data : []); 
  },

  getById: async (id: string): Promise<Oferta> => {
    const response = await api.get<Oferta>(`/ofertas-clean/${id}`);
    return response.data;
  },

  create: async (data: Partial<Oferta>): Promise<Oferta> => {
    const response = await api.post<Oferta>('/ofertas-clean', data);
    return response.data;
  },

  update: async (id: string, data: Partial<Oferta>): Promise<Oferta> => {
    const response = await api.put<Oferta>(`/ofertas-clean/${id}`, data);
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/ofertas-clean/${id}`);
  }
};
