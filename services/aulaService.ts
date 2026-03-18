import axios from 'axios';
import Cookies from 'js-cookie';

const API_URL = process.env.NEXT_PUBLIC_LMS_API_URL || 'http://localhost:3008/api/aula';
const API_SECRET = process.env.NEXT_PUBLIC_LMS_API_SECRET || 'LMS_SEC_key_2024_0bb62283a6691_aula_virtual';

const aulaApi = axios.create({
    baseURL: API_URL,
    headers: { 'X-SECRET': API_SECRET }
});

aulaApi.interceptors.request.use((config) => {
    // Usar exclusivamente aula_token (cookie)
    const token = Cookies.get('aula_token');

    if (token) config.headers.Authorization = `Bearer ${token}`;
    config.headers['X-SECRET'] = API_SECRET;
    return config;
});

aulaApi.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            if (typeof window !== 'undefined') {
                // Limpiar tokens y redirigir
                Cookies.remove('aula_token');
                Cookies.remove('aula_user');
                if (!window.location.pathname.includes('/aula/login')) {
                    window.location.href = '/aula/login';
                }
            }
        }
        return Promise.reject(error);
    }
);

export const aulaService = {
    // ─── AUTH ─────────────────────────────────────────────────────
    login: async (credentials: any) => {
        const response = await aulaApi.post('/auth/login', credentials);
        return response.data;
    },

    // ─── ESTUDIANTE ───────────────────────────────────────────────
    getMisCursos: async () => {
        const response = await aulaApi.get('/mis-cursos');
        return response.data;
    },

    getCursoDetalle: async (id: string, turnoId?: string) => {
        const response = await aulaApi.get(`/curso/${id}${turnoId ? `?turnoId=${turnoId}` : ''}`);
        return response.data;
    },

    getActividadDetalle: async (cursoId: string, actividadId: string) => {
        const response = await aulaApi.get(`/curso/${cursoId}/actividad/${actividadId}`);
        return response.data;
    },

    // ─── FOROS ────────────────────────────────────────────────────
    getForoPosts: async (foroId: string) => {
        const response = await aulaApi.get(`/foro/${foroId}/posts`);
        return response.data;
    },

    crearPost: async (foroId: string, data: { mensaje: string; padreId?: string }) => {
        const response = await aulaApi.post(`/foro/${foroId}/post`, data);
        return response.data;
    },

    // ─── TAREAS ───────────────────────────────────────────────────
    submitTarea: async (tareaId: string, data: { texto?: string, archivoUrl?: string }) => {
        const response = await aulaApi.post(`/tarea/${tareaId}/entrega`, data);
        return response.data;
    },

    verificarPago: async (inscripcionId: string) => {
        const response = await aulaApi.get(`/verificar-pago/${inscripcionId}`);
        return response.data;
    },

    // ─── FACILITADOR: DOCENCIA ────────────────────────────────────
    getDocencia: async () => {
        const response = await aulaApi.get('/docencia');
        return response.data;
    },

    getEstudiantes: async (moduloId: string, turnoId: string) => {
        const response = await aulaApi.get(`/docencia/${moduloId}/estudiantes?turnoId=${turnoId}`);
        return response.data;
    },

    // ─── FACILITADOR: UNIDADES ────────────────────────────────────
    getUnidades: async (moduloId: string, turnoId?: string) => {
        const response = await aulaApi.get(`/modulo/${moduloId}/unidades${turnoId ? `?turnoId=${turnoId}` : ''}`);
        return response.data;
    },

    crearUnidad: async (moduloId: string, data: { titulo: string; semana: number; descripcion?: string; orden?: number; fechaInicio?: string; fechaFin?: string; turnoId?: string }) => {
        const response = await aulaApi.post(`/modulo/${moduloId}/unidades`, data);
        return response.data;
    },

    actualizarUnidad: async (moduloId: string, id: string, data: { titulo?: string; semana?: number; descripcion?: string; orden?: number; fechaInicio?: string; fechaFin?: string; estado?: string }) => {
        const response = await aulaApi.put(`/modulo/${moduloId}/unidades/${id}`, data);
        return response.data;
    },

    eliminarUnidad: async (moduloId: string, id: string) => {
        const response = await aulaApi.delete(`/modulo/${moduloId}/unidades/${id}`);
        return response.data;
    },

    // ─── FACILITADOR: CATEGORÍAS (port 3008, GradingController) ──
    /**
     * Obtiene las categorías de calificación de un módulo.
     * Endpoint: GET /api/aula/modulo/:moduloId/categorias
     */
    getCategorias: async (moduloId: string, turnoId?: string) => {
        const response = await aulaApi.get(`/modulo/${moduloId}/categorias${turnoId ? `?turnoId=${turnoId}` : ''}`);
        return response.data;
    },

    /**
     * Crea una nueva categoría en el módulo (facilitador).
     * Endpoint: POST /api/aula/modulo/:moduloId/categorias
     */
    crearCategoria: async (moduloId: string, data: { nombre: string; peso: number; turnoId?: string; esEvalFinal?: boolean }) => {
        const response = await aulaApi.post(`/modulo/${moduloId}/categorias`, data);
        return response.data;
    },

    /**
     * Actualiza una categoría del módulo.
     * Endpoint: PUT /api/aula/modulo/:moduloId/categorias/:id
     */
    actualizarCategoria: async (moduloId: string, id: string, data: { nombre?: string; peso?: number; esEvalFinal?: boolean }) => {
        const response = await aulaApi.put(`/modulo/${moduloId}/categorias/${id}`, data);
        return response.data;
    },

    /**
     * Elimina una categoría del módulo (soft delete).
     * Endpoint: DELETE /api/aula/modulo/:moduloId/categorias/:id
     */
    eliminarCategoria: async (moduloId: string, id: string) => {
        const response = await aulaApi.delete(`/modulo/${moduloId}/categorias/${id}`);
        return response.data;
    },

    /**
     * Aplica la plantilla de categorías del tipo de programa al módulo.
     * Endpoint: POST /api/aula/modulo/:moduloId/categorias/aplicar
     */
    aplicarPlantilla: async (moduloId: string, turnoId?: string) => {
        const response = await aulaApi.post(`/modulo/${moduloId}/categorias/aplicar${turnoId ? `?turnoId=${turnoId}` : ''}`);
        return response.data;
    },

    // ─── FACILITADOR: ACTIVIDADES ─────────────────────────────────
    crearActividad: async (data: any) => {
        const response = await aulaApi.post('/actividades', data);
        return response.data;
    },

    actualizarActividad: async (id: string, data: any) => {
        const response = await aulaApi.put(`/actividades/${id}`, data);
        return response.data;
    },

    eliminarActividad: async (id: string) => {
        const response = await aulaApi.delete(`/actividades/${id}`);
        return response.data;
    },

    reordenarActividades: async (data: { id: string; orden: number }[]) => {
        const response = await aulaApi.post('/actividades/reordenar', data);
        return response.data;
    },

    // ─── RECURSOS ──────────────────────────────────────────────────
    crearRecurso: async (data: { unidadId: string; titulo: string; tipo: string; url: string; descripcion?: string; orden?: number }) => {
        const response = await aulaApi.post('/recursos', data);
        return response.data;
    },

    eliminarRecurso: async (id: string) => {
        const response = await aulaApi.delete(`/recursos/${id}`);
        return response.data;
    },

    actualizarRecurso: async (id: string, data: { titulo?: string; tipo?: string; url?: string; descripcion?: string }) => {
        const response = await aulaApi.put(`/recursos/${id}`, data);
        return response.data;
    },

    reordenarRecursos: async (data: { id: string; orden: number }[]) => {
        const response = await aulaApi.post('/recursos/reordenar', data);
        return response.data;
    },

    // ─── CALIFICACIONES ──────────────────────────────────────────
    getEntregas: async (actividadId: string) => {
        const response = await aulaApi.get(`/actividad/${actividadId}/entregas`);
        return response.data;
    },

    calificar: async (data: { actividadId: string; targetUserId: string; nota: number; retro?: string; tipoTarget: 'TAREA' | 'FORO' }) => {
        const response = await aulaApi.post('/calificar', data);
        return response.data;
    },

    // ─── ASISTENCIA ───────────────────────────────────────────────
    getAsistenciaModulo: async (moduloId: string, turnoId?: string) => {
        const response = await aulaApi.get(`/asistencia/modulo/${moduloId}${turnoId ? `?turnoId=${turnoId}` : ''}`);
        return response.data;
    },

    crearSesionAsistencia: async (moduloId: string, data: { fecha: string; turnoId?: string }) => {
        const response = await aulaApi.post(`/asistencia/modulo/${moduloId}`, data);
        return response.data;
    },

    getRegistrosAsistencia: async (sesionId: string) => {
        const response = await aulaApi.get(`/asistencia/sesion/${sesionId}/registros`);
        return response.data;
    },

    registrarAsistencia: async (sesionId: string, data: { registros: any[] }) => {
        const response = await aulaApi.post(`/asistencia/sesion/${sesionId}/registrar`, data);
        return response.data;
    },

    getMiAsistencia: async (moduloId: string) => {
        const response = await aulaApi.get(`/asistencia/modulo/${moduloId}/mi-asistencia`);
        return response.data;
    },

    getQrToken: async (sesionId: string): Promise<{
        token: string; sesionId: string; turnoId: string;
        sedeId: string; expiry: number; expiresInMinutes: number;
    }> => {
        const response = await aulaApi.get(`/asistencia/sesion/${sesionId}/qr-token`);
        return response.data;
    },

    marcarAsistenciaQR: async (token: string) => {
        const response = await aulaApi.post(`/asistencia/sesion/marcar-qr`, { token });
        return response.data;
    },

    // ─── CUESTIONARIOS ────────────────────────────────────────────
    getCuestionario: async (id: string) => {
        const response = await aulaApi.get(`/cuestionarios/${id}`);
        return response.data;
    },

    getCuestionarioByActividad: async (actId: string) => {
        const response = await aulaApi.get(`/cuestionarios/actividad/${actId}`);
        return response.data;
    },

    updateCuestionario: async (id: string, data: any) => {
        const response = await aulaApi.put(`/cuestionarios/${id}`, data);
        return response.data;
    },

    syncPreguntas: async (id: string, preguntas: any[]) => {
        const response = await aulaApi.post(`/cuestionarios/${id}/sync-preguntas`, { preguntas });
        return response.data;
    },

    getIntentosPorCuestionario: async (cuestionarioId: string) => {
        const response = await aulaApi.get(`/cuestionarios/${cuestionarioId}/intentos`);
        return response.data;
    },

    getQuizLobby: async (cuestionarioId: string) => {
        const response = await aulaApi.get(`/cuestionarios/${cuestionarioId}/lobby`);
        return response.data;
    },

    iniciarIntento: async (cuestionarioId: string) => {
        const response = await aulaApi.post(`/cuestionarios/${cuestionarioId}/iniciar`);
        return response.data;
    },

    responderPregunta: async (intentoId: string, data: { preguntaId: string; opcionId?: string; textoLibre?: string }) => {
        const response = await aulaApi.post(`/cuestionarios/intento/${intentoId}/responder`, data);
        return response.data;
    },

    finalizarIntento: async (intentoId: string) => {
        const response = await aulaApi.post(`/cuestionarios/intento/${intentoId}/finalizar`);
        return response.data;
    },

    // ─── NOTIFICACIONES ───────────────────────────────────────────
    getNotificaciones: async () => {
        const response = await aulaApi.get('/notificaciones');
        return response.data;
    },
    leerNotificacion: async (id: string) => {
        const response = await aulaApi.patch(`/notificaciones/${id}/leer`);
        return response.data;
    },
    eliminarNotificacion: async (id: string) => {
        const response = await aulaApi.delete(`/notificaciones/${id}`);
        return response.data;
    },
    marcarTodasLeidas: async () => {
        const response = await aulaApi.post('/notificaciones/leer-todo');
        return response.data;
    },

    // ─── INSIGNIAS ───────────────────────────────────────────────
    getMisInsignias: async () => {
        const response = await aulaApi.get('/insignias/me');
        return response.data;
    },

    getInsigniasTodas: async () => {
        const response = await aulaApi.get('/insignias/all');
        return response.data;
    },

    getInsigniasPorModulo: async (moduloId: string, turnoId?: string) => {
        const response = await aulaApi.get(`/insignias/modulo/${moduloId}${turnoId ? `?turnoId=${turnoId}` : ''}`);
        return response.data;
    },

    otorgarInsignia: async (targetUserId: string, insigniaId: string) => {
        const response = await aulaApi.post('/insignias/otorgar', { targetUserId, insigniaId });
        return response.data;
    },

    revocarInsignia: async (targetUserId: string, insigniaId: string) => {
        const response = await aulaApi.delete('/insignias/revocar', { data: { targetUserId, insigniaId } });
        return response.data;
    },

    // ─── ADMIN INSIGNIAS ───────────────────────────────────────────
    createInsignia: async (data: any) => {
        const response = await aulaApi.post('/insignias', data);
        return response.data;
    },

    updateInsignia: async (id: string, data: any) => {
        const response = await aulaApi.post(`/insignias/${id}/update`, data);
        return response.data;
    },

    deleteInsignia: async (id: string) => {
        const response = await aulaApi.delete(`/insignias/${id}`);
        return response.data;
    },

    // ─── REPORTES ──────────────────────────────────────────────────
    getReporteCalificaciones: async (moduloId: string, turnoId?: string) => {
        const response = await aulaApi.get(`/modulo/${moduloId}/reporte-calificaciones${turnoId ? `?turnoId=${turnoId}` : ''}`);
        return response.data;
    },

    // ─── UPLOADS ───────────────────────────────────────────────────
    uploadFile: async (tableName: string, formData: FormData) => {
        const response = await aulaApi.post(`/upload/${tableName}`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
        return response.data;
    },
};
