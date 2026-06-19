# Pokemon Monorepo API — Contexto para Agentes

## Stack
- **Backend**: Node.js, Express 4.19, Mongoose 8.4, Axios 1.7, **TypeScript** (tsx runner), ES Modules
- **Frontend**: Next.js 16, React 19, App Router, client-side rendering
- **BD**: MongoDB 7 (Docker — `docker compose up -d`)
- **API externa**: PokeAPI (`https://pokeapi.co/api/v2`)
- **Sin TypeScript en frontend**, sin tests, sin linter/formatter

## Estructura
```
backend/                         # Express API (puerto 3001)
├── src/
│   ├── index.ts                 # Entry point (was server.js)
│   ├── app.ts                   # Express setup (CORS configurable, rate-limit 200/15min, rutas, error handler)
│   ├── config/
│   │   ├── db.ts                # Conexión Mongoose
│   │   └── swagger.ts           # OpenAPI 3.0 spec (Swagger UI en /api/docs)
│   ├── models/
│   │   ├── Pokemon.ts           # Schema: pokemonId (único), name, types, rawData, timestamps (collection: externaldatas)
│   │   └── Team.ts              # Schema: name, pokemonIds[] (strings), timestamps
│   ├── controllers/
│   │   ├── pokemon.controller.ts    # CRUD + sync + create/update + species/evolution + random
│   │   └── team.controller.ts       # CRUD equipos con datos poblados desde Pokemon
│   ├── routes/
│   │   ├── pokemon.routes.ts
│   │   └── team.routes.ts
│   ├── middleware/validate.ts    # Validación: name requerido, types array no vacío, max 40 chars
│   ├── services/pokeapi.service.ts  # Fetch PokeAPI (batch 50 concurrentes, upsert)
│   ├── types/index.ts           # Interfaces compartidas (IPokemon, ITeam, CreatePokemonBody, etc.)
│   └── utils/                   # Utilidades (si aplica)
├── tsconfig.json
├── .env.example
└── package.json

frontend/                        # Next.js App Router (puerto 3000)
├── app/
│   ├── layout.jsx               # Root layout, nav, ToastProvider, ScrollToTop, theme injection
│   ├── page.jsx                 # <PokemonList/> con Suspense
│   ├── error.jsx                # Error boundary
│   ├── globals.css              # Tema oscuro/claro + trainer-card + pokedex-book (4430 líneas)
│   ├── pokemon/[id]/page.jsx    # Detalle: sprite, shiny, stats animados, cry, radar, evolución, movimientos
│   ├── teams/page.jsx           # Lista de equipos (TeamModal para crear/editar)
│   ├── teams/[id]/page.jsx      # Detalle de equipo con drag & drop, type coverage, debilidades
│   ├── abilities/page.jsx       # Explorador de habilidades (fetch directo a PokeAPI)
│   ├── battle/page.jsx          # Simulador de batallas por turnos (usa lib/battle.js)
│   ├── compare/page.jsx         # Comparador lado a lado con drag-drop, keyboard nav, dual radar, verdict
│   ├── trainer-card/page.jsx    # Generador de Trainer Card (Canvas API, 8 medallas, 6 marcos, exporta PNG)
│   └── pokedex-book/page.jsx    # Pokédex estilo Nintendo DS (pantalla dual, D-Pad, botones A/B, fade transition)
├── components/
│   ├── PokemonList.jsx          # Grid con search, type filter, sort, paginación, favoritos, modals
│   ├── PokemonSprite.jsx        # Imagen con fallback (placeholder "?" en error o sin src)
│   ├── PokemonFormModal.jsx     # Modal crear/editar Pokémon (todos los campos + stats)
│   ├── TeamModal.jsx            # Modal construir equipo (roster + search + paginación + random team)
│   ├── TeamRoster.jsx           # 6 slots con drag & drop
│   ├── TeamCard.jsx             # Preview de equipo en lista (sprites, tipos, fecha)
│   ├── NavBar.jsx               # Navegación glass flotante con links y hamburguesa
│   ├── NavFavCount.jsx          # Contador de favoritos en la nav (polling cada 1.5s)
│   ├── ThemeToggle.jsx          # Toggle dark/light mode con persistencia (pokemon-theme)
│   ├── ScrollToTop.jsx          # Botón flotante (visible tras 600px scroll)
│   ├── Toast.jsx                # Sistema de notificaciones (context + provider, auto-dismiss 3.5s)
│   ├── ConfirmModal.jsx         # Diálogo de confirmación (useConfirm hook, promesa)
│   ├── RadarChart.jsx           # Gráfico radar SVG de 6 stats
│   ├── CompareRadar.jsx         # SVG dual-overlay radar con red/blue legend
│   ├── SpeciesInfo.jsx          # Datos de especie (flavor text, genus) desde PokeAPI
│   ├── EvolutionChain.jsx       # Árbol evolutivo con sprites y condiciones
│   ├── MoveList.jsx             # Lista de movimientos agrupados por método, con búsqueda
│   └── PokemonOfTheDay.jsx      # Pokémon aleatorio del día, top 3 stats, botón "Another"
├── lib/
│   ├── constants.js             # TYPE_COLORS, ALL_TYPES, STATS_META, TYPE_CHART, calcTeamWeaknesses, debounce
│   └── battle.js                # Motor de batalla: daño, efectividad, STAB, crítico, IA
├── services/backendApi.js       # Cliente HTTP (fetch nativo) → /api/pokemon y /api/teams
├── public/favicon.svg
├── next.config.mjs              # remotePatterns para raw.githubusercontent.com
├── .env.example
└── package.json
```

