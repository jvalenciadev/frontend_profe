'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useInscripcions } from '@/features/inscripcion/application/useInscripcions';
import { useOfertas } from '@/features/oferta/application/useOfertas';
import { sedeService } from '@/services/sedeService';
import { programaInscripcionEstadoService } from '@/services/programaConfigService';
import { userService } from '@/services/userService';
import { roleService } from '@/services/roleService';
import { inscripcionService } from '@/services/inscripcionService';
import { mapPersonaService } from '@/services/mapPersonaService';
import * as XLSX from 'xlsx';
import {
    Plus,
    Search,
    Filter,
    Download,
    Eye,
    Edit2,
    Trash2,
    MoreVertical,
    Users,
    ChevronLeft,
    ChevronRight,
    Building2,
    Calendar,
    CheckCircle2,
    XCircle,
    Loader2,
    UserPlus,
    FileDigit,
    ArrowUpRight,
    MapPin,
    Clock,
    DollarSign,
    RefreshCw,
    BookOpen,
    Info,
    Stamp,
    Printer,
    ArrowRightCircle,
    Tag,
    ChevronDown,
    ChevronUp,
    ArrowLeftRight,
    Sparkles,
    Check,
    AlertCircle,
    User,
    GraduationCap,
    X,
    Star
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Modal } from '@/components/Modal';
import { Card } from '@/components/ui/Card';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { InscripcionPDF } from '@/components/academico/InscripcionPDF';
import { useProfe } from '@/contexts/ProfeContext';
import { PDFDownloadLink } from '@react-pdf/renderer';
import { InscritosModal } from '@/components/academico/InscritosModal';
import { ConfirmModal } from '@/components/ConfirmModal';

