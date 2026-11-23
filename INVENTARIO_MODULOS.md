# Inventario de Módulos — Repositorio Institucional UNIOR

Fecha: 2026-11-23

## 1. Backend

Base: Express 4 + TypeScript + Prisma 5 + PostgreSQL 16. Prefijo API: `/api/v1`.

| Módulo | Responsabilidad | Rutas principales |
|---|---|---|
| `config` | Entorno, Prisma, multer, seguridad JWT | — |
| `middlewares` | Auth, roles/ámbito, validación Zod, errores, rate limit, request-id | — |
| `auth` | Login, refresh, me, logout | `POST /auth/login`, `/auth/refresh`, `/auth/logout`, `GET /auth/me` |
| `users` | Altas, edición, asignación de facultades | `GET/POST /users`, `PATCH /users/:id`, `PUT /users/:id/faculties` |
| `communities/collections` | Taxonomía institucional | `GET /communities`, `GET /collections`, `POST /collections` |
| `items` | Depósitos, metadatos, búsqueda, asignación de revisor | `GET/POST /items`, `PATCH /items/:id/metadata`, `PATCH /items/:id/assign-reviewer` |
| `files` | Upload, firma PDF, preview, descarga controlada | `POST /files/items/:itemId`, `GET /files/:id/preview`, `GET /files/:id/download` |
| `workflow` | Transiciones, checks automáticos, logs, embargo | `POST /workflow/items/:id/submit` |
| `review` | Bandeja, checks, observaciones, decisiones, historial | `GET /review/inbox`, `/review/items/:id/*`, `PATCH /review/observations/:id/*` |
| `discovery` | Búsqueda, facets | `GET /discovery/search`, `GET /discovery/facets` |
| `stats` | Métricas públicas y administrativas | `GET /stats/overview`, `GET /stats/public` |
| `admin` | Stats y operaciones administrativas | `GET /admin/stats` |

## 2. Frontend

Base: React 18 + TypeScript + Vite 8 + React Router 7 + TanStack Query + Tailwind + React Hook Form + Zod.

### Páginas
- `HomePage`: portada institucional.
- `CommunitiesPage`, `CommunityDetailPage`, `CollectionDetailPage`: navegación por taxonomía.
- `SearchPage`: búsqueda con filtros y facets.
- `ItemDetailPage`: detalle, metadatos y visor PDF.
- `LoginPage`, `RegisterPage`: autenticación.
- `dashboard/DepositPage`, `MyDepositsPage`, `EditDepositPanel`: depósitos y correcciones.
- `dashboard/ReviewInboxPage`, `ReviewDetailPage`: bandeja y revisión.
- `dashboard/AdminPage`: métricas, asignación de revisores, ámbito, usuarios y colecciones.
- `HandleRedirect`: resolver de handles legacy.

### Componentes clave
- `layout/Sidebar`, `layout/Header`, `layout/Footer`.
- `ui/Modal`, `Toast`, `Skeleton`, `EmptyState`, `StatusBadge`.
- `dashboard/UploadWizard`, `MetadataForm`, `EditDepositPanel`.
- `review/PdfViewer`, `ChecklistPanel`, `ObservationList`, `DecisionBar`.
- `search/SearchFilters`, `ItemCard`.

### Servicios API
- `api/axios.ts`: interceptors de refresh, eventos `unior:auth-refreshed` y `unior:session-expired`.
- `api/services.ts`: contratos tipados para admin, auth, catalog, items, review, users, deposit.
- `context/AuthContext.tsx`: hidratación `/auth/me`, logout remoto.

## 3. Datos

Modelos Prisma: `User`, `UserFaculty`, `Community`, `Collection`, `Item`, `MetadataValue`, `Bitstream`, `ReviewCheck`, `Observation`, `WorkflowLog`.

Enums: `Role`, `ItemStatus`, `WorkflowAction`, `ObservationType`, `ObservationStatus`, `BitstreamBundle`.

Índices relevantes: búsqueda trigram, año, estado+fecha, metadatos por elemento/qualifier/valor, bitstreams por ítem, observaciones por estado, logs por ítem.

## 4. Infraestructura

- `docker-compose.yml`: DB + backend + frontend con healthchecks, restart y límites.
- `backend/Dockerfile`: multi-stage, Prisma generate, `npm prune --omit=dev`, entrypoint no-root.
- `frontend/Dockerfile`: build + nginx con CSP y caché.
- `fly.toml`: release command, healthcheck, volumen `unior_storage`.
- `netlify.toml`: SPA redirects y headers.
- `.github/workflows/ci.yml`: build/test/audit/Docker.

## 5. Deuda técnica priorizada

1. Unificar almacenamiento de binarios en object storage.
2. Reemplazar `localStorage` por cookies httpOnly enfrontend.
3. Fijar `connect-src` de CSP al dominio real de API.
4. Añadir monitoreo/alertas y trazas distribuidas.
5. Programar backups offsite y prueba periódica de restauración.
