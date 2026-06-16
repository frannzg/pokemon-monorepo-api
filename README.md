# Pokemon Monorepo

Backend Express + MongoDB + PokeAPI + Frontend Next.js.

## Prerequisites

- Docker (for MongoDB)
- Node.js 18+

## Quick start

```bash
# 1. Start MongoDB
docker compose up -d

# 2. Start backend
cd backend
cp .env.example .env
npm install
npm run dev

# 3. Start frontend (separate terminal)
cd frontend
cp .env.example .env.local
npm install
npm run dev
```

## Ports

| Service  | URL                          |
|----------|------------------------------|
| Frontend | http://localhost:3000        |
| Backend  | http://localhost:3001        |
| MongoDB  | mongodb://localhost:27017    |
