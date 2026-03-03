import api from '@/lib/api';
import { BancoProfesional, PaginatedBancoProfesionals } from '../domain/BancoProfesional';

export const BancoProfesionalApi = {
  getAll: async (params?: any): Promise<BancoProfesional[]> => {
    const response = await api.get<PaginatedBancoProfesionals>('/banco-profesional', { params });
    return Array.isArray(response.data.data) ? response.data.data : (Array.isArray(response.data) ? response.data : []);
  },

  getById: async (id: string): Promise<BancoProfesional> => {
    const response = await api.get<BancoProfesional>(`/banco-profesional/${id}`);
    return response.data;
  },

  create: async (data: Partial<BancoProfesional>): Promise<BancoProfesional> => {
    const response = await api.post<BancoProfesional>('/banco-profesional', data);
    return response.data;
  },

  update: async (id: string, data: Partial<BancoProfesional>): Promise<BancoProfesional> => {
    const response = await api.put<BancoProfesional>(`/banco-profesional/${id}`, data);
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/banco-profesional/${id}`);
  },

  getMyProfile: async (): Promise<BancoProfesional> => {
    const response = await api.get<BancoProfesional>('/banco-profesional/me');
    return response.data;
  },

  updateMyProfile: async (data: Partial<BancoProfesional>): Promise<BancoProfesional> => {
    const response = await api.put<BancoProfesional>('/banco-profesional/me', data);
    return response.data;
  }
};
