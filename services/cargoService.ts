import api from '@/lib/api';

export interface Cargo {
    id: string;
    nombre: string;
    estado: string;
}

export const cargoService = {
    getAll: async () => {
        // Adaptamos la respuesta del backend Clean Architecture que devuelve { data: [] } 
        // para que funcione con los modulos legacy que esperan un Array.
        const response = await api.get<any>('/cargos');
        return Array.isArray(response.data.data) ? response.data.data : response.data;
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
