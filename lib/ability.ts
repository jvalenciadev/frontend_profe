import { AbilityBuilder, createMongoAbility, MongoAbility, RawRuleOf } from '@casl/ability';
import { User, Permission } from '@/types';

// Definir el tipo de Ability (Usamos MongoAbility para soportar condiciones)
export type AppAbility = MongoAbility;

/**
 * Función Principal sugerida por el Arq. Senior para convertir 
 * los permisos brutos de la API en reglas de CASL.
 */
export function defineAbilityFromPermissions(permissions: Permission[], roles: string[] = []): AppAbility {
    const { can, build } = new AbilityBuilder<AppAbility>(createMongoAbility);

    // 1. OBLIGATORIO: Bypass para Super Administrador
    // Si el usuario es superadmin, tiene acceso total 'manage' a 'all'
    if (roles.includes('ADMINISTRADOR_SISTEMA') || roles.includes('SUPER_ADMIN')) {
        can('manage', 'all'); // Usamos 'manage' para máxima autoridad en CASL
        return build();
    }

    // 2. Procesar permisos dinámicos del backend
    if (permissions && permissions.length > 0) {
        permissions.forEach((perm) => {
            const { action, subject, conditions, fields } = perm;

            // Mapeamos los campos si existen
            const options: any = {};
            if (fields && Array.isArray(fields) && fields.length > 0) {
                // CASL permite restringir campos específicos
                can(action, subject, fields, conditions);
            } else {
                // Registro de regla con condiciones (ABAC)
                can(action, subject, conditions);
            }
        });
    }

    // 3. Generar la instancia de Ability final
    return build({
        // Esto permite a CASL identificar el tipo de objeto para comparaciones de condiciones
        detectSubjectType: (item) => {
            if (typeof item === 'string') return item;
            return item.__typename || item.constructor.name;
        }
    });
}
