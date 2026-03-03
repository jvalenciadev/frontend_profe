import api from '@/lib/api';
import { Permission, PaginatedPermissions } from '../domain/Permission';

export const PermissionApi = {
  getAll: async (params?: any): Promise<Permission[]> => {
    const response = await api.get<PaginatedPermissions>('/permissions', { params });
    return Array.isArray(response.data.data) ? response.data.data : (Array.isArray(response.data) ? response.data : []); 
  },

  getById: async (id: string): Promise<Permission> => {
    const response = await api.get<Permission>(`/permissions/${id}`);
    return response.data;
  },

  create: async (data: Partial<Permission>): Promise<Permission> => {
    const response = await api.post<Permission>('/permissions', data);
    return response.data;
  },

  update: async (id: string, data: Partial<Permission>): Promise<Permission> => {
    const response = await api.put<Permission>(`/permissions/${id}`, data);
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/permissions/${id}`);
  }
};
