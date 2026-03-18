import api from '@/lib/api';
import { aulaService } from './aulaService';

const createCrudService = (endpoint: string) => ({
    getAll: async () => {
        const { data } = await api.get<any>(endpoint);
        return Array.isArray(data) ? data : (data?.data || []);
    },
    getById: async (id: string) => {
        const { data } = await api.get<any>(`${endpoint}/${id}`);
        return data;
    },
    create: async (payload: any) => {
        const { data } = await api.post<any>(endpoint, payload);
        return data;
    },
    update: async (id: string, payload: any) => {
        const { data } = await api.put<any>(`${endpoint}/${id}`, payload);
        return data;
    },
    delete: async (id: string) => {
        await api.delete(`${endpoint}/${id}`);
    }
});

export const programaVersionService = createCrudService('/versiones');
export const programaTurnoService = createCrudService('/turnos');
export const programaDuracionService = createCrudService('/duraciones');
export const programaModalidadService = createCrudService('/modalidades');
export const programaTipoService = createCrudService('/tipos');
export const programaInscripcionEstadoService = createCrudService('/estados-inscripcion');

export const insigniaService = {
    getAll: aulaService.getInsigniasTodas,
    create: (data: any) => aulaService.createInsignia(data),
    update: (id: string, data: any) => aulaService.updateInsignia(id, data),
    delete: (id: string) => aulaService.deleteInsignia(id)
};
