# Pokémon Monorepo

Pokédex interactiva con gestor de equipos y simulador de batallas, construida con **Next.js** + **Express** + **MongoDB** + **PokeAPI**.

## Arquitectura

```
Frontend (Next.js)  ───→  Backend (Express)  ───→  PokeAPI
                                │
                                ↓
                            MongoDB (Docker)
```

El frontend **nunca habla directo a PokeAPI**. Todos los datos de Pokémon pasan por el backend, que los sincroniza y almacena en MongoDB. Las únicas excepciones son el explorador de habilidades (`/abilities`) y los datos de especie/evolución, que se obtienen desde PokeAPI a través del backend como proxy.

## Stack

| Capa | Tecnología | Lenguaje |
|------|-----------|----------|
| Backend | Node.js, Express 4.19, Mongoose 8.4, Axios 1.7 | TypeScript 6 (tsx runner) |
| Frontend | Next.js 16, React 19, App Router | JavaScript (JSX) |
| BD | MongoDB 7 (Docker) | |
| API externa | [PokeAPI](https://pokeapi.co/) | |

## Instalación

```bash
docker compose up -d                                    # MongoDB
cd backend && cp .env.example .env && npm install && npm run dev    # :3001
cd backend && npm run typecheck                         # Type checking (opcional)
cd frontend && cp .env.example .env.local && npm install && npm run dev  # :3000
```

| Servicio | URL |
|----------|-----|
| Frontend | http://localhost:3000 |
| Backend | http://localhost:3001 |
| MongoDB | mongodb://localhost:27017 |

## Documentación Swagger

La API tiene documentación interactiva generada con **Swagger UI** (OpenAPI 3.0).  
Una vez que el backend esté corriendo, ingresá a:

👉 **http://localhost:3001/api/docs**

Ahí vas a encontrar todos los endpoints documentados con schemas, ejemplos de respuesta y la posibilidad de probar cada uno directamente desde el browser.

## Cómo funciona la API

### Flujo de datos

1. **Sincronización** — `POST /api/pokemon/sync` fetchea todos los Pokémon desde PokeAPI en lotes de 50 requests concurrentes (`Promise.all`), los transforma a `{ pokemonId, name, types: string join, rawData }` y los guarda en MongoDB con `bulkWrite` + `upsert` (colección `externaldatas`).
2. **Consulta** — Todas las operaciones de lectura (`GET /api/pokemon`) consultan MongoDB, no PokeAPI. Una vez sincronizado, el sistema funciona sin depender de la API externa.
3. **Pokémon custom** — Se crean via `POST /api/pokemon` con ID auto-incremental desde 100000, permitiendo crear Pokémon originales además de los sincronizados.
4. **Especie y evolución** — Se obtienen desde PokeAPI usando el backend como proxy (`GET /api/pokemon/:id/species` y `GET /api/pokemon/:id/evolution`), parseando la URL de species desde el `rawData` almacenado.
5. **Equipos** — Se gestionan via `/api/teams` con `pokemonIds` (array de strings, máx 6). Los datos de Pokémon se resuelven manualmente en el controlador (sin Mongoose populate).
6. **Habilidades** — El explorador de habilidades (`/abilities`) fetchea directo de PokeAPI, no pasa por el backend.
7. **Batalla** — Usa `lib/battle.js` con fórmula de daño Gen V+.

### Rate limiting

Todas las rutas `/api/*` tienen un límite de **200 requests cada 15 minutos** por IP.

### CORS

Configurable via `CORS_ORIGIN` en `.env` (múltiples orígenes separados por coma, por defecto `http://localhost:3000`).

## API Endpoints

### Pokémon

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/pokemon` | Lista paginada (`search`, `type`, `ids`, `page`, `limit`, `sort`) |
| GET | `/api/pokemon/random` | Pokémon aleatorio (MongoDB random skip) |
| GET | `/api/pokemon/:id` | Detalle con `prevPokemon` / `nextPokemon` (también busca por nombre) |
| GET | `/api/pokemon/:id/species` | Datos de especie desde PokeAPI (proxy) |
| GET | `/api/pokemon/:id/evolution` | Cadena evolutiva desde PokeAPI (proxy) |
| POST | `/api/pokemon/sync` | Sincronizar desde PokeAPI (lotes 50 concurrentes, upsert) |
| POST | `/api/pokemon` | Crear Pokémon custom (ID auto-incremental desde 100000) |
| PUT | `/api/pokemon/:id` | Actualizar Pokémon (campos parciales) |
| DELETE | `/api/pokemon` | Eliminar TODOS los Pokémon |
| DELETE | `/api/pokemon/:id` | Eliminar un Pokémon por ID |

### Teams

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/teams` | Listar equipos con `pokemonData` poblados |
| POST | `/api/teams` | Crear equipo `{ name, pokemonIds: [] }` (máx 6) |
| GET | `/api/teams/:id` | Equipo + `pokemonData` poblados |
| PUT | `/api/teams/:id` | Actualizar equipo (name y/o pokemonIds) |
| DELETE | `/api/teams/:id` | Eliminar equipo |

### Otros

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/docs` | Documentación Swagger UI interactiva |
| GET | `/api/health` | `{ status: 'ok', timestamp }` |

## Estructura del proyecto

```
.
├── AGENTS.md                    # Contexto para agentes opencode
├── opencode.json                # Config de opencode (skills auto-detect)
├── docker-compose.yml           # MongoDB 7 container
├── .gitignore
├── .vscode/
│   └── settings.json            # Tema rojo en activityBar/titleBar
├── .opencode/
│   └── skills/
│       ├── backend-pro/
│       │   └── SKILL.md         # Skill backend (automático en backend/)
│       └── frontend-pro/
│           └── SKILL.md         # Skill frontend (automático en frontend/)
│
├── backend/                     # Express API (puerto 3001)
│   ├── .env / .env.example
│   ├── package.json             # type: "module"
│   ├── tsconfig.json            # target ES2022, strict, noEmit, sourceMap
│   ├── scripts/                 # Vacío
│   └── src/
│       ├── index.ts             # dotenv + connectDB + listen
│       ├── app.ts               # CORS, rate-limit (200/15min), rutas, error handler
│       ├── config/
│       │   ├── db.ts            # Conexión Mongoose (MONGO_URI)
│       │   └── swagger.ts       # OpenAPI 3.0 spec inline (Swagger UI en /api/docs)
│       ├── models/
│       │   ├── Pokemon.ts       # pokemonId (único), name, types, rawData, timestamps
│       │   └── Team.ts          # name, pokemonIds[], timestamps
│       ├── controllers/
│       │   ├── pokemon.controller.ts   # CRUD + sync + species/evolution + random
│       │   └── team.controller.ts      # CRUD con pokemonData poblados manualmente
│       ├── routes/
│       │   ├── pokemon.routes.ts
│       │   └── team.routes.ts
│       ├── middleware/
│       │   └── validate.ts      # name requerido, types[] no vacío, max 40 chars
│       ├── services/
│       │   └── pokeapi.service.ts   # Batch 50 concurrentes, upsert via controller
│       ├── types/
│       │   ├── index.ts         # IPokemon, ITeam, CreatePokemonBody, PokemonRawData, etc.
│       │   └── express.d.ts     # Declaración de módulo Express (placeholder)
│       └── utils/
│           └── asyncHandler.ts  # Wrapper para controladores async
│
└── frontend/                    # Next.js App Router (puerto 3000)
    ├── .env / .env.example
    ├── package.json
    ├── next.config.mjs          # remotePatterns para PokeAPI sprites
    ├── public/
    │   └── favicon.svg
    ├── services/
    │   └── backendApi.js        # Cliente HTTP con fetch nativo
    ├── lib/
    │   ├── constants.js         # TYPE_COLORS, TYPE_CHART, STATS_META, calcTeamWeaknesses, debounce
    │   └── battle.js            # Motor de batalla Gen V+
    ├── app/
    │   ├── globals.css          # Tema oscuro/claro con variables CSS (5480 líneas)
    │   ├── layout.jsx           # Root layout, nav, ToastProvider, ScrollToTop, theme injection
    │   ├── page.jsx             # <PokemonList/> + <PokemonOfTheDay/> con Suspense
    │   ├── error.jsx            # ErrorBoundary con botón "Try again"
    │   ├── not-found.jsx        # Página 404 "Wild page fled!"
    │   ├── pokemon/[id]/page.jsx
    │   ├── teams/page.jsx
    │   ├── teams/[id]/page.jsx
    │   ├── abilities/page.jsx
    │   ├── battle/page.jsx
    │   ├── compare/page.jsx
    │   ├── trainer-card/page.jsx
    │   └── pokedex-book/page.jsx
    └── components/
        ├── PokemonList.jsx      # Grid con search, type filter, sort, paginación, favoritos
        ├── PokemonSprite.jsx    # next/image con fallback "?"
        ├── PokemonFormModal.jsx # Crear/editar Pokémon con todos los campos + stats
        ├── PokemonOfTheDay.jsx  # Pokémon aleatorio del día
        ├── TeamModal.jsx        # Construir equipo con search + roster + random
        ├── TeamRoster.jsx       # 6 slots drag & drop
        ├── TeamCard.jsx         # Preview de equipo en lista
        ├── NavBar.jsx           # Nav glass flotante con hamburguesa
        ├── NavFavCount.jsx      # Contador de favoritos (polling 1.5s)
        ├── ThemeToggle.jsx      # Sol/luna, localStorage pokemon-theme
        ├── ScrollToTop.jsx      # Botón flotante tras 600px
        ├── Toast.jsx            # Context + Provider, auto-dismiss 3.5s
        ├── ConfirmModal.jsx     # Hook useConfirm → [modal, confirm]
        ├── RadarChart.jsx       # SVG radar 6 stats
        ├── CompareRadar.jsx     # SVG dual-overlay red/blue
        ├── SpeciesInfo.jsx      # Flavor text + genus desde PokeAPI
        ├── EvolutionChain.jsx   # Árbol evolutivo con sprites
        └── MoveList.jsx         # Movimientos agrupados con búsqueda
```

## Variables de entorno

**Backend** (`backend/.env`):
```
PORT=3001
MONGO_URI=mongodb://localhost:27017/external_api_db
EXTERNAL_API_URL=https://pokeapi.co/api/v2/pokemon?limit=2000
CORS_ORIGIN=http://localhost:3000          # Múltiples orígenes separados por coma
```

**Frontend** (`frontend/.env.local`):
```
NEXT_PUBLIC_BACKEND_URL=http://localhost:3001
```

## Skills de opencode

El proyecto incluye dos skills para opencode con activación automática por carpeta:

| Skill | Archivo | Activación |
|-------|---------|-----------|
| `backend-pro` | `.opencode/skills/backend-pro/SKILL.md` | Automática en `backend/**` + manual |
| `frontend-pro` | `.opencode/skills/frontend-pro/SKILL.md` | Automática en `frontend/**` + manual |

## Funcionalidades

- **Pokémon of the Day** — carta destacada con un Pokémon aleatorio, top 3 stats y botón "Another"
- **Documentación Swagger** en `/api/docs` con todos los endpoints documentados y probables desde el browser
- **Lista paginada** (60 por página) con búsqueda, filtro por tipo múltiple, ordenación por #/nombre, favoritos ★
- **Detalle completo**: sprite oficial, shiny toggle con animación, stats animados con barra porcentual y radar SVG, altura, peso, habilidades, sonido (cry), navegación prev/next
- **Cadena evolutiva** — árbol visual con sprites, condiciones de evolución (nivel, objeto, intercambio, amistad)
- **Lista de movimientos** — agrupados por método de aprendizaje (level-up, egg, TM, tutor) con búsqueda y filtro por tipo
- **Datos de especie** — flavor text, género, habitat, legendary/mythical desde PokeAPI
- **Favoritos** — persistidos en localStorage (`pokemon-favs`), filtro exclusivo en lista, badge en navbar con polling cada 1.5s
- **Tema oscuro/claro** — persistencia en localStorage (`pokemon-theme`), detección de preferencia del sistema, inline script anti-flash
- **Equipos** — crear hasta 6 Pokémon con drag & drop, random team, buscador con 30 items/página, type coverage, debilidades/resistencias
- **Simulador de batallas** — selección de 2 equipos, animación por turnos, daño Gen V+ con STAB (1.5×), efectividad (0/0.5/1/2×), crítico (10%), variación (85-100%), control de velocidad 0.5×/1×/2×, pausa
- **Explorador de habilidades** — búsqueda, filtro por generación, detalle con Pokémon que la poseen (fetch directo a PokeAPI)
- **Comparador de Pokémon** — selección drag & drop con teclado, radar dual superpuesto (red/blue), stats lado a lado, veredicto por stat
- **Trainer Card** — generador con Canvas API: 8 medallas Kanto, 6 marcos, selector de Pokémon favorito, exportación a PNG
- **Pokédex Book** — vista estilo Nintendo DS con dos pantallas, D-Pad navegable, botones A/B, fade transition, paginación por generación
- **Pokémon custom** — crear/editar con stats (HP/Atk/Def/SpA/SpD/Spe 0-255), sprites, shiny, tipos, habilidades, altura, peso
- **Sincronización** desde PokeAPI en lotes de 50 requests concurrentes con `upsert`
- **Pokémon aleatorio** por ID tipo "Who's that Pokémon?" con esconder sprite y hover para revelar
- **Pokémon editables** — modal de edición con todos los campos precargados y validación
- **404** — página "Wild page fled!" con pokeball decorativa
- **Error boundary** — captura errores con botón "Try again"
- **Diseño responsive** — barra de navegación glass flotante, menú hamburguesa, scroll suave
- **Scroll to top** — botón flotante visible tras 600px de scroll
- **Toast notifications** — sistema vía Context con auto-dismiss 3.5s
- **Confirm dialogs** — hook `useConfirm()` con promesa para acciones destructivas
