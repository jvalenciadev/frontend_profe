// Tipos de Autenticación
export interface LoginCredentials {
    username: string;
    password: string;
}

export interface AuthResponse {
    access_token: string;
    user: User;
}

// Tipos de Usuario
export interface User {
    id: string;
    username: string;
    nombre: string;
    apellidos: string;
    correo: string;
    email?: string;
    imagen?: string;
    genero?: string;
    licenciatura?: string;
    direccion?: string;
    curriculum?: string;
    fechaNacimiento?: string;
    estadoCivil?: string;
    facebook?: string;
    tiktok?: string;
    cargo?: string;
    cargoPostulacionId?: string;
    celular?: number;
    tenantId?: string;
    personaId?: string;
    roleId?: string;
    sedeIds?: string;
    proIds?: string;
    role?: string | Role;
    roles: (string | Role | RolePivot)[];
    permissions: (Permission | PermissionPivot)[];
    tenant?: Tenant;
    activo?: boolean;
    estado?: string;
    sedes?: SedePivot[];
    cargoPostulacion?: any;
    ci?: string | number;
    requiresPasswordChange?: boolean;
    linkedinUrl?: string;
    hojaDeVidaPdf?: string;
    rdaPdf?: string;
    resumenProfesional?: string;
    experienciaLaboral?: string;
    habilidades?: string;
    idiomas?: string;
    licUniversitaria?: string;
    licMescp?: string;
}

// Tipos de Permisos
export interface Permission {
    id: string;
    name: string;
    action: string; // 'read' | 'create' | 'update' | 'delete' | 'manage'
    subject: string; // 'User' | 'Programa' | 'Sede' | 'all'
    conditions?: Record<string, any>;
    fields?: string[];
}

// Tipos de Rol
export interface Role {
    id: string;
    name: string;
    description?: string;
    guardName: string;
    permissions?: (Permission | PermissionPivot)[];
    rolePermissions?: (Permission | PermissionPivot)[];
}

export interface RolePivot {
    role: Role;
    userId?: string;
    roleId?: string;
}

export interface PermissionPivot {
    permission: Permission;
    roleId?: string;
    permissionId?: string;
}

export interface SedePivot {
    userId: string;
    sedeId: string;
    sede: Sede;
}

// Tipos de Tenant (Departamento)
export interface Tenant {
    id: string;
    nombre: string;
    abreviacion: string;
    estado: 'ACTIVO' | 'INACTIVO';
}

// Tipos de Sede
export interface Sede {
    id: string;
    nombre: string;
    nombreAbre?: string;
    descripcion: string;
    imagen?: string;
    nombreResp1?: string;
    cargoResp1?: string;
    imagenResp1?: string;
    nombreResp2?: string;
    cargoResp2?: string;
    imagenResp2?: string;
    contacto1: number;
    contacto2?: number;
    facebook?: string;
    tiktok?: string;
    whatsapp?: string;
    horario: string;
    turno: string;
    ubicacion: string;
    latitud?: number;
    longitud?: number;
    departamentoId: string;
}

// Tipos de Programa
export interface Programa {
    id: string;
    codigo?: string;
    nombre: string;
    nombreAbre?: string;
    contenido: string;
    horario?: string;
    cargaHoraria: number;
    costo: number;
    banner: string;
    afiche: string;
    convocatoria?: string;
    fechaIniIns: string;
    fechaFinIns: string;
    fechaIniClase: string;
    estadoInscripcion: boolean;
    duracionId: string;
    versionId: string;
    tipoId: string;
    modalidadId: string;
    tenantId: string;
}

// Tipos de Módulo
export interface Modulo {
    id: string;
    codigo?: string;
    nombre: string;
    descripcion: string;
    notaMinima: number;
    fechaInicio: string;
    fechaFin: string;
    programaId: string;
}

// Tipos de Inscripción
export interface Inscripcion {
    id: string;
    docDigital?: string;
    certificacion?: boolean;
    entregoCert?: boolean;
    folio?: string;
    partida?: string;
    carton?: string;
    licenciatura?: string;
    unidadEducativa?: string;
    nivel?: string;
    subsistema?: string;
    materia?: string;
    observacion?: string;
    programaId: string;
    turnoId: string;
    sedeId: string;
    estadoInscripcionId: string;
    personaId: string;
    tenantId?: string;
}

// Tipos Auxiliares
export interface Genero {
    id: string;
    nombre: string;
}

export interface AreaTrabajo {
    id: string;
    nombre: string;
}

export interface Duracion {
    id: string;
    nombre: string;
    semana: number;
}

export interface Version {
    id: string;
    nombre: string;
    numero: number;
    romano: string;
    gestion: string;
}

export interface TipoPrograma {
    id: string;
    nombre: string;
}

export interface Modalidad {
    id: string;
    nombre: string;
}

export interface Turno {
    id: string;
    nombre: string;
}

// Tipos de Tema
export type Theme = 'light' | 'dark' | 'system';
export type EffectiveTheme = 'light' | 'dark';
