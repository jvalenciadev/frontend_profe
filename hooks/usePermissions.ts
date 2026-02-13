'use client';

import { useAuth } from '@/contexts/AuthContext';

export function usePermissions() {
    const { checkPermission, hasRole, isSuperAdmin, ability } = useAuth();

    /**
     * Verificar si el usuario puede realizar una acción sobre un subject
     */
    const can = (action: string, subject: string): boolean => {
        return checkPermission(action, subject);
    };

    /**
     * Verificar si el usuario puede realizar TODAS las acciones sobre un subject
     */
    const canAll = (actions: string[], subject: string): boolean => {
        return actions.every((action) => checkPermission(action, subject));
    };

    /**
     * Verificar si el usuario puede realizar AL MENOS UNA de las acciones sobre un subject
     */
    const canAny = (actions: string[], subject: string): boolean => {
        return actions.some((action) => checkPermission(action, subject));
    };

    return {
        can,
        canAll,
        canAny,
        hasRole,
        isSuperAdmin,
        ability,
    };
}
