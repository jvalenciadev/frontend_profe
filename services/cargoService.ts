import api from '@/lib/api';

export interface Cargo {
    id: string;
    nombre: string;
    estado: string;
}

export const cargoService = {
    getAll: async () => {
        const response = await api.get<Cargo[]>('/cargos');
        return response.data;
    },

    getById: async (id: string) => {
        const response = await api.get<Cargo>(`/cargos/${id}`);
        return response.data;
    },

    create: async (data: Partial<Cargo>) => {
        const response = await api.post<Cargo>('/cargos', data);
        return response.data;
    },

    update: async (id: string, data: Partial<Cargo>) => {
        const response = await api.patch<Cargo>(`/cargos/${id}`, data);
        return response.data;
    },

    delete: async (id: string) => {
        const response = await api.delete(`/cargos/${id}`);
        return response.data;
    }
};
