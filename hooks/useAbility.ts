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
        /** Verificar si el usuario tiene un rol específico */
        hasRole: (roleName: string) => {
            const roles: string[] = [];
            if (user?.role) {
                if (typeof user.role === 'string') roles.push(user.role);
                else if ((user.role as any).name) roles.push((user.role as any).name);
            }
            if (user?.roles && Array.isArray(user.roles)) {
                user.roles.forEach((r: any) => {
                    if (typeof r === 'string') roles.push(r);
                    else if (r?.role?.name) roles.push(r.role.name);
                    else if (r?.name) roles.push(r.name);
                });
            }
            return roles.includes(roleName) || isSuperAdmin();
        },
        /** Cerrar sesión */
        logout,
        /** El usuario actual para comparaciones */
        user
    };
}
