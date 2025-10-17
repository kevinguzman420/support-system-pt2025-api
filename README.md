# 🎫 Support System API - Prueba Técnica 2025

API RESTful para sistema de gestión de tickets de soporte técnico, construida con Next.js 15, Prisma ORM y autenticación JWT.

## 🌐 Despliegue en Producción

**URL de Producción (API, no posee interfaz):** [https://support-system-pt2025-api.vercel.app]

## 🏗️ Arquitectura del Sistema

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLIENTE (React)                          │
│              http://localhost:5173 (Desarrollo)                 │
└───────────────────────────┬─────────────────────────────────────┘
                            │
                            │ HTTP/HTTPS + CORS
                            │ JWT Token (Bearer/Cookie)
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                    API REST (Next.js 15)                        │
│                  http://localhost:3000/api                      │
├─────────────────────────────────────────────────────────────────┤
│  Middleware & Helpers                                           │
│  ├─ CORS Configuration (/src/lib/cors.ts)                       │
│  ├─ JWT Verification (/src/lib/auth.ts)                         │
│  └─ Prisma Client (/src/lib/prisma.ts)                          │
├─────────────────────────────────────────────────────────────────┤
│  API Routes (App Router)                                        │
│  ├─ /api/auth/*           → Autenticación                       │
│  ├─ /api/private/requests → Gestión de Solicitudes              │
│  ├─ /api/private/responses → Gestión de Respuestas              │
│  ├─ /api/private/me       → Perfil de Usuario                   │
│  └─ /api/private/admin/*  → Administración de Usuarios          │
└───────────────────────────┬─────────────────────────────────────┘
                            │
                            │ Prisma ORM
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                   Base de Datos (SQLite)                        │
│                    /prisma/dev.db                               │
├─────────────────────────────────────────────────────────────────┤
│  Tablas:                                                        │
│  ├─ users      → Usuarios del sistema                           │
│  ├─ requests   → Solicitudes de soporte                         │
│  └─ responses  → Respuestas a solicitudes                       │
└─────────────────────────────────────────────────────────────────┘

Roles de Usuario:
├─ ADMIN    → Acceso total al sistema
├─ SUPPORT  → Gestión de tickets y respuestas
└─ CLIENT   → Crear y ver sus propias solicitudes
```

## 🚀 Instalación y Configuración

### Prerrequisitos

- **Node.js** >= 18.x
- De preferencia usar: **pnpm**

### Pasos de Instalación

1. **Clonar el repositorio**

```bash
git clone <https://github.com/kevinguzman420/support-system-pt2025-api>
cd pt2025-api
```

2. **Instalar dependencias**

```bash
pnpm install
```

3. **Configurar variables de entorno**

Crear archivo `.env` en la raíz del proyecto:

```env
# Database
DATABASE_URL="file:./dev.db"

# JWT Secret (cambiar en producción)
JWT_SECRET="your-super-secret-jwt-key-change-in-production"

# Node Environment
NODE_ENV="development"
```

4. **Generar Prisma Client**

```bash
npx prisma generate
```

5. **Ejecutar migraciones de base de datos**

```bash
npx prisma migrate dev --name init
```

6. **Poblar base de datos con datos de prueba (seed), aunque no es necesario**

```bash
npx prisma db seed
```

Este comando creará 3 usuarios de prueba:

| Email               | Password | Rol     | Activo |
| ------------------- | -------- | ------- | ------ |
| admin@example.com   | demo123  | ADMIN   | ✅     |
| support@example.com | demo123  | SUPPORT | ✅     |
| client@example.com  | demo123  | CLIENT  | ✅     |

7. **Iniciar el servidor de desarrollo**

```bash
pnpm dev
```

La API estará disponible en: **http://localhost:3000**

## 📋 Endpoints Disponibles

### 🔐 Autenticación

| Método | Endpoint           | Descripción              | Autenticación |
| ------ | ------------------ | ------------------------ | ------------- |
| `POST` | `/api/auth/login`  | Iniciar sesión           | ❌            |
| `POST` | `/api/auth/logout` | Cerrar sesión            | ✅            |
| `GET`  | `/api/auth/login`  | Información del endpoint | ❌            |

**Ejemplo Login:**

```json
POST /api/auth/login
{
  "email": "admin@example.com",
  "password": "demo123"
}

Respuesta:
{
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": "...",
    "email": "admin@example.com",
    "name": "Admin User",
    "role": "ADMIN",
    "createdAt": "...",
    "requestsCount": 0
  }
}
```

### 👤 Perfil de Usuario

| Método | Endpoint          | Descripción                       | Roles |
| ------ | ----------------- | --------------------------------- | ----- |
| `GET`  | `/api/private/me` | Obtener datos del usuario actual  | Todos |
| `PUT`  | `/api/private/me` | Actualizar contraseña del usuario | Todos |

**Ejemplo Cambiar Contraseña:**

```json
PUT /api/private/me
Headers: { "Authorization": "Bearer <token>" }
{
  "newPassword": "nuevaContraseña123"
}
```

### 🎫 Gestión de Solicitudes (Requests)

| Método | Endpoint                | Descripción           | Roles   |
| ------ | ----------------------- | --------------------- | ------- |
| `GET`  | `/api/private/requests` | Listar solicitudes    | Todos\* |
| `POST` | `/api/private/requests` | Crear nueva solicitud | Todos   |

\*Los CLIENT solo ven sus propias solicitudes, ADMIN/SUPPORT ven todas.

**Ejemplo Crear Solicitud:**

```json
POST /api/private/requests
Headers: { "Authorization": "Bearer <token>" }
{
  "title": "Problema con el sistema",
  "description": "No puedo acceder a mi cuenta",
  "priority": "HIGH",
  "category": "ACCESS_ISSUE"
}

Valores permitidos:
- priority: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL"
- category: "TECHNICAL_SUPPORT" | "GENERAL_INQUIRY" | "ACCESS_ISSUE" | "BILLING" | "OTHER"
- status: "PENDING" | "IN_PROGRESS" | "RESOLVED" | "CLOSED" (automático: PENDING)
```

### 💬 Gestión de Respuestas (Responses)

| Método | Endpoint                               | Descripción                            | Roles     |
| ------ | -------------------------------------- | -------------------------------------- | --------- |
| `GET`  | `/api/private/responses`               | Listar respuestas                      | Todos\*   |
| `GET`  | `/api/private/responses?requestId=xxx` | Respuestas de una solicitud específica | Todos\*   |
| `POST` | `/api/private/responses`               | Crear respuesta                        | Todos\*\* |

\*Los CLIENT solo ven respuestas de sus propias solicitudes.  
\*\*Los CLIENT solo pueden responder a sus propias solicitudes.

**Ejemplo Crear Respuesta:**

```json
POST /api/private/responses
Headers: { "Authorization": "Bearer <token>" }
{
  "requestId": "clxxx...",
  "content": "Hemos revisado tu solicitud y...",
  "isAutomatic": false
}
```

### 👥 Administración de Usuarios (Solo ADMIN)

| Método  | Endpoint                           | Descripción               | Roles |
| ------- | ---------------------------------- | ------------------------- | ----- |
| `GET`   | `/api/private/admin/users`         | Listar todos los usuarios | ADMIN |
| `POST`  | `/api/private/admin/users`         | Crear nuevo usuario       | ADMIN |
| `PATCH` | `/api/private/admin/users/:userId` | Actualizar usuario        | ADMIN |

**Ejemplo Crear Usuario:**

```json
POST /api/private/admin/users
Headers: { "Authorization": "Bearer <token>" }
{
  "email": "nuevo@example.com",
  "password": "password123",
  "name": "Nuevo Usuario",
  "role": "SUPPORT",
  "active": true
}

Roles permitidos: "ADMIN" | "SUPPORT" | "CLIENT"
```

**Ejemplo Actualizar Usuario:**

```json
PATCH /api/private/admin/users/clxxx...
Headers: { "Authorization": "Bearer <token>" }
{
  "name": "Nombre Actualizado",
  "role": "ADMIN",
  "active": false
}
```

## 🔑 Autenticación

La API utiliza **JWT (JSON Web Tokens)** con estrategia dual:

1. **Cookie HttpOnly** (`token`) - Seguridad adicional
2. **Header Authorization** - `Authorization: Bearer <token>`

El token expira en **24 horas**.

### Ejemplo de petición autenticada:

```javascript
fetch('http://localhost:3000/api/private/requests', {
  method: 'GET',
  headers: {
    Authorization: 'Bearer eyJhbGciOiJIUzI1NiIs...',
    'Content-Type': 'application/json',
  },
  credentials: 'include', // Para cookies
})
```

## 🗃️ Modelo de Datos

### User (Usuario)

```typescript
{
  id: string
  email: string (único)
  password: string (hasheado con bcrypt)
  name: string
  role: "ADMIN" | "SUPPORT" | "CLIENT"
  active: boolean
  createdAt: DateTime
  updatedAt: DateTime
}
```

### Request (Solicitud)

```typescript
{
  id: string
  title: string
  description: string
  status: 'PENDING' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED'
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
  category: 'TECHNICAL_SUPPORT' |
    'GENERAL_INQUIRY' |
    'ACCESS_ISSUE' |
    'BILLING' |
    'OTHER'
  userId: string
  createdAt: DateTime
  updatedAt: DateTime
}
```

### Response (Respuesta)

```typescript
{
  id: string
  content: string
  isAutomatic: boolean
  requestId: string
  userId: string
  createdAt: DateTime
}
```

## 🛠️ Tecnologías Utilizadas

- **Next.js 15.5.5** - Framework React con App Router
- **Prisma ORM** - ORM moderno para TypeScript
- **SQLite** - Base de datos (desarrollo)
- **JWT (jsonwebtoken)** - Autenticación
- **bcryptjs** - Hash de contraseñas
- **TypeScript** - Tipado estático
- **CORS** - Configuración para peticiones cross-origin

## 📁 Estructura del Proyecto

```
pt2025-api/
├── prisma/
│   ├── schema.prisma        # Modelo de datos
│   ├── seed.ts              # Datos de prueba
│   └── dev.db               # Base de datos SQLite
├── src/
│   ├── app/
│   │   └── api/
│   │       ├── auth/        # Endpoints de autenticación
│   │       └── private/     # Endpoints protegidos
│   │           ├── requests/   # Gestión de solicitudes
│   │           ├── responses/  # Gestión de respuestas
│   │           ├── me/         # Perfil de usuario
│   │           └── admin/      # Administración
│   └── lib/
│       ├── auth.ts          # Helper de autenticación JWT
│       ├── cors.ts          # Configuración CORS
│       └── prisma.ts        # Cliente Prisma
├── .env                     # Variables de entorno
├── package.json
└── README.md
```

## 🧪 Probar la API

### Con cURL

```bash
# Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"demo123"}'

# Crear solicitud (reemplazar <TOKEN>)
curl -X POST http://localhost:3000/api/private/requests \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <TOKEN>" \
  -d '{"title":"Test","description":"Prueba de API","priority":"MEDIUM"}'
```

### Con Postman/Insomnia

1. Importar colección de endpoints
2. Configurar variable de entorno `baseURL`: `http://localhost:3000`
3. Login y copiar el `token` de la respuesta
4. Agregar header `Authorization: Bearer <token>` en peticiones protegidas

## 📊 Base de Datos

### Ver datos con Prisma Studio

```bash
npx prisma studio
```

Se abrirá en **http://localhost:5555** una interfaz visual para explorar la base de datos.

### Resetear base de datos

```bash
npx prisma migrate reset
npx prisma db seed
```

## 🌍 CORS

La API permite peticiones desde:

- `http://localhost:3000`
- `http://localhost:3001`
- `http://localhost:5173` (Vite)
- `http://localhost:4200` (Angular)
- Cualquier puerto localhost en desarrollo

## 📝 Scripts Disponibles

```bash
pnpm dev          # Iniciar servidor de desarrollo
pnpm build        # Compilar para producción

npx prisma studio    # Abrir Prisma Studio
npx prisma generate  # Generar cliente Prisma
npx prisma migrate dev # Crear nueva migración
npx prisma db seed   # Poblar base de datos
```

## 🚀 Despliegue en Vercel

Este proyecto está optimizado para desplegarse en Vercel:

1. Push del código a GitHub
2. Conectar repositorio en [Vercel](https://vercel.com)
3. Configurar variables de entorno:
   - `DATABASE_URL`
   - `JWT_SECRET`
   - `NODE_ENV=production`
4. Deploy automático

**URL de producción:** [https://support-system-pt2025-api.vercel.app]

## 📄 Licencia

Este proyecto fue desarrollado como prueba técnica 2025 para CIFRA.

---

## 👥 Autor

**Kevin Guzmán**
- Email: kevinjguzmano777@outlook.com
- GitHub: [@kevinguzman420](https://github.com/kevinguzman420)
- Deplegado en[Vercel](https://vercel.com) 

Desarrollado con ❤️ por Kevin Guzmán (Powered by AI)
