import api from '@/lib/api';
import { Permission } from '@/types';

export const permissionService = {
    // Listar todos los permisos
    getAll: async () => {
        const { data } = await api.get<any>('/permissions');
        // Handle both Array and Object { permissions: [] } responses
        if (Array.isArray(data)) return data;
        if (data.permissions && Array.isArray(data.permissions)) return data.permissions;
        if (data.data && Array.isArray(data.data)) return data.data;
        return [];
    },

    // Obtener un permiso por ID
    getById: async (id: string) => {
        const { data } = await api.get<Permission>(`/permissions/${id}`);
        return data;
    },

    // Crear un nuevo permiso
    create: async (permissionData: Partial<Permission>) => {
        const { data } = await api.post<Permission>('/permissions', permissionData);
        return data;
    },

    // Actualizar un permiso
    update: async (id: string, permissionData: Partial<Permission>) => {
        const { data } = await api.put<Permission>(`/permissions/${id}`, permissionData);
        return data;
    },

    // Eliminar un permiso
    delete: async (id: string) => {
        await api.delete(`/permissions/${id}`);
    }
};
