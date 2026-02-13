# 🚀 INICIO RÁPIDO - PROFE Frontend

## ⚡ Ejecutar el Proyecto

### 1️⃣ Asegúrate que el Backend esté corriendo
```bash
# El backend debe estar en http://localhost:3000
```

### 2️⃣ Inicia el Frontend
```bash
cd frontend
npm run dev
```

### 3️⃣ Abre el Navegador
```
http://localhost:5415
```

---

## 🔑 Credenciales de Prueba

### Super Administrador (Acceso Total)
- **Usuario:** `admin`
- **Contraseña:** `secret123`

### Responsable Departamental (La Paz)
- **Usuario:** `resp_lp`
- **Contraseña:** `secret123`

### Facilitador (Cochabamba)
- **Usuario:** `fac_cb`
- **Contraseña:** `secret123`

---

## 📍 URLs Importantes

| Servicio     | URL                             |
| ------------ | ------------------------------- |
| Frontend     | http://localhost:5415           |
| Backend API  | http://localhost:3000           |
| Landing Page | http://localhost:5415/          |
| Login        | http://localhost:5415/login     |
| Dashboard    | http://localhost:5415/dashboard |

---

## 🎯 Flujo de Uso

1. **Ir a la landing page:** http://localhost:5415
2. **Click en "Iniciar Sesión"**
3. **Ingresar credenciales** (ej: admin / secret123)
4. **Explorar el dashboard** con permisos según el rol
5. **Ver ejemplo de CRUD:** Dashboard → Académico → Programas

---

## 🛠️ Comandos Útiles

```bash
# Desarrollo
npm run dev

# Build de producción
npm run build

# Ejecutar producción
npm start

# Linting
npm run lint
```

---

## 📦 Dependencias Principales

- **Next.js 16.1.6** - Framework React
- **TypeScript** - Type safety
- **Tailwind CSS** - Estilos
- **CASL** - Control de permisos
- **Axios** - Cliente HTTP
- **js-cookie** - Manejo de cookies

---

## 🔍 Verificar que Todo Funciona

### ✅ Checklist
- [ ] Backend corriendo en puerto 3000
- [ ] Frontend corriendo en puerto 5415
- [ ] Puedes acceder a http://localhost:5415
- [ ] Puedes hacer login con `admin` / `secret123`
- [ ] Ves el dashboard con estadísticas
- [ ] La sidebar muestra menús según permisos
- [ ] Puedes cambiar el tema (claro/oscuro)
- [ ] Puedes navegar a Académico → Programas

---

## 🆘 Problemas Comunes

### Error: "Cannot connect to API"
**Solución:** Verifica que el backend esté corriendo en http://localhost:3000

### Error: "Port already in use"
**Solución:** El puerto 5415 está configurado en `package.json`. Si necesitas cambiarlo, edita la línea:
```json
"dev": "next dev -p 5415"
```

### Error: "Token expired"
**Solución:** Vuelve a hacer login. El sistema redirige automáticamente.

---

## 📚 Más Información

- Ver **README.md** para documentación completa
- Ver **PROYECTO_COMPLETADO.md** para resumen del proyecto
- Ver **ARCHITECTURE.md** para arquitectura técnica
- Ver **FRONTEND.md** para integración con API

---

**¡Listo para usar! 🎉**
