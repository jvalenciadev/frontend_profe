import api from '@/lib/api';

export const unidadAcademicaService = {
    getAll: async () => {
        const { data } = await api.get<any>('/unidades-educativas');
        if (Array.isArray(data)) return data;
        if (data.data && Array.isArray(data.data)) return data.data;
        return [];
    },

    getById: async (id: string) => {
        const { data } = await api.get<any>(`/unidades-educativas/${id}`);
        return data;
    },

    create: async (payload: any) => {
        const { data } = await api.post<any>('/unidades-educativas', payload);
        return data;
    },

    update: async (id: string, payload: any) => {
        const { data } = await api.put<any>(`/unidades-educativas/${id}`, payload);
        return data;
    },

    delete: async (id: string) => {
        await api.delete(`/unidades-educativas/${id}`);
    }
};
