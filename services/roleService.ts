import api from '@/lib/api';
import { Role } from '@/types';

export const roleService = {
    // Listar todos los roles
    getAll: async () => {
        const { data } = await api.get<any>('/roles');
        // Handle both Array and Object { roles: [] } responses
        if (Array.isArray(data)) return data;
        if (data.roles && Array.isArray(data.roles)) return data.roles;
        if (data.data && Array.isArray(data.data)) return data.data;
        return [];
    },

    // Obtener un rol por ID
    getById: async (id: string) => {
        const { data } = await api.get<Role>(`/roles/${id}`);
        return data;
    },

    // Crear un nuevo rol
    create: async (roleData: any) => {
        const { data } = await api.post<Role>('/roles', roleData);
        return data;
    },

    // Actualizar un rol
    update: async (id: string, roleData: any) => {
        const { data } = await api.put<Role>(`/roles/${id}`, roleData);
        return data;
    },

    // Eliminar un rol
    delete: async (id: string) => {
        await api.delete(`/roles/${id}`);
    }
};