## API Backend — Pokémon
| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/pokemon` | Lista paginada (`search`, `type`, `ids`, `page`, `limit`, `sort`) |
| GET | `/api/pokemon/random` | Pokémon aleatorio (MongoDB `$sample`) |
| GET | `/api/pokemon/:id` | Detalle con `prevPokemon` / `nextPokemon` |
| GET | `/api/pokemon/:id/species` | Datos de especie desde PokeAPI (proxy) |
| GET | `/api/pokemon/:id/evolution` | Cadena evolutiva desde PokeAPI (proxy) |
| POST | `/api/pokemon` | Crear Pokémon custom (ID auto-incremental desde 100000) |
| POST | `/api/pokemon/sync` | Sincronizar desde PokeAPI (lotes 50 concurrentes, upsert) |
| PUT | `/api/pokemon/:id` | Actualizar Pokémon (campos parciales) |
| DELETE | `/api/pokemon` | Eliminar TODOS los Pokémon |
| DELETE | `/api/pokemon/:id` | Eliminar un Pokémon |

## API Backend — Teams
| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/teams` | Listar equipos con `pokemonData` poblados |
| POST | `/api/teams` | Crear equipo `{ name, pokemonIds: [] }` (máx 6) |
| GET | `/api/teams/:id` | Equipo + `pokemonData` poblados |
| PUT | `/api/teams/:id` | Actualizar equipo |
| DELETE | `/api/teams/:id` | Eliminar equipo |

## Docs
| GET | `/api/docs` | Documentación Swagger UI interactiva |

## Health
| GET | `/api/health` | `{ status: 'ok', timestamp }` |

## Flujo de datos
1. POST `/sync` → backend fetch de PokeAPI en lotes de 50 requests concurrentes
2. Transforma a `{ pokemonId, name, types, rawData }` (campo `types` es string join)
3. `bulkWrite` con `upsert: true` en MongoDB (colección `externaldatas`)
4. Frontend hace GET a backend (nunca habla directo a PokeAPI, excepto abilities)
5. Pokémon custom se crean via POST `/api/pokemon` con ID auto-incremental ≥ 100000
6. Equipos se gestionan via `/api/teams`, se construyen desde TeamModal (con buscador propio)
7. Habilidades (`/abilities`) fetchean directo de PokeAPI — no pasan por backend
8. Simulador de batalla usa `lib/battle.js` con cálculo de daño generacional
9. Especies y evolución se obtienen desde PokeAPI a través del backend (proxy endpoints)

## Variables de entorno
```bash
# backend/.env
PORT=3001
MONGO_URI=mongodb://localhost:27017/external_api_db
EXTERNAL_API_URL=https://pokeapi.co/api/v2/pokemon?limit=2000
EXTERNAL_API_KEY=
CORS_ORIGIN=http://localhost:3000

# frontend/.env.local
NEXT_PUBLIC_BACKEND_URL=http://localhost:3001
```

## Comandos
```bash
docker compose up -d                           # MongoDB
cd backend && npm install && npm run dev        # Backend :3001
cd backend && npm run typecheck                 # TypeScript type checking
cd frontend && npm install && npm run dev       # Frontend :3000
```

## Convenciones
- Backend: **TypeScript** (compilación con `tsx`, type-check con `tsc --noEmit`)
- Frontend: JavaScript (JSX) con `'use client'` (sin TypeScript)
- ES Modules (`import`/`export`)
- CSS vainilla en `globals.css` (tema oscuro + claro Pokémon con variables CSS)
- Sin pruebas automatizadas
- Modals para crear/editar (no páginas separadas)
- `localStorage` para persistencia de: favoritos (`pokemon-favs`), tema (`pokemon-theme`), última sincronización (`pokemon-last-sync`)
- Las imágenes de Pokémon se cargan desde `raw.githubusercontent.com/PokeAPI/sprites` vía `next/image` con `remotePatterns`
- URLs de sprite se guardan en `rawData.sprites.other['official-artwork'].front_default`
- Tipo principal: `pokemon.types.split(', ')[0]` para colores de acento
- Colores de tipos definidos en `lib/constants.js` (`TYPE_COLORS`)
- Tabla de tipos (`TYPE_CHART`) usada por: `calcTeamWeaknesses`, `lib/battle.js`
- Motor de batalla (`lib/battle.js`): daño base Gen V+, STAB (1.5×), efectividad (0/0.5/1/2×), crítico (10%, 1.5×), variación aleatoria (85-100%), prioridad por velocidad

## Modelo de datos
- `Pokemon`: `{ pokemonId: string, name: string, types: string, rawData: object, timestamps }`
  - `pokemonId` único (string, ej: "6", "100001")
  - `name`: nombre del Pokémon
  - `types`: string de tipos separados por coma (ej: "fire, flying")
  - `rawData`: respuesta completa de PokeAPI
  - Colección en MongoDB: `externaldatas` (backward compatibility)
- `Team`: `{ name: string, pokemonIds: string[], timestamps }`
  - `pokemonIds`: array de strings referenciando `Pokemon.pokemonId`
  - Población manual via controller (no Mongoose populate)
