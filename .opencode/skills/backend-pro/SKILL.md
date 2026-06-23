---
name: backend-pro
description: |
  Backend specialist for the Pokemon Express API. Activates automatically on touch of files under backend/ or /api/ routes. Use when editing controllers, models, routes, services, middleware, config, or TypeScript types. Implements CRUD endpoints, PokeAPI sync, Mongoose schemas, validation, Swagger docs, and Express middleware patterns.
---

# Backend Pro — Pokémon API

Skill especializado para trabajar en el backend Express/TypeScript/Mongoose.

## Stack

- **Runtime**: Node.js + tsx (TypeScript directo, sin compilación)
- **Framework**: Express 4.19
- **ORM**: Mongoose 8.4 → MongoDB 7
- **HTTP**: Axios 1.7 (solo PokeAPI)
- **TypeScript**: v6, strict mode, ES2022 target
- **ES Modules**: `type: "module"` — imports con extensión `.js`

## Arquitectura

```
routes/  →  controllers/  →  services/  →  models/
            middleware/
            utils/
```

## Patrones de código

### Controladores

```typescript
export const getStoredData = async (
  req: Request<Record<string, string>, unknown, unknown, PokemonQueryParams>,
  res: Response
): Promise<void> => {
  try {
    // lógica...
    res.json({ data, total, page, limit, totalPages });
  } catch (error) {
    res.status(500).json({ message: (error as Error).message });
  }
};
```

- Requests tipadas con `TypedRequest<P, B, Q>` desde `types/index.ts`
- `asyncHandler.ts` existe en `utils/` pero actualmente NO se usa

### Rutas — Orden IMPORTANTE

Las rutas específicas DEBEN ir antes que `:id`:

```typescript
router.get('/', getStoredData);            // 1. Lista
router.get('/random', getRandomPokemon);   // 2. Antes de :id
router.get('/:id', getStoredDataById);     // 3. Detalle
router.get('/:id/species', ...);           // 4. Sub-rutas
router.post('/sync', syncExternalData);    // 5. Acciones
router.post('/', validatePokemonInput, createPokemon);
router.put('/:id', updatePokemon);
router.delete('/', deleteStoredData);
router.delete('/:id', deletePokemonById);
```

### Modelos Mongoose

```typescript
// Pokemon — colección 'externaldatas'
const pokemonSchema = new Schema<IPokemonDocument>(
  {
    pokemonId: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    types: { type: String, default: '' },
    rawData: { type: Object, default: {} },
  },
  { timestamps: true, collection: 'externaldatas' }
);
pokemonSchema.index({ name: 1 });
pokemonSchema.index({ types: 1 });
pokemonSchema.index({ createdAt: -1 });
```

- `types` es string join (ej: `"fire, flying"`)
- `rawData: Object` guarda respuesta completa de PokeAPI

### Validación

```typescript
// middleware/validate.ts
export const validatePokemonInput = (req, res, next) => {
  const { name, types } = req.body;
  if (!name || !name.trim()) return res.status(400).json({ message: 'Name is required' });
  if (!types || !Array.isArray(types) || types.length === 0)
    return res.status(400).json({ message: 'At least one type is required' });
  if (name.trim().length > 40)
    return res.status(400).json({ message: 'Name too long (max 40 characters)' });
  next();
};
```

### Servicio PokeAPI

- `fetchExternalData()`: batches de **50 concurrentes** con `Promise.all`
- `fetchPokemonSpecies(url)`: proxy
- `fetchEvolutionChain(url)`: proxy

### Población manual (NO populate)

```typescript
const pokemonData = await Pokemon.find({ pokemonId: { $in: team.pokemonIds } });
const pokemonMap: Record<string, typeof pokemonData[0]> = {};
pokemonData.forEach((p) => { pokemonMap[p.pokemonId] = p; });
const sortedPokemon = team.pokemonIds.map((id) => pokemonMap[id]).filter(Boolean);
```

## Tipos (types/index.ts)

| Tipo | Uso |
|------|-----|
| `IPokemon` | Pokemon con prevPokemon/nextPokemon |
| `ITeam` | Team con pokemonData opcional |
| `CreatePokemonBody` | Body POST/PUT /api/pokemon |
| `CreateTeamBody` | Body POST /api/teams |
| `PokemonQueryParams` | Query GET /api/pokemon |
| `PaginatedResponse` | `{ data, total, page, limit, totalPages }` |
| `PokemonRawData` | Schema completo PokeAPI |
| `TypedRequest<P, B, Q>` | Request genérica tipada |

## Errores comunes

1. ✅ Olvidar extensión `.js` en imports
2. ✅ No tipar `req.params`
3. ✅ Poner `/:id` antes de `/random`
4. ✅ No validar límite de 6 Pokémon
5. ✅ Usar `populate` de Mongoose (aquí es manual)

## Templates

### Nuevo endpoint

```typescript
// routes/mi-recurso.routes.ts
import { Router } from 'express';
import { getItems, createItem } from '../controllers/mi-recurso.controller.js';
const router = Router();
router.get('/', getItems);
router.post('/', createItem);
export default router;

// controllers/mi-recurso.controller.ts
import { Request, Response } from 'express';
export const getItems = async (req: Request, res: Response): Promise<void> => {
  try {
    res.json([]);
  } catch (error) {
    res.status(500).json({ message: (error as Error).message });
  }
};
```

### Nuevo modelo

```typescript
import mongoose, { Schema, Document } from 'mongoose';
export interface IMyDoc extends Document {
  name: string;
  createdAt: Date;
  updatedAt: Date;
}
const mySchema = new Schema<IMyDoc>({ name: { type: String, required: true } }, { timestamps: true });
export default mongoose.model<IMyDoc>('MyModel', mySchema);
```
