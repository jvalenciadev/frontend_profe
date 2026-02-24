import axios from 'axios';
import Cookies from 'js-cookie';
import { errorStore } from './error-store';
import { toast } from 'sonner';

// Configuración de constantes de entorno
const API_URL = process.env.NEXT_PUBLIC_API_URL || '';
// IMPORTANTE: El fallback debe coincidir con API_SECRET_KEY del backend
const API_SECRET = process.env.NEXT_PUBLIC_API_SECRET || 'mQsYt86mu5wiiqjmwyxYXMqeHVo4lRqIT6dQUwqYqzM=';

// Crear instancia de Axios con configuraciones base obligatorias
export const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
        'X-SECRET': API_SECRET
    },
});

// Interceptor de Request: Configuración de Seguridad Central
api.interceptors.request.use(
    (config) => {
        // Garantizar integridad de headers
        const secret = process.env.NEXT_PUBLIC_API_SECRET || 'mQsYt86mu5wiiqjmwyxYXMqeHVo4lRqIT6dQUwqYqzM=';

        // Inyección de Secret (X-SECRET)
        if (config.headers) {
            config.headers['X-SECRET'] = secret;
        }

        // Token de Sesión
        const token = Cookies.get('token');
        if (token && config.headers && !config.headers.Authorization) {
            config.headers.Authorization = `Bearer ${token}`;
        }

        // Timeout preventivo para redes inestables
        config.timeout = 15000;

        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Interceptor de Response: Manejar éxitos y errores globales
api.interceptors.response.use(
    (response) => {
        const isSilent = (response.config as any)._silent;
        if (isSilent) return response;

        // 1. Mensajes "Normales" (Éxito)
        const method = response.config?.method?.toUpperCase();

        // Solo mostrar éxito para mutaciones (evitar inundar con GETs)
        if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method || '')) {
            if (response.status === 201) {
                toast.success('¡Registro creado correctamente!', {
                    description: 'La operación se completó con éxito (201 Created).',
                    className: 'bg-emerald-500 text-white'
                });
            } else if (response.status === 204 || (response.status === 200 && method !== 'GET')) {
                toast.success('¡Operación exitosa!', {
                    description: 'Cambios guardados correctamente (Success).',
                    className: 'bg-emerald-600 text-white'
                });
            }
        }

        return response;
    },
    (error) => {
        const isSilent = (error.config as any)._silent;
        const backendError = error.response?.data;
        const status = error.response?.status;

        if (isSilent) return Promise.reject(error);

        // 2. Manejo de Sesión Expirada (401)
        if (status === 401) {
            Cookies.remove('token');
            Cookies.remove('user');

            // Redirigir al login solo en el cliente y si no estamos ya allí
            if (typeof window !== 'undefined' && !window.location.pathname.includes('/login')) {
                window.location.href = '/login';
            }
            return Promise.reject(error);
        }

        // 3. Otros Errores de Cliente (4xx) y Sistema (5xx)
        if (backendError && backendError.success === false) {
            // Si el backend mandó el formato estandarizado de error
            // Errores graves o lógicos (Conflict, Forbidden) van al Modal
            if ([403, 409, 500, 503].includes(status)) {
                errorStore.setError(backendError);
            } else {
                // Errores más comunes (400, 404) pueden ir como Toast para no ser tan intrusivos
                toast.error(`Error ${status}: ${backendError.title || 'Solicitud incorrecta'}`, {
                    description: backendError.message,
                    className: 'bg-rose-500 text-white'
                });
            }
        } else {
            // Error genérico o de red
            const genericMsg = status === 503
                ? 'Servidor en mantenimiento o sobrecargado (503).'
                : (error.message || 'Error de conexión con el servidor');

            errorStore.setError({
                success: false,
                statusCode: status || 500,
                timestamp: new Date().toISOString(),
                path: error.config?.url || 'unknown',
                method: error.config?.method || 'unknown',
                message: genericMsg,
                errorCode: 'SERVER_OR_NETWORK_ERROR'
            });
        }

        return Promise.reject(error);
    }
);

export default api;
