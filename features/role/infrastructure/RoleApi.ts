import api from '@/lib/api';
import { Role, PaginatedRoles } from '../domain/Role';

export const RoleApi = {
  getAll: async (params?: any): Promise<Role[]> => {
    const response = await api.get<PaginatedRoles>('/roles', { params });
    return Array.isArray(response.data.data) ? response.data.data : (Array.isArray(response.data) ? response.data : []); 
  },

  getById: async (id: string): Promise<Role> => {
    const response = await api.get<Role>(`/roles/${id}`);
    return response.data;
  },

  create: async (data: Partial<Role>): Promise<Role> => {
    const response = await api.post<Role>('/roles', data);
    return response.data;
  },

  update: async (id: string, data: Partial<Role>): Promise<Role> => {
    const response = await api.put<Role>(`/roles/${id}`, data);
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/roles/${id}`);
  }
};
