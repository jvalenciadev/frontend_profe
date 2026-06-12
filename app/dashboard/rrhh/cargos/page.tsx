'use client';

import { useState, useEffect } from 'react';
import { useCargos } from '@/features/cargos/application/useCargos';
import { Cargo } from '@/features/cargos/domain/Cargo';
import { CargosView } from '@/features/cargos/presentation/CargosView';
import { ConfirmModal } from '@/components/ConfirmModal';

// Este es el "Container Component". Aquí es donde Next.js monta la UI
// Su única responsabilidad es instanciar los Hooks (Use Cases / Application)
// y inyectarlo en el Presentador (UI View)
export default function CargosPage() {
    const { cargos, loading, loadCargos, createCargo, updateCargo, deleteCargo } = useCargos();

    // UI state that doesn't belong to the core business logic
    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingCargo, setEditingCargo] = useState<Cargo | null>(null);
    const [formData, setFormData] = useState<Partial<Cargo>>({ nombre: '', estado: 'ACTIVO' });

    // Confirm Modal State
    const [confirmDeleteState, setConfirmDeleteState] = useState<{ open: boolean; id: string }>({
        open: false,
        id: ''
    });

    useEffect(() => {
        loadCargos(''); // El estado está manejado en el hook
    }, [loadCargos]);

    const handleOpenModal = (cargo?: Cargo) => {
        if (cargo) {
            setEditingCargo(cargo);
            setFormData({ nombre: cargo.nombre, estado: cargo.estado });
        } else {
            setEditingCargo(null);
            setFormData({ nombre: '', estado: 'ACTIVO' });
        }
        setIsModalOpen(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        let success = false;
        if (editingCargo) {
            success = await updateCargo(editingCargo.id, formData);
        } else {
            success = await createCargo(formData);
        }

        if (success) {
            setIsModalOpen(false);
        }
    };

    const handleDeleteClick = (id: string) => {
        setConfirmDeleteState({ open: true, id });
    };

    const handleConfirmDelete = async () => {
        const id = confirmDeleteState.id;
        if (!id) return;
        await deleteCargo(id);
        setConfirmDeleteState({ open: false, id: '' });
    };

    return (
        <>
            <CargosView
                cargos={cargos}
                loading={loading}
                searchTerm={searchTerm}
                setSearchTerm={setSearchTerm}
                onDelete={handleDeleteClick}
                isModalOpen={isModalOpen}
                setIsModalOpen={setIsModalOpen}
                formData={formData}
                setFormData={setFormData}
                editingCargo={editingCargo}
                openModalFor={handleOpenModal}
                onSubmitFromUI={handleSubmit}
            />
            <ConfirmModal
                isOpen={confirmDeleteState.open}
                onClose={() => setConfirmDeleteState({ open: false, id: '' })}
                onConfirm={handleConfirmDelete}
                title="¿Eliminar Cargo?"
                description="¿Estás seguro de eliminar este cargo? Esta acción no se puede deshacer."
                confirmText="Sí, eliminar"
                cancelText="Cancelar"
                variant="danger"
            />
        </>
    );
}
