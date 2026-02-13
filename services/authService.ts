import api from '@/lib/api';
import { LoginCredentials, AuthResponse, User } from '@/types';

export const authService = {
    /**
     * Login de usuario
     */
    async login(credentials: LoginCredentials): Promise<AuthResponse> {
        const { data } = await api.post<AuthResponse>('/auth/login', credentials);
        return data;
    },

    /**
     * Obtener perfil del usuario autenticado
     */
    async getProfile(token?: string): Promise<User> {
        const config = token
            ? { headers: { Authorization: `Bearer ${token}` } }
            : {};
        const { data } = await api.get<User>('/auth/profile', config);
        return data;
    },

    /**
     * Recovery Password Phase 1: Request Reset Link
     */
    async forgotPassword(email: string): Promise<void> {
        await api.post('/auth/forgot-password', { email });
    },

    /**
     * Recovery Password Phase 2: Reset Password with Token
     */
    async resetPassword(token: string, password: string): Promise<void> {
        await api.post('/auth/reset-password', { token, password });
    },

    /**
     * Logout (limpieza en cliente)
     */
    logout(): void {
        // La limpieza de cookies se hace en el AuthContext
    },
};

export default authService;
