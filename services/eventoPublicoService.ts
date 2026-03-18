import { viewsApi as publicApi } from '@/lib/api';

export const eventoPublicoService = {
    // Obtener detalle de evento por código o ID
    getEvento: async (codigo: string) => {
        const { data } = await publicApi.get(`/public/eventos/${codigo}`);
        return data;
    },

    // Buscar persona por CI y fecha de nacimiento
    buscarPersona: async (ci: string, fechaNacimiento: string) => {
        const { data } = await publicApi.post('/public/eventos/persona/buscar', { ci, fechaNacimiento });
        return data;
    },

    // Inscribirse a un evento
    inscribirse: async (eventoId: string, datos: any) => {
        const { data } = await publicApi.post(`/public/eventos/${eventoId}/inscribir`, datos);
        return data;
    },

    // Verificar si ya está inscrito
    verificarInscripcion: async (eventoId: string, ci: string, fechaNacimiento: string) => {
        const { data } = await publicApi.post(`/public/eventos/${eventoId}/verificar-inscripcion`, { ci, fechaNacimiento });
        return data;
    },

    // Registrar asistencia con código
    registrarAsistencia: async (eventoId: string, ci: string, fechaNacimiento: string, codigoAsistencia: string) => {
        const { data } = await publicApi.post(`/public/eventos/${eventoId}/asistencia`, { ci, fechaNacimiento, codigoAsistencia });
        return data;
    },

    // Enviar respuestas de cuestionario
    responderCuestionario: async (eventoId: string, cuestionarioId: string, datos: {
        ci: string;
        fechaNacimiento: string;
        respuestas: Array<{
            preguntaId: string;
            opcionId?: string;
            opciones?: string[];
            texto?: string;
        }>;
    }) => {
        const { data } = await publicApi.post(`/public/eventos/${eventoId}/cuestionario/${cuestionarioId}/responder`, datos);
        return data;
    },

    // Obtener resultado del cuestionario
    getResultado: async (eventoId: string, cuestionarioId: string, ci: string, fechaNacimiento: string) => {
        const { data } = await publicApi.post(`/public/eventos/${eventoId}/cuestionario/${cuestionarioId}/resultado`, { ci, fechaNacimiento });
        return data;
    },

    // Obtener progreso de inscripciones y cuestionarios
    getProgreso: async (eventoId: string, ci: string, fechaNacimiento: string) => {
        const { data } = await publicApi.post(`/public/eventos/${eventoId}/progreso`, { ci, fechaNacimiento });
        return data;
    },

    // Registrar que el video fue visto
    marcarVideoVisto: async (eventoId: string, cuestionarioId: string, ci: string, fechaNacimiento: string) => {
        const { data } = await publicApi.post(`/public/eventos/${eventoId}/cuestionario/${cuestionarioId}/marcar-video`, { ci, fechaNacimiento });
        return data;
    },
};
