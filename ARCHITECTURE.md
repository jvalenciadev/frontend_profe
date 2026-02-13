# Arquitectura Técnica - Frontend PROFE

## 📐 Visión General

El frontend del sistema PROFE está diseñado como una **Single Page Application (SPA)** moderna con arquitectura basada en componentes, siguiendo principios de **separación de responsabilidades** y **reutilización de código**.

## 🏗️ Capas de la Aplicación

```
┌─────────────────────────────────────────────┐
│           PRESENTATION LAYER                │
│  (Pages, Components, Layouts)               │
├─────────────────────────────────────────────┤
│           BUSINESS LOGIC LAYER              │
│  (Hooks, Context, Permission Logic)         │
├─────────────────────────────────────────────┤
│           DATA ACCESS LAYER                 │
│  (Services, API Client, Interceptors)       │
├─────────────────────────────────────────────┤
│           EXTERNAL SERVICES                 │
│  (Backend API, Authentication Server)       │
└─────────────────────────────────────────────┘
```

## 🔐 Sistema de Autenticación y Autorización

### Flujo de Autenticación

```
┌──────────┐      ┌──────────┐      ┌──────────┐      ┌──────────┐
│  Login   │─────▶│   API    │─────▶│   JWT    │─────▶│Dashboard │
│  Page    │      │ /auth/   │      │  Token   │      │  Layout  │
│          │      │  login   │      │  Storage │      │          │
└──────────┘      └──────────┘      └──────────┘      └──────────┘
                                           │
                                           ▼
                                    ┌──────────┐
                                    │  Profile │
                                    │   API    │
                                    │ /auth/   │
                                    │ profile  │
                                    └──────────┘
```

### Estructura de Permisos

El sistema implementa **PBAC (Permission-Based Access Control)** con la siguiente jerarquía:

```typescript
User
├── roles: string[]              // ['ADMINISTRADOR_SISTEMA', 'RESPONSABLE_DEPARTAMENTO']
├── permissions: Permission[]    // Lista de permisos directos
└── tenant?: Tenant             // Contexto organizacional

Permission
├── action: string              // 'read', 'create', 'update', 'delete', 'manage'
├── subject: string             // 'User', 'Programa', 'Sede', etc.
└── conditions?: object         // Condiciones opcionales (ej: tenantId)
```

### Verificación de Permisos

```typescript
// Nivel 1: ADMINISTRADOR_SISTEMA bypass
if (user.roles.includes('ADMINISTRADOR_SISTEMA')) return true;

// Nivel 2: Verificación de permisos
user.permissions.some(perm => 
  (perm.action === action || perm.action === 'manage') &&
  (perm.subject === subject || perm.subject === 'all')
)
```

## 🎯 Componentes Clave

### 1. AuthContext

**Responsabilidad:** Gestión global del estado de autenticación

```typescript
interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (token: string, user: User) => void;
  logout: () => void;
  checkPermission: (action: string, subject: string) => boolean;
}
```

**Características:**
- Persistencia en localStorage
- Manejo de sesión expirada
- Redirección automática

### 2. ThemeContext

**Responsabilidad:** Gestión de temas (claro/oscuro/sistema)

```typescript
interface ThemeContextType {
  theme: 'light' | 'dark' | 'system';
  setTheme: (theme: Theme) => void;
  effectiveTheme: 'light' | 'dark';
}
```

**Características:**
- Detección automática del tema del sistema
- Persistencia de preferencias
- Aplicación dinámica de CSS variables

### 3. Can Component

**Responsabilidad:** Renderizado condicional basado en permisos

```typescript
<Can action="create" subject="Programa">
  <CreateButton />
</Can>
```

**Ventajas:**
- Declarativo y legible
- Reutilizable
- Soporte para fallback

### 4. usePermissions Hook

**Responsabilidad:** Lógica de permisos en componentes

```typescript
const { can, hasRole, isSuperAdmin } = usePermissions();
```

**Métodos:**
- `can(action, subject)` - Verificación básica
- `canAll(actions, subject)` - Verificación múltiple (AND)
- `canAny(actions, subject)` - Verificación múltiple (OR)
- `hasRole(role)` - Verificación de rol
- `isSuperAdmin()` - Verificación de super admin

## 🌐 Gestión de Estado

### Estado Global (Context API)

```
AuthContext
├── user
├── token
├── isAuthenticated
└── isLoading

ThemeContext
├── theme
└── effectiveTheme
```

### Estado Local (useState)

Usado en componentes individuales para:
- Formularios
- Modales
- Estados de carga
- Errores temporales

## 📡 Comunicación con Backend

