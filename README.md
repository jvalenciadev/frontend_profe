# PROFE - Frontend Dashboard

Sistema de gestión administrativa para programas de formación educativa con control de accesos basado en permisos (CASL).

## 🚀 Características

- ✅ **Next.js 15** con App Router
- ✅ **TypeScript** para type safety
- ✅ **Autenticación JWT** consumida desde API
- ✅ **CASL** para control de permisos en frontend
- ✅ **Tema claro/oscuro/sistema** con persistencia
- ✅ **Diseño institucional** moderno y responsive
- ✅ **Componentes reutilizables** con sistema de diseño
- ✅ **Tailwind CSS** para estilos

## 📋 Requisitos Previos

- Node.js 18+ 
- npm o yarn
- Backend API corriendo en `http://localhost:3000`

## 🔧 Instalación

1. **Clonar el repositorio** (si aplica)

2. **Instalar dependencias:**
```bash
npm install
```

3. **Configurar variables de entorno:**

Crear archivo `.env.local`:
```env
NEXT_PUBLIC_API_URL=http://localhost:3000
NEXT_PUBLIC_APP_NAME=PROFE - Programa de Formación Educativa
```

## 🏃 Ejecución

### Modo Desarrollo
```bash
npm run dev
```

La aplicación estará disponible en `http://localhost:3000`

### Modo Producción (Docker)

```bash
# Construir y levantar el contenedor
docker-compose up --build -d
```

La aplicación estará disponible en `http://localhost:3000`

## 🐳 Docker

El proyecto está totalmente dockerizado para producción.
- **Imagen Base:** Node.js 18 Alpine (ligera)
- **Modo:** Standalone (optimizado)
- **Usuario:** nextjs (no-root para seguridad)

## 👤 Usuarios de Prueba

Según `postman_collection.json`, los usuarios de prueba son:

| Usuario   | Contraseña  | Rol                        |
| --------- | ----------- | -------------------------- |
| `admin`   | `secret123` | Super Admin (acceso total) |
| `resp_lp` | `secret123` | Responsable La Paz         |
| `fac_cb`  | `secret123` | Facilitador Cochabamba     |

## 📁 Estructura del Proyecto

```
frontend/
├── app/                      # App Router de Next.js
│   ├── dashboard/           # Rutas protegidas del dashboard
│   │   ├── layout.tsx       # Layout con sidebar y header
│   │   └── page.tsx         # Página principal del dashboard
│   ├── login/               # Página de login
│   ├── layout.tsx           # Layout raíz con providers
│   ├── page.tsx             # Página principal (landing)
│   └── globals.css          # Estilos globales y sistema de diseño
├── components/              # Componentes reutilizables
│   ├── Can.tsx             # Componente para renderizado condicional
│   ├── Header.tsx          # Header del dashboard
│   └── Sidebar.tsx         # Sidebar con navegación
├── contexts/               # Contextos de React
│   ├── AuthContext.tsx    # Estado global de autenticación
│   └── ThemeContext.tsx   # Estado global de tema
├── hooks/                  # Custom hooks
│   └── usePermissions.ts  # Hook para verificar permisos
├── lib/                    # Utilidades y configuración
│   ├── ability.ts         # Configuración de CASL
│   └── api.ts             # Cliente de Axios con interceptores
├── services/              # Servicios de API
│   └── authService.ts    # Servicio de autenticación
├── types/                 # Tipos TypeScript
│   └── index.ts          # Definiciones de tipos
├── .env.local            # Variables de entorno (crear)
├── ARCHITECTURE.md       # Documentación de arquitectura
├── FRONTEND.md          # Documentación de integración
└── postman_collection.json  # Colección de Postman
```

## 🎨 Sistema de Diseño

