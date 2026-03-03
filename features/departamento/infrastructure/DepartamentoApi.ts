import api from '@/lib/api';
import { Departamento, PaginatedDepartamentos } from '../domain/Departamento';

export const DepartamentoApi = {
  getAll: async (params?: any): Promise<Departamento[]> => {
    const response = await api.get<PaginatedDepartamentos>('/departamentos', { params });
    return Array.isArray(response.data.data) ? response.data.data : (Array.isArray(response.data) ? response.data : []);
  },

  getById: async (id: string): Promise<Departamento> => {
    const response = await api.get<Departamento>(`/departamentos/${id}`);
    return response.data;
  },

  create: async (data: Partial<Departamento>): Promise<Departamento> => {
    const response = await api.post<Departamento>('/departamentos', data);
    return response.data;
  },

  update: async (id: string, data: Partial<Departamento>): Promise<Departamento> => {
    const response = await api.put<Departamento>(`/departamentos/${id}`, data);
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/departamentos/${id}`);
  }
};
