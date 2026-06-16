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
│   ├── app.js                   # Express setup (CORS, rate-limit 200/15min, rutas, error handler)
│   ├── config/db.js             # Conexión Mongoose
│   ├── models/
│   │   ├── ExternalData.js      # Schema: externalId (único), title, description, rawData, timestamps
│   │   └── Team.js              # Schema: name, pokemon[] (externalIds), timestamps
│   ├── controllers/
│   │   ├── externalData.controller.js  # CRUD + sync + create/update pokemon
│   │   └── team.controller.js          # CRUD equipos
│   ├── routes/
│   │   ├── externalData.routes.js
│   │   └── team.routes.js
│   └── services/externalApi.service.js  # Fetch PokeAPI (batch 50 concurrentes, upsert)
├── .env.example
└── package.json

frontend/                        # Next.js App Router (puerto 3000)
├── app/
│   ├── layout.jsx               # Root layout, nav (Browse / Teams), ScrollToTop, globals.css
│   ├── page.jsx                 # <PokemonList/>
│   ├── error.jsx                # Error boundary
│   ├── pokemon/[id]/page.jsx    # Detalle: sprite, shiny toggle, stats, cry, +Team, Edit, Delete
│   └── teams/
│       ├── page.jsx             # Lista de equipos (TeamModal para crear/editar)
│       └── [id]/page.jsx        # Detalle de equipo con type coverage
├── components/
│   ├── PokemonList.jsx          # Lista con search, type filter, sort, paginación, modals
│   ├── PokemonFormModal.jsx     # Modal crear/editar Pokémon (todos los campos)
│   ├── TeamModal.jsx            # Modal construir equipo (roster + search propio)
│   ├── TeamRoster.jsx           # 6 slots de equipo
│   ├── TeamCard.jsx             # Preview de equipo en lista
│   └── ScrollToTop.jsx
├── services/backendApi.js       # Cliente HTTP para todas las APIs
├── public/favicon.svg
├── next.config.mjs              # remotePatterns para raw.githubusercontent.com
├── .env.example
└── package.json
```

## API Backend — External Data
| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/external-data` | Lista paginada (`search`, `type`, `page`, `limit`, `sort`) |
| GET | `/api/external-data/:externalId` | Detalle por ID |
| POST | `/api/external-data` | Crear Pokémon custom (auto-incremental desde 100000) |
| POST | `/api/external-data/sync` | Sincronizar desde PokeAPI (lotes 50) |
| PUT | `/api/external-data/:externalId` | Actualizar Pokémon |
| DELETE | `/api/external-data` | Eliminar TODOS los Pokémon |
| DELETE | `/api/external-data/:externalId` | Eliminar un Pokémon |

## API Backend — Teams
| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/teams` | Listar equipos |
| POST | `/api/teams` | Crear equipo `{ name, pokemon: [ids] }` |
| GET | `/api/teams/:id` | Equipo + `pokemonData` poblados |
| PUT | `/api/teams/:id` | Actualizar equipo |
| DELETE | `/api/teams/:id` | Eliminar equipo |

| GET | `/api/health` | Health check |

## Flujo de datos
1. POST `/sync` → backend fetch de PokeAPI en lotes de 50 requests concurrentes
2. Transforma a `{ externalId, title, description (types), rawData (respuesta completa) }`
3. `bulkWrite` con `upsert: true` en MongoDB
4. Frontend hace GET a backend (nunca habla directo a PokeAPI)
5. Pokémon custom se crean via POST `/api/external-data` con ID auto-incremental ≥ 100000
6. Equipos se gestionan via `/api/teams`, se construyen desde TeamModal (con buscador propio)

## Variables de entorno
```bash
# backend/.env
PORT=3001
MONGO_URI=mongodb://localhost:27017/external_api_db
EXTERNAL_API_URL=https://pokeapi.co/api/v2/pokemon?limit=2000

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
- CSS vainilla en `globals.css` (tema oscuro Pokémon)
- Componentes frontend con `'use client'`
- Sin pruebas automatizadas
- Modals para crear/editar (no páginas separadas)
