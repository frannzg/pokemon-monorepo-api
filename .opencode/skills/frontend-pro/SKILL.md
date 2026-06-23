---
name: frontend-pro
description: |
  Frontend specialist for the Pokemon Next.js UI. Activates automatically on touch of files under frontend/. Use when editing pages, components, styles (globals.css), lib utilities, services (backendApi.js), or Next.js config. Implements React components with 'use client', modals, data fetching, theme system, localStorage persistence, and SVG charts.
---

# Frontend Pro — Pokémon UI

Skill especializado para trabajar en el frontend Next.js/React/CSS.

## Stack

- **Framework**: Next.js 16 + React 19 (App Router)
- **Lenguaje**: JavaScript con JSX — sin TypeScript
- **Estilos**: CSS vanilla, variables CSS en `app/globals.css` (~5480 líneas)
- **Data fetching**: fetch nativo via `services/backendApi.js`
- **Imágenes**: `next/image` con `remotePatterns` PokeAPI

## Arquitectura

```
app/          → Páginas (App Router)
components/   → Componentes reutilizables (todos 'use client')
lib/          → Constantes, motor de batalla
services/     → Cliente HTTP
```

## Patrones de código

### Componentes — 'use client'

TODOS los componentes reutilizables usan `'use client'`. Excepciones: `layout.jsx`, `not-found.jsx`.

### Data Fetching — Loading/Error

```jsx
const [pokemon, setPokemon] = useState(null);
const [loading, setLoading] = useState(true);
const [error, setError] = useState(null);

useEffect(() => {
  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      setPokemon(await getPokemonById(id));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };
  if (id) load();
}, [id]);

if (loading) return <div className="loading-state"><div className="pokeball-loader" /></div>;
if (error) return null;
if (!pokemon) return null;
```

### Modales — Escape + overlay click

```jsx
useEffect(() => {
  const handler = (e) => { if (e.key === 'Escape') onClose(); };
  window.addEventListener('keydown', handler);
  return () => window.removeEventListener('keydown', handler);
}, [onClose]);

{isOpen && (
  <div className="modal-overlay" onClick={onClose}>
    <div className="modal-content" onClick={e => e.stopPropagation()}>
      {/* contenido */}
    </div>
  </div>
)}
```

### Toast system

```jsx
const showToast = useToast();
showToast('Pokémon created!', 'success');  // 'success' | 'error'
// Auto-dismiss 3500ms
```

### Confirm modal

```jsx
const [confirmModal, confirm] = useConfirm();
const confirmed = await confirm('¿Estás seguro?');
```

### Imágenes (PokemonSprite)

```jsx
const [error, setError] = useState(false);
if (!src || error) return <div className="no-sprite">?</div>;
<Image src={src} alt={alt} width={w} height={h} onError={() => setError(true)} />

// URL:
pokemon.rawData?.sprites?.other?.['official-artwork']?.front_default
  || pokemon.rawData?.sprites?.front_default
```

### Favoritos (localStorage)

```jsx
const [favorites, setFavorites] = useState(() => {
  try { return JSON.parse(localStorage.getItem('pokemon-favs') || '[]'); }
  catch { return []; }
});
```

- Clave: `pokemon-favs` (JSON array de IDs)
- NavFavCount: polling cada **1500ms**
- Estrella: ★ activo / ☆ inactivo

### Tema (claro/oscuro)

```jsx
// Inline script en layout.jsx — evita flash:
document.documentElement.setAttribute('data-theme', t);

// ThemeToggle.jsx — toggle:
localStorage.setItem('pokemon-theme', next);
```

- Atributo `data-theme` en `<html>`
- Variables CSS en `:root` y `[data-theme="dark"]`
- Clave: `pokemon-theme`

## Servicios (services/backendApi.js)

| Función | Endpoint |
|---------|----------|
| `getPokemonList(params)` | GET `/api/pokemon?search&type&ids&page&limit&sort` |
| `getPokemonById(id)` | GET `/api/pokemon/:id` |
| `getRandomPokemon()` | GET `/api/pokemon/random` |
| `syncPokemonData()` | POST `/api/pokemon/sync` |
| `createPokemon(data)` | POST `/api/pokemon` |
| `updatePokemon(id, data)` | PUT `/api/pokemon/:id` |
| `deletePokemon(id)` | DELETE `/api/pokemon/:id` |
| `deleteAllPokemon()` | DELETE `/api/pokemon` |
| `getPokemonSpecies(id)` | GET `/api/pokemon/:id/species` |
| `getPokemonEvolution(id)` | GET `/api/pokemon/:id/evolution` |
| `getTeams()` | GET `/api/teams` |
| `getTeamById(id)` | GET `/api/teams/:id` |
| `createTeam(data)` | POST `/api/teams` |
| `updateTeam(id, data)` | PUT `/api/teams/:id` |
| `deleteTeam(id)` | DELETE `/api/teams/:id` |

## Constantes (lib/constants.js)

```javascript
TYPE_COLORS        // 18 tipos con hex
ALL_TYPES          // ['normal', 'fire', ...]
STATS_META         // labels + colores para 6 stats
TYPE_CHART         // { weak, resist, immune }
calcTeamWeaknesses // (teamTypes) => [{ type, multiplier, weak }]
debounce           // (fn, delay=300)
```

## Motor de batalla (lib/battle.js)

```
LEVEL: 50
Fórmula: ((2 * LEVEL / 5 + 2) * power * atk / def) / 50 + 2
STAB: 1.5x
Efectividad: 0 / 0.5 / 1 / 2x
Crítico: 10%, 1.5x
Variación: 85-100%
IA: máximo daño esperado
moveCache: caché en memoria
```

## Errores comunes

1. ✅ Olvidar `'use client'`
2. ✅ No manejar loading/error
3. ✅ Usar `<Image>` directo sin fallback (usar `PokemonSprite`)
4. ✅ No cerrar modales con Escape
5. ✅ Olvidar `remotePatterns` en `next.config.mjs`

## Templates

### Nueva página

```jsx
'use client';
import { useState, useEffect } from 'react';

export default function NewPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => { /* fetch */ }, []);

  if (loading) return <div className="container"><div className="pokeball-loader" /></div>;
  if (error) return <div className="container"><p>Error: {error}</p></div>;
  if (!data) return null;

  return <div className="container">{/* contenido */}</div>;
}
```

### Nuevo modal

```jsx
'use client';
import { useState, useEffect } from 'react';

export default function MyModal({ isOpen, onClose, onSaved }) {
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        {/* contenido */}
        <button onClick={onClose}>Cancel</button>
        <button onClick={onSaved}>Save</button>
      </div>
    </div>
  );
}
```
