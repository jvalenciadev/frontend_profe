'use client';

import { useState, useEffect } from 'react';
import { programaVersionService } from '@/services/programaVersionService';
import { programaMaestroService } from '@/services/programaMaestroService';
import { sedeService } from '@/services/sedeService';
import { programaLookupService } from '@/services/programaLookupService';
import { Modal } from '@/components/Modal';
import { ConfirmModal } from '@/components/ConfirmModal';
import { Card } from '@/components/ui/Card';
import {
    GraduationCap,
    Plus,
    Search,
    RefreshCw,
    Edit2,
    Trash2,
    Calendar,
    DollarSign,
    MapPin,
    Save,
    Tag,
    Clock,
    FileText,
    Activity,
    CheckCircle2,
    Building2,
    CalendarCheck,
    Image as ImageIcon,
    Rocket,
    ChevronLeft,
    ChevronRight,
    ChevronDown,
    ArrowRight,
    Mail,
    BookOpen,
    LayoutGrid,
    PlusCircle,
    XCircle,
    Award,
    Box,
    Users2,
    UserPlus,
    UserCircle,
    BadgeCheck,
    Target,
    Zap
} from 'lucide-react';
import { cn, getImageUrl } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';

import { useAuth } from '@/contexts/AuthContext';
import { asignacionService } from '@/services/asignacionService';
import { userService } from '@/services/userService';
import { StatusBadge } from '@/components/StatusBadge';
import { ImageUpload } from '@/components/ui/ImageUpload';
import { InscritosModal } from '@/components/academico/InscritosModal';

