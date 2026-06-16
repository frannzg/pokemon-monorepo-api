'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';

const POKEAPI = 'https://pokeapi.co/api/v2';
const abilityCache = new Map();
let cachePromise = null;

function extractId(url) {
  return url?.split('/').filter(Boolean).pop();
}

function spriteUrl(pokemonUrl) {
  const id = extractId(pokemonUrl);
  return id ? `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${id}.png` : null;
}

async function loadAllAbilities() {
  if (cachePromise) return cachePromise;
  cachePromise = (async () => {
    const listRes = await fetch(`${POKEAPI}/ability?limit=400`);
    const listData = await listRes.json();
    const total = listData.results.length;
    const results = [];
    const batchSize = 20;

    for (let i = 0; i < total; i += batchSize) {
      const batch = listData.results.slice(i, i + batchSize);
      const details = await Promise.allSettled(
        batch.map(async (item) => {
          if (abilityCache.has(item.name)) return abilityCache.get(item.name);
          const res = await fetch(item.url);
          const data = await res.json();
          const entry = data.effect_entries?.find(e => e.language.name === 'en');
          const info = {
            id: data.id,
            name: data.name,
            shortEffect: entry?.short_effect || '',
            effect: entry?.effect || '',
            generation: data.generation?.name?.replace('generation-', '') || 'unknown',
            generationLabel: data.generation?.name ? `Gen ${data.generation.name.replace('generation-', '').toUpperCase()}` : 'Unknown',
            pokemon: data.pokemon?.map(p => ({
              name: p.pokemon.name,
              url: p.pokemon.url,
              sprite: spriteUrl(p.pokemon.url),
              isHidden: p.is_hidden,
            })) || [],
          };
          abilityCache.set(data.name, info);
          return info;
        })
      );
      details.forEach(r => { if (r.status === 'fulfilled') results.push(r.value); });
    }
    return results;
  })();
  return cachePromise;
}

const GEN_ORDER = ['i', 'ii', 'iii', 'iv', 'v', 'vi', 'vii', 'viii', 'ix'];

export default function AbilitiesPage() {
  const [abilities, setAbilities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState(0);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState(null);
  const [genFilter, setGenFilter] = useState([]);
  const [sortBy, setSortBy] = useState('name');
  const [error, setError] = useState(null);

  useEffect(() => {
    loadAllAbilities()
      .then((list) => {
        setAbilities(list);
        setProgress(100);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));

    const interval = setInterval(() => {
      setProgress((p) => Math.min(95, p + (95 - p) * 0.1));
    }, 300);
    return () => clearInterval(interval);
  }, []);

  const gens = useMemo(() => {
    const set = new Set(abilities.map((a) => a.generation));
    return GEN_ORDER.filter((g) => set.has(g));
  }, [abilities]);

  const filtered = useMemo(() => {
    let list = abilities;
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((a) =>
        a.name.includes(q) ||
        a.shortEffect.toLowerCase().includes(q) ||
        a.pokemon.some((p) => p.name.includes(q))
      );
    }
    if (genFilter.length > 0) {
      list = list.filter((a) => genFilter.includes(a.generation));
    }
    list = [...list].sort((a, b) => {
      if (sortBy === 'name') return a.name.localeCompare(b.name);
      if (sortBy === 'id') return a.id - b.id;
      if (sortBy === 'pokemon') return b.pokemon.length - a.pokemon.length;
      return 0;
    });
    return list;
  }, [abilities, search, genFilter, sortBy]);

  const toggleGen = (g) => {
    setGenFilter((prev) =>
      prev.includes(g) ? prev.filter((x) => x !== g) : [...prev, g]
    );
    setSelected(null);
  };

  const toggleSelect = (a) => {
    setSelected((prev) => (prev?.id === a.id ? null : a));
  };

  return (
    <div className="container">
      <Link href="/" className="back-link">&larr; Back</Link>

      <div className="abilities-header">
        <h1>Abilities</h1>
        <p className="abilities-subtitle">
          {filtered.length} of {abilities.length} abilities
        </p>
      </div>

      {/* Filters */}
      <div className="filters-bar">
        <div className="filters-row">
          <div className="search-wrap">
            <svg className="search-icon" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8" />
              <path d="M21 21l-4.35-4.35" />
            </svg>
            <input
              type="text"
              className="search-input"
              placeholder="Search ability or Pokémon..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setSelected(null); }}
            />
          </div>
          <select className="filter-select" value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
            <option value="name">A–Z</option>
            <option value="id"># ID</option>
            <option value="pokemon">Most Pokémon</option>
          </select>
        </div>
        <div className="filter-header" style={{ marginTop: '0.5rem' }}>
          <span className="filter-label">Generation</span>
          {genFilter.length > 0 && (
            <button className="filter-reset-btn" onClick={() => setGenFilter([])}>✕ Clear</button>
          )}
        </div>
        <div className="type-filter-bar">
          {gens.map((g) => (
            <button
              key={g}
              className={`type-filter-badge ${genFilter.includes(g) ? 'active' : ''}`}
              style={{ backgroundColor: '#6b6b8a' }}
              onClick={() => toggleGen(g)}
            >
              Gen {g.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div className="abilities-loading">
          <div className="abilities-progress-track">
            <div className="abilities-progress-fill" style={{ width: `${progress}%` }} />
          </div>
          <p className="abilities-progress-text">Catching abilities... {Math.floor(progress)}%</p>
        </div>
      )}

      {error && (
        <div className="error-banner"><span className="error-icon">!</span> {error}</div>
      )}

      {/* Grid */}
      {!loading && !error && (
        <div className="abilities-grid">
          {filtered.map((a) => (
            <div key={a.name} className={`ability-card ${selected?.id === a.id ? 'ability-expanded' : ''}`}>
              <button className="ability-card-header" onClick={() => toggleSelect(a)}>
                <div className="ability-card-top">
                  <span className="ability-card-id">#{a.id}</span>
                  <span className="ability-card-gen">{a.generationLabel}</span>
                  <span className="ability-card-count">{a.pokemon.length} Pokémon</span>
                </div>
                <div className="ability-card-name">{a.name.replace(/-/g, ' ')}</div>
                <div className="ability-card-effect">{a.shortEffect}</div>
              </button>

              {selected?.id === a.id && (
                <div className="ability-card-detail">
                  <p className="ability-detail-text">{a.effect}</p>
                  <h4 className="ability-detail-sub">Pokémon with this ability</h4>
                  <div className="ability-detail-pokemon">
                    {a.pokemon.map((p) => (
                      <Link key={p.name} href={`/pokemon/${p.name}`} className="ability-pkmn-chip">
                        {p.sprite && (
                          <img src={p.sprite} alt={p.name} width={32} height={32} className="ability-pkmn-sprite" />
                        )}
                        <span className="ability-pkmn-name">{p.name.replace(/-/g, ' ')}</span>
                        {p.isHidden && <span className="ability-pkmn-hidden">Hidden</span>}
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
          {filtered.length === 0 && (
            <div className="empty-state" style={{ gridColumn: '1 / -1' }}>
              <div className="empty-icon">?</div>
              <p>No abilities match your search.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
