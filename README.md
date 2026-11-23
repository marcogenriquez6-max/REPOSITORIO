# Sistema de Repositorio Institucional UNIOR

Repositorio institucional universitario con metadatos Dublin Core.

## Stack
- **Frontend:** React + TypeScript + Tailwind CSS (Vite)
- **Backend:** Node.js + Express + TypeScript + Prisma (`/api/v1`)
- **Base de datos:** PostgreSQL 16 (citext, pg_trgm)
- **Almacenamiento:** Sistema de archivos local (`backend/storage`) con hash SHA-256

## Inicio rápido

### 1. Configuración y base de datos

Copie `.env.example` como `.env` en la raíz y complete `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB`, `JWT_SECRET`, `JWT_REFRESH_SECRET`, `CORS_ORIGIN` y `VITE_API_URL`. No se aceptan secretos de ejemplo ni contraseñas por defecto.

```bash
cp .env.example .env
# edite .env
docker compose up -d --build
```

### 2. Backend
```bash
cd backend
cp .env.example .env
npm install
npx prisma migrate dev --name init
npm run prisma:seed
npm run dev
```

Antes de ejecutar el seed, complete en `.env` los secretos `JWT_SECRET`, `JWT_REFRESH_SECRET` y las contraseñas `SEED_ADMIN_PASSWORD`, `SEED_REVIEWER_PASSWORD` y `SEED_DEPOSITOR_PASSWORD`. No se aceptan valores de ejemplo ni contraseñas por defecto.

Para generar secretos aleatorios:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

API: `http://localhost:4000/api/v1/health`

### 3. Frontend
```bash
cd frontend
npm install
npm run dev
```
App: `http://localhost:5173`

## Usuarios seed
| Rol | Email |
| --- | --- |
| ADMIN | admin@unior.edu.bo |
| REVISOR | postgrado@unior.edu.bo |
| DEPOSITANTE | biblioteca@unior.edu.bo |

Las contraseñas se leen desde `backend/.env`; no se publican credenciales por defecto.
