'use client';

import { useState, useEffect } from 'react';
import { useCargos } from '@/features/cargos/application/useCargos';
import { Cargo } from '@/features/cargos/domain/Cargo';
import { CargosView } from '@/features/cargos/presentation/CargosView';

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

    return (
        <CargosView
            cargos={cargos}
            loading={loading}
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            onDelete={deleteCargo}
            isModalOpen={isModalOpen}
            setIsModalOpen={setIsModalOpen}
            formData={formData}
            setFormData={setFormData}
            editingCargo={editingCargo}
            openModalFor={handleOpenModal}
            onSubmitFromUI={handleSubmit}
        />
    );
}
