import api from '@/lib/api';

export const programaLookupService = {
    getTipos: async () => {
        const { data } = await api.get<any>('/tipos');
        return Array.isArray(data) ? data : (data?.data || []);
    },
    getModalidades: async () => {
        const { data } = await api.get<any>('/modalidades');
        return Array.isArray(data) ? data : (data?.data || []);
    },
    getDuraciones: async () => {
        const { data } = await api.get<any>('/duraciones');
        return Array.isArray(data) ? data : (data?.data || []);
    },
    getDepartamentos: async () => {
        const { data } = await api.get<any>('/departments');
        return Array.isArray(data) ? data : (data?.data || []);
    },
    getVersiones: async () => {
        const { data } = await api.get<any>('/versiones');
        return Array.isArray(data) ? data : (data?.data || []);
    },
    getTurnos: async () => {
        const { data } = await api.get<any>('/turnos');
        return Array.isArray(data) ? data : (data?.data || []);
    }
};
