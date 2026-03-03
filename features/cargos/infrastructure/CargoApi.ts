import api from '@/lib/api';
import { Cargo, PaginatedCargos } from '../domain/Cargo';

export const CargoApi = {
    getAll: async (search?: string): Promise<Cargo[]> => {
        // Adapter pattern: El backend clean devuelve { data: ... }, lo mapeamos para que sea transparente
        const params = search ? { search } : {};
        const response = await api.get<PaginatedCargos>('/cargos', { params });
        return response.data.data;
    },

    getById: async (id: string): Promise<Cargo> => {
        const response = await api.get<Cargo>(`/cargos/${id}`);
        return response.data;
    },

    create: async (cargoData: Partial<Cargo>): Promise<Cargo> => {
        const response = await api.post<Cargo>('/cargos', cargoData);
        return response.data;
    },

    update: async (id: string, cargoData: Partial<Cargo>): Promise<Cargo> => {
        // NestJS clean controller usó PUT
        const response = await api.put<Cargo>(`/cargos/${id}`, cargoData);
        return response.data;
    },

    delete: async (id: string): Promise<void> => {
        await api.delete(`/cargos/${id}`);
    }
};
