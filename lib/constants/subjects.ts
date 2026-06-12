export const AVAILABLE_SUBJECTS = [
    { label: 'Acceso Total', value: 'all' },
    { label: 'Usuarios', value: 'User' },
    { label: 'Suplantar Identidad', value: 'Impersonate' },
    { label: 'Roles', value: 'Role' },
    { label: 'Permisos', value: 'Permission' },
    { label: 'Logs de Auditoría', value: 'AuditLog' },
    { label: 'Dispositivos', value: 'token_dispositivo' },
    { label: 'Institución (PROFE)', value: 'Profe' },

    // Territorial
    { label: 'Departamentos', value: 'Departamento' },
    { label: 'Provincias', value: 'Provincia' },
    { label: 'Sedes', value: 'Sede' },
    { label: 'Distritos', value: 'Distrito' },
    { label: 'Unidades Educativas', value: 'UnidadEducativa' },
    { label: 'Galerías', value: 'Galeria' },

    // Mapeos / Catálogos
    { label: 'Mapeo Personas', value: 'MapPersona' },
    { label: 'Mapeo Categorías', value: 'MapCategoria' },
    { label: 'Mapeo Cargos', value: 'MapCargo' },
    { label: 'Cargos', value: 'Cargo' },
    { label: 'Mapeo Especialidades', value: 'MapEspecialidad' },
    { label: 'Mapeo Niveles', value: 'MapNivel' },
    { label: 'Mapeo Subsistemas', value: 'MapSubsistema' },
    { label: 'Mapeo Géneros', value: 'MapGenero' },
    { label: 'Mapeo Áreas', value: 'MapArea' },

    // Académico (Estructura)
    { label: 'Programas (Master)', value: 'Programa' },
    { label: 'Programas (Ofertas)', value: 'ProgramaDos' },
    { label: 'Inscripciones de Programas', value: 'ProgramaInscripcion' },
    { label: 'Inscripción Estados', value: 'ProgramaInscripcionEstado' },
    { label: 'Restricciones de Programa', value: 'programa_restriccion' },
    { label: 'Módulos de Oferta', value: 'ProgramaModulo' },
    { label: 'Módulos por Versión', value: 'ProgramaModuloVersion' },
    { label: 'Versiones de Programa', value: 'ProgramaVersion' },
    { label: 'Modalidades', value: 'ProgramaModalidad' },
    { label: 'Duraciones', value: 'ProgramaDuracion' },
    { label: 'Tipos de Programa', value: 'ProgramaTipo' },
    { label: 'Turnos', value: 'ProgramaTurno' },
    { label: 'Bauchers / Pagos', value: 'Baucher' },
    { label: 'Facilitadores', value: 'ProgramaDosFacilitador' },
    { label: 'Asignación de Facilitadores', value: 'AsignacionFacilitador' },
    { label: 'Turnos de Oferta', value: 'ProgramaDosTurno' },

    // Comunicación
    { label: 'Blogs', value: 'Blog' },
    { label: 'Comunicados', value: 'Comunicado' },
    { label: 'Videos', value: 'Video' },

    // Eventos
    { label: 'Eventos', value: 'Evento' },
    { label: 'Tipo de Evento', value: 'TipoEvento' },
    { label: 'Inscripciones de Eventos', value: 'EventoInscripcion' },
    { label: 'Personas de Eventos', value: 'EventoPersona' },
    { label: 'Cuestionarios de Eventos', value: 'EventoCuestionario' },
    { label: 'Preguntas de Eventos', value: 'evento_pregunta' },
    { label: 'Opciones de Cuestionarios', value: 'evento_opciones' },
    { label: 'Respuestas de Cuestionarios', value: 'evento_respuestas' },
    { label: 'Restricciones de Eventos', value: 'evento_restriccion' },
    { label: 'Intentos de Cuestionario', value: 'EventoCuestionarioIntento' },
    { label: 'Campos Extra de Eventos', value: 'EventoCampoExtra' },
    { label: 'Respuestas Campos Extra', value: 'EventoCampoExtraRespuesta' },

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

    // Correspondencia
    { label: 'Correspondencia Documentos', value: 'CorDocumento' },
    { label: 'Correspondencia Participantes', value: 'CorParticipante' },
    { label: 'Correspondencia Seguimientos', value: 'CorSeguimiento' },

    // Configuración Técnica
    { label: 'Configuración de Archivos', value: 'UploadConfig' },
] as const;
