import api from '@/lib/api';
import { User, PaginatedUsers } from '../domain/User';

export const UserApi = {
  getAll: async (params?: any): Promise<User[]> => {
    const response = await api.get<PaginatedUsers>('/users-clean', { params });
    return Array.isArray(response.data.data) ? response.data.data : (Array.isArray(response.data) ? response.data : []); 
  },

  getById: async (id: string): Promise<User> => {
    const response = await api.get<User>(`/users-clean/${id}`);
    return response.data;
  },

  create: async (data: Partial<User>): Promise<User> => {
    const response = await api.post<User>('/users-clean', data);
    return response.data;
  },

  update: async (id: string, data: Partial<User>): Promise<User> => {
    const response = await api.put<User>(`/users-clean/${id}`, data);
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/users-clean/${id}`);
  }
};
