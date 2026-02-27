import api from '@/lib/api';

export interface BancoProfesional {
    id: string;
    licUniversitaria: string | null;
    licMescp: string | null;
    esMaestro: boolean;
    tieneProduccion: boolean;
    categoriaId: string | null;
    cargoId: string;
    cargoPostulacionId?: string;
    cargoPostulacion?: { nombre: string; };
    nombre: string;
    apellidos: string;
    ci: string | number;
    estado: string;
    hojaDeVidaPdf: string | null;
    correo?: string;
    fechaNacimiento?: string;
    resumenProfesional?: string;
    habilidades?: string;
    idiomas?: string;
    experienciaLaboral?: string;
    linkedinUrl?: string;
    celular?: string | number;
    direccion?: string;
    genero?: string;
    estadoCivil?: string;
    imagen?: string;
    postgrados?: any[];
    produccionIntelectual?: any[];
    rda?: string | number | null;
    rdaPdf?: string | null;
    user?: {
        id: string;
        nombre: string;
        apellidos: string;
        correo: string;
        username: string;
        ci: string;
        rda?: string | number | null;
        fechaNacimiento: string;
        celular?: string | number;
        direccion?: string;
        genero?: string;
        estadoCivil?: string;
        imagen?: string;
        departamento?: string;
    };
}

export const bancoProfesionalService = {
    getAll: async () => {
        const response = await api.get<BancoProfesional[]>('/banco-profesional');
        return response.data;
    },

    create: async (data: any) => {
        const response = await api.post<BancoProfesional>('/banco-profesional/registrar', data);
        return response.data;
    },

    getMiFicha: async () => {
        const response = await api.get<BancoProfesional>('/banco-profesional/mi-ficha');
        return response.data;
    },

    updateMiFicha: async (data: any) => {
        const response = await api.patch<BancoProfesional>('/banco-profesional/mi-ficha', data);
        return response.data;
    },

    aprobar: async (id: string, roleId: string, tenantId?: string, status?: string) => {
        const response = await api.patch(`/banco-profesional/${id}/aprobar`, { roleId, tenantId, status });
        return response.data;
    },

    // Postgrados
    getPosgrados: async (id: string) => {
        const response = await api.get<any[]>(`/banco-profesional/${id}/posgrados`);
        return response.data;
    },

    addPosgrado: async (id: string, data: any) => {
        const response = await api.post(`/banco-profesional/${id}/posgrados`, data);
        return response.data;
    },

    updatePosgrado: async (posgradoId: string, data: any) => {
        const response = await api.patch(`/banco-profesional/posgrados/${posgradoId}`, data);
        return response.data;
    },

    removePosgrado: async (posgradoId: string) => {
        await api.delete(`/banco-profesional/posgrados/${posgradoId}`);
    },

    // Produccion Intelectual
    getProduccion: async (id: string) => {
        const response = await api.get<any[]>(`/banco-profesional/${id}/produccion`);
        return response.data;
    },

    addProduccion: async (id: string, data: any) => {
        const response = await api.post(`/banco-profesional/${id}/produccion`, data);
        return response.data;
    },

    updateProduccion: async (produccionId: string, data: any) => {
        const response = await api.patch(`/banco-profesional/produccion/${produccionId}`, data);
        return response.data;
    },

    removeProduccion: async (produccionId: string) => {
        await api.delete(`/banco-profesional/produccion/${produccionId}`);
    },

    // Config (Public)
    getConfig: async () => {
        const [cargos, categorias, tiposPosgrado] = await Promise.all([
            api.get('/public/banco-profesional/config/cargos'),
            api.get('/public/banco-profesional/config/categorias'),
            api.get('/public/banco-profesional/config/tipos-posgrado')
        ]);
        return {
            cargos: cargos.data,
            categorias: categorias.data,
            tiposPosgrado: tiposPosgrado.data
        };
    },

    requestVerification: async (email: string) => {
        const response = await api.post('/public/banco-profesional/request-verification', { email });
        return response.data;
    }
};

export default bancoProfesionalService;
