import api from '@/lib/api';

export const departmentService = {
    getAll: async () => {
        const { data } = await api.get<any>('/departamentos');
        if (Array.isArray(data)) return data;
        if (data.data && Array.isArray(data.data)) return data.data;
        return [];
    },

    getById: async (id: string) => {
        const { data } = await api.get<any>(`/departamentos/${id}`);
        return data;
    },

    create: async (payload: any) => {
        const { data } = await api.post<any>('/departamentos', payload);
        return data;
    },

    update: async (id: string, payload: any) => {
        const { data } = await api.put<any>(`/departamentos/${id}`, payload);
        return data;
    },

    delete: async (id: string) => {
        await api.delete(`/departamentos/${id}`);
    }
};
