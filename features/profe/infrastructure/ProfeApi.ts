import api from '@/lib/api';
import { Profe } from '../domain/Profe';

export const ProfeApi = {
  get: async (): Promise<Profe | null> => {
    const response = await api.get<Profe>('/profe');
    return response.data;
  },

  create: async (data: Partial<Profe>): Promise<Profe> => {
    const response = await api.post<Profe>('/profe', data);
    return response.data;
  },

  update: async (id: string, data: Partial<Profe>): Promise<Profe> => {
    const response = await api.put<Profe>(`/profe/${id}`, data);
    return response.data;
  }
};