### Axios Instance (api.ts)

```typescript
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  headers: { 'Content-Type': 'application/json' }
});
```

### Interceptores

**Request Interceptor:**
```typescript
// Añade JWT token a todas las peticiones
config.headers.Authorization = `Bearer ${token}`;
```

**Response Interceptor:**
```typescript
// Maneja errores 401 (sesión expirada)
if (error.response?.status === 401) {
  // Limpiar sesión y redirigir a login
}
```

### Servicios

```typescript
authService
├── login(credentials)
├── getProfile()
└── logout()

// Futuros servicios:
programaService
sedeService
userService
```

## 🎨 Sistema de Diseño

### Variables CSS (Design Tokens)

```css
:root {
  /* Colors */
  --primary-600: #0277c7;
  --accent-500: #f43f5e;
  --neutral-900: #0f172a;
  
  /* Spacing */
  --sidebar-width: 260px;
  --header-height: 64px;
  
  /* Effects */
  --shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.1);
  --radius-lg: 0.75rem;
  --transition-speed: 0.2s;
}
```

### Temas

```css
[data-theme='dark'] {
  --bg-main: var(--neutral-900);
  --text-main: var(--neutral-50);
}
```

## 🔄 Flujo de Datos

### Login Flow

```
1. Usuario ingresa credenciales
   ↓
2. LoginPage → authService.login()
   ↓
3. API Response → { access_token, user }
   ↓
4. AuthContext.login(token, user)
   ↓
5. localStorage.setItem('token', token)
   ↓
6. navigate('/dashboard')
   ↓
7. DashboardLayout verifica isAuthenticated
   ↓
8. Sidebar filtra menú según permisos
   ↓
9. Dashboard renderiza con <Can /> components
```

### Permission Check Flow

```
Component necesita verificar permiso
   ↓
usePermissions() o <Can />
   ↓
AuthContext.checkPermission(action, subject)
   ↓
1. ¿Es ADMINISTRADOR_SISTEMA? → true
2. ¿Tiene permiso directo? → true/false
   ↓
Renderizar o ocultar UI
```

## 🚀 Optimizaciones

### Code Splitting

```typescript
// Lazy loading de servicios
const { authService } = await import('../services/authService');
```

### Memoization

```typescript
// Evitar re-renders innecesarios
const filteredMenu = useMemo(() => 
  menuItems.filter(item => checkPermission(...))
, [user]);
```

### Interceptores Eficientes

- Token añadido automáticamente
- Manejo centralizado de errores
- Retry logic (futuro)

## 📦 Build y Deployment

### Desarrollo

```bash
npm run dev
# Vite dev server con HMR
# Puerto: 3000
```

### Producción

```bash
npm run build
# 1. TypeScript compilation (tsc)
# 2. Vite build (optimización, minificación)
# Output: /dist
```

### Docker

**Multi-stage build:**
1. Build stage (Node.js)
2. Production stage (Nginx)

```dockerfile
FROM node:20-alpine as build-stage
# ... build process

FROM nginx:stable-alpine as production-stage
# ... serve static files
```

## 🔒 Seguridad

### Implementaciones

1. **JWT Storage:** localStorage (considerar httpOnly cookies en producción)
2. **XSS Protection:** React escapa automáticamente
3. **CSRF:** No aplica (stateless JWT)
4. **Secure Headers:** Configurados en Nginx
5. **HTTPS:** Requerido en producción

### Mejores Prácticas

- ✅ Validación de inputs
- ✅ Sanitización de datos
- ✅ Manejo seguro de tokens
- ✅ Timeout de sesión
- ✅ Logout seguro

## 📊 Métricas y Monitoreo

### Performance

- **Bundle Size:** ~330 KB (gzipped: ~102 KB)
- **First Contentful Paint:** < 1.5s
- **Time to Interactive:** < 3s

### Futuras Implementaciones

- [ ] Error tracking (Sentry)
- [ ] Analytics (Google Analytics / Mixpanel)
- [ ] Performance monitoring (Web Vitals)

## 🧪 Testing Strategy (Futuro)

```
Unit Tests (Jest + React Testing Library)
├── Hooks
├── Components
└── Utils

Integration Tests
├── Auth flow
├── Permission checks
└── API integration

E2E Tests (Playwright)
├── Login flow
├── Dashboard navigation
└── CRUD operations
```

## 📚 Referencias

- [React Documentation](https://react.dev)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Vite Guide](https://vitejs.dev/guide/)
- [Axios Documentation](https://axios-http.com/docs/intro)
- [CASL (Permission Library Reference)](https://casl.js.org/)

---

**Última actualización:** 2024-02-09
