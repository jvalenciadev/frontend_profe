import { render, screen, waitFor } from '@testing-library/react';
import GradeReport from './GradeReport';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { aulaService } from '@/services/aulaService';

// Mock de framer-motion
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}));

// Mock del servicio de Aula
vi.mock('@/services/aulaService', () => ({
  aulaService: {
    getReporteCalificaciones: vi.fn(),
    getCursoDetalle: vi.fn(),
  },
}));

// Mock de Sonner
vi.mock('sonner', () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
  },
}));

// --- MOCK DE CONTEXTOS (HOOKS) ---
vi.mock('@/contexts/AulaContext', () => ({
  useAula: () => ({
    secondaryColor: '#1474a6',
    theme: 'light',
  }),
}));

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({
    user: { id: 'user-1', nombre: 'Juan', apellidos: 'Perez' },
  }),
}));

describe('Componente GradeReport (Pruebas Unitarias)', () => {
  const mockOnClose = vi.fn();

  const renderComponent = () => {
    return render(
      <GradeReport
        moduloId="mod-1"
        turnoId="turno-1"
        onClose={mockOnClose}
        theme="light"
        moduloNombre="Matemáticas"
        turnoNombre="Mañana"
      />
    );
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('debería mostrar el estado de carga inicialmente', () => {
    (aulaService.getReporteCalificaciones as any).mockReturnValue(new Promise(() => { }));
    renderComponent();
    expect(screen.getByText(/Generando reporte/i)).toBeDefined();
  });

  it('debería mostrar los datos del estudiante después de cargar', async () => {
    const mockReportData = {
      estudiantes: [
        { userId: '1', nombre: 'Estudiante de Prueba', total: 85, scores: {}, desglose: [], asistencia: 90 },
      ],
      headers: [],
      categorias: [
        { nombre: 'Exámenes', peso: 100 }
      ],
    };
    const mockCursoData = {
      programaDos: { tipo: { notaReprobacion: 70, notaMaxima: 100 } },
    };

    (aulaService.getReporteCalificaciones as any).mockResolvedValue(mockReportData);
    (aulaService.getCursoDetalle as any).mockResolvedValue(mockCursoData);

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Estudiante de Prueba')).toBeDefined();
    });

    expect(screen.getAllByText('85').length).toBeGreaterThan(0);
    expect(screen.getAllByText(/APROBADO/i).length).toBeGreaterThan(0);
  });

  it('debería llamar a onClose cuando se presiona el botón de cerrar', async () => {
    (aulaService.getReporteCalificaciones as any).mockResolvedValue({ estudiantes: [] });
    (aulaService.getCursoDetalle as any).mockResolvedValue({});

    renderComponent();

    // El botón tiene la clase que contiene la X (icono de lucide-react)
    // El botón es el segundo en el header después del botón de PDF
    const buttons = screen.getAllByRole('button');
    const closeButton = buttons[buttons.length - 1]; // El último botón es el de cerrar

    closeButton.click();
    expect(mockOnClose).toHaveBeenCalled();
  });
});
