/**
 * Lista maestra de Sujetos (Subjects) para el sistema de Roles y Permisos.
 * Basada en los modelos de la base de datos (Prisma).
 */
/**
 * Lista maestra de Sujetos (Subjects) para el sistema de Roles y Permisos.
 * Basada en los modelos de la base de datos (Prisma).
 */
export const AVAILABLE_SUBJECTS = [
    { label: 'Acceso Total', value: 'all' },
    { label: 'Usuarios', value: 'User' },
    { label: 'Roles', value: 'Role' },
    { label: 'Permisos', value: 'Permission' },
    { label: 'Logs de Auditoría', value: 'AuditLog' },
    { label: 'Institución (PROFE)', value: 'Profe' },
    { label: 'Géneros', value: 'Genero' },
    { label: 'Áreas', value: 'Area' },

    // Territorial
    { label: 'Departamentos', value: 'Departamento' },
    { label: 'Provincias', value: 'Provincia' },
    { label: 'Sedes', value: 'Sede' },
    { label: 'Distritos', value: 'Distrito' },
    { label: 'Unidades Educativas', value: 'UnidadEducativa' },
    { label: 'Galerías', value: 'Galeria' },

    // Académico
    { label: 'Programas (Maestría)', value: 'Programa' },
    { label: 'Programas (Ofertas)', value: 'ProgramaDos' },
    { label: 'Inscripciones de Programas', value: 'ProgramaInscripcion' },
    { label: 'Módulos Maestros', value: 'ModuloMaestro' },
    { label: 'Módulos de Oferta', value: 'ProgramaModulo' },
    { label: 'Módulos por Versión', value: 'ProgramaModuloVersion' },
    { label: 'Versiones de Programa', value: 'ProgramaVersion' },
    { label: 'Modalidades', value: 'ProgramaModalidad' },
    { label: 'Asignación Facilitador', value: 'AsignacionFacilitador' },
    { label: 'Duraciones', value: 'ProgramaDuracion' },
    { label: 'Tipos de Programa', value: 'ProgramaTipo' },
    { label: 'Turnos', value: 'ProgramaTurno' },
    { label: 'Bauchers / Pagos', value: 'ProgramaBaucher' },
    { label: 'Facilitadores', value: 'ProgramaDosFacilitador' },

    // Comunicación
    { label: 'Blogs', value: 'Blog' },
    { label: 'Comunicados', value: 'Comunicado' },
    { label: 'Eventos', value: 'Evento' },
    { label: 'Tipo de Evento', value: 'EventoTipo' },
    { label: 'Inscripciones de Eventos', value: 'EventoInscripcion' },
    { label: 'Personas de Eventos', value: 'EventoPersona' },
    { label: 'Cuestionarios', value: 'EventoCuestionario' },
    { label: 'Preguntas de Eventos', value: 'EventoPregunta' },
    { label: 'Opciones de Preguntas', value: 'EventoOpciones' },
    { label: 'Respuestas de Eventos', value: 'EventoRespuestas' },
    { label: 'Videos', value: 'Video' },

    // RRHH / Banco Profesional
    { label: 'Cargos', value: 'Cargo' },
    { label: 'Personas (Mapeo)', value: 'MapPersona' },
    { label: 'Categorías (Mapeo)', value: 'MapCategoria' },
    { label: 'Posgrados (Banco)', value: 'bp_posgrado' },
    { label: 'Producción Intelectual', value: 'bp_produccion_intelectual' },
    { label: 'Tipos de Posgrado', value: 'bp_tipo_posgrado' },

    // Evaluaciones
    { label: 'Evaluaciones', value: 'EvaluacionAdmins' },
    { label: 'Criterios de Evaluación', value: 'EvaluacionCriterio' },
    { label: 'Periodos de Evaluación', value: 'EvaluacionPeriodo' },
    { label: 'Puntajes de Evaluación', value: 'EvaluacionPuntaje' },
] as const;

export type SubjectValue = typeof AVAILABLE_SUBJECTS[number]['value'];
