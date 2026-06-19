# Pokemon Monorepo API — Contexto para Agentes

## Stack
- **Backend**: Node.js, Express 4.19, Mongoose 8.4, Axios 1.7, ES Modules
- **Frontend**: Next.js 16, React 19, App Router, client-side rendering
- **BD**: MongoDB 7 (Docker — `docker compose up -d`)
- **API externa**: PokeAPI (`https://pokeapi.co/api/v2`)
- **Sin TypeScript, sin tests, sin linter/formatter**

## Estructura
```
backend/                         # Express API (puerto 3001)
├── src/
│   ├── server.js                # Entry point
│   ├── app.js                   # Express setup (CORS configurable, rate-limit 200/15min, rutas, error handler)
│   ├── config/db.js             # Conexión Mongoose
│   ├── models/
│   │   ├── ExternalData.js      # Schema: externalId (único), title, description, rawData, timestamps
│   │   └── Team.js              # Schema: name, pokemon[] (externalIds), timestamps
│   ├── controllers/
│   │   ├── externalData.controller.js  # CRUD + sync + create/update pokemon + species/evolution
│   │   └── team.controller.js          # CRUD equipos con datos poblados
│   ├── routes/
│   │   ├── externalData.routes.js
│   │   └── team.routes.js
│   ├── middleware/validate.js    # Validación: title requerido, types array no vacío, max 40 chars
│   └── services/externalApi.service.js  # Fetch PokeAPI (batch 50 concurrentes, upsert)
├── .env.example
└── package.json

frontend/                        # Next.js App Router (puerto 3000)
├── app/
│   ├── layout.jsx               # Root layout, nav, ToastProvider, ScrollToTop, theme injection
│   ├── page.jsx                 # <PokemonList/> con Suspense
│   ├── error.jsx                # Error boundary
│   ├── globals.css              # Tema oscuro/claro (4080 líneas)
│   ├── pokemon/[id]/page.jsx    # Detalle: sprite, shiny, stats animados, cry, radar, evolución, movimientos
│   ├── teams/page.jsx           # Lista de equipos (TeamModal para crear/editar)
│   ├── teams/[id]/page.jsx      # Detalle de equipo con drag & drop, type coverage, debilidades
│   ├── abilities/page.jsx       # Explorador de habilidades (fetch directo a PokeAPI)
│   └── battle/page.jsx          # Simulador de batallas por turnos (usa lib/battle.js)
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
│   ├── SpeciesInfo.jsx          # Datos de especie (flavor text, genus) desde PokeAPI
│   ├── EvolutionChain.jsx       # Árbol evolutivo con sprites y condiciones
│   └── MoveList.jsx             # Lista de movimientos agrupados por método, con búsqueda
├── lib/
│   ├── constants.js             # TYPE_COLORS, ALL_TYPES, STATS_META, TYPE_CHART, calcTeamWeaknesses, debounce
│   └── battle.js                # Motor de batalla: daño, efectividad, STAB, crítico, IA
├── services/backendApi.js       # Cliente HTTP para todas las APIs (fetch nativo)
├── public/favicon.svg
├── next.config.mjs              # remotePatterns para raw.githubusercontent.com
├── .env.example
└── package.json
```

## API Backend — External Data
| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/pokemon` | Lista paginada (`search`, `type`, `ids`, `page`, `limit`, `sort`) |
| GET | `/api/pokemon/random` | Pokémon aleatorio |
| GET | `/api/pokemon/:externalId` | Detalle con `prevPokemon` / `nextPokemon` |
| GET | `/api/pokemon/:externalId/species` | Datos de especie desde PokeAPI |
| GET | `/api/pokemon/:externalId/evolution` | Cadena evolutiva desde PokeAPI |
| POST | `/api/pokemon` | Crear Pokémon custom (ID auto-incremental desde 100000) |
| POST | `/api/pokemon/sync` | Sincronizar desde PokeAPI (lotes 50 concurrentes) |
| PUT | `/api/pokemon/:externalId` | Actualizar Pokémon (campos parciales) |
| DELETE | `/api/pokemon` | Eliminar TODOS los Pokémon |
| DELETE | `/api/pokemon/:externalId` | Eliminar un Pokémon |

## API Backend — Teams
| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/teams` | Listar equipos con `pokemonData` poblados |
| POST | `/api/teams` | Crear equipo `{ name, pokemon: [ids] }` (máx 6) |
| GET | `/api/teams/:id` | Equipo + `pokemonData` poblados |
| PUT | `/api/teams/:id` | Actualizar equipo |
| DELETE | `/api/teams/:id` | Eliminar equipo |

## Docs
| GET | `/api/docs` | Documentación Swagger UI interactiva |

## Health
| GET | `/api/health` | `{ status: 'ok', timestamp }` |

## Flujo de datos
1. POST `/sync` → backend fetch de PokeAPI en lotes de 50 requests concurrentes
2. Transforma a `{ externalId, title, description (types), rawData (respuesta completa) }`
3. `bulkWrite` con `upsert: true` en MongoDB
4. Frontend hace GET a backend (nunca habla directo a PokeAPI, excepto abilities y species/evolution)
5. Pokémon custom se crean via POST `/api/pokemon` con ID auto-incremental ≥ 100000
6. Equipos se gestionan via `/api/teams`, se construyen desde TeamModal (con buscador propio)
7. Habilidades (`/abilities`) fetchean directo de PokeAPI — no pasan por backend
8. Comparador (`/compare`) usa `getPokemonById` y `getExternalData` del backend para mostrar datos lado a lado
8. Especies y evolución se obtienen desde PokeAPI a través del backend (proxy endpoints)
9. El simulador de batalla usa `lib/battle.js` con cálculo de daño generacional

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
cd frontend && npm install && npm run dev       # Frontend :3000
```

## Convenciones
- JavaScript (JSX en frontend), sin TypeScript
- ES Modules en backend (`import`/`export`)
- CSS vainilla en `globals.css` (tema oscuro + claro Pokémon con variables CSS)
- Componentes frontend con `'use client'`
- Sin pruebas automatizadas
- Modals para crear/editar (no páginas separadas)
- `localStorage` para persistencia de: favoritos (`pokemon-favs`), tema (`pokemon-theme`), última sincronización (`pokemon-last-sync`)
- Las imágenes de Pokémon se cargan desde `raw.githubusercontent.com/PokeAPI/sprites` vía `next/image` con `remotePatterns`
- Las URLs de sprite se guardan en `rawData.sprites.other['official-artwork'].front_default`
- El tipo principal se obtiene de `pokemon.description.split(', ')[0]` para colores de acento
- Colores de tipos definidos en `lib/constants.js` (`TYPE_COLORS`)
- Tabla de tipos (`TYPE_CHART`) usada por: `calcTeamWeaknesses` (type coverage), `lib/battle.js` (efectividad)
- El motor de batalla (`lib/battle.js`) implementa: daño base Gen V+, STAB (1.5×), efectividad (0/0.5/1/2×), crítico (10%, 1.5×), variación aleatoria (85-100%), prioridad por velocidad
