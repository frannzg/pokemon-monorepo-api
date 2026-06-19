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

## Tecnologías

| Capa       | Tecnologías                                               |
|------------|-----------------------------------------------------------|
| Backend    | Node.js, Express 4.19, Mongoose 8.4, Axios 1.7, ES Modules |
| Frontend   | Next.js 16, React 19, App Router, client-side rendering    |
| BD         | MongoDB 7 (Docker)                                         |
| API externa| [PokeAPI](https://pokeapi.co/)                             |

## Instalación

```bash
docker compose up -d                                    # MongoDB
cd backend && cp .env.example .env && npm install && npm run dev    # :3001
cd frontend && cp .env.example .env.local && npm install && npm run dev  # :3000
```

| Servicio  | URL                          |
|-----------|------------------------------|
| Frontend  | http://localhost:3000        |
| Backend   | http://localhost:3001        |
| MongoDB   | mongodb://localhost:27017    |

## Documentación Swagger

La API tiene documentación interactiva generada con **Swagger UI** (OpenAPI 3.0).  
Una vez que el backend esté corriendo, ingresá a:

👉 **http://localhost:3001/api/docs**

Ahí vas a encontrar todos los endpoints documentados con schemas, ejemplos de respuesta y la posibilidad de probar cada uno directamente desde el browser.

## Cómo funciona la API

### Flujo de datos

1. **Sincronización** — `POST /api/pokemon/sync` fetchea todos los Pokémon desde PokeAPI en lotes de 50 requests concurrentes, los transforma a `{ externalId, title, description, rawData }` y los guarda en MongoDB con `bulkWrite` + `upsert`.
2. **Consulta** — Todas las operaciones de lectura (`GET /api/pokemon`) consultan MongoDB, no PokeAPI. Esto significa que una vez sincronizado, el sistema funciona sin depender de la API externa.
3. **Pokémon custom** — Se crean via `POST /api/pokemon` con ID auto-incremental desde 100000, permitiendo crear Pokémon originales además de los sincronizados.
4. **Especie y evolución** — Se obtienen desde PokeAPI usando el backend como proxy (`GET /api/pokemon/:id/species` y `GET /api/pokemon/:id/evolution`), parseando la URL de species desde el `rawData` almacenado.

### Rate limiting

Todas las rutas `/api/*` tienen un límite de **200 requests cada 15 minutos** por IP.

### CORS

Configurable via `CORS_ORIGIN` en `.env` (por defecto solo `http://localhost:3000`).

## API Endpoints

### Pokémon
| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/pokemon` | Lista paginada (`search`, `type`, `ids`, `page`, `limit`, `sort`) |
| GET | `/api/pokemon/random` | Pokémon aleatorio via MongoDB `$sample` |
| GET | `/api/pokemon/:externalId` | Detalle con `prevPokemon` / `nextPokemon` |
| GET | `/api/pokemon/:externalId/species` | Datos de especie desde PokeAPI (proxy) |
| GET | `/api/pokemon/:externalId/evolution` | Cadena evolutiva desde PokeAPI (proxy) |
| POST | `/api/pokemon/sync` | Sincronizar desde PokeAPI (lotes 50 concurrentes) |
| POST | `/api/pokemon` | Crear Pokémon custom (ID auto-incremental ≥ 100000) |
| PUT | `/api/pokemon/:externalId` | Actualizar Pokémon (campos parciales) |
| DELETE | `/api/pokemon` | Eliminar TODOS los Pokémon |
| DELETE | `/api/pokemon/:externalId` | Eliminar un Pokémon |

### Teams
| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/teams` | Listar equipos con `pokemonData` poblados |
| POST | `/api/teams` | Crear equipo `{ name, pokemon: [ids] }` (máx 6) |
| GET | `/api/teams/:id` | Detalle del equipo con `pokemonData` |
| PUT | `/api/teams/:id` | Actualizar nombre y/o roster |
| DELETE | `/api/teams/:id` | Eliminar equipo |

### Otros
| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/docs` | Documentación Swagger UI interactiva |
| GET | `/api/health` | `{ status: 'ok', timestamp }` |

## Estructura del proyecto

```
pokemon-monorepo/
├── docker-compose.yml
├── backend/
│   ├── src/
│   │   ├── server.js                       # Entry point
│   │   ├── app.js                          # Express setup (CORS, rate-limit, rutas, error handler)
│   │   ├── config/
│   │   │   ├── db.js                       # Conexión Mongoose
│   │   │   └── swagger.js                  # OpenAPI 3.0 spec (paths, schemas)
│   │   ├── models/
│   │   │   ├── ExternalData.js             # Schema: externalId, title, description, rawData
│   │   │   └── Team.js                     # Schema: name, pokemon[] (externalIds)
│   │   ├── controllers/
│   │   │   ├── pokemon.controller.js       # CRUD + sync + species/evolution + random
│   │   │   └── team.controller.js          # CRUD equipos con datos poblados
│   │   ├── routes/
│   │   │   └── api/
│   │   │       ├── pokemon.routes.js
│   │   │       └── team.routes.js
│   │   ├── middleware/validate.js           # Validación: title requerido, types array no vacío, max 40 chars
│   │   └── services/
│   │       └── pokeapi.service.js          # Fetch PokeAPI (batch 50 concurrentes, species, evolution)
│   ├── .env.example
│   └── package.json
├── frontend/
│   ├── app/
│   │   ├── layout.jsx                      # Root layout, NavBar, Toast, ScrollToTop, theme injection
│   │   ├── page.jsx                        # <PokemonList/> con Suspense
│   │   ├── error.jsx                       # Error boundary
│   │   ├── globals.css                     # Tema oscuro/claro Pokémon (CSS variables)
│   │   ├── pokemon/[id]/page.jsx           # Detalle: sprite, shiny, stats animados, cry, radar, evolución, movimientos
│   │   ├── teams/page.jsx                  # Lista de equipos (TeamModal para crear/editar)
│   │   ├── teams/[id]/page.jsx             # Detalle de equipo con drag & drop, type coverage
│   │   ├── abilities/page.jsx              # Explorador de habilidades (PokeAPI directo)
│   │   ├── battle/page.jsx                 # Simulador de batallas por turnos
│   │   ├── compare/page.jsx                # Comparador de Pokémon lado a lado
│   │   ├── trainer-card/page.jsx           # Generador de tarjeta de entrenador (Canvas)
│   │   └── pokedex-book/page.jsx           # Pokédex estilo Nintendo DS
│   ├── components/
│   │   ├── PokemonList.jsx                 # Grid con search, type filter, sort, paginación, favoritos
│   │   ├── PokemonSprite.jsx               # Imagen con fallback ("?" en error o sin src)
│   │   ├── PokemonFormModal.jsx            # Modal crear/editar Pokémon
│   │   ├── PokemonOfTheDay.jsx             # Pokémon aleatorio destacado
│   │   ├── TeamModal.jsx                   # Modal construir equipo (roster + search + random)
│   │   ├── TeamRoster.jsx                  # 6 slots con drag & drop
│   │   ├── TeamCard.jsx                    # Preview de equipo en lista
│   │   ├── NavBar.jsx                      # Navegación glass flotante
│   │   ├── NavFavCount.jsx                 # Contador de favoritos (polling 1.5s)
│   │   ├── ThemeToggle.jsx                 # Toggle dark/light mode
│   │   ├── ScrollToTop.jsx                 # Botón flotante (visible tras 600px)
│   │   ├── Toast.jsx                       # Sistema de notificaciones (auto-dismiss 3.5s)
│   │   ├── ConfirmModal.jsx                # Diálogo de confirmación (useConfirm hook)
│   │   ├── RadarChart.jsx                  # Gráfico radar SVG de 6 stats
│   │   ├── CompareRadar.jsx                # Radar dual superpuesto (rojo/azul)
│   │   ├── SpeciesInfo.jsx                 # Datos de especie desde PokeAPI
│   │   ├── EvolutionChain.jsx              # Árbol evolutivo con sprites y condiciones
│   │   └── MoveList.jsx                    # Lista de movimientos agrupados por método
│   ├── lib/
│   │   ├── constants.js                    # TYPE_COLORS, TYPE_CHART, STATS_META, calcTeamWeaknesses, debounce
│   │   └── battle.js                       # Motor de batalla (daño Gen V+, STAB, efectividad, crítico, IA)
│   ├── services/backendApi.js              # Cliente HTTP para todas las APIs
│   ├── next.config.mjs                     # remotePatterns para raw.githubusercontent.com
│   ├── .env.example
│   └── package.json
├── .gitignore
├── AGENTS.md
└── README.md
```

## Variables de entorno

**Backend** (`backend/.env`):
```
PORT=3001
MONGO_URI=mongodb://localhost:27017/external_api_db
EXTERNAL_API_URL=https://pokeapi.co/api/v2/pokemon?limit=2000
EXTERNAL_API_KEY=
CORS_ORIGIN=http://localhost:3000
```

**Frontend** (`frontend/.env.local`):
```
NEXT_PUBLIC_BACKEND_URL=http://localhost:3001
```

## Funcionalidades

- **Pokémon of the Day** — carta destacada con un Pokémon aleatorio, stats y botón para refrescar
- **Documentación Swagger** en `/api/docs` con todos los endpoints documentados y probables desde el browser
- **Lista paginada** (60 por página) con búsqueda, filtro por tipo múltiple, ordenación por #/nombre
- **Detalle completo**: sprite oficial, shiny toggle, stats animados con barra y radar, altura, peso, habilidades, sonido, navegación prev/next
- **Cadena evolutiva** con sprites y condiciones de evolución (nivel, objeto, intercambio)
- **Lista de movimientos** agrupados por método de aprendizaje con filtro
- **Datos de especie** (género, flavor text) desde PokeAPI
- **Favoritos** ★ persistidos en localStorage con filtro exclusivo
- **Tema oscuro/claro** con persistencia y detección de preferencia del sistema
- **Equipos**: crear hasta 6 Pokémon, drag & drop, random team, type coverage, debilidades/resistencias
- **Simulador de batallas**: selección de 2 equipos, animación por turnos, daño calculado con STAB/efectividad/crítico, control de velocidad y pausa
- **Explorador de habilidades**: búsqueda, filtro por generación, detalle con Pokémon que la poseen
- **Comparador de Pokémon**: selecciona 2 Pokémon y compara stats lado a lado con radar superpuesto y veredicto
- **Trainer Card**: generador de tarjeta de entrenador con badges, Pokémon favorito y exportación a PNG via Canvas API
- **Pokédex Book**: vista estilo Nintendo DS con dos pantallas, D-Pad, botones A/B y paginación
- **Pokémon custom**: crear/editar con stats, sprites, tipos
- **Sincronización** desde PokeAPI en lotes de 50 requests concurrentes
- **Diseño responsive** con barra de navegación glass y menú hamburguesa
