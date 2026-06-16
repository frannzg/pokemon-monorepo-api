# Pokémon Monorepo

Una Pokédex interactiva construida con **Next.js** + **Express** + **MongoDB** + **PokeAPI**.

## Arquitectura

```
Frontend (Next.js)  ───→  Backend (Express)  ───→  PokeAPI
                                │
                                ↓
                            MongoDB (Docker)
```

## Tecnologías

| Capa       | Tecnologías                                       |
|------------|---------------------------------------------------|
| Backend    | Node.js, Express, Mongoose, Axios, CORS, Dotenv   |
| Frontend   | Next.js 14, React 18                              |
| BD         | MongoDB 7 (Docker)                                |
| API externa| [PokeAPI](https://pokeapi.co/)                    |

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

## Rutas del backend

| Método | Ruta                              | Descripción                         |
|--------|-----------------------------------|-------------------------------------|
| GET    | `/api/external-data`              | Lista todos los Pokémon guardados   |
| GET    | `/api/external-data/:externalId`  | Obtiene un Pokémon por ID           |
| POST   | `/api/external-data/sync`         | Sincroniza desde PokeAPI (lotes 50) |
| DELETE | `/api/external-data`              | Elimina todos los datos             |

## Estructura del proyecto

```
pokemon-monorepo/
├── docker-compose.yml
├── backend/
│   ├── src/
│   │   ├── server.js
│   │   ├── app.js
│   │   ├── config/db.js
│   │   ├── models/ExternalData.js
│   │   ├── controllers/externalData.controller.js
│   │   ├── routes/externalData.routes.js
│   │   └── services/externalApi.service.js
│   ├── .env.example
│   └── package.json
├── frontend/
│   ├── app/
│   │   ├── page.jsx
│   │   ├── layout.jsx
│   │   ├── globals.css
│   │   └── pokemon/[id]/page.jsx
│   ├── components/PokemonList.jsx
│   ├── services/backendApi.js
│   ├── .env.example
│   └── package.json
├── .gitignore
└── README.md
```

## Variables de entorno

**Backend** (`backend/.env`):
```
PORT=3001
MONGO_URI=mongodb://localhost:27017/external_api_db
EXTERNAL_API_URL=https://pokeapi.co/api/v2/pokemon?limit=2000
EXTERNAL_API_KEY=
```

**Frontend** (`frontend/.env.local`):
```
NEXT_PUBLIC_BACKEND_URL=http://localhost:3001
```

## Funcionalidades

- Lista paginada (60 por página) con búsqueda, filtro por tipo y ordenación
- Detalle del Pokémon con sprite oficial, stats animados, altura, peso, habilidades
- Diseño oscuro temático Pokémon (azul noche / dorado / rojo)
- Sincronización en lotes de 50 requests concurrentes
