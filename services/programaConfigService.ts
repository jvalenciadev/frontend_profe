import api from '@/lib/api';

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
