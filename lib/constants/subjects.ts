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

    // Territorial
    { label: 'Departamentos', value: 'Departamento' },
    { label: 'Provincias', value: 'provincia' },
    { label: 'Sedes', value: 'Sede' },
    { label: 'Distritos', value: 'distrito' },
    { label: 'Unidades Educativas', value: 'unidad_educativa' },
    { label: 'Galerías', value: 'Galeria' },

    // Académico
    { label: 'Programas (Maestría)', value: 'Programa' },
    { label: 'Programas (Ofertas)', value: 'ProgramaDos' },
    { label: 'Inscripciones de Programas', value: 'ProgramaInscripcion' },
    { label: 'Módulos', value: 'ProgramaModulo' },
    { label: 'Versiones de Programa', value: 'ProgramaVersion' },
    { label: 'Modalidades', value: 'ProgramaModalidad' },
    { label: 'Duraciones', value: 'ProgramaDuracion' },
    { label: 'Tipos de Programa', value: 'ProgramaTipo' },
    { label: 'Turnos', value: 'ProgramaTurno' },
    { label: 'Bauchers / Pagos', value: 'ProgramaBaucher' },

    // Comunicación
    { label: 'Blogs', value: 'Blog' },
    { label: 'Comunicados', value: 'Comunicado' },
    { label: 'Eventos', value: 'Evento' },
    { label: 'Inscripciones de Eventos', value: 'EventoInscripcion' },
    { label: 'Personas de Eventos', value: 'EventoPersona' },
    { label: 'Cuestionarios', value: 'EventoCuestionario' },
    { label: 'Preguntas de Eventos', value: 'evento_pregunta' },
    { label: 'Opciones de Preguntas', value: 'evento_opciones' },
    { label: 'Respuestas de Eventos', value: 'evento_respuestas' },
    { label: 'Videos', value: 'Video' },

    // RRHH / Banco Profesional
    { label: 'Cargos', value: 'Cargo' },
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