### Colores Principales
- **Primary**: Azul institucional (#2196f3)
- **Secondary**: Púrpura (#9c27b0)
- **Accent**: Naranja (#ff9800)

### Componentes CSS
El proyecto incluye clases utilitarias para:
- Botones: `.btn`, `.btn-primary`, `.btn-secondary`, etc.
- Inputs: `.input`, `.input-error`
- Cards: `.card`, `.card-hover`
- Badges: `.badge`, `.badge-primary`, etc.
- Tablas: `.table`

## 🔐 Control de Accesos (CASL)

### Uso del componente `<Can>`
```tsx
import { Can } from '@/components/Can';

<Can action="create" subject="Programa">
  <button>Crear Programa</button>
</Can>
```

### Uso del hook `usePermissions`
```tsx
import { usePermissions } from '@/hooks/usePermissions';

const { can, hasRole, isSuperAdmin } = usePermissions();

if (can('update', 'User')) {
  // Mostrar botón de editar
}

if (isSuperAdmin()) {
  // Mostrar opciones de super admin
}
```

### Estructura de Permisos
Los permisos vienen desde la API en el siguiente formato:
```typescript
{
  id: string;
  name: string;
  action: 'read' | 'create' | 'update' | 'delete' | 'manage';
  subject: 'User' | 'Programa' | 'Sede' | 'all';
  conditions?: object;
  fields?: string[];
}
```

## 🌐 Rutas

| Ruta           | Descripción         | Protección           |
| -------------- | ------------------- | -------------------- |
| `/`            | Landing page        | Pública              |
| `/login`       | Página de login     | Pública              |
| `/dashboard`   | Dashboard principal | Protegida            |
| `/dashboard/*` | Rutas del dashboard | Protegida + Permisos |

## 🔄 Flujo de Autenticación

1. Usuario ingresa credenciales en `/login`
2. Se hace POST a `/auth/login` → recibe `access_token`
3. Se hace GET a `/auth/profile` → recibe usuario completo con permisos
4. Se guarda token y usuario en cookies
5. Se define `ability` de CASL basado en permisos
6. Se redirige a `/dashboard`
7. Sidebar y componentes se filtran según permisos

## 📡 Consumo de API

Todos los endpoints están documentados en:
- `FRONTEND.md` - Especificación completa de campos
- `postman_collection.json` - Colección de Postman

### Ejemplo de uso:
```typescript
import api from '@/lib/api';

// GET request
const { data } = await api.get('/programas');

// POST request
const { data } = await api.post('/programas', {
  nombre: 'Nuevo Programa',
  // ...
});
```

El token JWT se añade automáticamente en los headers.

## 🎯 Próximos Pasos

Para expandir el proyecto:

1. **Crear páginas CRUD** para cada módulo:
   - `/dashboard/territorial/departamentos`
   - `/dashboard/territorial/sedes`
   - `/dashboard/academico/programas`
   - etc.

2. **Implementar servicios** para cada módulo:
   - `services/programaService.ts`
   - `services/sedeService.ts`
   - etc.

3. **Agregar validación de formularios** con:
   - React Hook Form
   - Zod para schemas

4. **Implementar tablas dinámicas** con:
   - TanStack Table
   - Paginación
   - Filtros

## 📚 Documentación de Referencia

- [Next.js Documentation](https://nextjs.org/docs)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [CASL Documentation](https://casl.js.org/v6/en/)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [Axios](https://axios-http.com/docs/intro)

## 🐛 Troubleshooting

### Error: "Cannot find module"
```bash
npm install
```

### Error: "API connection failed"
Verificar que el backend esté corriendo en `http://localhost:3000`

### Error: "Token expired"
El token se limpia automáticamente y redirige a `/login`

## 📝 Notas Importantes

- ❗ **NO hay backend en este proyecto** - solo consume APIs
- ❗ **NO se modifica la lógica del servidor** - solo frontend
- ❗ **CASL se usa SOLO en frontend** - para control de UI
- ❗ Los permisos vienen desde la API - no se hardcodean

## 📄 Licencia

Este proyecto es parte del sistema PROFE - Programa de Formación Educativa.

---

**Última actualización:** 2026-02-09