export default function OfertasAcademicasPage() {
    const { user } = useAuth();
    const [ofertas, setOfertas] = useState<any[]>([]);
    const [programasMaster, setProgramasMaster] = useState<any[]>([]);
    const [sedes, setSedes] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [editingOferta, setEditingOferta] = useState<any>(null);
    const [modalStep, setModalStep] = useState<'pick' | 'form'>('pick');
    const [selectedMaster, setSelectedMaster] = useState<any>(null);
    const [masterSearch, setMasterSearch] = useState('');
    const [activeMaster, setActiveMaster] = useState<any>(null);
    const [departamentos, setDepartamentos] = useState<any[]>([]);

    const [formData, setFormData] = useState({
        programaId: '',
        sedeId: '',
        versionId: '986566d5-dc56-46ea-9828-b80c5ce82edc',
        departamentoId: user?.tenantId || '',
        nombre: '',
        nombreAbre: '',
        codigo: '',
        contenido: '',
        cargaHoraria: 0,
        convocatoria: '',
        tipoId: '',
        modalidadId: '',
        duracionId: '',
        horario: '',
        costo: 0,
        banner: '',
        afiche: '',
        fechaIniIns: '',
        fechaFinIns: '',
        fechaIniClase: '',
        estadoInscripcion: true,
        estado: 'activo',
        modulos: [] as any[],
        turnos: [] as any[]
    });

    // Sincronización automática de TenantId cuando el usuario carga
    useEffect(() => {
        const userTenant = user?.tenantId || (user as any)?.departamentoId;
        if (userTenant && !editingOferta) {
            setFormData(prev => ({
                ...prev,
                departamentoId: userTenant
            }));
        }
    }, [user, editingOferta]);

    const [tipos, setTipos] = useState<any[]>([]);
    const [modalidades, setModalidades] = useState<any[]>([]);
    const [duraciones, setDuraciones] = useState<any[]>([]);
    const [versiones, setVersiones] = useState<any[]>([]);
    const [turnosMaster, setTurnosMaster] = useState<any[]>([]);
    const [facilitadores, setFacilitadores] = useState<any[]>([]);

    // Facilitator Assignment State
    const [isFacilitadoresModalOpen, setIsFacilitadoresModalOpen] = useState(false);
    const [targetOferta, setTargetOferta] = useState<any>(null);
    const [asignaciones, setAsignaciones] = useState<any[]>([]);
    const [facilitadorSearch, setFacilitadorSearch] = useState('');
    const [newAsignacion, setNewAsignacion] = useState({
        moduloId: '',
        turnoId: '',
        selectedSlots: [] as string[], // Format: "moduloId:turnoId"
        facilitadorId: '',
    });

    const [confirmAction, setConfirmAction] = useState<{
        isOpen: boolean;
        title: string;
        description: string;
        onConfirm: () => void;
        loading: boolean;
        variant?: 'danger' | 'warning' | 'info';
    }>({
        isOpen: false,
        title: '',
        description: '',
        onConfirm: () => { },
        loading: false
    });

    // Inscriptions State
    const [isInscritosModalOpen, setIsInscritosModalOpen] = useState(false);
    const [targetInscritosOferta, setTargetInscritosOferta] = useState<any>(null);

    useEffect(() => {
        loadData();
    }, []);

    useEffect(() => {
        const timer = setTimeout(() => {
            loadFacilitadores(facilitadorSearch);
        }, 300);
        return () => clearTimeout(timer);
    }, [facilitadorSearch]);

    const loadFacilitadores = async (search?: string) => {
        try {
            const users = await userService.getAll(search);
            setFacilitadores(users);
        } catch (error) {
            console.error('Error cargando facilitadores:', error);
        }
    };

    const loadData = async () => {
        try {
            setLoading(true);
            const [dataOfertas, dataMaster, dataSedes, dataTipos, dataModalities, dataDurations, dataVersions, dataTurnos, dataDepartamentos] = await Promise.all([
                programaVersionService.getAll(),
                programaMaestroService.getAll(),
                sedeService.getAll(),
                programaLookupService.getTipos(),
                programaLookupService.getModalidades(),
                programaLookupService.getDuraciones(),
                programaLookupService.getVersiones(),
                programaLookupService.getTurnos(),
                programaLookupService.getDepartamentos()
            ]);
            setOfertas(dataOfertas);
            setProgramasMaster(dataMaster);
            setSedes(dataSedes);
            setTipos(dataTipos);
            setModalidades(dataModalities);
            setDuraciones(dataDurations);
            setTurnosMaster(dataTurnos);
            setDepartamentos(dataDepartamentos);
            // Sort versions by gestion (desc) and numero (asc)
            const sortedVersions = [...dataVersions].sort((a: any, b: any) => {
                if (b.gestion !== a.gestion) {
                    return (b.gestion || '').localeCompare(a.gestion || '');
                }
                return (a.numero || 0) - (b.numero || 0);
            });
            setVersiones(sortedVersions);
        } catch (error) {
            console.error('Error loading data:', error);
            toast.error('Error al sincronizar Ofertas Académicas');
        } finally {
            setLoading(false);
        }
    };

    const handleOpenModal = () => {
        setEditingOferta(null);
        setSelectedMaster(null);
        setModalStep('pick');
        setFormData({
            programaId: '',
            sedeId: '',
            versionId: versiones[0]?.id || '986566d5-dc56-46ea-9828-b80c5ce82edc',
            departamentoId: user?.tenantId || '', // Forzar tenant del usuario
            nombre: '',
            nombreAbre: '',
            codigo: '',
            contenido: '',
            cargaHoraria: 0,
            convocatoria: '',
            tipoId: '',
            modalidadId: '',
            duracionId: '',
            horario: '',
            costo: 0,
            banner: '',
            afiche: '',
            fechaIniIns: '',
            fechaFinIns: '',
            fechaIniClase: '',
            estadoInscripcion: true,
            estado: 'activo',
            modulos: [],
            turnos: []
        });
        setIsModalOpen(true);
    };

    const addModulo = () => {
        setFormData({
            ...formData,
            modulos: [
                ...formData.modulos,
                { nombre: '', codigo: '', descripcion: '', orden: formData.modulos.length + 1, fechaInicio: '', fechaFin: '', estado: 'activo' }
            ]
        });
    };

    const removeModulo = (index: number) => {
        const newModulos = [...formData.modulos];
        newModulos.splice(index, 1);
        setFormData({ ...formData, modulos: newModulos });
    };

    const updateModulo = (index: number, field: string, value: any) => {
        const newModulos = [...formData.modulos];
        newModulos[index] = { ...newModulos[index], [field]: value };
        setFormData({ ...formData, modulos: newModulos });
    };

    const addTurno = () => {
        setFormData({
            ...formData,
            turnos: [
                ...formData.turnos,
                { turnoIds: '', cupo: 0, cupoPre: 0, estado: 'activo' }
            ]
        });
    };

    const removeTurno = (index: number) => {
        const newTurnos = [...formData.turnos];
        newTurnos.splice(index, 1);
        setFormData({ ...formData, turnos: newTurnos });
    };

    const updateTurno = (index: number, field: string, value: any) => {
        const newTurnos = [...formData.turnos];
        newTurnos[index] = { ...newTurnos[index], [field]: value };
        setFormData({ ...formData, turnos: newTurnos });
    };

    const toggleSlot = (moduloId: string, turnoId: string) => {
        const slotKey = `${moduloId}:${turnoId}`;
        setNewAsignacion(prev => {
            const isSelected = prev.selectedSlots.includes(slotKey);
            return {
                ...prev,
                selectedSlots: isSelected
                    ? prev.selectedSlots.filter(s => s !== slotKey)
                    : [...prev.selectedSlots, slotKey],
                // Clear single selection if we are using multiple
                moduloId: '',
                turnoId: ''
            };
        });
    };

    const handleEdit = (oferta: any) => {
        setEditingOferta(oferta);
        setSelectedMaster(oferta.programa);

        // Ensure we handle dates correctly from the backend snapshot
        const formatDate = (dateStr: string) => {
            if (!dateStr) return '';
            return new Date(dateStr).toISOString().split('T')[0];
        };

        setFormData({
            programaId: oferta.programaId || '',
            sedeId: oferta.sedeId || '',
            versionId: oferta.versionId || '',
            departamentoId: oferta.departamentoId || user?.tenantId || '',
            nombre: oferta.nombre || '',
            nombreAbre: oferta.nombreAbre || '',
            codigo: oferta.codigo || '',
            contenido: oferta.contenido || '',
            cargaHoraria: oferta.cargaHoraria || 0,
            convocatoria: oferta.convocatoria || '',
            tipoId: oferta.tipoId || '',
            modalidadId: oferta.modalidadId || '',
            duracionId: oferta.duracionId || '',
            horario: oferta.horario || '',
            costo: oferta.costo || 0,
            banner: oferta.banner || '',
            afiche: oferta.afiche || '',
            fechaIniIns: formatDate(oferta.fechaIniIns),
            fechaFinIns: formatDate(oferta.fechaFinIns),
            fechaIniClase: formatDate(oferta.fechaIniClase),
            estadoInscripcion: oferta.estadoInscripcion ?? true,
            estado: oferta.estado || 'activo',
            // Load the CURRENT operative modules (ProgramaModuloDos)
            modulos: oferta.modulos?.map((m: any) => ({
                id: m.id,
                moduloId: m.moduloId,
                nombre: m.nombre,
                codigo: m.codigo,
                descripcion: m.descripcion,
                estado: m.estado || 'activo',
                fechaInicio: formatDate(m.fechaInicio),
                fechaFin: formatDate(m.fechaFin)
            })) || [],
            turnos: oferta.turnos?.map((t: any) => ({
                id: t.id,
                turnoIds: t.turnoIds || t.turnoId,
                cupo: t.cupo || 0,
                cupoPre: t.cupoPre || 0,
                estado: t.estado || 'activo'
            })) || []
        });
        setModalStep('form');
        setIsModalOpen(true);
    };

    const handleSelectMaster = async (master: any) => {
        try {
            setIsLoading(true);
            setModalStep('form'); // Go straight to form
            setIsModalOpen(true); // Open modal immediately

            // Clear current form partially so user sees it's a "New" one
            setFormData(prev => ({ ...prev, nombre: 'Cargando datos...', modulos: [] }));

            // Fetch full details to ensure we have modules and all fields
            const fullMaster = await programaMaestroService.getById(master.id);
            setSelectedMaster(fullMaster);

            const today = new Date().toISOString().split('T')[0];
            const nextMonth = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
            const inTwoMonths = new Date(Date.now() + 45 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

            setFormData({
                ...formData,
                programaId: fullMaster.id,
                sedeId: sedes[0]?.id || '',
                versionId: versiones[0]?.id || '986566d5-dc56-46ea-9828-b80c5ce82edc',
                departamentoId: user?.tenantId || formData.departamentoId || '', // Mantener o forzar tenant
                nombre: fullMaster.nombre || '',
                nombreAbre: fullMaster.nombreAbre || '',
                codigo: fullMaster.codigo || '',
                cargaHoraria: fullMaster.cargaHoraria || 0,
                convocatoria: fullMaster.convocatoria || '',
                contenido: fullMaster.contenido || '',
                tipoId: fullMaster.tipoId || '',
                modalidadId: fullMaster.modalidadId || '',
                duracionId: fullMaster.duracionId || '',
                costo: fullMaster.costo || 0,
                banner: fullMaster.banner || '',
                afiche: fullMaster.afiche || '',
                horario: fullMaster.horario || '',
                fechaIniIns: today,
                fechaFinIns: nextMonth,
                fechaIniClase: inTwoMonths,
                modulos: fullMaster.modulos
                    ?.filter((m: any) => m.estado !== 'INACTIVO' && m.estado !== 'ELIMINADO' && !m.esGlobal)
                    .map((m: any) => ({
                        moduloId: m.id,
                        nombre: m.nombre,
                        codigo: m.codigo,
                        descripcion: m.descripcion,
                        orden: m.orden,
                        estado: m.estado || 'activo',
                        fechaInicio: inTwoMonths, // Default startup date
                        fechaFin: inTwoMonths     // Default end date
                    })) || [],
                turnos: []
            });
            setModalStep('form');
        } catch (error) {
            console.error('Error fetching master details:', error);
            toast.error('Error al cargar detalles del programa maestro');
            setIsModalOpen(false);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            setIsLoading(true);
            const payload = {
                ...formData,
                fechaIniIns: formData.fechaIniIns ? new Date(formData.fechaIniIns).toISOString() : null,
                fechaFinIns: formData.fechaFinIns ? new Date(formData.fechaFinIns).toISOString() : null,
                fechaIniClase: formData.fechaIniClase ? new Date(formData.fechaIniClase).toISOString() : null,
                modulos: formData.modulos.map(m => ({
                    ...m,
                    fechaInicio: m.fechaInicio ? new Date(m.fechaInicio).toISOString() : null,
                    fechaFin: m.fechaFin ? new Date(m.fechaFin).toISOString() : null
                })),
                turnos: formData.turnos
            };

            if (editingOferta) {
                await programaVersionService.update(editingOferta.id, payload);
            } else {
                await programaVersionService.versionalizar(selectedMaster.id, payload);
            }
            setIsModalOpen(false);
            loadData();
        } catch (error) {
            console.error('Error saving:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        setConfirmAction({
            isOpen: true,
            title: 'Dar de Baja Oferta',
            description: '¿Seguro que desea dar de baja esta oferta académica? Esta acción la ocultará del catálogo vigente.',
            loading: false,
            variant: 'danger',
            onConfirm: async () => {
                try {
                    setConfirmAction(prev => ({ ...prev, loading: true }));
                    await programaVersionService.delete(id);
                    toast.success('Oferta dada de baja');
                    loadData();
                    setConfirmAction(prev => ({ ...prev, isOpen: false }));
                } catch (error) {
                    toast.error('Error al dar de baja');
                } finally {
                    setConfirmAction(prev => ({ ...prev, loading: false }));
                }
            }
        });
    };

    const handleOpenFacilitadores = async (oferta: any) => {
        setTargetOferta(oferta);
        setNewAsignacion({ moduloId: '', turnoId: '', selectedSlots: [], facilitadorId: '' });
        setFacilitadorSearch('');
        setIsFacilitadoresModalOpen(true);
        try {
            const data = await asignacionService.getByPrograma(oferta.id);
            setAsignaciones(data);
        } catch (error) {
            console.error('Error al cargar asignaciones:', error);
        }
    };

    const handleCreateAsignacion = async () => {
        if (!newAsignacion.facilitadorId) {
            toast('¡Aula sin Docente!', {
                description: 'Cada gran módulo necesita un guía. Por favor, selecciona un facilitador de la lista.',
                icon: <UserPlus className="w-5 h-5 text-primary animate-pulse" />,
                className: "rounded-2xl border-primary/20 bg-primary/5 backdrop-blur-sm",
                duration: 4000
            });
            return;
        }

        const payloads: any[] = [];
        const existingToReplace: any[] = [];

        // Determine targets based on selection mode
        let targets: { moduloId: string, turnoId: string }[] = [];

        if (newAsignacion.selectedSlots.length > 0) {
            // New Multi-selection mode
            targets = newAsignacion.selectedSlots.map(s => {
                const [mId, tId] = s.split(':');
                return { moduloId: mId, turnoId: tId };
            });
        } else if (newAsignacion.moduloId && newAsignacion.turnoId) {
            // Legacy / Standard selection mode
            const targetModulos = newAsignacion.moduloId === 'all'
                ? targetOferta?.modulos
                : targetOferta?.modulos?.filter((m: any) => m.id === newAsignacion.moduloId);

            const targetTurnos = newAsignacion.turnoId === 'all'
                ? targetOferta?.turnos
                : targetOferta?.turnos?.filter((t: any) => t.id === newAsignacion.turnoId);

            targetModulos.forEach((m: any) => {
                targetTurnos.forEach((t: any) => {
                    targets.push({ moduloId: m.id, turnoId: t.id });
                });
            });
        }

        if (targets.length === 0) {
            toast('¿Dónde y Cuándo?', {
                description: 'Falta definir el Módulo y el Turno para completar esta asignación.',
                icon: <Clock className="w-5 h-5 text-primary animate-spin-slow" />,
                className: "rounded-2xl border-primary/20 bg-background/50 backdrop-blur-sm",
                duration: 4000
            });
            return;
        }

        targets.forEach(({ moduloId, turnoId }) => {
            // Buscar si es un módulo maestro (Global) o un modulo dos
            const isMasterModule = targetOferta?.programa?.modulos?.find((m: any) => m.id === moduloId && m.esGlobal);
            const existing = asignaciones.find(as => 
                (isMasterModule ? as.moduloMaestroId === moduloId : as.moduloId === moduloId) && 
                as.turnoId === turnoId
            );
            
            const payload = {
                programaId: targetOferta?.id,
                moduloId: isMasterModule ? null : moduloId,
                moduloMaestroId: isMasterModule ? moduloId : null,
                turnoId,
                facilitadorId: newAsignacion.facilitadorId
            };

            if (existing) {
                existingToReplace.push({ ...payload, id: existing.id });
            } else {
                payloads.push(payload);
            }
        });

        if (payloads.length === 0 && existingToReplace.length === 0) {
            toast.error('No hay combinaciones válidas seleccionadas.');
            return;
        }

        // Si es una asignación individual y ya existe alguien, preguntar si reemplazar
        if (newAsignacion.moduloId !== 'all' && newAsignacion.turnoId !== 'all' && existingToReplace.length > 0) {
            const currentAsig = existingToReplace[0];
            const currentFac = asignaciones.find(a => a.id === currentAsig.id)?.facilitador;

            setConfirmAction({
                isOpen: true,
                title: 'Reemplazar Facilitador',
                description: `Este espacio ya está asignado a ${currentFac?.nombre || 'otro docente'}. ¿Deseas reemplazarlo con el nuevo facilitador seleccionado?`,
                loading: false,
                variant: 'warning',
                onConfirm: async () => {
                    try {
                        setIsLoading(true);
                        await asignacionService.update(currentAsig.id, { facilitadorId: newAsignacion.facilitadorId });
                        if (targetOferta?.id) {
                            const data = await asignacionService.getByPrograma(targetOferta.id);
                            setAsignaciones(data);
                        }
                        setNewAsignacion({ moduloId: '', turnoId: '', selectedSlots: [], facilitadorId: '' });
                        toast.success('Facilitador actualizado correctamente');
                    } catch (error) {
                        toast.error('Error al actualizar la asignación');
                    } finally {
                        setIsLoading(false);
                        setConfirmAction(prev => ({ ...prev, isOpen: false }));
                    }
                }
            });
            return;
        }

        // Para asignaciones masivas
        if (payloads.length > 0 || existingToReplace.length > 0) {
            const isMassive = (payloads.length + existingToReplace.length) > 1;

            if (isMassive) {
                const hasExisting = existingToReplace.length > 0;
                setConfirmAction({
                    isOpen: true,
                    title: hasExisting ? 'Reasignación Masiva' : 'Asignación Masiva',
                    description: hasExisting
                        ? `Se detectaron ${existingToReplace.length} espacios ya asignados. ¿Deseas REASIGNARLOS a todos con el nuevo facilitador o solo registrar en los que están vacíos?`
                        : `Se realizarán ${payloads.length} asignaciones nuevas. ¿Confirmar el proceso masivo?`,
                    loading: false,
                    variant: 'warning',
                    onConfirm: async () => {
                        // Si el usuario confirma REASIGNAR (en caso de error masivo)
                        // Ejecutamos ambos: crear nuevos y actualizar existentes
                        try {
                            setIsLoading(true);
                            // Crear nuevos
                            for (const p of payloads) {
                                await asignacionService.create(p, { _silent: true });
                            }
                            // Actualizar existentes (Arreglar errores)
                            for (const r of existingToReplace) {
                                await asignacionService.update(r.id, { facilitadorId: newAsignacion.facilitadorId });
                            }

                            if (targetOferta?.id) {
                                const data = await asignacionService.getByPrograma(targetOferta.id);
                                setAsignaciones(data);
                            }
                            setNewAsignacion({ moduloId: '', turnoId: '', selectedSlots: [], facilitadorId: '' });
                            toast.success(`Se procesaron ${payloads.length + existingToReplace.length} espacios correctamente.`);
                        } catch (error) {
                            toast.error('Ocurrió un error en el proceso masivo');
                        } finally {
                            setIsLoading(false);
                            setConfirmAction(prev => ({ ...prev, isOpen: false }));
                        }
                    }
                });
            } else if (payloads.length === 1) {
                await executeAsignaciones(payloads, false);
            }
        }
    };

    const executeAsignaciones = async (payloads: any[], isMassive: boolean) => {
        try {
            setIsLoading(true);
            if (!isMassive) {
                await asignacionService.create(payloads[0]);
            } else {
                let successCount = 0;
                let failCount = 0;

                for (const p of payloads) {
                    try {
                        await asignacionService.create(p, { _silent: true });
                        successCount++;
                    } catch (e) {
                        failCount++;
                    }
                }

                if (successCount > 0) {
                    toast.success(`Proceso masivo finalizado: ${successCount} exitosas${failCount > 0 ? `, ${failCount} fallidas` : ''}`);
                } else if (failCount > 0) {
                    toast.error('Todas las asignaciones masivas fallaron.');
                }
            }

            if (targetOferta?.id) {
                const data = await asignacionService.getByPrograma(targetOferta.id);
                setAsignaciones(data);
            }
            setNewAsignacion({ moduloId: '', turnoId: '', selectedSlots: [], facilitadorId: '' });
        } catch (error) {
            console.error('Error en proceso de asignación:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleDeleteAsignacion = async (id: string) => {
        setConfirmAction({
            isOpen: true,
            title: 'Eliminar Asignación',
            description: '¿Seguro que desea eliminar esta asignación de facilitador? El módulo quedará sin docente asignado.',
            loading: false,
            variant: 'danger',
            onConfirm: async () => {
                try {
                    setConfirmAction(prev => ({ ...prev, loading: true }));
                    await asignacionService.delete(id);
                    if (targetOferta?.id) {
                        const data = await asignacionService.getByPrograma(targetOferta.id);
                        setAsignaciones(data);
                    }
                    setConfirmAction(prev => ({ ...prev, isOpen: false }));
                } catch (error) {
                    toast.error('Error al eliminar');
                } finally {
                    setConfirmAction(prev => ({ ...prev, loading: false }));
                }
            }
        });
    };

    const [selectedTipoMaster, setSelectedTipoMaster] = useState('');
    const [selectedSede, setSelectedSede] = useState('');
    const [selectedModalidad, setSelectedModalidad] = useState('');
    const [selectedEstadoInscripcion, setSelectedEstadoInscripcion] = useState('');

    const filteredMasters = programasMaster.filter(m => {
        const matchesSearch = m.nombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            m.codigo?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesTipo = selectedTipoMaster ? m.tipoId === selectedTipoMaster : true;
        // Only show ACTIVO programs (check for both cases to support backend enum)
        const isActive = !m.estado || m.estado === 'ACTIVO' || m.estado === 'activo';
        return matchesSearch && matchesTipo && isActive;
    });

    const filteredOfertas = ofertas.filter(o => {
        const matchesSearch = (o.nombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            o.codigo?.toLowerCase().includes(searchTerm.toLowerCase()));

        const matchesMaster = !activeMaster || o.programaId === activeMaster.id;
        const matchesSede = selectedSede ? o.sedeId === selectedSede : true;
        const matchesModalidad = selectedModalidad ? o.modalidadId === selectedModalidad : true;
        const matchesEstado = selectedEstadoInscripcion
            ? (selectedEstadoInscripcion === 'abierto' ? o.estadoInscripcion === true : o.estadoInscripcion === false)
            : true;

        return matchesSearch && matchesMaster && matchesSede && matchesModalidad && matchesEstado;
    });

    return (
        <div className="space-y-8 pb-20">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div className="space-y-1">
                    <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.3em] text-primary mb-2">
                        <Rocket className="w-3 h-3" />
                        <span>Gestión de Ofertas por Programa</span>
                    </div>
                    {activeMaster ? (
                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => setActiveMaster(null)}
                                className="p-2 rounded-xl bg-primary/10 text-primary hover:bg-primary hover:text-white transition-all"
                            >
                                <ChevronLeft className="w-5 h-5" />
                            </button>
                            <div>
                                <h1 className="text-4xl font-black tracking-tighter text-foreground uppercase">
                                    {activeMaster.tipo?.nombre} en <span className="text-primary">{activeMaster.nombre}</span>
                                </h1>
                                <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Código Maestro: {activeMaster.codigo}</p>
                            </div>
                        </div>
                    ) : (
                        <>
                            <h1 className="text-4xl font-black tracking-tighter text-foreground uppercase">
                                Ofertas <span className="text-primary">Académicas</span>
                            </h1>
                            <p className="text-sm font-medium text-muted-foreground max-w-md">
                                Seleccione un programa maestro para gestionar sus convocatorias vigentes.
                            </p>
                        </>
                    )}
                </div>

                {activeMaster ? (
                    <button
                        onClick={() => handleSelectMaster(activeMaster)}
                        className="h-14 px-8 rounded-2xl bg-primary text-white font-black text-xs uppercase tracking-[0.2em] hover:shadow-2xl hover:shadow-primary/40 active:scale-95 transition-all flex items-center gap-3 shrink-0"
                    >
                        <Plus className="w-5 h-5" />
                        Nueva Convocatoria
                    </button>
                ) : (
                    <button
                        onClick={handleOpenModal}
                        className="h-14 px-8 rounded-2xl bg-primary text-white font-black text-xs uppercase tracking-[0.2em] hover:shadow-2xl hover:shadow-primary/40 active:scale-95 transition-all flex items-center gap-3 shrink-0"
                    >
                        <Plus className="w-5 h-5" />
                        Crear Oferta
                    </button>
                )}
            </div>

            {/* Search & Filters */}
            <Card className="p-1 border-border/40 bg-card/30 backdrop-blur-md">
                <div className="flex flex-col xl:flex-row gap-2 p-2">
                    <div className="relative flex-1">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <input
                            type="text"
                            placeholder={activeMaster ? "Buscar convocatoria específica..." : "Buscar catálogo maestro..."}
                            className="w-full h-12 pl-12 pr-4 rounded-xl bg-muted/30 border border-border/50 focus:border-primary transition-all outline-none text-[13px] font-bold text-foreground"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2 xl:w-auto w-full">
                        {!activeMaster ? (
                            // Filters for Master List
                            <select
                                className="h-12 px-4 rounded-xl bg-muted/30 border border-border/50 focus:border-primary transition-all outline-none text-[11px] font-bold text-foreground cursor-pointer hover:bg-muted/50 md:col-span-3 xl:w-64"
                                value={selectedTipoMaster}
                                onChange={(e) => setSelectedTipoMaster(e.target.value)}
                            >
                                <option value="">TODOS LOS TIPOS</option>
                                {tipos.map(t => <option key={t.id} value={t.id}>{t.nombre}</option>)}
                            </select>
                        ) : (
                            // Filters for Specific Offers
                            <>
                                <select
                                    className="h-12 px-4 rounded-xl bg-muted/30 border border-border/50 focus:border-primary transition-all outline-none text-[11px] font-bold text-foreground cursor-pointer hover:bg-muted/50"
                                    value={selectedSede}
                                    onChange={(e) => setSelectedSede(e.target.value)}
                                >
                                    <option value="">TODA SEDE</option>
                                    {sedes
                                        .filter(s => !user?.tenantId || s.departamentoId === user?.tenantId)
                                        .map(s => <option key={s.id} value={s.id}>{s.nombre}</option>)}
                                </select>
                                <select
                                    className="h-12 px-4 rounded-xl bg-muted/30 border border-border/50 focus:border-primary transition-all outline-none text-[11px] font-bold text-foreground cursor-pointer hover:bg-muted/50"
                                    value={selectedModalidad}
                                    onChange={(e) => setSelectedModalidad(e.target.value)}
                                >
                                    <option value="">TODA MODALIDAD</option>
                                    {modalidades.map(m => <option key={m.id} value={m.id}>{m.nombre}</option>)}
                                </select>
                                <select
                                    className="h-12 px-4 rounded-xl bg-muted/30 border border-border/50 focus:border-primary transition-all outline-none text-[11px] font-bold text-foreground cursor-pointer hover:bg-muted/50"
                                    value={selectedEstadoInscripcion}
                                    onChange={(e) => setSelectedEstadoInscripcion(e.target.value)}
                                >
                                    <option value="">ESTADO INSCRIPCIÓN</option>
                                    <option value="abierto">ABIERTAS</option>
                                    <option value="cerrado">CERRADAS</option>
                                </select>
                            </>
                        )}
                    </div>
                </div>
            </Card>

            {/* Grid */}
            <div className="space-y-12">
                {loading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {Array(8).fill(0).map((_, i) => (
                            <Card key={i} className="h-64 animate-pulse bg-muted/20 border-border/40" />
                        ))}
                    </div>
                ) : !activeMaster ? (
                    // Master List View
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {filteredMasters.map((m) => (
                            <Card
                                key={m.id}
                                onClick={() => setActiveMaster(m)}
                                className="group relative border-border/40 overflow-hidden bg-card hover:border-primary/40 transition-all p-6 cursor-pointer"
                            >
                                <div className="flex justify-between items-start mb-6">
                                    <div className="p-4 rounded-2xl bg-primary/5 text-primary group-hover:bg-primary group-hover:text-white transition-all shadow-inner">
                                        <BookOpen className="w-8 h-8" />
                                    </div>
                                    <div className="flex flex-col items-end gap-1">
                                        <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground bg-muted/50 px-3 py-1 rounded-full border border-border/50">
                                            {m.codigo}
                                        </span>
                                        {m.version && (
                                            <span className="text-[9px] font-black uppercase tracking-widest text-indigo-500 bg-indigo-500/10 px-2 py-0.5 rounded-full">
                                                {m.version.gestion}
                                            </span>
                                        )}
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <h3 className="text-lg font-black tracking-tight text-foreground uppercase group-hover:text-primary transition-colors line-clamp-2">
                                        {m.nombre}
                                    </h3>

                                    {m.tipo && (
                                        <span className="inline-block text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-600 border border-amber-500/10 mb-2">
                                            {m.tipo.nombre}
                                        </span>
                                    )}

                                    <div className="flex items-center justify-between pt-4 border-t border-border/40">
                                        <div className="flex flex-col gap-1">
                                            <div className="flex items-center gap-1.5 text-indigo-500 font-bold text-[10px] uppercase">
                                                <Activity className="w-4 h-4" />
                                                {ofertas.filter(o => o.programaId === m.id).length} Convocatorias
                                            </div>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleSelectMaster(m);
                                                }}
                                                className="text-[9px] font-black uppercase text-primary hover:underline text-left mt-1"
                                            >
                                                + Lanzar Nueva
                                            </button>
                                        </div>
                                        <div className="flex items-center gap-1 text-primary">
                                            <span className="text-[10px] font-black uppercase tracking-widest">Ver</span>
                                            <ChevronRight className="w-4 h-4" />
                                        </div>
                                    </div>
                                </div>
                            </Card>
                        ))}
                    </div>
                ) : (
                    // Specific Offers View (Grouped by Gestion)
                    <>
                        {filteredOfertas.length === 0 && (
                            <div className="py-20 text-center space-y-4 opacity-40">
                                <div className="flex justify-center"><Rocket className="w-12 h-12" /></div>
                                <p className="text-sm font-black uppercase tracking-[0.2em]">No hay convocatorias activas para este programa</p>
                                <button
                                    onClick={() => {
                                        setSelectedMaster(activeMaster);
                                        setModalStep('form');
                                        setIsModalOpen(true);
                                    }}
                                    className="text-[10px] font-black uppercase text-primary underline"
                                >
                                    Lanzar primera oferta ahora
                                </button>
                            </div>
                        )}

                        {Object.entries(
                            filteredOfertas.reduce((acc: any, oferta) => {
                                const gestion = oferta.version?.gestion || 'Sin Gestión';
                                if (!acc[gestion]) acc[gestion] = [];
                                acc[gestion].push(oferta);
                                return acc;
                            }, {})
                        ).sort((a: any, b: any) => b[0].localeCompare(a[0])).map((entry: any) => {
                            const [gestion, groupOfertas] = entry as [string, any[]];
                            return (
                                <div key={gestion} className="space-y-6">
                                    <div className="flex items-center gap-4">
                                        <div className="h-px flex-1 bg-border/60"></div>
                                        <span className="px-4 py-1.5 rounded-full border border-primary/20 bg-primary/5 text-primary text-[11px] font-black uppercase tracking-[0.2em]">
                                            Gestión {gestion}
                                        </span>
                                        <div className="h-px flex-1 bg-border/60"></div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                                        {groupOfertas.map((o) => (
                                            <Card key={o.id} className="group relative border-border/40 overflow-hidden bg-card hover:border-primary/30 transition-all p-0 shadow-sm hover:shadow-lg">
                                                <div className="relative h-36 overflow-hidden bg-muted/30">
                                                    {o.banner ? (
                                                        <img src={getImageUrl(o.banner)} alt={o.nombre} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                                                    ) : (
                                                        <div className="flex flex-col items-center justify-center h-full gap-2 text-muted-foreground/30">
                                                            <ImageIcon className="w-8 h-8" />
                                                            <span className="text-[8px] font-black uppercase tracking-widest">Sin Banner</span>
                                                        </div>
                                                    )}

                                                    {/* Badges Overlay */}
                                                    <div className="absolute top-3 right-3 flex flex-col gap-1 items-end">
                                                        <StatusBadge
                                                            status={o.estadoInscripcion ? 'OPEN' : 'CLOSED'}
                                                            showIcon={false}
                                                            className="backdrop-blur-md shadow-xl"
                                                        />
                                                        {o.version && (
                                                            <span className="px-2 py-0.5 rounded-md bg-black/50 backdrop-blur-sm text-white text-[8px] font-black uppercase border border-white/10">
                                                                {o.version.nombre} {o.version.romano} ({o.version.gestion})
                                                            </span>
                                                        )}
                                                    </div>

                                                    <div className="absolute bottom-3 left-3">
                                                        {o.tipo && (
                                                            <span className="px-2 py-0.5 rounded-md bg-white/90 backdrop-blur-md text-foreground text-[8px] font-black uppercase shadow-sm">
                                                                {o.tipo.nombre}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>

                                                <div className="p-5 space-y-4">
                                                    <div className="space-y-1">
                                                        <h3 className="text-sm font-black tracking-tight text-foreground uppercase line-clamp-2 min-h-[2.5em] group-hover:text-primary transition-colors">
                                                            {o.tipo?.nombre} en {o.nombre}
                                                        </h3>
                                                        <div className="flex items-center gap-1.5 text-muted-foreground">
                                                            <MapPin className="w-3 h-3" />
                                                            <span className="text-[9px] font-black uppercase tracking-widest truncate">{o.sede?.nombre || 'Sede Regional'}</span>
                                                        </div>
                                                    </div>

                                                    <div className="grid grid-cols-2 gap-3 pt-2">
                                                        <div className="space-y-1">
                                                            <p className="text-[8px] font-black text-muted-foreground uppercase tracking-widest">Inversión</p>
                                                            <div className="flex items-center gap-1 text-primary">
                                                                <DollarSign className="w-3 h-3 font-bold" />
                                                                <span className="text-[12px] font-black">{o.costo} <span className="text-[8px] font-bold uppercase">Bs</span></span>
                                                            </div>
                                                        </div>
                                                        <div className="space-y-1">
                                                            <p className="text-[8px] font-black text-muted-foreground uppercase tracking-widest">Inicio Clases</p>
                                                            <div className="flex items-center gap-1 text-primary">
                                                                <CalendarCheck className="w-3 h-3" />
                                                                <span className="text-[10px] font-black">{o.fechaIniClase ? new Date(o.fechaIniClase).toLocaleDateString('es-ES', { month: 'short', day: 'numeric' }) : '---'}</span>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Turnos Habilitados Visualization */}
                                                    <div className="pt-3 space-y-2">
                                                        <div className="flex items-center gap-1.5 text-[8px] font-black text-muted-foreground uppercase tracking-wider">
                                                            <Clock className="w-3 h-3" />
                                                            Turnos & Cupos
                                                        </div>
                                                        <div className="flex flex-wrap gap-1.5">
                                                            {o.turnos && o.turnos.length > 0 ? (
                                                                o.turnos.map((t: any) => {
                                                                    // Encontrar el nombre del turno desde turnosMaster si es posible
                                                                    const masterT = turnosMaster.find(mt => mt.id === (t.turnoIds || t.turnoId));
                                                                    return (
                                                                        <div key={t.id} className="flex flex-col px-2 py-1 rounded-lg bg-primary/5 border border-primary/10 min-w-[70px]">
                                                                            <span className="text-[8px] font-black text-primary uppercase truncate">
                                                                                {masterT?.nombre || (t.turnoConfig?.nombre) || 'T. Especial'}
                                                                            </span>
                                                                            <div className="flex items-center justify-between mt-0.5">
                                                                                <span className="text-[9px] font-black text-foreground">
                                                                                    {t.cupoPre || 0}<span className="text-muted-foreground/50 mx-0.5">/</span>{t.cupo || 0}
                                                                                </span>
                                                                                {t.cupo > 0 && (
                                                                                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                                                                                )}
                                                                            </div>
                                                                        </div>
                                                                    );
                                                                })
                                                            ) : (
                                                                <span className="text-[8px] font-bold text-muted-foreground italic">Sin turnos asignados</span>
                                                            )}
                                                        </div>
                                                    </div>

                                                    <div className="flex items-center justify-between pt-3 border-t border-border/40 mt-2">
                                                        <div className="flex items-center gap-1.5 text-primary font-bold text-[9px] uppercase">
                                                            <Award className="w-4 h-4" />
                                                            {o.modulos?.length || 0} Módulos
                                                        </div>
                                                        <button
                                                            onClick={() => {
                                                                setTargetInscritosOferta(o);
                                                                setIsInscritosModalOpen(true);
                                                            }}
                                                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-white text-[8px] font-black uppercase hover:shadow-lg hover:shadow-primary/20 transition-all shadow-sm"
                                                        >
                                                            <UserPlus className="w-3 h-3" />
                                                            Inscritos
                                                        </button>
                                                        <button
                                                            onClick={() => handleOpenFacilitadores(o)}
                                                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary/10 text-primary text-[8px] font-black uppercase hover:bg-primary hover:text-white transition-all shadow-sm"
                                                        >
                                                            <Users2 className="w-3 h-3" />
                                                            Facilitadores
                                                        </button>
                                                    </div>

                                                    <div className="pt-3 flex items-center justify-between">
                                                        <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-tight">@{o.codigo}</span>
                                                        <div className="flex gap-1.5">
                                                            <button
                                                                onClick={() => handleEdit(o)}
                                                                className="p-2 rounded-lg bg-primary/5 text-primary hover:bg-primary hover:text-white transition-all shadow-sm group/btn"
                                                                title="Editar Oferta"
                                                            >
                                                                <Edit2 className="w-3.5 h-3.5 group-hover/btn:scale-110 transition-transform" />
                                                            </button>
                                                            <button
                                                                onClick={() => handleDelete(o.id)}
                                                                className="p-2 rounded-lg bg-destructive/5 text-destructive hover:bg-destructive hover:text-destructive-foreground transition-all shadow-sm group/btn"
                                                                title="Eliminar Oferta"
                                                            >
                                                                <Trash2 className="w-3.5 h-3.5 group-hover/btn:scale-110 transition-transform" />
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            </Card>
                                        ))}
                                    </div>
                                </div>
                            );
                        })}
                    </>
                )}
            </div>

            {/* Modal */}
            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={
                    modalStep === 'pick'
                        ? 'Seleccionar Programa Maestro'
                        : (editingOferta
                            ? `Actualizar Oferta: ${editingOferta.nombre}`
                            : `Nueva Convocatoria: ${selectedMaster?.nombre || ''}`)
                }
                size={modalStep === 'pick' ? 'xl' : '2xl'}
            >
                {modalStep === 'pick' ? (
                    <div className="space-y-6">
                        <div className="relative">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <input
                                type="text"
                                placeholder="Filtrar catálogos maestros..."
                                className="w-full h-12 pl-12 pr-4 rounded-xl bg-muted/30 border border-border/50 focus:border-primary transition-all outline-none text-sm font-bold"
                                value={masterSearch}
                                onChange={(e) => setMasterSearch(e.target.value)}
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar pb-4">
                            {programasMaster
                                .filter(m => {
                                    const isActive = !m.estado || m.estado === 'activo' || m.estado === 'ACTIVO';
                                    const matchesSearch = (m.nombre?.toLowerCase() || '').includes(masterSearch.toLowerCase()) || (m.codigo?.toLowerCase() || '').includes(masterSearch.toLowerCase());
                                    return isActive && matchesSearch;
                                })
                                .map((master) => (
                                    <div
                                        key={master.id}
                                        onClick={() => handleSelectMaster(master)}
                                        className="p-4 rounded-2xl border border-border bg-card hover:border-primary hover:bg-primary/5 cursor-pointer transition-all group"
                                    >
                                        <div className="flex justify-between items-start mb-2">
                                            <div className="p-2 rounded-lg bg-primary/10 text-primary group-hover:bg-primary group-hover:text-white transition-all">
                                                <FileText className="w-4 h-4" />
                                            </div>
                                            <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">{master.codigo}</span>
                                        </div>
                                        <h5 className="text-xs font-black uppercase mb-1">{master.nombre}</h5>
                                        <div className="flex items-center gap-3 text-[9px] font-bold text-muted-foreground">
                                            <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {master.cargaHoraria} Hrs</span>
                                            <span className="flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> {master.modulos?.length || 0} Módulos</span>
                                        </div>
                                    </div>
                                ))}
                        </div>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="space-y-8 max-h-[75vh] overflow-y-auto px-2 pr-4 custom-scrollbar relative">
                        {isLoading && (
                            <div className="absolute inset-0 bg-background/60 backdrop-blur-[2px] z-50 flex flex-col items-center justify-center rounded-2xl">
                                <RefreshCw className="w-8 h-8 text-primary animate-spin mb-2" />
                                <p className="text-[10px] font-black uppercase tracking-widest text-primary">Sincronizando Plantilla...</p>
                            </div>
                        )}
                        <div className="space-y-6">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-primary/5 rounded-xl border border-primary/10">
                                        <Rocket className="w-4 h-4 text-primary" />
                                    </div>
                                    <div>
                                        <h4 className="text-[11px] font-black uppercase tracking-[0.2em] text-foreground">Lanzamiento Operativo</h4>
                                        <p className="text-[10px] font-bold text-muted-foreground uppercase">{selectedMaster?.nombre}</p>
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setModalStep('pick')}
                                    className="text-[9px] font-black uppercase text-primary hover:underline"
                                >
                                    Cambiar Maestro
                                </button>
                            </div>

                            <div className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <label className="text-[9px] font-black text-muted-foreground uppercase tracking-widest ml-1">Nombre de la Convocatoria (Snapshot)</label>
                                        <input
                                            type="text"
                                            className="w-full h-12 px-4 rounded-xl bg-card border border-border focus:border-primary transition-all outline-none text-sm font-bold text-foreground shadow-sm disabled:opacity-70 disabled:bg-muted/50"
                                            value={formData.nombre}
                                            onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                                            disabled={!!selectedMaster}
                                            placeholder="Nombre del programa operativo..."
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[9px] font-black text-muted-foreground uppercase tracking-widest ml-1">Código del Programa Operativo</label>
                                        <input
                                            type="text"
                                            className="w-full h-12 px-4 rounded-xl bg-card border border-border focus:border-primary transition-all outline-none text-sm font-bold text-foreground shadow-sm disabled:opacity-70 disabled:bg-muted/50"
                                            value={formData.codigo}
                                            onChange={(e) => setFormData({ ...formData, codigo: e.target.value })}
                                            disabled={!!selectedMaster}
                                            placeholder="Ej: D-IA-2024-LP"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-4 p-4 rounded-2xl bg-muted/30 border border-border/50">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {/* DEPARTAMENTO (TENANT) - PRIMERO */}
                                        <div className={`space-y-1.5 p-2 rounded-xl border transition-all ${!!(user?.tenantId || (user as any)?.departamentoId) ? 'bg-blue-100/50 border-blue-400/50 text-blue-700 shadow-inner' : 'bg-card border-border'}`}>
                                            <label className="text-[9px] font-black uppercase tracking-widest ml-1 flex items-center gap-2">
                                                1. Departamento {!!(user?.tenantId || (user as any)?.departamentoId) ? '(Asignado por Perfil)' : '(Selección Global)'} *
                                                {!!(user?.tenantId || (user as any)?.departamentoId) && <span className="text-[7px] bg-blue-600 text-white px-1.5 py-0.5 rounded-full uppercase">Fijo</span>}
                                            </label>
                                            <select
                                                className="w-full h-11 px-4 rounded-xl bg-transparent border-none focus:ring-0 outline-none text-xs font-black text-foreground appearance-none disabled:opacity-100 cursor-not-allowed"
                                                value={user?.tenantId || (user as any)?.departamentoId || formData.departamentoId || ''}
                                                onChange={(e) => {
                                                    const newDepId = e.target.value;
                                                    setFormData({ ...formData, departamentoId: newDepId, sedeId: '' }); // Reset sede on change
                                                }}
                                                required
                                                disabled={!!(user?.tenantId || (user as any)?.departamentoId)}
                                            >
                                                {!(user?.tenantId || (user as any)?.departamentoId) && (
                                                    <option value="">-- Seleccionar Departamento --</option>
                                                )}
                                                {departamentos
                                                    .filter(d => {
                                                        const userTenant = user?.tenantId || (user as any)?.departamentoId;
                                                        return !userTenant || d.id === userTenant;
                                                    })
                                                    .map(d => (
                                                        <option key={d.id} value={d.id}>{d.nombre}</option>
                                                    ))}
                                            </select>
                                        </div>

                                        {/* SEDE DE EJECUCIÓN - SEGUNDO */}
                                        <div className={`space-y-1.5 p-2 rounded-xl border transition-all ${!formData.departamentoId ? 'opacity-50 grayscale' : 'bg-primary/5 border-primary/20 text-primary shadow-sm'}`}>
                                            <label className="text-[9px] font-black uppercase tracking-widest ml-1 flex items-center gap-2">
                                                2. Sede de Ejecución *
                                                {!formData.departamentoId && <span className="text-[7px] bg-muted text-muted-foreground px-1.5 py-0.5 rounded-full italic">Elija Depto. primero</span>}
                                            </label>
                                            <select
                                                className="w-full h-11 px-4 rounded-xl bg-transparent border-none focus:ring-0 outline-none text-xs font-black text-foreground appearance-none"
                                                value={formData.sedeId}
                                                onChange={(e) => setFormData({ ...formData, sedeId: e.target.value })}
                                                required
                                                disabled={!formData.departamentoId}
                                            >
                                                <option value="">Seleccionar Sede</option>
                                                {sedes
                                                    .filter(s => s.departamentoId === (user?.tenantId || formData.departamentoId))
                                                    .map(s => <option key={s.id} value={s.id}>{s.nombre}</option>)}
                                            </select>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                                        <div className="space-y-1.5">
                                            <label className="text-[9px] font-black text-muted-foreground uppercase tracking-widest ml-1">Costo de Inversión (Bs)</label>
                                            <input
                                                type="number"
                                                className="w-full h-11 px-4 rounded-xl bg-card border border-border focus:border-primary transition-all outline-none text-xs font-bold text-foreground shadow-sm disabled:opacity-70 disabled:bg-muted/50"
                                                value={formData.costo}
                                                onChange={(e) => setFormData({ ...formData, costo: parseInt(e.target.value) })}
                                                required
                                                disabled={!!selectedMaster}
                                            />
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-[9px] font-black text-muted-foreground uppercase tracking-widest ml-1">Versión / Gestión</label>
                                            <select
                                                className="w-full h-11 px-4 rounded-xl bg-card border border-border focus:border-primary transition-all outline-none text-xs font-bold text-foreground appearance-none shadow-sm"
                                                value={formData.versionId}
                                                onChange={(e) => setFormData({ ...formData, versionId: e.target.value })}
                                                required
                                            >
                                                <option value="">Seleccionar Versión</option>
                                                {versiones.map(v => (
                                                    <option key={v.id} value={v.id}>
                                                        {v.nombre} {v.romano} ({v.gestion})
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <label className="text-[9px] font-black text-muted-foreground uppercase tracking-widest ml-1">Horario y Turnos</label>
                                        <input
                                            type="text"
                                            className="w-full h-11 px-4 rounded-xl bg-card border border-border focus:border-primary transition-all outline-none text-xs font-bold text-foreground shadow-sm"
                                            value={formData.horario}
                                            onChange={(e) => setFormData({ ...formData, horario: e.target.value })}
                                            placeholder="Ej: Sábados 08:00 - 15:00"
                                            required
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[9px] font-black text-muted-foreground uppercase tracking-widest ml-1">Convocatoria (Gestión)</label>
                                        <input
                                            type="text"
                                            className="w-full h-11 px-4 rounded-xl bg-card border border-border focus:border-primary transition-all outline-none text-xs font-bold text-foreground shadow-sm disabled:opacity-70 disabled:bg-muted/50"
                                            value={formData.convocatoria}
                                            onChange={(e) => setFormData({ ...formData, convocatoria: e.target.value })}
                                            placeholder="Ej: I-2024"
                                            required
                                            disabled={!!selectedMaster}
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div className="space-y-1.5">
                                        <label className="text-[9px] font-black text-muted-foreground uppercase tracking-widest ml-1">Tipo Snapshot</label>
                                        <select
                                            className="w-full h-11 px-4 rounded-xl bg-card border border-border focus:border-primary transition-all outline-none text-xs font-bold text-foreground shadow-sm disabled:opacity-70 disabled:bg-muted/50"
                                            value={formData.tipoId}
                                            onChange={(e) => setFormData({ ...formData, tipoId: e.target.value })}
                                            disabled={!!selectedMaster}
                                        >
                                            <option value="">Seleccionar Tipo</option>
                                            {tipos.map(t => <option key={t.id} value={t.id}>{t.nombre}</option>)}
                                        </select>
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[9px] font-black text-muted-foreground uppercase tracking-widest ml-1">Modalidad</label>
                                        <select
                                            className="w-full h-11 px-4 rounded-xl bg-card border border-border focus:border-primary transition-all outline-none text-xs font-bold text-foreground shadow-sm disabled:opacity-70 disabled:bg-muted/50"
                                            value={formData.modalidadId}
                                            onChange={(e) => setFormData({ ...formData, modalidadId: e.target.value })}
                                            disabled={!!selectedMaster}
                                        >
                                            <option value="">Seleccionar Modalidad</option>
                                            {modalidades.map(m => <option key={m.id} value={m.id}>{m.nombre}</option>)}
                                        </select>
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[9px] font-black text-muted-foreground uppercase tracking-widest ml-1">Duración</label>
                                        <select
                                            className="w-full h-11 px-4 rounded-xl bg-card border border-border focus:border-primary transition-all outline-none text-xs font-bold text-foreground shadow-sm disabled:opacity-70 disabled:bg-muted/50"
                                            value={formData.duracionId}
                                            onChange={(e) => setFormData({ ...formData, duracionId: e.target.value })}
                                            disabled={!!selectedMaster}
                                        >
                                            <option value="">Seleccionar Duración</option>
                                            {duraciones.map(d => <option key={d.id} value={d.id}>{d.nombre}</option>)}
                                        </select>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <label className="text-[9px] font-black text-muted-foreground uppercase tracking-widest ml-1">Código Snapshot</label>
                                        <input
                                            type="text"
                                            className="w-full h-11 px-4 rounded-xl bg-card border border-border focus:border-primary transition-all outline-none text-xs font-bold text-foreground shadow-sm disabled:opacity-70 disabled:bg-muted/50"
                                            value={formData.codigo}
                                            onChange={(e) => setFormData({ ...formData, codigo: e.target.value })}
                                            disabled={!!selectedMaster}
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[9px] font-black text-muted-foreground uppercase tracking-widest ml-1">Carga Horaria</label>
                                        <input
                                            type="number"
                                            className="w-full h-11 px-4 rounded-xl bg-card border border-border focus:border-primary transition-all outline-none text-xs font-bold text-foreground shadow-sm disabled:opacity-70 disabled:bg-muted/50"
                                            value={formData.cargaHoraria}
                                            onChange={(e) => setFormData({ ...formData, cargaHoraria: parseInt(e.target.value) })}
                                            disabled={!!selectedMaster}
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <label className="text-[9px] font-black text-muted-foreground uppercase tracking-widest ml-1 flex items-center gap-2">
                                            <ImageIcon className="w-3 h-3 text-primary" />
                                            Banner Informativo
                                        </label>
                                        <ImageUpload
                                            value={formData.banner}
                                            onChange={(url) => setFormData({ ...formData, banner: url })}
                                            tableName="ofertas"
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[9px] font-black text-muted-foreground uppercase tracking-widest ml-1 flex items-center gap-2">
                                            <ImageIcon className="w-3 h-3 text-primary" />
                                            Afiche Publicitario
                                        </label>
                                        <ImageUpload
                                            value={formData.afiche}
                                            onChange={(url) => setFormData({ ...formData, afiche: url })}
                                            tableName="ofertas"
                                        />
                                    </div>
                                </div>

                                <div className="md:col-span-2 space-y-1.5">
                                    <label className="text-[9px] font-black text-muted-foreground uppercase tracking-widest ml-1">Contenido / Malla (Snapshot)</label>
                                    <textarea
                                        className="w-full h-24 p-4 rounded-xl bg-card border border-border focus:border-primary transition-all outline-none text-xs font-bold text-foreground shadow-sm resize-none disabled:opacity-70 disabled:bg-muted/50"
                                        value={formData.contenido}
                                        onChange={(e) => setFormData({ ...formData, contenido: e.target.value })}
                                        disabled={!!selectedMaster}
                                    />
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div className="space-y-1.5">
                                        <label className="text-[9px] font-black text-muted-foreground uppercase tracking-widest ml-1">Inicia Inscripciones</label>
                                        <input type="date" className="w-full h-11 px-4 rounded-xl bg-card border border-border focus:border-primary transition-all outline-none text-xs font-bold text-foreground shadow-sm" value={formData.fechaIniIns} onChange={(e) => setFormData({ ...formData, fechaIniIns: e.target.value })} required />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[9px] font-black text-muted-foreground uppercase tracking-widest ml-1">Finaliza Inscripciones</label>
                                        <input type="date" className="w-full h-11 px-4 rounded-xl bg-card border border-border focus:border-primary transition-all outline-none text-xs font-bold text-foreground shadow-sm" value={formData.fechaFinIns} onChange={(e) => setFormData({ ...formData, fechaFinIns: e.target.value })} required />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[9px] font-black text-muted-foreground uppercase tracking-widest ml-1">Inicio de Clases</label>
                                        <input type="date" className="w-full h-11 px-4 rounded-xl bg-card border border-border focus:border-primary transition-all outline-none text-xs font-bold text-foreground shadow-sm" value={formData.fechaIniClase} onChange={(e) => setFormData({ ...formData, fechaIniClase: e.target.value })} required />
                                    </div>
                                </div>
                            </div>

                            <button
                                type="button"
                                onClick={() => setFormData({ ...formData, estadoInscripcion: !formData.estadoInscripcion })}
                                className={cn(
                                    "flex items-center justify-between w-full h-14 px-5 rounded-2xl border-2 transition-all shadow-sm",
                                    formData.estadoInscripcion
                                        ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-600"
                                        : "bg-rose-500/10 border-rose-500/20 text-rose-600"
                                )}
                            >
                                <span className="text-[10px] font-black uppercase tracking-widest">Inscripciones {formData.estadoInscripcion ? 'Abiertas (PUBLICADO)' : 'Cerrado (BORRADOR)'}</span>
                                <Activity className={cn("w-5 h-5", formData.estadoInscripcion ? "animate-pulse" : "")} />
                            </button>

                            <div className="space-y-1.5 pt-2">
                                <label className="text-[9px] font-black text-muted-foreground uppercase tracking-widest ml-1">Estado del Registro</label>
                                <select
                                    className="w-full h-11 px-4 rounded-xl bg-card border border-border focus:border-primary transition-all outline-none text-xs font-bold text-foreground shadow-sm"
                                    value={formData.estado}
                                    onChange={(e) => setFormData({ ...formData, estado: e.target.value })}
                                >
                                    <option value="activo">ACTIVO</option>
                                    <option value="inactivo">INACTIVO</option>
                                    <option value="eliminado">ELIMINADO</option>
                                    <option value="vista">SOLO VISTA</option>
                                </select>
                            </div>

                            {/* Modulos Management */}
                            <div className="space-y-6 pb-4 pt-6 mt-6 border-t border-border/40">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-primary/5 rounded-xl border border-primary/10">
                                            <LayoutGrid className="w-4 h-4 text-primary" />
                                        </div>
                                        <h4 className="text-[11px] font-black uppercase tracking-[0.2em] text-foreground">
                                            {editingOferta ? 'Gestión de Módulos Operativos (Editando)' : 'Arquitectura de Módulos (Auto-clonada del Maestro)'}
                                        </h4>
                                    </div>
                                    {!selectedMaster && (
                                        <button
                                            type="button"
                                            onClick={addModulo}
                                            className="px-4 py-2 rounded-xl bg-primary text-white text-[9px] font-black uppercase tracking-widest hover:opacity-90 flex items-center gap-2 shadow-lg shadow-primary/20"
                                        >
                                            <PlusCircle className="w-3.5 h-3.5" />
                                            Nuevo Módulo Operativo
                                        </button>
                                    )}
                                </div>

                                <div className="space-y-3">
                                    {formData.modulos.length === 0 && (
                                        <div className="p-8 rounded-2xl border-2 border-dashed border-border flex flex-col items-center justify-center text-center opacity-40">
                                            <Box className="w-8 h-8 mb-2" />
                                            <p className="text-[10px] font-bold uppercase tracking-widest">Sin módulos configurados en esta oferta</p>
                                        </div>
                                    )}
                                    {formData.modulos.map((modulo, index) => (
                                        <div key={index} className="p-4 rounded-2xl bg-muted/20 border border-border/50 space-y-4 relative group">
                                            {!selectedMaster && (
                                                <button
                                                    type="button"
                                                    onClick={() => removeModulo(index)}
                                                    className="absolute -top-2 -right-2 p-1.5 rounded-full bg-destructive text-destructive-foreground shadow-lg opacity-0 group-hover:opacity-100 transition-all z-10"
                                                >
                                                    <XCircle className="w-4 h-4" />
                                                </button>
                                            )}

                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                                <div className="md:col-span-2 space-y-1">
                                                    <label className="text-[8px] font-black text-muted-foreground uppercase tracking-widest">Nombre del Módulo</label>
                                                    <input
                                                        type="text"
                                                        className="w-full h-10 px-3 rounded-lg bg-card border border-border focus:border-primary outline-none text-[11px] font-bold disabled:opacity-70 disabled:bg-muted/30"
                                                        value={modulo.nombre}
                                                        onChange={(e) => updateModulo(index, 'nombre', e.target.value)}
                                                        disabled={!!selectedMaster}
                                                    />
                                                </div>
                                                <div className="space-y-1">
                                                    <label className="text-[8px] font-black text-muted-foreground uppercase tracking-widest">Código</label>
                                                    <input
                                                        type="text"
                                                        className="w-full h-10 px-3 rounded-lg bg-card border border-border focus:border-primary outline-none text-[11px] font-bold disabled:opacity-70 disabled:bg-muted/30"
                                                        value={modulo.codigo}
                                                        onChange={(e) => updateModulo(index, 'codigo', e.target.value)}
                                                        disabled={!!selectedMaster}
                                                    />
                                                </div>
                                                <div className="md:col-span-3 space-y-1">
                                                    <label className="text-[8px] font-black text-muted-foreground uppercase tracking-widest">Descripción</label>
                                                    <input
                                                        type="text"
                                                        className="w-full h-10 px-3 rounded-lg bg-card border border-border focus:border-primary outline-none text-[11px] font-bold disabled:opacity-70 disabled:bg-muted/30"
                                                        value={modulo.descripcion}
                                                        onChange={(e) => updateModulo(index, 'descripcion', e.target.value)}
                                                        disabled={!!selectedMaster}
                                                    />
                                                </div>

                                                <div className="space-y-1">
                                                    <label className="text-[8px] font-black text-muted-foreground uppercase tracking-widest">Fecha Inicio</label>
                                                    <input
                                                        type="date"
                                                        className="w-full h-10 px-3 rounded-lg bg-card border border-border focus:border-primary outline-none text-[11px] font-bold"
                                                        value={modulo.fechaInicio}
                                                        onChange={(e) => updateModulo(index, 'fechaInicio', e.target.value)}
                                                    />
                                                </div>
                                                <div className="space-y-1">
                                                    <label className="text-[8px] font-black text-muted-foreground uppercase tracking-widest">Fecha Fin</label>
                                                    <input
                                                        type="date"
                                                        className="w-full h-10 px-3 rounded-lg bg-card border border-border focus:border-primary outline-none text-[11px] font-bold"
                                                        value={modulo.fechaFin}
                                                        onChange={(e) => updateModulo(index, 'fechaFin', e.target.value)}
                                                    />
                                                </div>
                                                <div className="space-y-1">
                                                    <label className="text-[8px] font-black text-muted-foreground uppercase tracking-widest">Estado</label>
                                                    <select
                                                        className="w-full h-10 px-3 rounded-lg bg-card border border-border focus:border-primary outline-none text-[11px] font-bold"
                                                        value={modulo.estado}
                                                        onChange={(e) => updateModulo(index, 'estado', e.target.value)}
                                                    >
                                                        <option value="activo">ACTIVO</option>
                                                        <option value="inactivo">INACTIVO</option>
                                                    </select>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Turnos Management */}
                            <div className="space-y-6 pb-4 pt-6 mt-6 border-t border-border/40">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-primary/5 rounded-xl border border-primary/10">
                                            <Clock className="w-4 h-4 text-primary" />
                                        </div>
                                        <h4 className="text-[11px] font-black uppercase tracking-[0.2em] text-foreground">
                                            Gestión de Turnos y Cupos
                                        </h4>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={addTurno}
                                        className="px-4 py-2 rounded-xl bg-primary text-white text-[9px] font-black uppercase tracking-widest hover:opacity-90 flex items-center gap-2 shadow-lg shadow-primary/20"
                                    >
                                        <PlusCircle className="w-3.5 h-3.5" />
                                        Agregar Turno de Trabajo
                                    </button>
                                </div>

                                <div className="space-y-3">
                                    {formData.turnos.length === 0 && (
                                        <div className="p-8 rounded-2xl border-2 border-dashed border-border flex flex-col items-center justify-center text-center opacity-40">
                                            <Clock className="w-8 h-8 mb-2" />
                                            <p className="text-[10px] font-bold uppercase tracking-widest">Sin turnos asignados. Debe agregar al menos uno para habilitar cupos.</p>
                                        </div>
                                    )}
                                    {formData.turnos.map((turno, index) => (
                                        <div key={index} className="p-4 rounded-2xl bg-primary/5 border border-primary/10 space-y-4 relative group">
                                            <button
                                                type="button"
                                                onClick={() => removeTurno(index)}
                                                className="absolute -top-2 -right-2 p-1.5 rounded-full bg-destructive text-destructive-foreground shadow-lg opacity-0 group-hover:opacity-100 transition-all z-10"
                                            >
                                                <XCircle className="w-4 h-4" />
                                            </button>

                                            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                                                <div className="md:col-span-1 space-y-1">
                                                    <label className="text-[8px] font-black text-muted-foreground uppercase tracking-widest">Turno / Horarios</label>
                                                    <select
                                                        className="w-full h-10 px-3 rounded-lg bg-card border border-border focus:border-primary outline-none text-[11px] font-bold"
                                                        value={turno.turnoIds}
                                                        onChange={(e) => updateTurno(index, 'turnoIds', e.target.value)}
                                                        required
                                                    >
                                                        <option value="">Seleccionar Turno</option>
                                                        {turnosMaster.map(tm => (
                                                            <option key={tm.id} value={tm.id}>
                                                                {tm.nombre?.toUpperCase()} {tm.descripcion ? `- ${tm.descripcion}` : ''}
                                                            </option>
                                                        ))}
                                                    </select>
                                                </div>
                                                <div className="space-y-1">
                                                    <label className="text-[8px] font-black text-muted-foreground uppercase tracking-widest">Cupo Máximo</label>
                                                    <input
                                                        type="number"
                                                        className="w-full h-10 px-3 rounded-lg bg-card border border-border focus:border-primary outline-none text-[11px] font-bold"
                                                        value={turno.cupo}
                                                        onChange={(e) => updateTurno(index, 'cupo', parseInt(e.target.value) || 0)}
                                                        required
                                                    />
                                                </div>
                                                <div className="space-y-1">
                                                    <label className="text-[8px] font-black text-muted-foreground uppercase tracking-widest">Cupo Preinscrito</label>
                                                    <input
                                                        type="number"
                                                        className="w-full h-10 px-3 rounded-lg bg-card border border-border focus:border-primary outline-none text-[11px] font-bold"
                                                        value={turno.cupoPre}
                                                        onChange={(e) => updateTurno(index, 'cupoPre', parseInt(e.target.value) || 0)}
                                                    />
                                                </div>
                                                <div className="space-y-1">
                                                    <label className="text-[8px] font-black text-muted-foreground uppercase tracking-widest">Estado</label>
                                                    <select
                                                        className="w-full h-10 px-3 rounded-lg bg-card border border-border focus:border-primary outline-none text-[11px] font-bold"
                                                        value={turno.estado}
                                                        onChange={(e) => updateTurno(index, 'estado', e.target.value)}
                                                    >
                                                        <option value="activo">ACTIVO</option>
                                                        <option value="inactivo">INACTIVO</option>
                                                    </select>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-end gap-3 pt-6 border-t border-border/40">
                            <button type="button" onClick={() => setIsModalOpen(false)} className="px-6 text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:text-foreground">Cancelar</button>
                            <button type="submit" disabled={isLoading} className="h-12 px-10 rounded-xl bg-primary text-white font-black text-[10px] uppercase tracking-widest shadow-lg shadow-primary/20 hover:opacity-90 transition-all">
                                {isLoading ? 'Generando Versión...' : (editingOferta ? 'Actualizar Oferta' : 'Lanzar Oferta Operativa')}
                            </button>
                        </div>
                    </form>
                )}
            </Modal>

            <Modal
                isOpen={isFacilitadoresModalOpen}
                onClose={() => setIsFacilitadoresModalOpen(false)}
                title="Gestión de Facilitadores"
                size="2xl"
            >
                <div className="space-y-8 max-h-[75vh] overflow-y-auto px-2 pr-4 custom-scrollbar">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
                        {/* Matrix Column - Mobile Scrollable */}
                        <div className="space-y-4">
                            <div className="flex items-center justify-between px-1">
                                <div className="flex items-center gap-2">
                                    <div className="p-1.5 bg-indigo-500/10 rounded-lg">
                                        <LayoutGrid className="w-4 h-4 text-indigo-500" />
                                    </div>
                                    <h4 className="text-[10px] font-black uppercase tracking-widest text-foreground">Matriz de Cobertura</h4>
                                </div>
                                <button
                                    onClick={() => {
                                        const allSlots: string[] = [];
                                        for (const m of targetOferta.modulos) {
                                            for (const t of targetOferta.turnos) {
                                                allSlots.push(`${m.id}:${t.id}`);
                                            }
                                        }
                                        setNewAsignacion(prev => ({ ...prev, selectedSlots: allSlots, moduloId: '', turnoId: '' }));
                                    }}
                                    className="text-[9px] font-black uppercase text-primary hover:underline"
                                >
                                    Fijar Todo
                                </button>
                            </div>

                            <div className="rounded-2xl border border-border/50 bg-card/50 overflow-hidden">
                                <div className="overflow-x-auto custom-scrollbar">
                                    <table className="w-full border-collapse min-w-[500px]">
                                        <thead>
                                            <tr className="bg-muted/30 border-b border-border/40">
                                                <th className="p-2 w-24"></th>
                                                {targetOferta?.turnos?.map((t: any) => {
                                                    const masterT = turnosMaster.find((x: any) => x.id === (t.turnoIds || t.turnoId));
                                                    return (
                                                        <th key={t.id} className="p-2 border-r border-border/10 last:border-r-0">
                                                            <button
                                                                onClick={() => {
                                                                    const columnSlots = (targetOferta?.modulos || []).map((m: any) => `${m.id}:${t.id}`);
                                                                    setNewAsignacion(prev => ({
                                                                        ...prev,
                                                                        selectedSlots: Array.from(new Set([...prev.selectedSlots, ...columnSlots])),
                                                                        moduloId: '',
                                                                        turnoId: ''
                                                                    }));
                                                                }}
                                                                className="flex flex-col items-center gap-1 group/th"
                                                                title={`Seleccionar todos los módulos para el turno ${masterT?.nombre || 'Especial'}`}
                                                            >
                                                                <span className="text-[8px] font-black uppercase text-muted-foreground group-hover/th:text-primary transition-colors">
                                                                    {masterT?.nombre || (t.turnoConfig?.nombre) || 'S/T'}
                                                                </span>
                                                                <ChevronDown className="w-2.5 h-2.5 text-muted-foreground/30 group-hover/th:text-primary animate-bounce-subtle" />
                                                            </button>
                                                        </th>
                                                    );
                                                })}
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {/* SECCIÓN MÓDULOS GLOBALES (MÓDULO 0) */}
                                            {targetOferta?.programa?.modulos?.filter((m: any) => m.esGlobal).map((gm: any) => (
                                                <tr key={gm.id} className="border-b border-indigo-500/20 bg-indigo-500/[0.03]">
                                                    <td className="p-2 border-r border-border/10 bg-indigo-500/5">
                                                        <div className="flex items-center gap-2">
                                                            <div className="w-5 h-5 rounded-full bg-indigo-500 text-white flex items-center justify-center text-[10px] font-black">M0</div>
                                                            <div className="flex flex-col">
                                                                <span className="text-[10px] font-black text-indigo-700 uppercase leading-none">{gm.nombre}</span>
                                                                <span className="text-[7px] font-bold text-indigo-400 uppercase tracking-tighter mt-0.5">Módulo Global</span>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    {targetOferta?.turnos?.map((t: any) => {
                                                        const asig = asignaciones.find((a: any) => a.moduloMaestroId === gm.id && a.turnoId === t.id);
                                                        const isSelected = newAsignacion.selectedSlots.includes(`${gm.id}:${t.id}`);

                                                        return (
                                                            <td key={t.id} className="p-1 border-r last:border-r-0 border-border/10 relative">
                                                                <button
                                                                    onClick={() => toggleSlot(gm.id, t.id)}
                                                                    className={cn(
                                                                        "w-full h-10 rounded-xl flex flex-col items-center justify-center gap-1 transition-all border-2",
                                                                        isSelected
                                                                            ? "bg-indigo-600 border-indigo-600 text-white shadow-md scale-[0.98]"
                                                                            : asig
                                                                                ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-700"
                                                                                : "bg-indigo-500/5 border-dashed border-indigo-200 hover:border-indigo-400"
                                                                    )}
                                                                >
                                                                    {asig && !isSelected ? (
                                                                        <div className="w-6 h-6 rounded-full overflow-hidden border-2 border-emerald-500/20 shadow-sm">
                                                                            {asig.facilitador?.imagen ? <img src={asig.facilitador.imagen} className="w-full h-full object-cover" /> : <UserCircle className="w-full h-full p-0.5" />}
                                                                        </div>
                                                                    ) : isSelected ? <BadgeCheck className="w-4 h-4 text-white" /> : <PlusCircle className="w-3.5 h-3.5 text-indigo-200" />}
                                                                </button>
                                                            </td>
                                                        );
                                                    })}
                                                </tr>
                                            ))}

                                            {/* SECCIÓN MÓDULOS REGULARES */}
                                            {(targetOferta?.modulos || []).sort((a: any, b: any) => (a.orden || 0) - (b.orden || 0)).map((m: any) => {
                                                const rowIsSelected = newAsignacion.moduloId === m.id && newAsignacion.turnoId === 'all';
                                                return (
                                                    <tr key={m.id} className="border-b border-border/10 last:border-b-0">
                                                        <td className="p-2 border-r border-border/10">
                                                            <button
                                                                onClick={() => {
                                                                    const rowSlots = (targetOferta?.turnos || []).map((t: any) => `${m.id}:${t.id}`);
                                                                    setNewAsignacion(prev => ({
                                                                        ...prev,
                                                                        selectedSlots: Array.from(new Set([...prev.selectedSlots, ...rowSlots])),
                                                                        moduloId: '',
                                                                        turnoId: ''
                                                                    }));
                                                                }}
                                                                className="flex items-center gap-2 group/tr w-full text-left"
                                                                title={`Seleccionar todos los turnos para el módulo: ${m.nombre}`}
                                                            >
                                                                <ArrowRight className="w-2.5 h-2.5 text-muted-foreground/30 group-hover/tr:text-primary transition-transform group-hover/tr:translate-x-0.5" />
                                                                <span className="text-[8px] font-black uppercase text-foreground group-hover/tr:text-primary transition-colors truncate max-w-[90px]">
                                                                    {m.nombre}
                                                                </span>
                                                            </button>
                                                        </td>
                                                        {targetOferta?.turnos?.map((t: any) => {
                                                            const asig = asignaciones.find((a: any) => a.moduloId === m.id && a.turnoId === t.id);
                                                            const isLegacySelected = (newAsignacion.moduloId === m.id || newAsignacion.moduloId === 'all') &&
                                                                (newAsignacion.turnoId === t.id || newAsignacion.turnoId === 'all');
                                                            const isMultiSelected = newAsignacion.selectedSlots.includes(`${m.id}:${t.id}`);
                                                            const isSelected = isLegacySelected || isMultiSelected;

                                                            return (
                                                                 <td key={t.id} className="p-1 border-r last:border-r-0 border-border/10 relative">
                                                                     <button
                                                                         onClick={() => toggleSlot(m.id, t.id)}
                                                                         title={asig ? `Módulo asignado a ${asig.facilitador?.nombre}` : 'Espacio disponible'}
                                                                         className={cn(
                                                                             "w-full h-10 rounded-xl flex flex-col items-center justify-center gap-1 transition-all text-center border-2",
                                                                             isSelected
                                                                                 ? "bg-primary border-primary text-white shadow-md shadow-primary/10 scale-[0.98]"
                                                                                 : asig
                                                                                     ? "bg-emerald-500/5 border-emerald-500/10 text-emerald-600 hover:bg-emerald-500/10"
                                                                                     : "bg-background border-dashed border-border/60 hover:border-primary/40 text-muted-foreground hover:bg-primary/5"
                                                                         )}
                                                                     >
                                                                         {asig && !isSelected ? (
                                                                             <div className="w-6 h-6 rounded-full overflow-hidden border-2 border-emerald-500/20 shadow-sm">
                                                                                 {asig.facilitador?.imagen ? (
                                                                                     <img src={asig.facilitador.imagen} className="w-full h-full object-cover" />
                                                                                 ) : <UserCircle className="w-full h-full p-0.5" />}
                                                                             </div>
                                                                         ) : isSelected ? (
                                                                             <div className="flex flex-col items-center">
                                                                                 <BadgeCheck className="w-4 h-4 text-white animate-in zoom-in" />
                                                                             </div>
                                                                         ) : (
                                                                             <PlusCircle className={cn("w-3.5 h-3.5", "text-muted-foreground/20 group-hover/tr:text-primary/30")} />
                                                                         )}
                                                                     </button>
                                                                 </td>
                                                             );
                                                         })}
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>

                        {/* Action Column */}
                        <div className="space-y-4">
                            <div className="p-5 rounded-3xl bg-muted/20 border border-border/50 space-y-5">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <div className="p-1.5 bg-primary/10 rounded-lg">
                                            <UserPlus className="w-3.5 h-3.5 text-primary" />
                                        </div>
                                        <h4 className="text-[9px] font-black uppercase tracking-widest text-foreground">Asignar Personal</h4>
                                    </div>
                                    <div className="px-2 py-1 rounded bg-card border border-border text-[8px] font-black text-primary uppercase">
                                        {(() => {
                                            if (newAsignacion.selectedSlots.length > 0) return `${newAsignacion.selectedSlots.length} Cupos`;
                                            const mCount = newAsignacion.moduloId === 'all' ? targetOferta?.modulos?.length : (newAsignacion.moduloId ? 1 : 0);
                                            const tCount = newAsignacion.turnoId === 'all' ? targetOferta?.turnos?.length : (newAsignacion.turnoId ? 1 : 0);
                                            return `${mCount * tCount} Cupos`;
                                        })()}
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <div className="relative group">
                                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                                        <input
                                            type="text"
                                            placeholder="Buscar Facilitador..."
                                            className="w-full h-10 pl-11 pr-4 rounded-xl bg-card border border-border focus:border-primary outline-none text-[11px] font-bold transition-all shadow-sm"
                                            value={facilitadorSearch}
                                            onChange={(e) => setFacilitadorSearch(e.target.value)}
                                        />

                                        {facilitadorSearch && (
                                            <div className="absolute top-full left-0 right-0 mt-2 z-[100] bg-card border border-border rounded-xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-1">
                                                <div className="max-h-[200px] overflow-y-auto p-1 grid grid-cols-1 gap-1">
                                                    {facilitadores.length === 0 ? (
                                                        <div className="py-6 text-center opacity-30 text-[9px] font-black uppercase">Sin resultados</div>
                                                    ) : (
                                                        facilitadores.map(f => (
                                                            <button
                                                                key={f.id}
                                                                onClick={() => {
                                                                    setNewAsignacion({ ...newAsignacion, facilitadorId: f.id });
                                                                    setFacilitadorSearch('');
                                                                }}
                                                                className="flex items-center gap-3 p-2 rounded-lg hover:bg-primary/5 text-left transition-all"
                                                            >
                                                                <div className="w-7 h-7 rounded bg-primary/5 flex items-center justify-center border border-primary/5 overflow-hidden shrink-0">
                                                                    {f.imagen ? <img src={f.imagen} className="w-full h-full object-cover" /> : <UserCircle className="w-4 h-4 text-primary" />}
                                                                </div>
                                                                <div className="flex-1 min-w-0">
                                                                    <p className="text-[9px] font-black uppercase tracking-tight truncate">{f.nombre} {f.apellidos}</p>
                                                                    <p className="text-[7px] font-bold text-muted-foreground opacity-60 truncate">{f.correo}</p>
                                                                </div>
                                                            </button>
                                                        ))
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {newAsignacion.facilitadorId && (
                                        <div className="flex items-center justify-between p-3 rounded-xl bg-primary text-white animate-in zoom-in duration-200">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-lg overflow-hidden border border-white/20 bg-white/10 shrink-0">
                                                    {(() => {
                                                        const f = facilitadores.find((x: any) => x.id === newAsignacion.facilitadorId);
                                                        return f?.imagen ? <img src={f.imagen} className="w-full h-full object-cover" /> : <UserCircle className="w-5 h-5 m-auto" />;
                                                    })()}
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="text-[9px] font-black uppercase truncate">
                                                        {(() => {
                                                            const f = facilitadores.find((x: any) => x.id === newAsignacion.facilitadorId);
                                                            return f ? `${f.nombre} ${f.apellidos}` : '...';
                                                        })()}
                                                    </p>
                                                    <p className="text-[7px] font-bold opacity-60 uppercase">Docente Seleccionado</p>
                                                </div>
                                            </div>
                                            <button onClick={() => setNewAsignacion({ ...newAsignacion, facilitadorId: '' })} className="p-1 hover:bg-white/10 rounded">
                                                <Trash2 className="w-3 h-3" />
                                            </button>
                                        </div>
                                    )}

                                    <button
                                        onClick={handleCreateAsignacion}
                                        disabled={isLoading || !newAsignacion.facilitadorId}
                                        className={cn(
                                            "w-full h-11 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2",
                                            !newAsignacion.facilitadorId
                                                ? "bg-muted text-muted-foreground opacity-50"
                                                : "bg-primary text-white hover:shadow-lg hover:shadow-primary/20 active:scale-95"
                                        )}
                                    >
                                        <Save className="w-3.5 h-3.5" />
                                        Confirmar Asignación
                                    </button>
                                </div>
                            </div>

                            {/* Global Statistics Compact */}
                            {targetOferta && (
                                <div className="p-4 rounded-2xl bg-card border border-border flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-full border-2 border-primary/20 flex items-center justify-center relative">
                                        <span className="text-[9px] font-black text-primary">
                                            {Math.round((asignaciones.length / (targetOferta.modulos.length * targetOferta.turnos.length || 1)) * 100)}%
                                        </span>
                                    </div>
                                    <div>
                                        <p className="text-[8px] font-black uppercase text-muted-foreground tracking-widest">Cobertura Académica</p>
                                        <p className="text-[10px] font-black text-foreground uppercase">
                                            {asignaciones.length} de {targetOferta.modulos.length * targetOferta.turnos.length} Puestos
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Academic Coverage Radar - Mini Institutional Version */}
                    {targetOferta && (
                        <div className="px-1">
                            <div className="p-4 rounded-2xl bg-card border border-border shadow-sm relative overflow-hidden group/radar">
                                <div className="relative flex items-center gap-5">
                                    {/* Mini Progress Ring */}
                                    <div className="relative w-14 h-14 flex items-center justify-center shrink-0">
                                        <svg className="w-full h-full -rotate-90">
                                            <circle
                                                cx="28" cy="28" r="24"
                                                fill="transparent"
                                                stroke="currentColor"
                                                strokeWidth="4"
                                                className="text-muted/10"
                                            />
                                            <circle
                                                cx="28" cy="28" r="24"
                                                fill="transparent"
                                                stroke="currentColor"
                                                strokeWidth="4"
                                                strokeDasharray={151}
                                                strokeDashoffset={151 - (151 * (asignaciones.length / (targetOferta.modulos.length * targetOferta.turnos.length || 1)))}
                                                strokeLinecap="round"
                                                className="text-primary transition-all duration-1000 ease-out"
                                            />
                                        </svg>
                                        <span className="absolute text-[10px] font-black italic text-primary">
                                            {Math.round((asignaciones.length / (targetOferta.modulos.length * targetOferta.turnos.length || 1)) * 100) || 0}%
                                        </span>
                                    </div>

                                    <div className="flex-1 space-y-1">
                                        <div className="flex items-center gap-2">
                                            <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                                            <span className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground">Cobertura Académica</span>
                                        </div>
                                        <div className="flex items-baseline gap-2">
                                            <h3 className="text-sm font-black uppercase text-foreground truncate">
                                                {asignaciones.length === (targetOferta.modulos.length * targetOferta.turnos.length)
                                                    ? 'Personal Completo'
                                                    : 'Personal en Proceso'}
                                            </h3>
                                            <span className="text-[9px] font-bold text-muted-foreground whitespace-nowrap">
                                                ({asignaciones.length}/{targetOferta.modulos.length * targetOferta.turnos.length})
                                            </span>
                                        </div>
                                        <div className="w-full h-1 bg-muted/30 rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-primary transition-all duration-1000"
                                                style={{ width: `${(asignaciones.length / (targetOferta.modulos.length * targetOferta.turnos.length || 1)) * 100}%` }}
                                            />
                                        </div>
                                    </div>

                                    {asignaciones.length === (targetOferta.modulos.length * targetOferta.turnos.length) && (
                                        <div className="shrink-0 flex items-center justify-center w-8 h-8 rounded-full bg-primary/5 text-primary border border-primary/10 animate-in zoom-in">
                                            <CheckCircle2 className="w-4 h-4" />
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                    {/* Pending Slots (Creative "Ghost" List) */}
                    {(() => {
                        const pending = [];
                        if (targetOferta?.modulos && targetOferta?.turnos) {
                            for (const m of [...targetOferta.modulos].sort((a: any, b: any) => (a.orden || 0) - (b.orden || 0))) {
                                for (const t of targetOferta.turnos) {
                                    const isAssigned = asignaciones.some(as => as.moduloId === m.id && as.turnoId === t.id);
                                    if (!isAssigned) pending.push({ modulo: m, turno: t });
                                }
                            }
                        }

                        if (pending.length > 0) {
                            return (
                                <div className="space-y-3 animate-in fade-in slide-in-from-bottom-2 duration-500">
                                    <div className="flex items-center gap-2 px-1">
                                        <div className="w-1.5 h-1.5 rounded-full bg-destructive animate-pulse" />
                                        <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">Puestos Pendientes de Docente ({pending.length})</span>
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                        {pending.slice(0, 4).map((p, idx) => (
                                            <div key={idx} className="p-3 rounded-2xl bg-muted/30 border border-dashed border-border/60 flex items-center gap-3 group/ghost opacity-70 hover:opacity-100 transition-opacity">
                                                <div className="w-8 h-8 rounded-full border border-border bg-background flex items-center justify-center">
                                                    <UserPlus className="w-3.5 h-3.5 text-muted-foreground group-hover/ghost:text-destructive transition-colors" />
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="text-[9px] font-black uppercase truncate text-foreground">{p.modulo.nombre}</p>
                                                    <p className="text-[8px] font-bold uppercase truncate text-muted-foreground italic">
                                                        Turno: {p.turno.turnoConfig?.nombre || turnosMaster.find(x => x.id === (p.turno.turnoId || p.turno.turnoIds))?.nombre || 'S/T'}
                                                    </p>
                                                </div>
                                            </div>
                                        ))}
                                        {pending.length > 4 && (
                                            <div className="col-span-full py-1 text-center">
                                                <span className="text-[8px] font-black uppercase text-muted-foreground italic">... y {pending.length - 4} más sin asignar</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        }
                        return (
                            <div className="p-4 rounded-2xl bg-emerald-500/5 border border-emerald-500/10 flex items-center gap-3">
                                <div className="p-2 bg-emerald-500 rounded-xl text-white shadow-lg shadow-emerald-500/20">
                                    <Award className="w-4 h-4" />
                                </div>
                                <div>
                                    <p className="text-[10px] font-black uppercase text-emerald-600">¡Equipo Completo!</p>
                                    <p className="text-[8px] font-bold text-emerald-600/70 uppercase">Todos los módulos tienen docente asignado.</p>
                                </div>
                            </div>
                        );
                    })()}

                    {/* Current Assignments List */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-primary/5 rounded-xl">
                                <BadgeCheck className="w-5 h-5 text-primary" />
                            </div>
                            <h4 className="text-[11px] font-black uppercase tracking-[0.2em] text-foreground">Facilitadores Asignados</h4>
                        </div>

                        <div className="grid grid-cols-1 gap-3">
                            {asignaciones.length === 0 ? (
                                <div className="py-12 flex flex-col items-center justify-center opacity-30 border-2 border-dashed border-border rounded-3xl">
                                    <UserPlus className="w-10 h-10 mb-2" />
                                    <p className="text-[10px] font-black uppercase tracking-widest">No hay facilitadores vinculados aún</p>
                                </div>
                            ) : (
                                Object.entries(
                                    asignaciones.reduce((acc: any, curr: any) => {
                                        const turn = curr.turno?.turnoConfig || turnosMaster.find(x => x.id === (curr.turno?.turnoId || curr.turno?.turnoIds));
                                        const turnName = turn?.nombre || 'S/T';
                                        if (!acc[turnName]) acc[turnName] = [];
                                        acc[turnName].push(curr);
                                        return acc;
                                    }, {})
                                ).map(([turnName, items]: [string, any]) => (
                                    <div key={turnName} className="space-y-3 mb-6 last:mb-0 animate-in fade-in slide-in-from-left-2 transition-all">
                                        <div className="flex items-center gap-3 px-1">
                                            <div className="h-px flex-1 bg-gradient-to-r from-primary/20 via-primary/5 to-transparent" />
                                            <div className="flex items-center gap-2">
                                                <Clock className="w-3 h-3 text-primary animate-pulse" />
                                                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-primary/70">{turnName}</span>
                                            </div>
                                            <div className="h-px flex-1 bg-gradient-to-l from-primary/20 via-primary/5 to-transparent" />
                                        </div>

                                        <div className="grid grid-cols-1 gap-2">
                                            {items.sort((a: any, b: any) => (a.modulo?.nombre || '').localeCompare(b.modulo?.nombre || '')).map((as: any) => (
                                                <div key={as.id} className="group relative flex items-center justify-between p-3 rounded-2xl bg-muted/20 border border-border/40 hover:bg-card hover:border-primary/30 transition-all duration-300">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center text-primary overflow-hidden border border-primary/5">
                                                            {as.facilitador?.imagen ? (
                                                                <img src={as.facilitador.imagen} alt={as.facilitador.nombre} className="w-full h-full object-cover" />
                                                            ) : (
                                                                <UserCircle className="w-5 h-5" />
                                                            )}
                                                        </div>
                                                        <div className="space-y-0.5">
                                                            <h5 className="text-[11px] font-black uppercase text-foreground leading-tight">
                                                                {as.facilitador?.nombre} {as.facilitador?.apellidos}
                                                            </h5>
                                                            <div className="flex items-center gap-1.5">
                                                                <Box className="w-2.5 h-2.5 text-muted-foreground" />
                                                                <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-tight">
                                                                    {as.modulo?.nombre || 'Módulo'}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
                                                        <button
                                                            onClick={() => {
                                                                setNewAsignacion({ ...newAsignacion, moduloId: as.moduloId, turnoId: as.turnoId });
                                                                toast.info('Reasignando', { description: as.modulo?.nombre });
                                                            }}
                                                            className="p-2 rounded-lg hover:bg-primary hover:text-white transition-colors text-muted-foreground"
                                                        >
                                                            <RefreshCw className="w-3.5 h-3.5" />
                                                        </button>
                                                        <button
                                                            onClick={() => handleDeleteAsignacion(as.id)}
                                                            className="p-2 rounded-lg hover:bg-rose-500 hover:text-white transition-colors text-rose-500"
                                                        >
                                                            <Trash2 className="w-3.5 h-3.5" />
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            </Modal>

            <ConfirmModal
                isOpen={confirmAction.isOpen}
                onClose={() => setConfirmAction({ ...confirmAction, isOpen: false })}
                onConfirm={confirmAction.onConfirm}
                title={confirmAction.title}
                description={confirmAction.description}
                loading={confirmAction.loading}
                variant={confirmAction.variant as any}
            />

            <InscritosModal
                isOpen={isInscritosModalOpen}
                onClose={() => setIsInscritosModalOpen(false)}
                oferta={targetInscritosOferta}
            />
        </div>
    );
}
