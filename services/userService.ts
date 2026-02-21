import api from '@/lib/api';
import { User } from '@/types';


import { authService } from './authService';

export const userService = {
    // Listar todos los usuarios
    getAll: async (search?: string) => {
        const { data } = await api.get<any>('/users', { params: { search } });
        // Handle both Array and Object { users: [] } responses
        if (Array.isArray(data)) return data;
        if (data.users && Array.isArray(data.users)) return data.users;
        if (data.data && Array.isArray(data.data)) return data.data;
        return [];
    },

    // Obtener un usuario por ID
    getById: async (id: string) => {
        const { data } = await api.get<User>(`/users/${id}`);
        return data;
    },

    // Crear un nuevo usuario
    create: async (userData: Partial<User>) => {
        const { data } = await api.post<User>('/users', userData);
        return data;
    },

    // Actualizar un usuario
    update: async (id: string, userData: Partial<User>) => {
        const { data } = await api.put<User>(`/users/${id}`, userData);
        return data;
    },

    // Eliminar un usuario
    delete: async (id: string) => {
        await api.delete(`/users/${id}`);
    },

    // Actualizar perfil propio
    updateProfile: async (profileData: Partial<User>) => {
        await api.put<User>('/users/profile', profileData);
        // Despues de actualizar, obtenemos el perfil completo con permisos y roles
        // ya que el endpoint de update no devuelve las relaciones ni el ability
        return await authService.getProfile();
    },

    // Resetear contraseña
    resetPassword: async (id: string) => {
        const { data } = await api.post(`/users/${id}/reset-password`);
        return data;
    },

    // Solicitar verificación de email dinámicamente
    requestEmailVerification: async (email: string) => {
        const { data } = await api.post('/users/request-email-verification', { email });
        return data;
    }
};
