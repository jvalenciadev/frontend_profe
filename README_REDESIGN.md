# 🎨 PROFE Frontend Premium v4.0

Bienvenido a la nueva arquitectura frontend del **Programa de Formación Especializada (PROFE)**. Este sistema ha sido rediseñado desde cero siguiendo estándares de diseño institucional premium, UX fluida y seguridad avanzada.

## 🚀 Stack Tecnológico
- **Next.js 16 (App Router)**: Máximo rendimiento y SEO.
- **TypeScript**: Tipado estricto para una base de código robusta.
- **CASL (@casl/ability)**: Autorización basada en permisos dinámica desde el backend.
- **Vanilla CSS + HSL Variables**: Control total sobre el diseño y cambios en tiempo real.
- **Framer Motion**: Micro-interacciones y transiciones premium.
- **Lucide React**: Iconografía moderna y consistente.

## 🛠️ Características Principales

### 1. Sistema de Temas Inteligente
- **Modo Claro / Oscuro / Sistema**: Cambio instantáneo con persistencia en `localStorage`.
- **Configuración en Tiempo Real**: Panel flotante para cambiar el color principal y la tipografía de todo el sistema sin recargar la página.
- **Tipografías Incluidas**: Inter, Outfit, Roboto y Poppins.

### 2. Autorización con CASL
- Control de visibilidad en el **Sidebar**, **Header** y **Acciones Rápidas**.
- Implementación de hook `useAbility()` y componente `<Can />`.
- Permisos cargados dinámicamente desde el objeto de usuario (`user.permissions`).

### 3. Dashboard Institucional
- **Sidebar Colapsable**: Maximiza el espacio de trabajo.
- **Glassmorphism**: Efectos de desenfoque y transparencia en paneles laterales y encabezados.
- **Cards Estadísticas**: Visualización de datos crítica con indicadores de tendencia.
- **Responsive Design**: Adaptado perfectamente para tablets y desktop.

## 📁 Estructura del Proyecto
- `/app`: Rutas del sistema (Login, Dashboard, Layouts).
- `/components/ui`: Componentes base reutilitables (Botones, Inputs, Cards).
- `/components/layout`: Sidebar y Header dinámicos.
- `/components/config`: Panel de personalización en tiempo real.
- `/contexts`: Estados globales de Autenticación y Temas.
- `/lib/casl`: Definición de lógica de habilidades.
- `/hooks`: Hooks personalizados para permisos y estado.

## 📖 Uso Básico de Permisos
Para ocultar un componente basado en permisos:
```tsx
import { Can } from '@/components/Can';

<Can action="create" subject="Programa">
  <Button>Crear Nuevo Programa</Button>
</Can>
```

---
**Desarrollado con Excelencia por el Equipo de Arquitectura Frontend.**
