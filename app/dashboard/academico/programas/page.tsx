'use client';

import { useState, useEffect } from 'react';
import { Can } from '@/components/Can';
import api from '@/lib/api';
import { Programa } from '@/types';

export default function ProgramasPage() {
    const [programas, setProgramas] = useState<Programa[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        loadProgramas();
    }, []);

    const loadProgramas = async () => {
        try {
            setIsLoading(true);
            const { data } = await api.get<Programa[]>('/programas-maestros');
            setProgramas(data);
            setError('');
        } catch (err: any) {
            console.error('Error loading programas:', err);
            setError('Error al cargar los programas');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-[var(--text-main)]">
                        Programas Académicos
                    </h1>
                    <p className="text-[var(--text-secondary)] mt-1">
                        Gestión de programas de formación y capacitación
                    </p>
                </div>

                <Can action="create" subject="Programa">
                    <button className="btn btn-primary">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                        </svg>
                        Nuevo Programa
                    </button>
                </Can>
            </div>

            {/* Filtros */}
            <div className="card">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-[var(--text-main)] mb-2">
                            Buscar
                        </label>
                        <input
                            type="text"
                            placeholder="Nombre del programa..."
                            className="input"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-[var(--text-main)] mb-2">
                            Estado
                        </label>
                        <select className="input">
                            <option value="">Todos</option>
                            <option value="activo">Activos</option>
                            <option value="inactivo">Inactivos</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-[var(--text-main)] mb-2">
                            Tipo
                        </label>
                        <select className="input">
                            <option value="">Todos</option>
                            <option value="diplomado">Diplomado</option>
                            <option value="curso">Curso</option>
                            <option value="taller">Taller</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Tabla */}
            <div className="card">
                {isLoading ? (
                    <div className="flex items-center justify-center py-12">
                        <div className="flex flex-col items-center gap-4">
                            <div className="w-12 h-12 border-4 border-primary-600 border-t-transparent rounded-full animate-spin"></div>
                            <p className="text-[var(--text-secondary)]">Cargando programas...</p>
                        </div>
                    </div>
                ) : error ? (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                        {error}
                    </div>
                ) : programas.length === 0 ? (
                    <div className="text-center py-12">
                        <svg className="w-16 h-16 text-[var(--text-tertiary)] mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                        </svg>
                        <p className="text-[var(--text-secondary)] text-lg">No hay programas registrados</p>
                        <Can action="create" subject="Programa">
                            <button className="btn btn-primary mt-4">
                                Crear Primer Programa
                            </button>
                        </Can>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="table">
                            <thead>
                                <tr>
                                    <th>Código</th>
                                    <th>Nombre</th>
                                    <th>Tipo</th>
                                    <th>Modalidad</th>
                                    <th>Carga Horaria</th>
                                    <th>Costo</th>
                                    <th>Estado</th>
                                    <th className="text-right">Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                {programas.map((programa) => (
                                    <tr key={programa.id}>
                                        <td className="font-mono text-sm">{programa.codigo || 'N/A'}</td>
                                        <td>
                                            <div className="font-medium text-[var(--text-main)]">
                                                {programa.nombre}
                                            </div>
                                            {programa.nombreAbre && (
                                                <div className="text-xs text-[var(--text-tertiary)]">
                                                    {programa.nombreAbre}
                                                </div>
                                            )}
                                        </td>
                                        <td>
                                            <span className="badge badge-primary">
                                                {programa.tipoId}
                                            </span>
                                        </td>
                                        <td>
                                            <span className="badge">
                                                {programa.modalidadId}
                                            </span>
                                        </td>
                                        <td>{programa.cargaHoraria} hrs</td>
                                        <td className="font-medium">Bs. {programa.costo.toLocaleString()}</td>
                                        <td>
                                            {programa.estadoInscripcion ? (
                                                <span className="badge badge-success">Activo</span>
                                            ) : (
                                                <span className="badge badge-error">Inactivo</span>
                                            )}
                                        </td>
                                        <td>
                                            <div className="flex items-center justify-end gap-2">
                                                <Can action="read" subject="Programa">
                                                    <button
                                                        className="btn btn-sm btn-ghost"
                                                        title="Ver detalles"
                                                    >
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                                        </svg>
                                                    </button>
                                                </Can>

                                                <Can action="update" subject="Programa">
                                                    <button
                                                        className="btn btn-sm btn-ghost text-primary-600"
                                                        title="Editar"
                                                    >
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                        </svg>
                                                    </button>
                                                </Can>

                                                <Can action="delete" subject="Programa">
                                                    <button
                                                        className="btn btn-sm btn-ghost text-error-500"
                                                        title="Eliminar"
                                                    >
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                        </svg>
                                                    </button>
                                                </Can>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Paginación */}
            {!isLoading && programas.length > 0 && (
                <div className="flex items-center justify-between">
                    <p className="text-sm text-[var(--text-secondary)]">
                        Mostrando <span className="font-medium">{programas.length}</span> programas
                    </p>

                    <div className="flex items-center gap-2">
                        <button className="btn btn-sm btn-outline" disabled>
                            Anterior
                        </button>
                        <button className="btn btn-sm btn-primary">1</button>
                        <button className="btn btn-sm btn-outline">2</button>
                        <button className="btn btn-sm btn-outline">3</button>
                        <button className="btn btn-sm btn-outline">
                            Siguiente
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
