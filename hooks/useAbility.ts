'use client';

import { useAuth } from '@/contexts/AuthContext';
import { AppAbility } from '@/lib/ability';

/**
 * Hook Especializado para el consumo de Abilities en el Frontend
 * Proporciona acceso directo al objeto ability de CASL y métodos rápidos.
 */
export function useAbility() {
    const { ability, user, isSuperAdmin, logout } = useAuth();

    return {
        /** Instancia pura de CASL Ability */
        ability: ability as AppAbility,
        /** Función rápida para check condicional */
        can: (action: string, subject: string | any) => ability.can(action, subject),
        /** Indica si el usuario es superadmin (bypass total) */
        isSuperAdmin: isSuperAdmin(),
        /** Cerrar sesión */
        logout,
        /** El usuario actual para comparaciones */
        user
    };
}
