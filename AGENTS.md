# Pokemon Monorepo API — Contexto para Agentes

## Stack

| Capa | Tecnología | Versión |
|------|-----------|---------|
| Backend | Node.js, Express 4.19, Mongoose 8.4, Axios 1.7 | TypeScript 6 (tsx runner) |
| Frontend | Next.js 16, React 19, App Router | JavaScript (JSX), sin TypeScript |
| Base de datos | MongoDB 7 | Docker (`docker compose up -d`) |
| API externa | PokeAPI | `https://pokeapi.co/api/v2` |
| Sin tests, sin linter, sin formateador | | |

## Estructura del monorepo

```
.
├── AGENTS.md                    # Este archivo
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

---

## API Backend — Pokémon

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

## API Backend — Teams

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/teams` | Listar equipos con `pokemonData` poblados |
| POST | `/api/teams` | Crear equipo `{ name, pokemonIds: [] }` (máx 6) |
| GET | `/api/teams/:id` | Equipo + `pokemonData` poblados |
| PUT | `/api/teams/:id` | Actualizar equipo (name y/o pokemonIds) |
| DELETE | `/api/teams/:id` | Eliminar equipo |

## Docs & Health

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/docs` | Swagger UI (tema Monokai) |
| GET | `/api/health` | `{ status: 'ok', timestamp }` |

---

## Flujo de datos

1. `POST /api/pokemon/sync` → backend fetch de PokeAPI en lotes de 50 requests concurrentes (`Promise.all`)
2. Transforma cada Pokémon a `{ pokemonId, name, types: string join, rawData }`
3. `bulkWrite` con `upsert: true` en MongoDB (colección `externaldatas`)
4. Frontend hace GET a backend (NUNCA habla directo a PokeAPI, excepto abilities)
5. Pokémon custom se crean via `POST /api/pokemon` con ID auto-incremental >= 100000
6. Equipos se gestionan via `/api/teams`, se construyen desde `TeamModal`
7. Habilidades (`/abilities`) fetchean directo de PokeAPI — no pasan por backend
8. Batalla usa `lib/battle.js` con fórmula de daño Gen V+
9. Especies y evolución se obtienen desde PokeAPI a través del backend (proxy)

---

## Variables de entorno

```bash
# backend/.env
PORT=3001
MONGO_URI=mongodb://localhost:27017/external_api_db
EXTERNAL_API_URL=https://pokeapi.co/api/v2/pokemon?limit=2000
EXTERNAL_API_KEY=
CORS_ORIGIN=http://localhost:3000          # Múltiples orígenes separados por coma

# frontend/.env.local
NEXT_PUBLIC_BACKEND_URL=http://localhost:3001
```

---

## Comandos

```bash
docker compose up -d                           # MongoDB 7
cd backend && npm install && npm run dev        # Backend :3001 (tsx watch)
cd backend && npm run typecheck                 # tsc --noEmit
cd backend && npm start                         # Producción :3001
cd frontend && npm install && npm run dev       # Frontend :3000 (next dev)
cd frontend && npm run build                    # next build
```

---

## Convenciones

### Backend (TypeScript)
- ES Modules: `import`/`export` con extensión `.js` (ej: `from './app.js'`)
- TypeScript compilado con `tsx` (sin compilación previa)
- Type checking con `tsc --noEmit`
- Controladores: `async (req, res): Promise<void>` con try/catch interno
- Requests tipadas con `TypedRequest<P, B, Q>` desde `types/index.ts`
- `asyncHandler.ts` disponible como wrapper (aunque actualmente no se usa)
- Rutas Express: orden específico (GET /random antes de GET /:id)
- Swagger spec inline en `config/swagger.ts` (no JSDoc)
- Sin populate de Mongoose — población manual en controladores
- `rawData` almacena respuesta completa de PokeAPI como `Object`

### Frontend (JavaScript/JSX)
- Todos los componentes con `'use client'`
- Sin TypeScript en frontend
- CSS vanilla con variables CSS en `globals.css` (~5480 líneas)
- `localStorage` para: favoritos (`pokemon-favs`), tema (`pokemon-theme`), última sincronización
- Data fetching con fetch nativo (no axios) via `services/backendApi.js`
- Imágenes desde `raw.githubusercontent.com/PokeAPI/sprites` con `next/image`
- Fallback de sprite: componente `PokemonSprite` muestra "?" si hay error
- Modales: escuchar tecla Escape + overlay click to close
- Toast: sistema vía Context + auto-dismiss 3.5s
- Confirm: hook `useConfirm()` devuelve `[modal, confirm]` (promesa)
- Favoritos: polling cada 1500ms en `NavFavCount`
- Tema: inline script en layout para evitar flash, key `pokemon-theme`
- `PokemonCard` usa `React.memo`
- Paginación: 60 items/page en lista, 30 en TeamModal

### Constantes y librerías
- `TYPE_COLORS`: 18 tipos con colores hex (ej: fire → `#EE8130`)
- `TYPE_CHART`: weak/resist/immune para cálculos de efectividad
- `STATS_META`: labels + colores para 6 stats
- `calcTeamWeaknesses(teamTypes)`: calcula multiplicadores de daño
- `debounce(fn, 300ms)`: utilidad estándar
- Motor de batalla (`lib/battle.js`): daño base Gen V+, STAB 1.5x, efectividad (0/0.5/1/2x), crítico 10% (1.5x), variación 85-100%, prioridad por velocidad

---

## Modelo de datos

### Pokemon
```typescript
{
  pokemonId: string,       // Único, ej: "6", "100001"
  name: string,            // Nombre del Pokémon
  types: string,           // Tipos separados por coma: "fire, flying"
  rawData: {               // Respuesta completa de PokeAPI
    id: number,
    name: string,
    height: number,        // en decímetros
    weight: number,        // en hectogramos
    base_experience: number,
    types: [{ type: { name: string } }],
    stats: [{ base_stat: number, stat: { name: string }, effort: number }],
    abilities: [{ ability: { name: string }, is_hidden: boolean, slot: number }],
    sprites: {
      front_default: string,
      front_shiny: string,
      other: { 'official-artwork': { front_default: string, front_shiny: string } }
    },
    species?: { url: string },
    cries?: Record<string, unknown>
  },
  createdAt: Date,
  updatedAt: Date
}
```
- Colección MongoDB: `externaldatas` (backward compatibility)
- Índices: `name: 1`, `types: 1`, `createdAt: -1`

### Team
```typescript
{
  name: string,            // Ej: "Mi equipo"
  pokemonIds: string[],    // Array de IDs referenciando Pokemon.pokemonId (máx 6)
  createdAt: Date,
  updatedAt: Date
}
```
- Población manual vía controlador (NO Mongoose populate)
- Índices: `name: 1`, `updatedAt: -1`

---

## Skills de opencode

| Skill | Archivo | Activación |
|-------|---------|-----------|
| `backend-pro` | `.opencode/skills/backend-pro/SKILL.md` | Automática en `backend/**` + manual |
| `frontend-pro` | `.opencode/skills/frontend-pro/SKILL.md` | Automática en `frontend/**` + manual |

Los skills contienen instrucciones detalladas de patrones, templates y advertencias específicas para cada capa.
