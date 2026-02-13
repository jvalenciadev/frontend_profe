'use client';

import { ReactNode } from 'react';
import { useAbility } from '@/hooks/useAbility';

interface CanProps {
    action: string;
    subject: string | any;
    children: ReactNode;
    fallback?: ReactNode;
}

/**
 * Componente de Autorización Senior
 * Renderiza el contenido solo si el usuario tiene los permisos CASL necesarios.
 * 
 * @example
 * <Can action="update" subject="User">
 *   <EditButton />
 * </Can>
 */
export function Can({ action, subject, children, fallback = null }: CanProps) {
    const { can, isSuperAdmin } = useAbility();

    // Verificación de capacidad CASL o Bypass de Superadmin
    if (isSuperAdmin || can(action, subject)) {
        return <>{children}</>;
    }

    // Renderizado de respaldo (normalmente nada)
    return <>{fallback}</>;
}
