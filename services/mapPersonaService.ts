import api from '@/lib/api';

export interface MapCatalogo {
    id: string;
    nombre: string;
    estado: string;
}

export interface MapPersona {
    id: string;
    ci: string;
    complemento?: string;
    nombre1: string;
    nombre2?: string;
    apellido1: string;
    apellido2?: string;
    rda?: number;
    celular: number;
    correo: string;
    estado: string;
    cargo?: MapCatalogo;
    categoria?: MapCatalogo;
    nivel?: MapCatalogo;
    subsistema?: MapCatalogo;
    especialidad?: MapCatalogo;
    genero?: MapCatalogo;
    area?: MapCatalogo;
    fechaNacimiento?: string;
    enFuncion: boolean;
    libretaMilitar: boolean;
}

export interface MapStats {
    total: number;
    recientes: number;
    kpis: {
        operativos: number;
        noOperativos: number;
        libretaMilitar: number;
        noLibretaMilitar: number;
        conRda: number;
        sinRda: number;
        coberturaCorreo: number;
        digitalizacion: number;
    };
    cargos: { name: string; value: number }[];
    especialidades: { name: string; value: number }[];
    categorias: { name: string; value: number }[];
    generos: { name: string; value: number }[];
    areas: { name: string; value: number }[];
    subsistemas: { name: string; value: number }[];
    niveles: { name: string; value: number }[];
}

export interface ImportJobStatus {
    jobId: string;
    total: number;
    current: number;
    success: number;
    updated: number;
    errors: {
        row: number;
        ci: string;
        nombre?: string;
        error: string;
    }[];
    status: 'processing' | 'completed' | 'failed' | 'cancelled';
}

export const mapPersonaService = {
    getAll: async (params: any = {}) => {
        const response = await api.get('/map-personas', {
            params,
            timeout: 60000
        });
        return response.data;
    },

    getStats: async (): Promise<MapStats> => {
        const response = await api.get('/map-personas/stats', {
            timeout: 60000
        });
        return response.data;
    },

    startImport: async (file: File, jobId: string) => {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('jobId', jobId);

        const response = await api.post('/map-personas/import', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
            timeout: 300000,
        });
        return response.data;
    },

    getImportStatus: async (jobId: string): Promise<ImportJobStatus> => {
        const response = await api.get(`/map-personas/import/status/${jobId}`);
        return response.data;
    },

    cancelImport: async (jobId: string) => {
        const response = await api.post(`/map-personas/import/cancel/${jobId}`);
        return response.data;
    },

    delete: async (id: string) => {
        await api.delete(`/map-personas/${id}`);
    }
};

export const mapCargoService = {
    getAll: async () => {
        const response = await api.get<MapCatalogo[]>('/map-personas/catalogs/cargos');
        return response.data;
    }
};

export const mapCategoriaService = {
    getAll: async () => {
        const response = await api.get<MapCatalogo[]>('/map-personas/catalogs/categorias');
        return response.data;
    }
};

export const mapNivelService = {
    getAll: async () => {
        const response = await api.get<MapCatalogo[]>('/map-personas/catalogs/niveles');
        return response.data;
    }
};

export const mapSubsistemaService = {
    getAll: async () => {
        const response = await api.get<MapCatalogo[]>('/map-personas/catalogs/subsistemas');
        return response.data;
    }
};

export const mapEspecialidadService = {
    getAll: async () => {
        const response = await api.get<MapCatalogo[]>('/map-personas/catalogs/especialidades');
        return response.data;
    }
};

export const mapGeneroService = {
    getAll: async () => {
        const response = await api.get<MapCatalogo[]>('/map-personas/catalogs/generos');
        return response.data;
    }
};

export const mapAreaService = {
    getAll: async () => {
        const response = await api.get<MapCatalogo[]>('/map-personas/catalogs/areas');
        return response.data;
    }
};

export default mapPersonaService;
