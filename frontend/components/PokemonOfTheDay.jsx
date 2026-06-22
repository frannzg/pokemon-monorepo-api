'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { getRandomPokemon } from '../services/backendApi';
import PokemonSprite from './PokemonSprite';
import { TYPE_COLORS, STATS_META } from '../lib/constants';

export default function PokemonOfTheDay() {
  const [pokemon, setPokemon] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statsAnimated, setStatsAnimated] = useState(false);

  const fetchRandom = useCallback(async () => {
    setLoading(true);
    setError(null);
    setStatsAnimated(false);
    try {
      const result = await getRandomPokemon();
      setPokemon(result);
      setTimeout(() => setStatsAnimated(true), 150);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchRandom(); }, [fetchRandom]);

  if (loading) {
    return (
      <div className="potd-card">
        <div className="loading-state" style={{ padding: '1.5rem' }}>
          <div className="pokeball-loader" />
        </div>
      </div>
    );
  }

  if (error || !pokemon) return null;

  const sprite =
    pokemon.rawData?.sprites?.other?.['official-artwork']?.front_default ||
    pokemon.rawData?.sprites?.front_default;
  const types = pokemon.types.split(', ');
  const mainType = types[0];
  const accent = TYPE_COLORS[mainType] || '#999';

  return (
    <div className="potd-card" style={{ borderColor: accent }}>
      <div className="potd-badge" style={{ background: accent }}>Pokémon of the Day</div>
      <div className="potd-body">
        <div className="potd-sprite-wrap" style={{ background: `${accent}15` }}>
          <Link href={`/pokemon/${pokemon.pokemonId}`}>
            <PokemonSprite src={sprite} alt={pokemon.name} width={130} height={130} className="potd-sprite" />
          </Link>
        </div>
        <div className="potd-info">
          <div className="potd-id" style={{ color: accent }}>#{pokemon.pokemonId ? pokemon.pokemonId.padStart(4, '0') : '???'}</div>
          <Link href={`/pokemon/${pokemon.pokemonId}`} className="potd-name">{pokemon.name}</Link>
          <div className="potd-types">
            {types.map((t) => (
              <span key={t} className="type-badge" style={{ backgroundColor: TYPE_COLORS[t] }}>
                {t}
              </span>
            ))}
          </div>
          <div className="potd-stats">
            {(pokemon.rawData?.stats || []).slice(0, 3).map((s) => {
              const meta = STATS_META[s.stat.name];
              return (
                <div key={s.stat.name} className="potd-stat">
                  <span className="potd-stat-label">{meta?.label || s.stat.name}</span>
                  <div className="potd-stat-bar-bg">
                    <div
                      className="potd-stat-bar-fill"
                      style={{
                        width: statsAnimated ? `${Math.min(100, (s.base_stat / 255) * 100)}%` : '0%',
                        backgroundColor: meta?.color || '#999',
                      }}
                    />
                  </div>
                  <span className="potd-stat-value">{s.base_stat}</span>
                </div>
              );
            })}
          </div>
          <button className="potd-refresh" onClick={fetchRandom} title="Show another random Pokémon">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="23 4 23 10 17 10" />
              <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
            </svg>
            Another
          </button>
        </div>
      </div>
    </div>
  );
}