// ─── HELPER: Validar Edad (17 a 120 años) y Calendario Real ────────────────
export const isValidAge = (dateStr: string): { valid: boolean; error?: string } => {
    if (!dateStr) return { valid: false, error: 'Por favor, ingresa tu fecha de nacimiento.' };
    const parts = dateStr.split('-');
    if (parts.length !== 3) return { valid: false, error: 'Fecha de nacimiento inválida.' };
    const yr = Number(parts[0]);
    const mo = Number(parts[1]);
    const dy = Number(parts[2]);
    if (isNaN(yr) || isNaN(mo) || isNaN(dy)) return { valid: false, error: 'Fecha de nacimiento inválida.' };

    if (mo < 1 || mo > 12) {
        return { valid: false, error: 'El mes debe estar entre 01 y 12.' };
    }

    const esBisiesto = yr % 4 === 0 && (yr % 100 !== 0 || yr % 400 === 0);
    const diasPorMes = [31, esBisiesto ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

    if (dy < 1 || dy > diasPorMes[mo - 1]) {
        return { valid: false, error: `El día ingresado (${dy}) no es válido para el mes especificado.` };
    }

    const born = new Date(yr, mo - 1, dy);
    const now = new Date();
    let age = now.getFullYear() - born.getFullYear();
    const mDiff = now.getMonth() - born.getMonth();
    if (mDiff < 0 || (mDiff === 0 && now.getDate() < born.getDate())) age--;

    if (age < 17) {
        return { valid: false, error: 'La persona debe tener al menos 17 años de edad para registrarse.' };
    }
    if (age > 120) {
        return { valid: false, error: 'Fecha de nacimiento no válida (mayor a 120 años).' };
    }
    return { valid: true };
};


// ─── COMPONENTE: Input de Fecha D/M/A (sin calendar nativo) ────────────────
function DateInputDMY({
    value,
    onChange,
    className = '',
    disabled = false,
}: {
    value: string;
    onChange: (isoDate: string) => void;
    className?: string;
    disabled?: boolean;
}) {
    // Estado interno independiente: permite escritura parcial sin que el padre
    // destruya lo escrito al recibir '' como valor incompleto.
    const parse = (v: string) => {
        if (!v) return { d: '', m: '', y: '' };
        const [yr, mo, dy] = v.split('-');
        return { d: dy ? String(Number(dy)) : '', m: mo ? String(Number(mo)) : '', y: yr || '' };
    };
    const init = parse(value);
    const [d, setD] = React.useState(init.d);
    const [m, setM] = React.useState(init.m);
    const [y, setY] = React.useState(init.y);

    // Sincronizar si el padre limpia el valor desde afuera (ej: reset del form o autocompletado de MAP)
    const lastEmitted = React.useRef(value);
    React.useEffect(() => {
        if (value !== lastEmitted.current) {
            lastEmitted.current = value;
            if (!value) {
                setD('');
                setM('');
                setY('');
            } else {
                const parsed = parse(value);
                setD(parsed.d);
                setM(parsed.m);
                setY(parsed.y);
            }
        }
    }, [value]);

    const dayRef = React.useRef<HTMLInputElement>(null);
    const monRef = React.useRef<HTMLInputElement>(null);
    const yearRef = React.useRef<HTMLInputElement>(null);

    const [ageError, setAgeError] = React.useState('');

    const emit = (dd: string, mm: string, yy: string) => {
        if (dd && mm && yy.length === 4) {
            const dy = Number(dd), mo = Number(mm), yr = Number(yy);

            // Validar existencia real del mes y día antes de evaluar la edad
            if (mo < 1 || mo > 12) {
                setAgeError('El mes debe estar entre 01 y 12.');
                lastEmitted.current = '';
                onChange('');
                return;
            }
            const esBisiesto = yr % 4 === 0 && (yr % 100 !== 0 || yr % 400 === 0);
            const diasPorMes = [31, esBisiesto ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
            if (dy < 1 || dy > diasPorMes[mo - 1]) {
                setAgeError('El día ingresado es inválido para ese mes.');
                lastEmitted.current = '';
                onChange('');
                return;
            }

            const born = new Date(yr, mo - 1, dy);
            const now = new Date();
            let age = now.getFullYear() - born.getFullYear();
            const mDiff = now.getMonth() - born.getMonth();
            if (mDiff < 0 || (mDiff === 0 && now.getDate() < born.getDate())) age--;

            if (age < 17) {
                setAgeError('La persona debe tener al menos 17 años.');
            } else if (age > 120) {
                setAgeError('Fecha de nacimiento inválida (más de 120 años).');
            } else {
                setAgeError('');
            }

            // Emitimos la fecha al padre para habilitar el botón, permitiendo al handler validar al hacer submit
            const newVal = `${yy}-${mm.padStart(2, '0')}-${dd.padStart(2, '0')}`;
            lastEmitted.current = newVal;
            onChange(newVal);
        } else {
            setAgeError('');
            lastEmitted.current = '';
            onChange('');
        }
    };

    const handleDay = (v: string) => {
        if (disabled) return;
        const n = v.replace(/\D/g, '').slice(0, 2);
        setD(n);
        emit(n, m, y);
        if (n.length === 2) monRef.current?.focus();
    };
    const handleMonth = (v: string) => {
        if (disabled) return;
        const n = v.replace(/\D/g, '').slice(0, 2);
        setM(n);
        emit(d, n, y);
        if (n.length === 2) yearRef.current?.focus();
    };
    const handleYear = (v: string) => {
        if (disabled) return;
        const n = v.replace(/\D/g, '').slice(0, 4);
        setY(n);
        emit(d, m, n);
    };

    const fieldCls = 'h-11 w-full rounded-xl border border-border/50 bg-white dark:bg-slate-900 outline-none font-bold text-center text-slate-800 dark:text-white transition-all text-xs focus:border-primary disabled:opacity-75 disabled:bg-muted/10';

    return (
        <div className={`space-y-1.5 ${className}`}>
            <div className="flex gap-1.5 items-end">
                <div className="flex-1 flex flex-col gap-1">
                    <input ref={dayRef} type="tel" inputMode="numeric" maxLength={2} disabled={disabled}
                        placeholder="DD" value={d} onChange={e => handleDay(e.target.value)}
                        className={`${fieldCls} ${ageError ? 'border-red-500/60' : ''}`} />
                    <span className="text-[9px] font-black uppercase text-slate-400 text-center">Día</span>
                </div>
                <span className="text-lg font-black text-slate-300 dark:text-white/20 mb-3">/</span>
                <div className="flex-1 flex flex-col gap-1">
                    <input ref={monRef} type="tel" inputMode="numeric" maxLength={2} disabled={disabled}
                        placeholder="MM" value={m} onChange={e => handleMonth(e.target.value)}
                        className={`${fieldCls} ${ageError ? 'border-red-500/60' : ''}`} />
                    <span className="text-[9px] font-black uppercase text-slate-400 text-center">Mes</span>
                </div>
                <span className="text-lg font-black text-slate-300 dark:text-white/20 mb-3">/</span>
                <div className="flex-[1.6] flex flex-col gap-1">
                    <input ref={yearRef} type="tel" inputMode="numeric" maxLength={4} disabled={disabled}
                        placeholder="AAAA" value={y} onChange={e => handleYear(e.target.value)}
                        className={`${fieldCls} ${ageError ? 'border-red-500/60' : ''}`} />
                    <span className="text-[9px] font-black uppercase text-slate-400 text-center">Año</span>
                </div>
            </div>
            {ageError && (
                <p className="text-[10px] font-bold text-red-500 text-center tracking-tight flex items-center justify-center gap-1">
                    <span>⚠</span> {ageError}
                </p>
            )}
        </div>
    );
}

export default function InscripcionesPage() {
    const { items: inscripciones, loading, loadItems, createItem: createInscripcion, updateItem: updateInscripcion, deleteItem } = useInscripcions();
    const { items: ofertas, loadItems: loadOfertas } = useOfertas();
    const { config: profe } = useProfe();

    const searchRef = useRef<HTMLInputElement>(null);
    const [sedes, setSedes] = useState<any[]>([]);
    const [estadosInscripcion, setEstadosInscripcion] = useState<any[]>([]);
    const [activePdfRow, setActivePdfRow] = useState<string | null>(null);

    const [roles, setRoles] = useState<any[]>([]);
    const [isRegisteringPersona, setIsRegisteringPersona] = useState(false);
    const [personaRegistering, setPersonaRegistering] = useState(false);
    const [newPersonaData, setNewPersonaData] = useState({
        ci: '',
        nombre: '',
        apellidos: '',
        fechaNacimiento: '',
        genero: '',
        estadoCivil: '',
        direccion: '',
        celular: '',
        correo: ''
    });
    const [mapPersonaFound, setMapPersonaFound] = useState<any>(null);
    const [mapPersonaLoading, setMapPersonaLoading] = useState(false);

    // Confirm delete modal state
    const [confirmDeleteState, setConfirmDeleteState] = useState<{ open: boolean; id: string; loading: boolean }>({
        open: false,
        id: '',
        loading: false
    });
    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingInscripcion, setEditingInscripcion] = useState<any>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [currentStep, setCurrentStep] = useState(1);
    const [camposExtra, setCamposExtra] = useState<any[]>([]);
    const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
    const [bulkDestination, setBulkDestination] = useState({ versionId: '', programaId: '', turnoId: '' });
    const [bulkFile, setBulkFile] = useState<File | null>(null);
    const [bulkData, setBulkData] = useState<any[]>([]);
    const [isMigrating, setIsMigrating] = useState(false);
    const [migrationReport, setMigrationReport] = useState<any>(null);
    const [migrationProgress, setMigrationProgress] = useState(0);
    const [userExtraResponses, setUserExtraResponses] = useState<{ [key: string]: string }>({});
    const [selectedVersionId, setSelectedVersionId] = useState<string>('');
    const [filterVersion, setFilterVersion] = useState('');

    // Persona Search State
    const [personaSearch, setPersonaSearch] = useState('');
    const [personasFound, setPersonasFound] = useState<any[]>([]);
    const [personaLoading, setPersonaLoading] = useState(false);

    // Filter states
    const [filterSede, setFilterSede] = useState('');
    const [filterEstado, setFilterEstado] = useState('');
    const [showFilters, setShowFilters] = useState(false);
    const [page, setPage] = useState(1);

    // Modal view for payments (Eye)
    const [isInscritosModalOpen, setIsInscritosModalOpen] = useState(false);
    const [targetOferta, setTargetOferta] = useState<any>(null);

    const [formData, setFormData] = useState({
        personaId: '',
        programaId: '',
        sedeId: '',
        turnoId: '',
        estadoInscripcionId: '',
        observacion: '',
        licenciatura: '',
        unidadEducativa: '',
        nivel: '',
        subsistema: ''
    });


    const [selectedGroup, setSelectedGroup] = useState<string | null>(null);
    const [searchGroupTerm, setSearchGroupTerm] = useState('');
    const [occupancyFilter, setOccupancyFilter] = useState<'all' | 'available' | 'full'>('all');
    const [expandedSedes, setExpandedSedes] = useState<{ [key: string]: boolean }>({});


    // Re-load items when page or search changes
    useEffect(() => {
        const params: any = { page, limit: 50 };
        if (searchTerm) params.search = searchTerm;
        if (filterSede) params.sedeId = filterSede;
        if (filterEstado) params.estadoInscripcionId = filterEstado;
        if (filterVersion) params.versionId = filterVersion;

        // Si hay un grupo seleccionado, filtramos solo por programaId en el backend.
        // El turnoId se aplica en el cliente para no excluir inscripciones con turnoId null.
        if (selectedGroup) {
            const [ofertaId] = selectedGroup.split('|');
            params.programaId = ofertaId;
        }

        loadItems(params);
    }, [page, searchTerm, filterSede, filterEstado, filterVersion, selectedGroup]);

    // Grouping logic for slots (Cupos)
    const groupedStats = useMemo(() => {
        const flatStats: any[] = [];

        ofertas.forEach(o => {
            // Process each turno of the offer as a separate slot
            (o.turnos || []).forEach((t: any) => {
                const offerInscripciones = (o as any).inscripciones || [];
                const count = offerInscripciones.filter((ins: any) =>
                    ins.turnoId === t.id &&
                    ['INSCRITO', 'CONFIRMADO'].includes(ins.estadoInscripcion?.nombre)
                ).length;

                const cupoReal = t.cupo || 0;
                const percentage = cupoReal > 0 ? Math.min(100, (count / cupoReal) * 100) : 0;
                // Si cupoReal es 0, se considera ilimitado (isFull = false)
                const isFull = cupoReal > 0 && count >= cupoReal;

                flatStats.push({
                    id: `${o.id}|${t.id}`,
                    ofertaId: o.id,
                    nombre: o.nombre,
                    codigo: o.codigo,
                    sede: o.sede?.nombre || 'General',
                    sedeId: o.sedeId,
                    turno: t.turnoConfig?.nombre || 'Único',
                    turnoId: t.id,
                    programaId: o.programaId,
                    version: o.version?.nombre ? `${o.version.nombre} ${o.version.numero}` : '',
                    gestion: o.version?.gestion || '',
                    inscritos: count,
                    cupo: cupoReal,
                    porcentaje: percentage,
                    isFull: isFull
                });
            });
        });

        return flatStats;
    }, [ofertas]);

    const filteredGroupedStats = useMemo(() => {
        return groupedStats.filter(group => {
            const matchesSearch =
                group.nombre.toLowerCase().includes(searchGroupTerm.toLowerCase()) ||
                group.codigo.toLowerCase().includes(searchGroupTerm.toLowerCase()) ||
                group.sede.toLowerCase().includes(searchGroupTerm.toLowerCase()) ||
                group.turno.toLowerCase().includes(searchGroupTerm.toLowerCase());

            const matchesStatus =
                occupancyFilter === 'all' ||
                (occupancyFilter === 'available' && !group.isFull) ||
                (occupancyFilter === 'full' && group.isFull);

            return matchesSearch && matchesStatus;
        });
    }, [groupedStats, searchGroupTerm, occupancyFilter]);

    // Group filtered groups by Sede
    const groupedBySede = useMemo(() => {
        const map: { [sedeName: string]: any[] } = {};
        filteredGroupedStats.forEach(g => {
            const key = g.sede || 'General';
            if (!map[key]) map[key] = [];
            map[key].push(g);
        });
        return map;
    }, [filteredGroupedStats]);

    // Toggle expand/collapse all
    const toggleAllSedes = (expand: boolean) => {
        const keys = Object.keys(groupedBySede);
        const newState: any = {};
        keys.forEach(k => {
            newState[k] = expand;
        });
        setExpandedSedes(newState);
    };

    // Auto-expand the first Sede on load if nothing is expanded
    useEffect(() => {
        const keys = Object.keys(groupedBySede);
        if (keys.length > 0 && Object.keys(expandedSedes).length === 0) {
            setExpandedSedes({ [keys[0]]: true });
        }
    }, [groupedBySede]);


    // Filtrar localmente por turnoId cuando hay un grupo seleccionado.
    // El backend devuelve todos los inscritos del programa; aquí afinamos por turno.
    const filteredInscripciones = useMemo(() => {
        if (!selectedGroup) return inscripciones;
        const [, turnoId] = selectedGroup.split('|');
        // Incluir inscripciones que tienen exactamente ese turnoId,
        // o aquellas con turnoId null (inscripciones sin turno asignado pertenecientes al programa)
        return inscripciones.filter(ins =>
            (ins as any).turnoId === turnoId || (ins as any).turnoId == null
        );
    }, [inscripciones, selectedGroup]);

    const stats = useMemo(() => {
        const total = inscripciones.length;
        const inscritos = inscripciones.filter(i => i.estadoInscripcion?.nombre === 'INSCRITO').length;
        const preinscritos = total - inscritos;
        const recaudado = inscripciones.reduce((acc, i) => {
            const pagos = (i.baucher || []).reduce((s: number, b: any) => s + (b.confirmado ? Number(b.monto) : 0), 0);
            return acc + pagos;
        }, 0);

        return { total, inscritos, preinscritos, recaudado };
    }, [inscripciones]);

    const uniqueVersions = useMemo(() => {
        const map = new Map<string, any>();
        ofertas.forEach((o: any) => {
            if (o.version) {
                const existing = map.get(o.version.id);
                if (existing) {
                    // Acumular nombres únicos de programa
                    if (!existing.programaNombres.includes(o.nombre)) {
                        existing.programaNombres.push(o.nombre);
                    }
                } else {
                    map.set(o.version.id, {
                        id: o.version.id,
                        nombre: o.version.nombre,
                        numero: o.version.numero,
                        gestion: o.version.gestion,
                        programaNombres: [o.nombre],
                        codigo: o.version.codigo || o.codigo
                    });
                }
            }
        });
        // Añadir programaNombre como string para compatibilidad
        return Array.from(map.values()).map(v => ({
            ...v,
            programaNombre: v.programaNombres.join(' · ')
        }));
    }, [ofertas]);


    useEffect(() => {
        // loadItems(); // Removido: el useEffect de paginación lo cargará
        loadOfertas();
        loadSedes();
        loadEstados();
        loadCamposExtra();
        loadRoles();
    }, []);

    const loadRoles = async () => {
        try {
            const data = await roleService.getAll();
            setRoles(data);
        } catch (error) {
            console.error('Error al cargar roles');
        }
    };

    const handleRegisterPersona = async () => {
        if (!newPersonaData.ci.trim() || !newPersonaData.nombre.trim() || !newPersonaData.apellidos.trim()) {
            toast.warning('Complete los campos obligatorios: CI, Nombres y Apellidos');
            return;
        }

        // Validate birth date if provided
        if (newPersonaData.fechaNacimiento) {
            const ageCheck = isValidAge(newPersonaData.fechaNacimiento);
            if (!ageCheck.valid) {
                toast.error(ageCheck.error || 'Fecha de nacimiento inválida.');
                return;
            }
        }

        // Parse CI complement if input includes hyphen (ej: 1234567-1B)
        let ciLimpio = newPersonaData.ci.trim();
        let complemento: string | undefined;
        if (ciLimpio.includes('-')) {
            const [c, co] = ciLimpio.split('-');
            ciLimpio = c;
            complemento = co || undefined;
        }

        setPersonaRegistering(true);
        try {
            const matchingRole = roles.find(r => r.name?.toUpperCase().includes('PARTICIPANTE') || r.nombre?.toUpperCase().includes('PARTICIPANTE'));
            const roleIds = matchingRole ? [matchingRole.id] : [];

            const payload: any = {
                username: ciLimpio,
                password: ciLimpio.length >= 6 ? ciLimpio : ciLimpio.padEnd(6, '0'),
                ci: ciLimpio,
                per_ci: ciLimpio,
                ...(complemento ? { complemento, per_complemento: complemento } : {}),
                nombre: newPersonaData.nombre.trim(),
                apellidos: newPersonaData.apellidos.trim(),
                correo: newPersonaData.correo.trim() || `${ciLimpio}@profe.edu.bo`,
                celular: newPersonaData.celular.trim() || undefined,
                roleIds,
                activo: true
            };
            if (newPersonaData.fechaNacimiento) payload.fechaNacimiento = newPersonaData.fechaNacimiento;
            if (newPersonaData.genero) payload.genero = newPersonaData.genero;
            if (newPersonaData.estadoCivil) payload.estadoCivil = newPersonaData.estadoCivil;
            if (newPersonaData.direccion.trim()) payload.direccion = newPersonaData.direccion.trim();
            if (mapPersonaFound) payload.personaId = mapPersonaFound.id;

            const createdUser = await userService.create(payload);
            toast.success('Participante registrado exitosamente');

            // Auto select
            setFormData(prev => ({ ...prev, personaId: createdUser.id }));
            setPersonaSearch(`${createdUser.nombre} ${createdUser.apellidos}`);
            setIsRegisteringPersona(false);

            // Clean state
            setNewPersonaData({
                ci: '',
                nombre: '',
                apellidos: '',
                fechaNacimiento: '',
                genero: '',
                estadoCivil: '',
                direccion: '',
                celular: '',
                correo: ''
            });
            setMapPersonaFound(null);
        } catch (error: any) {
            console.error('Error creating participant:', error);
            const msg = error.response?.data?.message || 'Error al registrar al participante';
            toast.error(msg);
        } finally {
            setPersonaRegistering(false);
        }
    };

    // Set default version filter to latest version (not 2025 if possible)
    useEffect(() => {
        if (uniqueVersions.length > 0 && !filterVersion) {
            const latest = [...uniqueVersions].sort((a, b) => b.gestion - a.gestion || b.numero - a.numero)[0];
            if (latest && latest.gestion !== 2025) {
                setFilterVersion(latest.id);
            }
        }
    }, [uniqueVersions]);

    const loadCamposExtra = async () => {
        try {
            const data = await userService.getCamposExtra();
            setCamposExtra(data);
        } catch (error) {
            console.error('Error loading extra fields');
        }
    };

    const loadSedes = async () => {
        try {
            const data = await sedeService.getAll();
            setSedes(data);
        } catch (error) {
            toast.error('Error al cargar sedes');
        }
    };

    const loadEstados = async () => {
        try {
            const data = await programaInscripcionEstadoService.getAll();
            setEstadosInscripcion(data);
        } catch (error) {
            toast.error('Error al cargar estados');
        }
    };

    // Auto-search personas
    useEffect(() => {
        const timer = setTimeout(async () => {
            if (personaSearch.length >= 3 && !formData.personaId) {
                setPersonaLoading(true);
                try {
                    const data = await userService.getAll(personaSearch, true);
                    setPersonasFound(data);
                } catch (error) {
                    console.error('Error searching personas');
                } finally {
                    setPersonaLoading(false);
                }
            } else {
                setPersonasFound([]);
            }
        }, 500);
        return () => clearTimeout(timer);
    }, [personaSearch, formData.personaId]);

    // Search in map_personas by CI when registration CI changes
    useEffect(() => {
        if (!isRegisteringPersona) {
            setMapPersonaFound(null);
            return;
        }

        const ciQuery = newPersonaData.ci.trim();
        if (ciQuery.length < 5) {
            if (mapPersonaFound) {
                setMapPersonaFound(null);
            }
            return;
        }

        setMapPersonaLoading(true);
        const timer = setTimeout(async () => {
            try {
                const response = await mapPersonaService.getAll({ search: ciQuery, limit: 1 });
                const match = response.data?.find((p: any) => p.ci.toString().trim() === ciQuery);
                if (match) {
                    setMapPersonaFound(match);

                    const pNombre = [match.nombre1, match.nombre2].filter(Boolean).join(' ').trim().toUpperCase();
                    const pApellidos = [match.apellido1, match.apellido2].filter(Boolean).join(' ').trim().toUpperCase();

                    let pFecha = '';
                    if (match.fechaNacimiento) {
                        try {
                            pFecha = new Date(match.fechaNacimiento).toISOString().split('T')[0];
                        } catch (e) {
                            console.error(e);
                        }
                    }

                    let pGenero = '';
                    if (match.genero?.nombre) {
                        const genNombre = match.genero.nombre.toUpperCase();
                        if (genNombre.includes('MASC') || genNombre === 'VARÓN' || genNombre === 'VARON' || genNombre === 'MALE') {
                            pGenero = 'MASCULINO';
                        } else if (genNombre.includes('FEM') || genNombre === 'MUJER' || genNombre === 'FEMALE') {
                            pGenero = 'FEMENINO';
                        } else if (genNombre.includes('PREF') || genNombre.includes('NO DECIR')) {
                            pGenero = 'PREFIERO_NO_DECIRLO';
                        } else {
                            pGenero = 'OTRO';
                        }
                    }

                    setNewPersonaData(prev => ({
                        ...prev,
                        nombre: pNombre,
                        apellidos: pApellidos,
                        fechaNacimiento: pFecha,
                        genero: pGenero,
                        celular: match.celular ? match.celular.toString() : '',
                        correo: match.correo || '',
                    }));

                    toast.info('Datos cargados desde el Padrón (MAP)');
                } else {
                    if (mapPersonaFound) {
                        setMapPersonaFound(null);
                        setNewPersonaData(prev => ({
                            ...prev,
                            nombre: '',
                            apellidos: '',
                            fechaNacimiento: '',
                            genero: '',
                            celular: '',
                            correo: '',
                        }));
                    }
                }
            } catch (error) {
                console.error('Error querying map_personas:', error);
            } finally {
                setMapPersonaLoading(false);
            }
        }, 500);

        return () => clearTimeout(timer);
    }, [newPersonaData.ci, isRegisteringPersona]);

    const handleOpenModal = (inscripcion: any = null) => {
        setIsRegisteringPersona(false);
        setNewPersonaData({
            ci: '',
            nombre: '',
            apellidos: '',
            fechaNacimiento: '',
            genero: '',
            estadoCivil: '',
            direccion: '',
            celular: '',
            correo: ''
        });
        setMapPersonaFound(null);
        if (inscripcion) {
            setEditingInscripcion(inscripcion);

            // Lock the selected version if we're editing
            const oferta = ofertas.find((o: any) => o.id === inscripcion.programaId);
            if (oferta && oferta.version) setSelectedVersionId(oferta.version.id);

            setCurrentStep(3); // Jump to program/turno selection when editing
            setPersonaSearch(inscripcion.persona ? `${inscripcion.persona.nombre} ${inscripcion.persona.apellidos}` : '');
            setFormData({
                personaId: inscripcion.personaId || '',
                programaId: inscripcion.programaId || '',
                sedeId: inscripcion.sedeId || '',
                turnoId: inscripcion.turnoId || '',
                estadoInscripcionId: inscripcion.estadoInscripcionId || '',
                observacion: inscripcion.observacion || '',
                licenciatura: inscripcion.licenciatura || '',
                unidadEducativa: inscripcion.unidadEducativa || '',
                nivel: inscripcion.nivel || '',
                subsistema: inscripcion.subsistema || ''
            });

            // Populate extra responses from user
            const responses: { [key: string]: string } = {};
            if (inscripcion.persona?.mod_campos_extra_regs) {
                inscripcion.persona.mod_campos_extra_regs.forEach((reg: any) => {
                    responses[reg.campoExtraId] = reg.valor;
                });
            }
            setUserExtraResponses(responses);
        } else {
            setEditingInscripcion(null);
            setCurrentStep(1); // Start with person search for new
            setPersonaSearch('');
            setSelectedVersionId('');
            setUserExtraResponses({});
            setFormData({
                personaId: '',
                programaId: '',
                sedeId: '',
                turnoId: '',
                estadoInscripcionId: '',
                observacion: '',
                licenciatura: '',
                unidadEducativa: '',
                nivel: '',
                subsistema: ''
            });
        }
        setIsModalOpen(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Solo procesar si estamos en el paso final (4) o editando
        if (!editingInscripcion && currentStep !== 4) return;

        if (!formData.personaId) {
            toast.warning('Debe seleccionar a una persona');
            return;
        }
        if (!formData.programaId || !formData.turnoId) {
            toast.warning('Debe seleccionar programa y turno');
            return;
        }

        setIsSubmitting(true);
        try {
            // 1. Update user extra fields first
            if (formData.personaId && Object.keys(userExtraResponses).length > 0) {
                await userService.update(formData.personaId, {
                    mod_campos_extra_regs: userExtraResponses as any
                });
            }

            // 2. Process inscription
            const payload = { ...formData };
            if (editingInscripcion) {
                const success = await updateInscripcion(editingInscripcion.id, payload);
                if (success) setIsModalOpen(false);
            } else {
                const success = await createInscripcion(payload);
                if (success) setIsModalOpen(false);
            }
        } catch (error) {
            toast.error('Error al procesar la solicitud');
        } finally {
            setIsSubmitting(false);
        }
    };


    const confirmDelete = (id: string) => {
        setConfirmDeleteState({ open: true, id, loading: false });
    };

    const handleConfirmDelete = async () => {
        const id = confirmDeleteState.id;
        if (!id) return;
        setConfirmDeleteState(prev => ({ ...prev, loading: true }));
        await deleteItem(id);
        setConfirmDeleteState({ open: false, id: '', loading: false });
    };

    const handleBulkFile = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setBulkFile(file);

        const reader = new FileReader();
        reader.onload = (evt) => {
            const bstr = evt.target?.result;
            const wb = XLSX.read(bstr, { type: 'binary' });
            const wsname = wb.SheetNames[0];
            const ws = wb.Sheets[wsname];
            const data = XLSX.utils.sheet_to_json(ws);
            setBulkData(data);
            toast.success(`${data.length} registros cargados del archivo`);
        };
        reader.readAsBinaryString(file);
    };

    const startBulkMigration = async () => {
        if (!bulkDestination.programaId || !bulkDestination.turnoId || bulkData.length === 0) {
            toast.warning('Complete todos los campos y suba un archivo');
            return;
        }

        setIsMigrating(true);
        setMigrationReport(null);
        setMigrationProgress(0);

        try {
            const rawParticipantes = bulkData.map(row => ({
                ci: row.ci || row.CI || row.documento || row.DOCUMENTO,
                nombres: row.nombres || row.NOMBRES || row.nombre || row.NOMBRE,
                apellidos: row.apellidos || row.APELLIDOS || row.apellido || row.APELLIDO,
                correo: row.correo || row.CORREO || row.email || row.EMAIL,
                celular: row.celular || row.CELULAR || row.telefono || row.TELEFONO,
                password: row.password || row.PASSWORD || row.contraseña || row.CONTRASEÑA,
                licenciatura: row.licenciatura || row.LICENCIATURA,
                unidadEducativa: row.unidad_educativa || row.UE,
                nivel: row.nivel || row.NIVEL,
                subsistema: row.subsistema || row.SUBSISTEMA
            })).filter(p => p.ci && p.nombres);

            if (rawParticipantes.length === 0) {
                toast.error('El archivo no tiene el formato correcto o está vacío');
                setIsMigrating(false);
                return;
            }

            const chunkSize = 50;
            const chunks = [];
            for (let i = 0; i < rawParticipantes.length; i += chunkSize) {
                chunks.push(rawParticipantes.slice(i, i + chunkSize));
            }

            let totalSuccess = 0;
            let totalErrors: any[] = [];

            for (let i = 0; i < chunks.length; i++) {
                const res = await inscripcionService.bulkImport({
                    ...bulkDestination,
                    sedeId: ofertas.find(o => o.id === bulkDestination.programaId)?.sedeId,
                    participantes: chunks[i]
                });

                totalSuccess += res.success;
                totalErrors = [...totalErrors, ...res.errors];

                setMigrationProgress(Math.round(((i + 1) / chunks.length) * 100));
            }

            const finalReport = { success: totalSuccess, errors: totalErrors };
            setMigrationReport(finalReport);
            toast.success(`Migración finalizada: ${totalSuccess} exitosos, ${totalErrors.length} errores`);
            loadItems();

            if (totalErrors.length === 0) {
                setTimeout(() => setIsBulkModalOpen(false), 2000);
            }
        } catch (error) {
            console.error('Migration error:', error);
            toast.error('Error durante la migración masiva');
        } finally {
            setIsMigrating(false);
        }
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Header with Glassmorphism Summary */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div>
                    <h1 className="text-4xl font-black tracking-tighter text-foreground uppercase italic">
                        Control de <span className="text-primary">Matriculación</span>
                    </h1>
                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mt-1">Gestión académica y financiera de participantes</p>
                </div>
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => setShowFilters(!showFilters)}
                        className={cn(
                            "p-3 rounded-2xl border transition-all shadow-sm",
                            showFilters ? "bg-primary text-white border-primary" : "bg-card border-border hover:border-primary/50 text-muted-foreground"
                        )}
                    >
                        <Filter className="w-5 h-5" />
                    </button>
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => setIsBulkModalOpen(true)}
                            className="h-16 px-8 rounded-3xl bg-amber-500/10 text-amber-600 font-black text-[10px] uppercase tracking-[0.2em] flex items-center gap-3 hover:bg-amber-600 hover:text-white transition-all shadow-xl shadow-amber-500/5 group"
                        >
                            <ArrowLeftRight className="w-5 h-5 group-hover:rotate-180 transition-transform duration-500" />
                            <span>Migración Masiva</span>
                        </button>
                        <button
                            onClick={() => handleOpenModal()}
                            className="h-16 px-10 rounded-3xl bg-primary text-primary-foreground font-black text-[10px] uppercase tracking-[0.2em] flex items-center gap-3 hover:bg-slate-800 transition-all shadow-2xl shadow-primary/20 group"
                        >
                            <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform" />
                            <span>Inscribir Nuevo</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                    { label: 'Total Registros', val: stats.total, icon: Users, color: 'text-indigo-500', bg: 'bg-indigo-500/10' },
                    { label: 'Confirmados', val: stats.inscritos, icon: CheckCircle2, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
                    { label: 'Pendientes', val: stats.preinscritos, icon: Clock, color: 'text-amber-500', bg: 'bg-amber-500/10' },
                    { label: 'Recaudación Total', val: `Bs. ${stats.recaudado.toLocaleString()}`, icon: DollarSign, color: 'text-primary', bg: 'bg-primary/10' },
                ].map((s, i) => (
                    <Card key={i} className="p-6 border-border/40 hover:border-primary/20 transition-all group overflow-hidden relative">
                        <div className={cn("absolute -top-4 -right-4 w-24 h-24 rounded-full opacity-5 blur-2xl", s.color.replace('text', 'bg'))} />
                        <div className="flex items-center gap-4 relative z-10">
                            <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110 duration-500", s.bg)}>
                                <s.icon className={cn("w-7 h-7", s.color)} />
                            </div>
                            <div>
                                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">{s.label}</p>
                                <p className="text-2xl font-black tracking-tight">{s.val}</p>
                            </div>
                        </div>
                    </Card>
                ))}
            </div>

            {/* DYNAMIC CUPOS & GROUPS PANEL */}
            <div className="space-y-4">
                <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                    <div className="flex items-center gap-2">
                        <div className="p-1.5 bg-orange-500/10 rounded-lg">
                            <ArrowRightCircle className="w-4 h-4 text-orange-500" />
                        </div>
                        <h2 className="text-[11px] font-black uppercase tracking-[0.2em] text-foreground text-primary italic">Control de Ocupación (SEDE / PROGRAMA-VERSIÓN / TURNO)</h2>
                    </div>

                    {/* Controles Creativos y Rápidos de Filtro */}
                    <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
                        <div className="relative flex-1 sm:w-64 max-w-xs group">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                            <input
                                type="text"
                                placeholder="Filtrar grupos..."
                                className="w-full h-10 pl-9 pr-3 rounded-xl bg-card border border-border/50 outline-none text-[11px] font-bold transition-all focus:border-primary focus:ring-2 focus:ring-primary/5 placeholder:text-muted-foreground/50"
                                value={searchGroupTerm}
                                onChange={(e) => setSearchGroupTerm(e.target.value)}
                            />
                        </div>
                        <div className="flex gap-1.5">
                            <button
                                type="button"
                                onClick={() => setOccupancyFilter('all')}
                                className={cn(
                                    "h-10 px-3.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all",
                                    occupancyFilter === 'all'
                                        ? "bg-primary text-white shadow-md shadow-primary/20"
                                        : "bg-muted/40 text-muted-foreground hover:bg-muted"
                                )}
                            >
                                Todos
                            </button>
                            <button
                                type="button"
                                onClick={() => setOccupancyFilter('available')}
                                className={cn(
                                    "h-10 px-3.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all",
                                    occupancyFilter === 'available'
                                        ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/20"
                                        : "bg-muted/40 text-muted-foreground hover:bg-muted"
                                )}
                            >
                                Disponibles
                            </button>
                            <button
                                type="button"
                                onClick={() => setOccupancyFilter('full')}
                                className={cn(
                                    "h-10 px-3.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all",
                                    occupancyFilter === 'full'
                                        ? "bg-rose-500 text-white shadow-md shadow-rose-500/20"
                                        : "bg-muted/40 text-muted-foreground hover:bg-muted"
                                )}
                            >
                                Llenos
                            </button>
                        </div>
                    </div>
                </div>

                <div className="flex items-center justify-between gap-3 flex-wrap">
                    <div className="flex items-center gap-3 flex-wrap">
                        <span className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">
                            {filteredGroupedStats.length} grupo{filteredGroupedStats.length !== 1 ? 's' : ''} · {filteredGroupedStats.reduce((a, g) => a + g.inscritos, 0)} inscritos totales
                        </span>
                        {selectedGroup && (
                            <button
                                type="button"
                                onClick={() => setSelectedGroup(null)}
                                className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary/10 text-primary text-[8px] font-black uppercase tracking-widest hover:bg-rose-500/10 hover:text-rose-600 transition-all border border-primary/20"
                            >
                                <X className="w-3 h-3" /> Limpiar selección
                            </button>
                        )}
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={() => toggleAllSedes(true)}
                            className="px-2.5 py-1 bg-muted/40 hover:bg-muted text-[8px] font-black uppercase tracking-widest rounded-lg border border-border/40 text-muted-foreground hover:text-foreground transition-all"
                        >
                            Expandir Todos
                        </button>
                        <button
                            type="button"
                            onClick={() => toggleAllSedes(false)}
                            className="px-2.5 py-1 bg-muted/40 hover:bg-muted text-[8px] font-black uppercase tracking-widest rounded-lg border border-border/40 text-muted-foreground hover:text-foreground transition-all"
                        >
                            Colapsar Todos
                        </button>
                    </div>
                </div>

                <div className="space-y-4">
                    {filteredGroupedStats.length === 0 ? (
                        <div className="py-12 text-center border-2 border-dashed border-border/40 rounded-[2rem] bg-card/10">
                            <p className="text-xs font-black uppercase tracking-widest text-muted-foreground opacity-50">No se encontraron grupos con los filtros actuales</p>
                        </div>
                    ) : (
                        Object.keys(groupedBySede).map((sedeName) => {
                            const sedeGroups = groupedBySede[sedeName];
                            const isExpanded = !!expandedSedes[sedeName];

                            // Consolidate stats for this Sede
                            const totalInscritosSede = sedeGroups.reduce((acc, g) => acc + g.inscritos, 0);
                            const totalCupoSede = sedeGroups.reduce((acc, g) => acc + g.cupo, 0);
                            const sedePercentage = totalCupoSede > 0 ? Math.min(100, Math.round((totalInscritosSede / totalCupoSede) * 100)) : 0;

                            return (
                                <div key={sedeName} className="border border-border/40 rounded-2xl bg-card/30 backdrop-blur-md overflow-hidden transition-all shadow-sm hover:shadow-md">
                                    {/* Sede Accordion Header */}
                                    <div
                                        onClick={() => setExpandedSedes(prev => ({ ...prev, [sedeName]: !isExpanded }))}
                                        className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 cursor-pointer select-none hover:bg-muted/10 transition-colors"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-black text-sm border border-primary/20">
                                                {sedeName.substring(0, 2).toUpperCase()}
                                            </div>
                                            <div>
                                                <h3 className="text-sm font-black uppercase tracking-wider text-foreground leading-none mb-1">{sedeName}</h3>
                                                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{sedeGroups.length} grupo{sedeGroups.length !== 1 ? 's' : ''}</p>
                                            </div>
                                        </div>

                                        {/* Consolidate occupancy info */}
                                        <div className="flex items-center gap-4 w-full sm:w-auto shrink-0">
                                            <div className="flex-1 sm:w-48 text-right space-y-1">
                                                <div className="flex justify-between text-[9px] font-black uppercase tracking-wider">
                                                    <span className="text-muted-foreground">Ocupación Sede</span>
                                                    <span className="text-foreground">{totalInscritosSede} / {totalCupoSede > 0 ? totalCupoSede : '∞'} ({sedePercentage}%)</span>
                                                </div>
                                                <div className="h-2 w-full bg-muted rounded-full overflow-hidden p-0.5 border border-border/20">
                                                    <div
                                                        className={cn(
                                                            "h-full rounded-full transition-all duration-1000",
                                                            sedePercentage > 90 ? "bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.4)]" :
                                                                sedePercentage > 60 ? "bg-orange-500" : "bg-emerald-500"
                                                        )}
                                                        style={{ width: `${totalCupoSede > 0 ? sedePercentage : 10}%` }}
                                                    />
                                                </div>
                                            </div>
                                            <button className="p-1.5 rounded-lg border border-border/40 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
                                                {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                                            </button>
                                        </div>
                                    </div>

                                    {/* Collapsible content (Grilla de grupos de la sede) */}
                                    <AnimatePresence initial={false}>
                                        {isExpanded && (
                                            <motion.div
                                                initial={{ height: 0, opacity: 0 }}
                                                animate={{ height: 'auto', opacity: 1 }}
                                                exit={{ height: 0, opacity: 0 }}
                                                transition={{ duration: 0.25 }}
                                                className="border-t border-border/30 bg-muted/5"
                                            >
                                                <div className="p-5 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                                                    {sedeGroups.map((group) => (
                                                        <Card
                                                            key={group.id}
                                                            onClick={() => setSelectedGroup(selectedGroup === group.id ? null : group.id)}
                                                            className={cn(
                                                                "p-3.5 border-border/30 cursor-pointer bg-card/60 backdrop-blur-xl relative overflow-hidden group transition-all rounded-xl",
                                                                group.isFull ? "border-rose-500/20 bg-rose-500/[0.01]" : "hover:border-primary/20",
                                                                selectedGroup === group.id ? "ring-2 ring-primary border-primary bg-primary/5 shadow-lg shadow-primary/5" : "scale-[0.98] opacity-80 hover:opacity-100 hover:scale-100"
                                                            )}
                                                        >
                                                            <div className="flex justify-between items-start mb-3 text-primary">
                                                                <div className="space-y-1 max-w-[80%]">
                                                                    <div className="flex items-center gap-1.5 flex-wrap">
                                                                        {group.version && (
                                                                            <span className="px-1.5 py-0.5 rounded bg-indigo-500/10 dark:bg-indigo-500/5 text-indigo-600 dark:text-indigo-400 text-[8px] font-black tracking-widest uppercase border border-indigo-500/10">
                                                                                {group.version}
                                                                            </span>
                                                                        )}
                                                                        <span className="text-[8px] font-black text-muted-foreground uppercase tracking-widest pl-1.5 border-l border-border/40">{group.codigo}</span>
                                                                    </div>
                                                                    <h4 className="text-[11px] font-black uppercase tracking-tight text-foreground leading-tight line-clamp-2 mt-1">
                                                                        {group.nombre}
                                                                    </h4>
                                                                    <div className="flex items-center gap-1 text-[8px] font-bold text-muted-foreground uppercase tracking-widest mt-1">
                                                                        <Clock className="w-2.5 h-2.5 text-indigo-500 shrink-0" />
                                                                        <span>{group.turno}</span>
                                                                    </div>
                                                                </div>
                                                                <span className={cn(
                                                                    "px-1.5 py-0.5 rounded text-[7px] font-black uppercase tracking-widest border shrink-0",
                                                                    group.cupo === 0 ? "bg-indigo-500/10 text-indigo-500 border-indigo-500/20" :
                                                                        group.isFull ? "bg-rose-500/10 text-rose-500 border-rose-500/20" : "bg-primary/10 text-primary border-primary/20"
                                                                )}>
                                                                    {group.cupo === 0 ? 'Ilimitado' : group.isFull ? 'Lleno' : 'Libre'}
                                                                </span>
                                                            </div>

                                                            <div className="space-y-1.5 mt-2 pt-2 border-t border-border/20">
                                                                <div className="flex justify-between text-[9px] font-black">
                                                                    <span className="text-muted-foreground uppercase tracking-widest text-[7px]">Ocupado</span>
                                                                    <span className={cn(group.porcentaje > 90 ? "text-rose-500" : "text-foreground")}>
                                                                        {group.inscritos} / {group.cupo > 0 ? group.cupo : '∞'}
                                                                    </span>
                                                                </div>
                                                                <div className="h-2 bg-muted rounded-full overflow-hidden p-0.5 border border-border/10">
                                                                    <motion.div
                                                                        initial={{ width: 0 }}
                                                                        animate={{ width: group.cupo > 0 ? `${group.porcentaje}%` : '10%' }}
                                                                        className={cn(
                                                                            "h-full rounded-full transition-all duration-1000",
                                                                            group.cupo === 0 ? "bg-indigo-300 opacity-60" :
                                                                                group.porcentaje > 90 ? "bg-rose-500" :
                                                                                    group.porcentaje > 60 ? "bg-orange-500" : "bg-emerald-500"
                                                                        )}
                                                                    />
                                                                </div>
                                                                {/* Botón Ver inscritos */}
                                                                <button
                                                                    type="button"
                                                                    onClick={(e) => { e.stopPropagation(); setSelectedGroup(selectedGroup === group.id ? null : group.id); }}
                                                                    className={cn(
                                                                        "w-full mt-2 h-7 rounded-lg text-[8px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-1",
                                                                        selectedGroup === group.id
                                                                            ? "bg-primary text-white shadow-sm"
                                                                            : "bg-muted/40 text-muted-foreground hover:bg-primary/10 hover:text-primary"
                                                                    )}
                                                                >
                                                                    <Users className="w-2.5 h-2.5" />
                                                                    {selectedGroup === group.id ? 'Seleccionado' : `Filtrar (${group.inscritos})`}
                                                                </button>
                                                            </div>
                                                        </Card>
                                                    ))}
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            );
                        })
                    )}
                </div>

            </div>

            {/* Inscriptions Table Card */}
            <Card className="border-border/40 overflow-hidden shadow-2xl shadow-primary/5 bg-card/60 backdrop-blur-md">
                <div className="p-8 border-b border-border/40 bg-white/30 dark:bg-slate-900/30 flex flex-col md:flex-row justify-between gap-6">
                    <div className="relative flex-1 max-w-xl group">
                        <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                        <input
                            type="text"
                            placeholder="Buscar por Doc., Nombre o Programa..."
                            className="w-full h-14 pl-14 pr-6 rounded-2xl bg-background border border-border/60 focus:border-primary focus:ring-4 focus:ring-primary/5 outline-none text-sm font-bold transition-all shadow-sm"
                            value={searchTerm}
                            onChange={(e) => {
                                setSearchTerm(e.target.value);
                                setPage(1); // Reset page on search
                            }}
                        />
                    </div>
                    {showFilters && (
                        <div className="flex flex-wrap gap-4 animate-in slide-in-from-right-4 duration-300">
                            <select
                                className="h-14 px-6 rounded-2xl bg-muted/30 border border-border/50 outline-none text-[11px] font-black uppercase tracking-widest"
                                value={filterVersion}
                                onChange={(e) => setFilterVersion(e.target.value)}
                            >
                                <option value="">Todas las Versiones</option>
                                {uniqueVersions.map(v => (
                                    <option key={v.id} value={v.id}>
                                        {v.nombre} {v.numero} ({v.gestion})
                                    </option>
                                ))}
                            </select>
                            <select
                                className="h-14 px-6 rounded-2xl bg-muted/30 border border-border/50 outline-none text-[11px] font-black uppercase tracking-widest"
                                value={filterSede}
                                onChange={(e) => setFilterSede(e.target.value)}
                            >
                                <option value="">Todas las Sedes</option>
                                {sedes.map(s => <option key={s.id} value={s.id}>{s.nombre}</option>)}
                            </select>
                            <select
                                className="h-14 px-6 rounded-2xl bg-muted/30 border border-border/50 outline-none text-[11px] font-black uppercase tracking-widest"
                                value={filterEstado}
                                onChange={(e) => setFilterEstado(e.target.value)}
                            >
                                <option value="">Todos los Estados</option>
                                {estadosInscripcion.map(e => <option key={e.id} value={e.id}>{e.nombre}</option>)}
                            </select>
                        </div>
                    )}
                </div>

                <div className="overflow-x-auto custom-scrollbar">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-muted/30">
                                <th className="p-6 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground whitespace-nowrap">Expediente / Participante</th>
                                <th className="p-6 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground whitespace-nowrap text-center">Inscrito en</th>
                                <th className="p-6 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground whitespace-nowrap text-center">Estado Académico</th>
                                <th className="p-6 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground whitespace-nowrap text-right">Balance Económico</th>
                                <th className="p-6 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground whitespace-nowrap text-center">Gestión</th>
                                <th className="p-6 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground whitespace-nowrap text-right">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border/40">
                            {loading ? (
                                Array.from({ length: 5 }).map((_, i) => (
                                    <tr key={i} className="animate-pulse">
                                        <td colSpan={6} className="p-10 h-24 bg-muted/10" />
                                    </tr>
                                ))
                            ) : filteredInscripciones.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="p-20 text-center">
                                        <div className="flex flex-col items-center justify-center opacity-30 gap-4">
                                            <Search className="w-16 h-16" />
                                            <p className="text-sm font-black uppercase tracking-[0.3em]">No se encontraron resultados</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                filteredInscripciones.map((ins) => (
                                    <tr
                                        key={ins.id}
                                        onMouseEnter={() => setActivePdfRow(ins.id)}
                                        onMouseLeave={() => setActivePdfRow(null)}
                                        className="hover:bg-primary/[0.02] transition-colors group"
                                    >
                                        <td className="p-6">
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center font-black text-xs shadow-sm">
                                                    {ins.persona?.nombre?.[0]}{ins.persona?.apellidos?.[0]}
                                                </div>
                                                <div>
                                                    <p className="text-[13px] font-black uppercase tracking-tight text-foreground leading-none mb-1">{ins.persona?.nombre} {ins.persona?.apellidos}</p>
                                                    <div className="flex items-center gap-2 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                                                        <span>CI: {ins.persona?.ci}</span>
                                                        <span className="w-1 h-1 rounded-full bg-border" />
                                                        <span className="text-primary/60">ID: {ins.id?.substring(0, 8)}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-6">
                                            <div className="flex flex-col items-center text-center">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <BookOpen className="w-3.5 h-3.5 text-indigo-500" />
                                                    <span className="text-[10px] font-black uppercase text-foreground">{ins.programa?.nombre || 'General'}</span>
                                                </div>
                                                <div className="flex items-center gap-2 text-[9px] font-bold text-muted-foreground uppercase tracking-widest">
                                                    <MapPin className="w-3 h-3" /> {ins.sede?.nombre || 'General'}
                                                    <span className="w-1 h-1 rounded-full bg-border" />
                                                    <Clock className="w-3 h-3" /> {ins.turno?.turnoConfig?.nombre || 'Turno Único'}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-6 text-center">
                                            <span className={cn(
                                                "px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-[0.2em] border shadow-sm",
                                                ins.estadoInscripcion?.nombre === 'INSCRITO' ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" :
                                                    ins.estadoInscripcion?.nombre === 'PREINSCRITO' ? "bg-amber-500/10 text-amber-600 border-amber-500/20 shadow-amber-500/5 shadow-inner" :
                                                        "bg-muted text-muted-foreground border-border"
                                            )}>
                                                {ins.estadoInscripcion?.nombre || 'PROCESANDO'}
                                            </span>
                                        </td>
                                        <td className="p-6">
                                            <div className="flex flex-col items-end gap-1.5 text-right">
                                                <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden max-w-[120px] ml-auto">
                                                    <div
                                                        className="h-full bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.5)]"
                                                        style={{ width: `${Math.min(100, ((ins.baucher || []).reduce((acc: number, b: any) => acc + (b.confirmado ? Number(b.monto) : 0), 0) / (ins.programa?.costo || 1)) * 100)}%` }}
                                                    />
                                                </div>
                                                <div className="flex items-center gap-2 justify-end">
                                                    <span className="text-sm font-black text-foreground">Bs. {(ins.baucher || []).reduce((acc: number, b: any) => acc + (b.confirmado ? Number(b.monto) : 0), 0)}</span>
                                                    <span className="text-[10px] font-bold text-muted-foreground italic">/ Bs. {ins.programa?.costo || 0}</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-6 text-center">
                                            <div className="inline-flex flex-col items-center">
                                                <span className="text-[11px] font-black text-foreground">{ins.programa?.version?.gestion || '-'}</span>
                                                <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-tighter opacity-70">{ins.programa?.version?.nombre} {ins.programa?.version?.numero}</span>
                                            </div>
                                        </td>
                                        <td className="p-6">
                                            <div className="flex justify-end gap-2.5">
                                                <button
                                                    onClick={() => {
                                                        setTargetOferta(ins.programa);
                                                        setIsInscritosModalOpen(true);
                                                    }}
                                                    className="w-12 h-12 rounded-2xl bg-slate-100 hover:bg-slate-800 hover:text-white dark:bg-slate-800 dark:hover:bg-indigo-600 text-slate-600 dark:text-slate-300 flex items-center justify-center transition-all shadow-sm"
                                                    title="Expediente y Pagos"
                                                >
                                                    <Eye className="w-5 h-5" />
                                                </button>
                                                <button
                                                    onClick={() => handleOpenModal(ins)}
                                                    className="w-12 h-12 rounded-2xl bg-indigo-500/10 text-indigo-600 flex items-center justify-center hover:bg-indigo-600 hover:text-white transition-all shadow-sm"
                                                    title="Modificar Matrícula"
                                                >
                                                    <Edit2 className="w-5 h-5" />
                                                </button>
                                                {activePdfRow === ins.id ? (
                                                    <PDFDownloadLink
                                                        document={<InscripcionPDF inscripcion={ins} profe={profe} />}
                                                        fileName={`Inscripcion_${ins.persona?.ci || ins.id}.pdf`}
                                                        className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center hover:bg-emerald-600 hover:text-white transition-all shadow-sm animate-in fade-in zoom-in-95 duration-150"
                                                    >
                                                        {({ loading }) => (loading ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Printer className="w-5 h-5" />)}
                                                    </PDFDownloadLink>
                                                ) : (
                                                    <button
                                                        className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center hover:bg-emerald-600 hover:text-white transition-all shadow-sm"
                                                        title="Ficha PDF"
                                                    >
                                                        <Printer className="w-5 h-5" />
                                                    </button>
                                                )}
                                                <button
                                                    onClick={() => confirmDelete(ins.id)}
                                                    className="w-12 h-12 rounded-2xl bg-rose-500/10 text-rose-500 flex items-center justify-center hover:bg-rose-500 hover:text-white transition-all shadow-sm"
                                                >
                                                    <Trash2 className="w-5 h-5" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* PAGINATION UI */}
                <div className="p-6 border-t border-border/40 bg-muted/20 flex items-center justify-between">
                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                        Página <span className="text-primary">{page}</span>
                    </p>
                    <div className="flex gap-2">
                        <button
                            onClick={() => setPage(prev => Math.max(1, prev - 1))}
                            disabled={page === 1 || loading}
                            className="h-10 px-4 rounded-xl border border-border/50 bg-background hover:bg-muted disabled:opacity-50 transition-all flex items-center gap-2 text-[10px] font-black uppercase tracking-widest"
                        >
                            <ChevronLeft className="w-4 h-4" /> Anterior
                        </button>
                        <button
                            onClick={() => setPage(prev => prev + 1)}
                            disabled={loading || inscripciones.length < 50}
                            className="h-10 px-4 rounded-xl border border-border/50 bg-background hover:bg-muted disabled:opacity-50 transition-all flex items-center gap-2 text-[10px] font-black uppercase tracking-widest"
                        >
                            Siguiente <ChevronRight className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </Card>

            {/* Inscription Processing Modal (Premium Wizard) */}
            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={undefined}
                size="2xl"
            >
                <form onSubmit={handleSubmit} className="relative flex flex-col min-h-[550px] max-h-[85vh] overflow-hidden bg-slate-50 dark:bg-slate-950 rounded-[2rem]">
                    {/* LEFT ACCENT BAR (decorative, inside the form to fit the Modal container) */}
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary rounded-l-[2rem] z-10" />

                    {/* Modal Head */}
                    <div className="relative shrink-0 px-8 pt-6 pb-5 bg-white dark:bg-slate-900 border-b border-border/40 pl-9">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="relative">
                                    <div className="w-14 h-14 rounded-2xl bg-primary flex items-center justify-center shadow-xl shadow-primary/20">
                                        <Stamp className="w-7 h-7 text-white" />
                                    </div>
                                    <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-emerald-400 border-2 border-white dark:border-slate-900 flex items-center justify-center">
                                        <Sparkles className="w-2.5 h-2.5 text-white animate-pulse" />
                                    </div>
                                </div>
                                <div>
                                    <h3 className="text-2xl font-black uppercase tracking-tighter italic leading-none">
                                        {editingInscripcion ? 'Actualizar' : 'Nueva'} <span className="text-primary">Inscripción</span>
                                    </h3>
                                    <p className="text-[9px] font-black uppercase tracking-[0.3em] text-muted-foreground mt-1">Sistema de Matriculación Profe</p>
                                </div>
                            </div>

                            {/* Close button */}
                            <button
                                type="button"
                                onClick={() => setIsModalOpen(false)}
                                className="w-10 h-10 rounded-2xl bg-muted/40 hover:bg-rose-50 hover:text-rose-500 dark:hover:bg-rose-900/20 flex items-center justify-center transition-all"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Step indicator */}
                        {!editingInscripcion && (
                            <div className="flex items-center gap-0 mt-6 border-t border-border/20 pt-4">
                                {[
                                    { id: 1, label: 'Participante', icon: User },
                                    { id: 2, label: 'Versión', icon: GraduationCap },
                                    { id: 3, label: 'Programa', icon: MapPin },
                                    { id: 4, label: 'Estado', icon: BookOpen },
                                ].map((s, idx) => {
                                    const isActive = currentStep === s.id;
                                    const isDone = currentStep > s.id;
                                    return (
                                        <div key={s.id} className="flex items-center">
                                            <button
                                                type="button"
                                                disabled={!isDone}
                                                onClick={() => isDone && setCurrentStep(s.id)}
                                                className={cn(
                                                    'flex items-center gap-2 px-3 py-1.5 rounded-full transition-all text-[8px] font-black uppercase tracking-widest',
                                                    isActive
                                                        ? 'bg-primary text-primary-foreground shadow-lg'
                                                        : isDone
                                                            ? 'text-primary hover:bg-primary/10 cursor-pointer'
                                                            : 'text-muted-foreground'
                                                )}
                                            >
                                                <div
                                                    className={cn(
                                                        'w-4 h-4 rounded-full flex items-center justify-center border-2 transition-all text-[8px] font-black',
                                                        isActive
                                                            ? 'border-white bg-white/20'
                                                            : isDone
                                                                ? 'border-primary bg-primary/10'
                                                                : 'border-border'
                                                    )}
                                                >
                                                    {isDone ? (
                                                        <Check className="w-2.5 h-2.5" />
                                                    ) : (
                                                        s.id
                                                    )}
                                                </div>
                                                <s.icon className="w-3 h-3" />
                                                <span className="hidden sm:inline">{s.label}</span>
                                            </button>
                                            {idx < 3 && (
                                                <div
                                                    className={cn(
                                                        'h-0.5 w-6 mx-1 rounded-full transition-all',
                                                        currentStep > s.id ? 'bg-primary' : 'bg-border'
                                                    )}
                                                />
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    {/* Step Content */}
                    <div className="flex-1 px-8 py-6 space-y-6 overflow-y-auto custom-scrollbar pl-9 bg-slate-50/50 dark:bg-slate-950/50">
                        <AnimatePresence mode="wait">
                            {currentStep === 1 ? (
                                <motion.div
                                    key="step1"
                                    initial={{ opacity: 0, x: -16 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: 16 }}
                                    transition={{ duration: 0.2 }}
                                    className="space-y-6"
                                >
                                    {isRegisteringPersona ? (
                                        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-border/40 shadow-sm space-y-4">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    <UserPlus className="w-4 h-4 text-primary" />
                                                    <h4 className="text-[10px] font-black uppercase tracking-widest text-primary">Registrar Nuevo Participante</h4>
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setIsRegisteringPersona(false);
                                                        setMapPersonaFound(null);
                                                    }}
                                                    className="px-2.5 py-1 rounded bg-muted hover:bg-muted/80 text-[8px] font-black uppercase tracking-widest text-muted-foreground transition-all"
                                                >
                                                    Cancelar
                                                </button>
                                            </div>

                                            {/* Sección: Identidad */}
                                            <div className="flex items-center justify-between mb-1">
                                                <p className="text-[8px] font-black uppercase tracking-[0.2em] text-primary border-l-2 border-primary pl-2">Datos de Identidad</p>
                                                {mapPersonaLoading && (
                                                    <span className="flex items-center gap-1 text-[8px] font-bold text-muted-foreground uppercase tracking-widest">
                                                        <Loader2 className="w-3 h-3 animate-spin text-primary" /> Buscando...
                                                    </span>
                                                )}
                                                {mapPersonaFound && (
                                                    <span className="flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-500 text-white text-[8px] font-black uppercase tracking-wider">
                                                        ✓ Vinculado a Padrón (MAP)
                                                    </span>
                                                )}
                                            </div>
                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                                <div className="space-y-1.5">
                                                    <label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground block ml-1">C.I. / Documento *</label>
                                                    <input
                                                        type="text"
                                                        required
                                                        autoComplete="off"
                                                        name="reg_ci"
                                                        placeholder="Ej: 1234567 o 1234567-1B"
                                                        className="w-full h-11 px-4 rounded-xl border border-border/50 bg-white dark:bg-slate-900 focus:border-primary outline-none text-xs font-bold"
                                                        value={newPersonaData.ci}
                                                        onChange={(e) => setNewPersonaData({ ...newPersonaData, ci: e.target.value })}
                                                    />
                                                    <span className="text-[8px] text-muted-foreground/80 font-bold block ml-1">
                                                        Si tiene complemento usar guion (ej: 1234567-1B)
                                                    </span>
                                                </div>
                                                <div className="space-y-1.5 md:col-span-2">
                                                    <label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground block ml-1">Nombres *</label>
                                                    <input
                                                        type="text"
                                                        required
                                                        autoComplete="off"
                                                        name="reg_nombre"
                                                        placeholder="Nombres completos"
                                                        className="w-full h-11 px-4 rounded-xl border border-border/50 bg-white dark:bg-slate-900 focus:border-primary outline-none text-xs font-bold uppercase read-only:opacity-75 read-only:bg-muted/10"
                                                        value={newPersonaData.nombre}
                                                        onChange={(e) => setNewPersonaData({ ...newPersonaData, nombre: e.target.value.toUpperCase() })}
                                                        readOnly={!!mapPersonaFound}
                                                    />
                                                </div>
                                                <div className="space-y-1.5 md:col-span-2">
                                                    <label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground block ml-1">Apellidos *</label>
                                                    <input
                                                        type="text"
                                                        required
                                                        autoComplete="off"
                                                        name="reg_apellidos"
                                                        placeholder="Apellidos completos"
                                                        className="w-full h-11 px-4 rounded-xl border border-border/50 bg-white dark:bg-slate-900 focus:border-primary outline-none text-xs font-bold uppercase read-only:opacity-75 read-only:bg-muted/10"
                                                        value={newPersonaData.apellidos}
                                                        onChange={(e) => setNewPersonaData({ ...newPersonaData, apellidos: e.target.value.toUpperCase() })}
                                                        readOnly={!!mapPersonaFound}
                                                    />
                                                </div>
                                                <div className="space-y-1.5">
                                                    <label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground block ml-1">Fecha de Nacimiento</label>
                                                    <DateInputDMY
                                                        value={newPersonaData.fechaNacimiento}
                                                        onChange={v => setNewPersonaData(prev => ({ ...prev, fechaNacimiento: v }))}
                                                        disabled={!!mapPersonaFound}
                                                    />
                                                </div>
                                            </div>

                                            {/* Sección: Datos Personales */}
                                            <div className="space-y-1 mt-4 mb-1">
                                                <p className="text-[8px] font-black uppercase tracking-[0.2em] text-primary border-l-2 border-primary pl-2">Datos Personales</p>
                                            </div>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div className="space-y-1.5">
                                                    <label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground block ml-1">Género</label>
                                                    <div className="relative">
                                                        <select
                                                            className="w-full h-11 px-4 pr-10 rounded-xl border border-border/50 bg-white dark:bg-slate-900 focus:border-primary outline-none text-xs font-bold appearance-none cursor-pointer disabled:opacity-75 disabled:bg-muted/10"
                                                            value={newPersonaData.genero}
                                                            onChange={(e) => setNewPersonaData({ ...newPersonaData, genero: e.target.value })}
                                                            disabled={!!mapPersonaFound}
                                                        >
                                                            <option value="">Seleccionar...</option>
                                                            <option value="MASCULINO">Masculino</option>
                                                            <option value="FEMENINO">Femenino</option>
                                                            <option value="OTRO">Otro</option>
                                                            <option value="PREFIERO_NO_DECIRLO">Prefiero no decirlo</option>
                                                        </select>
                                                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                                                    </div>
                                                </div>
                                                <div className="space-y-1.5">
                                                    <label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground block ml-1">Estado Civil</label>
                                                    <div className="relative">
                                                        <select
                                                            className="w-full h-11 px-4 pr-10 rounded-xl border border-border/50 bg-white dark:bg-slate-900 focus:border-primary outline-none text-xs font-bold appearance-none cursor-pointer"
                                                            value={newPersonaData.estadoCivil}
                                                            onChange={(e) => setNewPersonaData({ ...newPersonaData, estadoCivil: e.target.value })}
                                                        >
                                                            <option value="">Seleccionar...</option>
                                                            <option value="SOLTERO">Soltero/a</option>
                                                            <option value="CASADO">Casado/a</option>
                                                            <option value="DIVORCIADO">Divorciado/a</option>
                                                            <option value="VIUDO">Viudo/a</option>
                                                            <option value="UNION_LIBRE">Unión Libre</option>
                                                        </select>
                                                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                                                    </div>
                                                </div>
                                                <div className="space-y-1.5 md:col-span-2">
                                                    <label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground block ml-1">Dirección</label>
                                                    <input
                                                        type="text"
                                                        autoComplete="off"
                                                        name="reg_direccion"
                                                        placeholder="Dirección completa"
                                                        className="w-full h-11 px-4 rounded-xl border border-border/50 bg-white dark:bg-slate-900 focus:border-primary outline-none text-xs font-bold"
                                                        value={newPersonaData.direccion}
                                                        onChange={(e) => setNewPersonaData({ ...newPersonaData, direccion: e.target.value })}
                                                    />
                                                </div>
                                            </div>

                                            {/* Sección: Contacto */}
                                            <div className="space-y-1 mt-4 mb-1">
                                                <p className="text-[8px] font-black uppercase tracking-[0.2em] text-primary border-l-2 border-primary pl-2">Información de Contacto</p>
                                            </div>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div className="space-y-1.5">
                                                    <label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground block ml-1">Celular / Teléfono</label>
                                                    <input
                                                        type="tel"
                                                        autoComplete="off"
                                                        name="reg_celular"
                                                        placeholder="Ej: 70000000"
                                                        className="w-full h-11 px-4 rounded-xl border border-border/50 bg-white dark:bg-slate-900 focus:border-primary outline-none text-xs font-bold read-only:opacity-75 read-only:bg-muted/10"
                                                        value={newPersonaData.celular}
                                                        onChange={(e) => setNewPersonaData({ ...newPersonaData, celular: e.target.value })}
                                                        readOnly={!!mapPersonaFound}
                                                    />
                                                </div>
                                                <div className="space-y-1.5">
                                                    <label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground block ml-1">Correo Electrónico</label>
                                                    <input
                                                        type="email"
                                                        autoComplete="off"
                                                        name="reg_correo"
                                                        placeholder="correo@ejemplo.com"
                                                        className="w-full h-11 px-4 rounded-xl border border-border/50 bg-white dark:bg-slate-900 focus:border-primary outline-none text-xs font-bold read-only:opacity-75 read-only:bg-muted/10"
                                                        value={newPersonaData.correo}
                                                        onChange={(e) => setNewPersonaData({ ...newPersonaData, correo: e.target.value })}
                                                        readOnly={!!mapPersonaFound}
                                                    />
                                                </div>
                                            </div>

                                            <button
                                                type="button"
                                                disabled={personaRegistering || !newPersonaData.ci.trim() || !newPersonaData.nombre.trim() || !newPersonaData.apellidos.trim()}
                                                onClick={handleRegisterPersona}
                                                className="w-full h-12 rounded-xl bg-primary text-white text-[10px] font-black uppercase tracking-widest hover:bg-primary/90 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                                            >
                                                {personaRegistering ? <Loader2 className="w-4.5 h-4.5 animate-spin" /> : <Check className="w-4.5 h-4.5" />}
                                                Crear y Seleccionar Participante
                                            </button>
                                        </div>
                                    ) : (
                                        <>
                                            {/* Persona Search block */}
                                            <div className="space-y-3">
                                                <div className="flex items-center justify-between">
                                                    <label className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                                                        <User className="w-3.5 h-3.5 text-primary" />
                                                        Identificación del Participante
                                                    </label>
                                                    {!formData.personaId && (
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                setIsRegisteringPersona(true);
                                                                setMapPersonaFound(null);
                                                                setNewPersonaData({
                                                                    ci: /^\d+$/.test(personaSearch) ? personaSearch : '',
                                                                    nombre: /^[a-zA-Z\s]+$/.test(personaSearch) ? personaSearch : '',
                                                                    apellidos: '',
                                                                    fechaNacimiento: '',
                                                                    genero: '',
                                                                    estadoCivil: '',
                                                                    direccion: '',
                                                                    celular: '',
                                                                    correo: ''
                                                                });
                                                            }}
                                                            className="text-[9px] font-black uppercase tracking-widest text-primary hover:underline flex items-center gap-1"
                                                        >
                                                            <Plus className="w-3 h-3" /> Registrar Nuevo
                                                        </button>
                                                    )}
                                                </div>

                                                <div className="relative">
                                                    <div
                                                        className={cn(
                                                            'relative flex items-center rounded-2xl border-2 bg-white dark:bg-slate-900 transition-all shadow-sm',
                                                            formData.personaId
                                                                ? 'border-primary/40'
                                                                : personaSearch.length >= 3
                                                                    ? 'border-primary shadow-lg shadow-primary/10'
                                                                    : 'border-border/50 hover:border-primary/30'
                                                        )}
                                                    >
                                                        <Search className="absolute left-5 w-5 h-5 text-muted-foreground shrink-0" />
                                                        <input
                                                            ref={searchRef}
                                                            type="text"
                                                            placeholder="Buscar por CI, nombre o apellidos..."
                                                            className="w-full h-14 pl-14 pr-12 bg-transparent outline-none text-xs font-bold text-foreground placeholder:text-muted-foreground/50"
                                                            value={personaSearch}
                                                            onChange={(e) => {
                                                                setPersonaSearch(e.target.value);
                                                                setFormData({ ...formData, personaId: '' });
                                                            }}
                                                            required
                                                        />
                                                        {personaLoading && (
                                                            <Loader2 className="absolute right-5 w-5 h-5 text-primary animate-spin" />
                                                        )}
                                                        {formData.personaId && !personaLoading && (
                                                            <CheckCircle2 className="absolute right-5 w-5 h-5 text-emerald-500" />
                                                        )}
                                                    </div>

                                                    {/* Dropdown */}
                                                    <AnimatePresence>
                                                        {personasFound.length > 0 && !formData.personaId && (
                                                            <motion.div
                                                                initial={{ opacity: 0, y: -8, scale: 0.98 }}
                                                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                                                exit={{ opacity: 0, y: -8, scale: 0.98 }}
                                                                className="absolute z-[100] top-full left-0 right-0 mt-2 bg-white dark:bg-slate-900 border border-border/50 rounded-3xl shadow-2xl overflow-hidden"
                                                            >
                                                                <div className="p-2 space-y-1 max-h-64 overflow-y-auto custom-scrollbar">
                                                                    {personasFound.slice(0, 6).map((p: any) => (
                                                                        <button
                                                                            key={p.id}
                                                                            type="button"
                                                                            onClick={() => {
                                                                                setFormData({ ...formData, personaId: p.id });
                                                                                setPersonaSearch(`${p.nombre} ${p.apellidos}`);
                                                                                setPersonasFound([]);
                                                                            }}
                                                                            className="w-full flex items-center gap-4 p-3 rounded-2xl hover:bg-primary/5 dark:hover:bg-primary/10 transition-all group text-left"
                                                                        >
                                                                            <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-black text-[11px] shrink-0">
                                                                                {`${p.nombre?.[0] ?? ''}${p.apellidos?.[0] ?? ''}`.toUpperCase()}
                                                                            </div>
                                                                            <div className="flex-1 min-w-0">
                                                                                <p className="text-[12px] font-black uppercase text-foreground group-hover:text-primary transition-colors truncate">
                                                                                    {p.nombre} {p.apellidos}
                                                                                </p>
                                                                                <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider">
                                                                                    CI: {p.ci} · {p.celular}
                                                                                </p>
                                                                            </div>
                                                                            <ArrowUpRight className="w-4 h-4 text-primary opacity-0 group-hover:opacity-100 transition-all shrink-0" />
                                                                        </button>
                                                                    ))}
                                                                </div>
                                                                {personasFound.length > 6 && (
                                                                    <div className="px-4 py-2 bg-muted/30 text-[9px] font-bold text-muted-foreground text-center uppercase tracking-widest border-t border-border/30">
                                                                        +{personasFound.length - 6} resultados · refine su búsqueda
                                                                    </div>
                                                                )}
                                                            </motion.div>
                                                        )}
                                                    </AnimatePresence>
                                                </div>

                                                {/* Selected persona card */}
                                                <AnimatePresence>
                                                    {formData.personaId && (
                                                        <motion.div
                                                            initial={{ opacity: 0, y: 8 }}
                                                            animate={{ opacity: 1, y: 0 }}
                                                            exit={{ opacity: 0, y: 8 }}
                                                            className="relative overflow-hidden p-4 rounded-2xl bg-primary text-white shadow-xl shadow-primary/20"
                                                        >
                                                            {/* Background pattern */}
                                                            <div className="absolute inset-0 opacity-10" style={{
                                                                backgroundImage: 'radial-gradient(circle at 85% 50%, white 1px, transparent 1px)',
                                                                backgroundSize: '16px 16px',
                                                            }} />
                                                            <div className="relative flex items-center justify-between">
                                                                <div className="flex items-center gap-4">
                                                                    <div className="w-11 h-11 rounded-xl bg-white/20 flex items-center justify-center font-black text-sm">
                                                                        {personaSearch.split(' ').map((w: string) => w[0]).slice(0, 2).join('').toUpperCase()}
                                                                    </div>
                                                                    <div>
                                                                        <p className="text-xs font-black uppercase tracking-wide leading-none">
                                                                            {personaSearch}
                                                                        </p>
                                                                        <p className="text-[9px] font-bold text-white/70 uppercase tracking-widest mt-1">
                                                                            Participante Vinculado Exitosamente
                                                                        </p>
                                                                    </div>
                                                                </div>
                                                                {!editingInscripcion && (
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => {
                                                                            setFormData({ ...formData, personaId: '' });
                                                                            setPersonaSearch('');
                                                                        }}
                                                                        className="px-3.5 py-2 bg-white/15 hover:bg-white/25 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all"
                                                                    >
                                                                        Cambiar
                                                                    </button>
                                                                )}
                                                            </div>
                                                        </motion.div>
                                                    )}
                                                </AnimatePresence>

                                                {/* Not Found Suggestion */}
                                                {!formData.personaId && personaSearch.length >= 3 && !personaLoading && personasFound.length === 0 && (
                                                    <div className="p-5 rounded-2xl border border-dashed border-border bg-white dark:bg-slate-900 text-center space-y-3">
                                                        <p className="text-[10px] font-bold text-muted-foreground uppercase">No se encontró ningún participante con "{personaSearch}"</p>
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                setIsRegisteringPersona(true);
                                                                setNewPersonaData({
                                                                    ci: /^\d+$/.test(personaSearch) ? personaSearch : '',
                                                                    nombre: /^[a-zA-Z\s]+$/.test(personaSearch) ? personaSearch : '',
                                                                    apellidos: '',
                                                                    fechaNacimiento: '',
                                                                    genero: '',
                                                                    estadoCivil: '',
                                                                    direccion: '',
                                                                    celular: '',
                                                                    correo: ''
                                                                });
                                                            }}
                                                            className="h-10 px-5 rounded-xl bg-primary text-white text-[9px] font-black uppercase tracking-widest hover:bg-primary/90 transition-all inline-flex items-center gap-2"
                                                        >
                                                            <UserPlus className="w-4 h-4" /> Registrar como Nuevo
                                                        </button>
                                                    </div>
                                                )}

                                                {/* Hint */}
                                                {!formData.personaId && personaSearch.length < 3 && (
                                                    <p className="flex items-center gap-2 text-[9px] font-bold text-muted-foreground/60 uppercase tracking-widest px-1">
                                                        <AlertCircle className="w-3.5 h-3.5" />
                                                        Ingrese al menos 3 caracteres para buscar
                                                    </p>
                                                )}
                                            </div>

                                            {/* Dynamic Extra Fields */}
                                            {camposExtra.length > 0 && (
                                                <div className="space-y-4">
                                                    <div className="flex items-center gap-2">
                                                        <Star className="w-3.5 h-3.5 text-amber-500" />
                                                        <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                                                            Información Complementaria
                                                        </span>
                                                    </div>
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-5 rounded-2xl bg-white dark:bg-slate-900 border border-border/40 shadow-sm">
                                                        {camposExtra.map((field: any) => {
                                                            const fieldType = (field.tipo ?? '').toString().toLowerCase().trim();
                                                            let options: string[] = [];
                                                            if (Array.isArray(field.opciones)) {
                                                                options = field.opciones;
                                                            } else if (typeof field.opciones === 'string') {
                                                                try {
                                                                    options = field.opciones.startsWith('[')
                                                                        ? JSON.parse(field.opciones)
                                                                        : field.opciones.split(',').map((s: string) => s.trim());
                                                                } catch { }
                                                            }

                                                            const baseInput = 'w-full h-12 px-4 rounded-xl border border-border/50 bg-white dark:bg-slate-900 focus:border-primary outline-none text-xs font-bold transition-all shadow-sm';

                                                            return (
                                                                <div key={field.id} className="space-y-1.5">
                                                                    <label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground block ml-1">
                                                                        {field.label} {field.esObligatorio && <span className="text-rose-500">*</span>}
                                                                    </label>
                                                                    {(() => {
                                                                        if (['seleccion_unica', 'seleccion unica', 'select', 'single_select'].includes(fieldType)) {
                                                                            return (
                                                                                <div className="relative">
                                                                                    <select
                                                                                        className={cn(baseInput, 'appearance-none cursor-pointer pr-10')}
                                                                                        value={userExtraResponses[field.id] || ''}
                                                                                        onChange={(e) => setUserExtraResponses({ ...userExtraResponses, [field.id]: e.target.value })}
                                                                                        required={field.esObligatorio}
                                                                                    >
                                                                                        <option value="" disabled>Seleccione...</option>
                                                                                        {options.map((opt) => (
                                                                                            <option key={opt} value={opt}>{opt}</option>
                                                                                        ))}
                                                                                    </select>
                                                                                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                                                                                </div>
                                                                            );
                                                                        }

                                                                        if (['seleccion_multiple', 'seleccion multiple', 'checkbox', 'multiple_select'].includes(fieldType)) {
                                                                            return (
                                                                                <div className="flex flex-col gap-2.5 p-4 bg-white dark:bg-slate-900 border border-border/50 rounded-2xl shadow-sm">
                                                                                    {options.map((opt: string) => {
                                                                                        const isChecked = (userExtraResponses[field.id] || '').split(',').includes(opt);
                                                                                        return (
                                                                                            <label key={opt} className="flex items-center gap-3 text-xs font-bold cursor-pointer group hover:bg-slate-50 dark:hover:bg-slate-800/50 p-2 -m-2 rounded-xl transition-all">
                                                                                                <div className={cn("w-5 h-5 rounded-lg flex items-center justify-center border-2 transition-all duration-300", isChecked ? "bg-primary border-primary scale-105" : "border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 group-hover:border-primary/50")}>
                                                                                                    {isChecked && <Check className="w-3.5 h-3.5 text-white" />}
                                                                                                </div>
                                                                                                <input
                                                                                                    type="checkbox"
                                                                                                    className="hidden"
                                                                                                    checked={isChecked}
                                                                                                    onChange={(e) => {
                                                                                                        const current = (userExtraResponses[field.id] || '').split(',').filter(Boolean);
                                                                                                        if (e.target.checked) {
                                                                                                            setUserExtraResponses({ ...userExtraResponses, [field.id]: [...current, opt].join(',') });
                                                                                                        } else {
                                                                                                            setUserExtraResponses({ ...userExtraResponses, [field.id]: current.filter(c => c !== opt).join(',') });
                                                                                                        }
                                                                                                    }}
                                                                                                />
                                                                                                <span className={cn("transition-colors duration-200", isChecked ? "text-primary font-black" : "text-foreground")}>{opt}</span>
                                                                                            </label>
                                                                                        );
                                                                                    })}
                                                                                </div>
                                                                            );
                                                                        }

                                                                        return (
                                                                            <input
                                                                                className={baseInput}
                                                                                type={['number', 'numero'].includes(fieldType) ? 'number' : ['date', 'fecha'].includes(fieldType) ? 'date' : 'text'}
                                                                                value={userExtraResponses[field.id] || ''}
                                                                                onChange={(e) => setUserExtraResponses({ ...userExtraResponses, [field.id]: e.target.value })}
                                                                                placeholder={`${field.label}...`}
                                                                                required={field.esObligatorio}
                                                                            />
                                                                        );
                                                                    })()}
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                </div>
                                            )}
                                        </>
                                    )}
                                </motion.div>
                            ) : currentStep === 2 ? (
                                <motion.div
                                    key="step2"
                                    initial={{ opacity: 0, x: 16 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -16 }}
                                    transition={{ duration: 0.2 }}
                                    className="space-y-5"
                                >
                                    {/* Participante pill */}
                                    {personaSearch && (
                                        <div className="flex items-center gap-3 px-4 py-2 rounded-2xl bg-primary/5 border border-primary/10 w-fit">
                                            <div className="w-7 h-7 rounded-full bg-primary/15 flex items-center justify-center text-primary text-[10px] font-black">
                                                {personaSearch.split(' ').map((w: string) => w[0]).slice(0, 2).join('').toUpperCase()}
                                            </div>
                                            <span className="text-[11px] font-black text-primary uppercase tracking-wide">{personaSearch}</span>
                                        </div>
                                    )}
                                    <label className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                                        <GraduationCap className="w-3.5 h-3.5 text-primary" />
                                        Seleccione la Versión Académica
                                    </label>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[340px] overflow-y-auto custom-scrollbar pr-1">
                                        {uniqueVersions.map((v: any) => {
                                            const isSelected = selectedVersionId === v.id;
                                            return (
                                                <button
                                                    key={v.id}
                                                    type="button"
                                                    onClick={() => {
                                                        setSelectedVersionId(v.id);
                                                        setFormData({ ...formData, programaId: '', sedeId: '', turnoId: '' });
                                                    }}
                                                    className={cn(
                                                        'relative p-4 rounded-2xl border-2 text-left transition-all group overflow-hidden',
                                                        isSelected
                                                            ? 'border-primary bg-primary/5 shadow-lg shadow-primary/10'
                                                            : 'border-border/40 bg-white dark:bg-slate-900 hover:border-primary/40 hover:shadow-sm'
                                                    )}
                                                >
                                                    {isSelected && (
                                                        <div className="absolute top-3 right-3 w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                                                            <Check className="w-3 h-3 text-white" />
                                                        </div>
                                                    )}
                                                    <div className="flex items-center gap-2 mb-2">
                                                        <span className="px-2.5 py-0.5 rounded-full bg-primary text-white text-[9px] font-black tracking-widest uppercase">
                                                            {v.nombre} {v.numero}
                                                        </span>
                                                        {v.gestion && (
                                                            <span className="text-[9px] font-bold text-muted-foreground bg-muted/50 px-2 py-0.5 rounded-full">
                                                                {v.gestion}
                                                            </span>
                                                        )}
                                                    </div>
                                                    <p className={cn(
                                                        'text-[11px] font-black uppercase tracking-tight leading-tight',
                                                        isSelected ? 'text-primary' : 'text-foreground group-hover:text-primary transition-colors'
                                                    )}>
                                                        {v.programaNombre}
                                                    </p>
                                                    {v.codigo && (
                                                        <p className="text-[8px] font-black text-muted-foreground/50 uppercase tracking-widest mt-1">
                                                            {v.codigo}
                                                        </p>
                                                    )}
                                                </button>
                                            );
                                        })}
                                        {uniqueVersions.length === 0 && (
                                            <div className="col-span-2 py-12 text-center text-muted-foreground text-[11px] font-bold uppercase tracking-widest">
                                                No hay versiones académicas disponibles
                                            </div>
                                        )}
                                    </div>
                                </motion.div>
                            ) : currentStep === 3 ? (
                                <motion.div
                                    key="step3"
                                    initial={{ opacity: 0, x: 16 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -16 }}
                                    transition={{ duration: 0.2 }}
                                    className="space-y-6"
                                >
                                    {/* Breadcrumb versión seleccionada */}
                                    {selectedVersionId && (() => {
                                        const v = uniqueVersions.find((x: any) => x.id === selectedVersionId);
                                        return v ? (
                                            <div className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-primary/5 border border-primary/10 w-fit">
                                                <GraduationCap className="w-3.5 h-3.5 text-primary" />
                                                <span className="text-[10px] font-black text-primary uppercase tracking-wide">{v.nombre} {v.numero} · {v.gestion}</span>
                                            </div>
                                        ) : null;
                                    })()}

                                    {/* Programas disponibles */}
                                    <div className="space-y-3">
                                        <label className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                                            <BookOpen className="w-3.5 h-3.5 text-primary" />
                                            Programa Académico
                                        </label>
                                        <div className="grid grid-cols-1 gap-2 max-h-48 overflow-y-auto custom-scrollbar pr-1">
                                            {ofertas
                                                .filter((o: any) => o.version?.id === selectedVersionId)
                                                .map((o: any) => {
                                                    const isSelected = formData.programaId === o.id;
                                                    return (
                                                        <button
                                                            key={o.id}
                                                            type="button"
                                                            onClick={() => {
                                                                let newTurnoId = o?.turnos?.[0]?.id || '';
                                                                if (formData.turnoId && formData.programaId) {
                                                                    const oldOferta = ofertas.find((old: any) => old.id === formData.programaId);
                                                                    const oldTurno = oldOferta?.turnos?.find((t: any) => t.id === formData.turnoId);
                                                                    if (oldTurno) {
                                                                        const matchingTurno = o?.turnos?.find((t: any) => t.turnoConfig?.nombre === oldTurno.turnoConfig?.nombre);
                                                                        if (matchingTurno) newTurnoId = matchingTurno.id;
                                                                    }
                                                                }
                                                                setFormData({ ...formData, programaId: o.id, sedeId: o.sedeId, turnoId: newTurnoId });
                                                            }}
                                                            className={cn(
                                                                'flex items-center justify-between w-full px-4 py-3 rounded-xl border-2 transition-all text-left',
                                                                isSelected
                                                                    ? 'border-primary bg-primary/5 shadow-md'
                                                                    : 'border-border/40 bg-white dark:bg-slate-900 hover:border-primary/40'
                                                            )}
                                                        >
                                                            <div>
                                                                <p className={cn('text-[11px] font-black uppercase tracking-tight', isSelected ? 'text-primary' : 'text-foreground')}>
                                                                    {o.nombre}
                                                                </p>
                                                                <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest mt-0.5">
                                                                    {o.codigo && <span>{o.codigo} · </span>}{o.sede?.nombre || 'General'}
                                                                </p>
                                                            </div>
                                                            {isSelected && <Check className="w-4 h-4 text-primary shrink-0" />}
                                                        </button>
                                                    );
                                                })}
                                        </div>
                                    </div>

                                    {/* Turno selection */}
                                    <AnimatePresence>
                                        {formData.programaId && (
                                            <motion.div
                                                initial={{ opacity: 0, y: 8 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                className="space-y-3 pt-4 border-t border-border/30"
                                            >
                                                <label className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                                                    <Clock className="w-3.5 h-3.5 text-primary" />
                                                    Horario / Turno
                                                </label>
                                                <div className="flex flex-wrap gap-2.5">
                                                    {(ofertas.find(o => o.id === formData.programaId)?.turnos || []).map((t: any) => {
                                                        const isSelected = formData.turnoId === t.id;
                                                        return (
                                                            <button
                                                                key={t.id}
                                                                type="button"
                                                                onClick={() => setFormData({ ...formData, turnoId: t.id })}
                                                                className={cn(
                                                                    'flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 transition-all text-[10px] font-black uppercase tracking-wider',
                                                                    isSelected
                                                                        ? 'border-primary bg-primary text-white shadow-lg shadow-primary/20'
                                                                        : 'border-border/40 bg-white dark:bg-slate-900 text-foreground hover:border-primary/50'
                                                                )}
                                                            >
                                                                <Clock className={cn('w-3.5 h-3.5', isSelected ? 'text-white/85' : 'text-primary/60')} />
                                                                {t.turnoConfig?.nombre || 'Turno Único'}
                                                                {isSelected && <Check className="w-3.5 h-3.5 ml-1" />}
                                                            </button>
                                                        );
                                                    })}
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>

                                    {/* Summary preview */}
                                    <AnimatePresence>
                                        {formData.programaId && formData.turnoId && (
                                            <motion.div
                                                initial={{ opacity: 0, y: 12 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                className="p-4 rounded-2xl border border-emerald-200 dark:border-emerald-800/40 bg-emerald-50/50 dark:bg-emerald-900/10"
                                            >
                                                <div className="flex items-center gap-2 mb-3">
                                                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                                                    <span className="text-[10px] font-black uppercase tracking-widest text-emerald-700 dark:text-emerald-400">Selección Confirmada</span>
                                                </div>
                                                {(() => {
                                                    const sel = ofertas.find(o => o.id === formData.programaId);
                                                    return (
                                                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-[10px] font-bold">
                                                            <div>
                                                                <p className="text-muted-foreground uppercase tracking-widest text-[8px] mb-0.5">Programa</p>
                                                                <p className="font-black text-foreground line-clamp-1">{sel?.nombre}</p>
                                                            </div>
                                                            <div>
                                                                <p className="text-muted-foreground uppercase tracking-widest text-[8px] mb-0.5">Sede</p>
                                                                <p className="font-black text-foreground">{sel?.sede?.nombre || 'General'}</p>
                                                            </div>
                                                            <div>
                                                                <p className="text-muted-foreground uppercase tracking-widest text-[8px] mb-0.5">Turno</p>
                                                                <p className="font-black text-foreground">{sel?.turnos?.find((t: any) => t.id === formData.turnoId)?.turnoConfig?.nombre || 'Único'}</p>
                                                            </div>
                                                        </div>
                                                    );
                                                })()}
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </motion.div>
                            ) : (
                                <motion.div
                                    key="step4"
                                    initial={{ opacity: 0, x: 16 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -16 }}
                                    transition={{ duration: 0.2 }}
                                    className="space-y-6"
                                >
                                    {/* Summary pill */}
                                    {formData.programaId && (() => {
                                        const sel = ofertas.find(o => o.id === formData.programaId);
                                        const turno = sel?.turnos?.find((t: any) => t.id === formData.turnoId);
                                        return (
                                            <div className="p-4 rounded-2xl bg-primary/5 border border-primary/10 space-y-1">
                                                <p className="text-[11px] font-black text-primary uppercase tracking-tight">{sel?.nombre}</p>
                                                <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">
                                                    {sel?.sede?.nombre || 'General'} · {turno?.turnoConfig?.nombre || 'Turno Único'}
                                                </p>
                                            </div>
                                        );
                                    })()}

                                    {/* Estado */}
                                    <div className="space-y-3">
                                        <label className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                                            <BookOpen className="w-3.5 h-3.5 text-primary" />
                                            Estado del Registro Académico
                                        </label>
                                        <div className="flex flex-wrap gap-2">
                                            {estadosInscripcion.map((est: any) => {
                                                const isSelected = formData.estadoInscripcionId === est.id;
                                                const colorMap: Record<string, string> = {
                                                    INSCRITO: 'border-emerald-500 bg-emerald-500 hover:bg-emerald-600',
                                                    PREINSCRITO: 'border-amber-500 bg-amber-500 hover:bg-amber-600',
                                                    BAJA: 'border-rose-500 bg-rose-500 hover:bg-rose-600',
                                                };
                                                const activeColor = colorMap[est.nombre] ?? 'border-primary bg-primary hover:bg-primary/90';
                                                return (
                                                    <button
                                                        key={est.id}
                                                        type="button"
                                                        onClick={() => setFormData({ ...formData, estadoInscripcionId: est.id })}
                                                        className={cn(
                                                            'px-4 py-2.5 rounded-xl border-2 text-[9px] font-black uppercase tracking-widest transition-all',
                                                            isSelected
                                                                ? `${activeColor} text-white shadow-lg`
                                                                : 'border-border/40 bg-white dark:bg-slate-900 text-foreground hover:border-primary/40'
                                                        )}
                                                    >
                                                        {est.nombre}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>

                                    {/* Campos extra */}
                                    {camposExtra.length > 0 && (
                                        <div className="space-y-4 pt-4 border-t border-border/30">
                                            <div className="flex items-center gap-2">
                                                <Star className="w-3.5 h-3.5 text-amber-500" />
                                                <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Información Complementaria</span>
                                            </div>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                {camposExtra.map((field: any) => {
                                                    const fieldType = (field.tipo ?? '').toString().toLowerCase().trim();
                                                    let options: string[] = [];
                                                    if (Array.isArray(field.opciones)) options = field.opciones;
                                                    else if (typeof field.opciones === 'string') {
                                                        try { options = field.opciones.startsWith('[') ? JSON.parse(field.opciones) : field.opciones.split(',').map((s: string) => s.trim()); } catch { }
                                                    }
                                                    const baseInput = 'w-full h-11 px-4 rounded-xl border border-border/50 bg-white dark:bg-slate-900 focus:border-primary outline-none text-xs font-bold';
                                                    return (
                                                        <div key={field.id} className="space-y-1.5">
                                                            <label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground block ml-1">{field.label}{field.esObligatorio && <span className="text-rose-500 ml-1">*</span>}</label>
                                                            {['seleccion_unica', 'seleccion unica', 'select', 'single_select'].includes(fieldType) ? (
                                                                <div className="relative">
                                                                    <select className={cn(baseInput, 'appearance-none cursor-pointer pr-10')} value={userExtraResponses[field.id] || ''} onChange={e => setUserExtraResponses({ ...userExtraResponses, [field.id]: e.target.value })} required={field.esObligatorio}>
                                                                        <option value="" disabled>Seleccione...</option>
                                                                        {options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                                                    </select>
                                                                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                                                                </div>
                                                            ) : (
                                                                <input className={baseInput} type={['number', 'numero'].includes(fieldType) ? 'number' : ['date', 'fecha'].includes(fieldType) ? 'date' : 'text'} value={userExtraResponses[field.id] || ''} onChange={e => setUserExtraResponses({ ...userExtraResponses, [field.id]: e.target.value })} placeholder={`${field.label}...`} required={field.esObligatorio} />
                                                            )}
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    )}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* Modal Footer */}
                    <div className="shrink-0 px-8 py-5 bg-white dark:bg-slate-900 border-t border-border/40 flex justify-between items-center gap-4 pl-9">
                        <button
                            type="button"
                            onClick={() => {
                                if (editingInscripcion) { setIsModalOpen(false); return; }
                                if (currentStep > 1) setCurrentStep(currentStep - 1);
                                else setIsModalOpen(false);
                            }}
                            className="h-12 px-5 rounded-xl text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-all flex items-center gap-2"
                        >
                            <ChevronLeft className="w-4 h-4" />
                            {currentStep === 1 || editingInscripcion ? 'Cancelar' : 'Atrás'}
                        </button>

                        <p className="hidden md:flex items-center gap-1.5 text-[9px] font-bold text-muted-foreground uppercase tracking-widest">
                            <Info className="w-3.5 h-3.5 text-primary/50" />
                            {currentStep === 1 ? 'Seleccione al participante'
                                : currentStep === 2 ? 'Seleccione la versión académica'
                                    : currentStep === 3 ? 'Seleccione programa, sede y turno'
                                        : 'Seleccione el estado e información complementaria'}
                        </p>

                        {/* Avanzar pasos o confirmar */}
                        {!editingInscripcion && currentStep < 4 ? (
                            <button
                                type="button"
                                disabled={
                                    (currentStep === 1 && !formData.personaId) ||
                                    (currentStep === 2 && !selectedVersionId) ||
                                    (currentStep === 3 && (!formData.programaId || !formData.turnoId))
                                }
                                onClick={() => setCurrentStep(currentStep + 1)}
                                className="h-14 px-8 rounded-xl font-black text-[10px] uppercase tracking-[0.2em] transition-all flex items-center gap-3 shadow-xl disabled:opacity-40 disabled:cursor-not-allowed bg-primary text-primary-foreground hover:bg-primary/90 hover:scale-[1.01]"
                            >
                                <span>{currentStep === 1 ? 'Elegir Versión' : currentStep === 2 ? 'Elegir Programa' : 'Elegir Estado'}</span>
                                <ArrowRightCircle className="w-4 h-4" />
                            </button>
                        ) : (
                            <button
                                type="submit"
                                disabled={isSubmitting || !formData.personaId || !formData.programaId || !formData.turnoId}
                                className="h-14 px-8 rounded-xl font-black text-[10px] uppercase tracking-[0.2em] transition-all flex items-center gap-3 shadow-xl disabled:opacity-40 disabled:cursor-not-allowed bg-primary text-primary-foreground hover:bg-primary/90 hover:scale-[1.01]"
                            >
                                {isSubmitting ? (
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                ) : editingInscripcion ? (
                                    <><CheckCircle2 className="w-5 h-5" /><span>Guardar Cambios</span></>
                                ) : (
                                    <><Stamp className="w-5 h-5" /><span>Confirmar Matrícula</span></>
                                )}
                            </button>
                        )}
                    </div>
                </form>
            </Modal>

            {/* Inscritos Modal (Reused for Detail View) */}
            <InscritosModal
                isOpen={isInscritosModalOpen}
                onClose={() => setIsInscritosModalOpen(false)}
                oferta={targetOferta}
            />

            {/* Bulk Migration Modal */}
            <Modal
                isOpen={isBulkModalOpen}
                onClose={() => setIsBulkModalOpen(false)}
                title={undefined}
                size="2xl"
            >
                <div className="flex flex-col bg-slate-50 dark:bg-slate-950">
                    <div className="p-8 bg-white dark:bg-slate-900 border-b border-border/40">
                        <div className="flex items-center gap-4">
                            <div className="w-14 h-14 rounded-2xl bg-amber-500 flex items-center justify-center text-white shadow-xl shadow-amber-500/20">
                                <ArrowLeftRight className="w-8 h-8" />
                            </div>
                            <div>
                                <h3 className="text-2xl font-black uppercase tracking-tighter italic leading-none">
                                    Migración <span className="text-amber-600">Masiva</span>
                                </h3>
                                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground">Importación de participantes vía Excel/CSV</p>
                            </div>
                        </div>
                    </div>

                    <div className="p-8 space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-1.5 md:col-span-2">
                                <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">Versión de Destino</label>
                                <select
                                    className="w-full h-14 px-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 focus:border-amber-500 outline-none text-xs font-bold"
                                    value={bulkDestination.versionId}
                                    onChange={(e) => setBulkDestination({ ...bulkDestination, versionId: e.target.value, programaId: '', turnoId: '' })}
                                >
                                    <option value="">Seleccione Versión</option>
                                    {uniqueVersions.map(v => <option key={v.id} value={v.id}>{v.nombre} {v.numero} ({v.gestion})</option>)}
                                </select>
                            </div>

                            {bulkDestination.versionId && (
                                <>
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">Sede / Modalidad</label>
                                        <select
                                            className="w-full h-14 px-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 focus:border-amber-500 outline-none text-xs font-bold"
                                            value={bulkDestination.programaId}
                                            onChange={(e) => {
                                                const o = ofertas.find(oferta => oferta.id === e.target.value);
                                                setBulkDestination({ ...bulkDestination, programaId: e.target.value, turnoId: o?.turnos?.[0]?.id || '' });
                                            }}
                                        >
                                            <option value="">Seleccione Sede</option>
                                            {ofertas.filter(o => o.version?.id === bulkDestination.versionId).map(o => (
                                                <option key={o.id} value={o.id}>{o.sede?.nombre}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">Turno</label>
                                        <select
                                            className="w-full h-14 px-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 focus:border-amber-500 outline-none text-xs font-bold"
                                            value={bulkDestination.turnoId}
                                            onChange={(e) => setBulkDestination({ ...bulkDestination, turnoId: e.target.value })}
                                        >
                                            <option value="">Seleccione Turno</option>
                                            {ofertas.find(o => o.id === bulkDestination.programaId)?.turnos?.map((t: any) => (
                                                <option key={t.id} value={t.id}>{t.turnoConfig?.nombre}</option>
                                            ))}
                                        </select>
                                    </div>
                                </>
                            )}
                        </div>

                        <div className="p-10 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-[2.5rem] bg-white/50 dark:bg-slate-900/50 flex flex-col items-center justify-center gap-4 hover:border-amber-500/50 transition-all group cursor-pointer relative overflow-hidden">
                            <div className={cn("w-16 h-16 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform", bulkFile ? "bg-emerald-500 text-white" : "bg-amber-500/10 text-amber-600")}>
                                {bulkFile ? <CheckCircle2 className="w-8 h-8" /> : <Download className="w-8 h-8" />}
                            </div>
                            <div className="text-center">
                                <p className="text-sm font-black uppercase tracking-tight">{bulkFile ? bulkFile.name : 'Seleccionar Archivo Excel'}</p>
                                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{bulkData.length > 0 ? `${bulkData.length} registros detectados` : 'Formatos permitidos: .xlsx, .csv'}</p>
                            </div>
                            <input
                                type="file"
                                className="absolute inset-0 opacity-0 cursor-pointer"
                                accept=".xlsx, .csv"
                                onChange={handleBulkFile}
                                disabled={isMigrating}
                            />
                        </div>

                        {isMigrating && (
                            <div className="space-y-3">
                                <div className="flex justify-between items-center px-1">
                                    <span className="text-[10px] font-black uppercase tracking-widest text-amber-600 animate-pulse">Procesando registros...</span>
                                    <span className="text-[10px] font-black text-amber-600">{migrationProgress}%</span>
                                </div>
                                <div className="h-3 w-full bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                                    <motion.div
                                        className="h-full bg-amber-500"
                                        initial={{ width: 0 }}
                                        animate={{ width: `${migrationProgress}%` }}
                                        transition={{ duration: 0.5 }}
                                    />
                                </div>
                            </div>
                        )}

                        {migrationReport && (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="p-8 rounded-[2rem] bg-slate-100/50 dark:bg-slate-900/50 border border-border/40 space-y-6"
                            >
                                <div className="flex items-center justify-between mb-4">
                                    <h4 className="text-[10px] font-black uppercase tracking-widest text-foreground">Resultado de la Importación</h4>
                                    <span className="text-[9px] font-bold px-2 py-1 bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-border/50">
                                        Total: {migrationReport.success + migrationReport.errors.length} registros
                                    </span>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="p-6 rounded-3xl bg-white dark:bg-slate-800 shadow-sm border border-emerald-100 dark:border-emerald-900/30 flex flex-col items-center gap-2">
                                        <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center"><CheckCircle2 className="w-6 h-6" /></div>
                                        <p className="text-2xl font-black text-emerald-600">{migrationReport.success}</p>
                                        <p className="text-[8px] font-black uppercase tracking-widest text-emerald-600/60">Migrados con Éxito</p>
                                    </div>
                                    <div className="p-6 rounded-3xl bg-white dark:bg-slate-800 shadow-sm border border-rose-100 dark:border-rose-900/30 flex flex-col items-center gap-2">
                                        <div className="w-10 h-10 rounded-xl bg-rose-500/10 text-rose-600 flex items-center justify-center"><XCircle className="w-6 h-6" /></div>
                                        <p className="text-2xl font-black text-rose-600">{migrationReport.errors.length}</p>
                                        <p className="text-[8px] font-black uppercase tracking-widest text-rose-600/60">Registros con Error</p>
                                    </div>
                                </div>

                                {migrationReport.errors.length > 0 && (
                                    <div className="space-y-3">
                                        <div className="flex items-center gap-2 px-1">
                                            <Info className="w-3.5 h-3.5 text-rose-500" />
                                            <span className="text-[9px] font-black uppercase tracking-widest text-rose-500">Detalle de errores</span>
                                        </div>
                                        <div className="max-h-52 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                                            {migrationReport.errors.slice(0, 100).map((err: any, idx: number) => (
                                                <div key={idx} className="p-4 rounded-2xl bg-white dark:bg-slate-800 border border-rose-100 dark:border-rose-900/20 flex items-center justify-between group hover:border-rose-500/30 transition-all">
                                                    <div className="flex flex-col">
                                                        <span className="text-[10px] font-black">CI: {err.ci}</span>
                                                    </div>
                                                    <span className="text-[9px] font-bold text-rose-500/80 px-3 py-1 bg-rose-500/5 rounded-full uppercase tracking-tight">{err.error}</span>
                                                </div>
                                            ))}
                                            {migrationReport.errors.length > 100 && (
                                                <p className="text-[9px] text-center font-bold text-muted-foreground p-2 italic">... y {migrationReport.errors.length - 100} errores más</p>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </motion.div>
                        )}

                        <div className="p-4 rounded-2xl bg-amber-500/5 border border-amber-500/10 flex gap-4">
                            <Info className="w-5 h-5 text-amber-600 shrink-0" />
                            <p className="text-[9px] font-bold text-amber-900/60 dark:text-amber-200/60 uppercase leading-relaxed tracking-wide">
                                Columnas recomendadas: ci, nombres, apellidos, correo, celular, password. Si no se provee contraseña, se usará "AulaProfe*2026".
                            </p>
                        </div>
                    </div>

                    <div className="p-8 bg-white dark:bg-slate-900 border-t border-border/40 flex justify-end gap-4">
                        <button
                            onClick={() => {
                                setIsBulkModalOpen(false);
                                setMigrationReport(null);
                                setBulkFile(null);
                                setBulkData([]);
                            }}
                            className="h-14 px-8 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-600 transition-colors"
                        >
                            Cerrar
                        </button>
                        <button
                            onClick={startBulkMigration}
                            disabled={isMigrating || bulkData.length === 0 || !bulkDestination.turnoId}
                            className="h-14 px-10 rounded-2xl bg-amber-600 text-white font-black text-[10px] uppercase tracking-widest shadow-xl shadow-amber-600/20 hover:bg-amber-700 transition-all flex items-center gap-3 disabled:opacity-50"
                        >
                            {isMigrating ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowLeftRight className="w-4 h-4" />}
                            <span>{isMigrating ? 'Procesando...' : 'Iniciar Migración Masiva'}</span>
                        </button>
                    </div>
                </div>
            </Modal>

            <ConfirmModal
                isOpen={confirmDeleteState.open}
                onClose={() => setConfirmDeleteState({ open: false, id: '', loading: false })}
                onConfirm={handleConfirmDelete}
                title="¿Eliminar Registro?"
                description="¿Está seguro de eliminar este registro? Esta acción no se puede deshacer."
                confirmText="Sí, eliminar"
                cancelText="Cancelar"
                variant="danger"
                loading={confirmDeleteState.loading}
            />
        </div>
    );
}

