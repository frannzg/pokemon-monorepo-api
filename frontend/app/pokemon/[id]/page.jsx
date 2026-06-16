'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { getPokemonById } from '../../../services/backendApi';

const TYPE_COLORS = {
  normal: '#A8A77A', fire: '#EE8130', water: '#6390F0',
  electric: '#F7D02C', grass: '#7AC74C', ice: '#96D9D6',
  fighting: '#C22E28', poison: '#A33EA1', ground: '#E2BF65',
  flying: '#A98FF3', psychic: '#F95587', bug: '#A6B91A',
  rock: '#B6A136', ghost: '#735797', dragon: '#6F35FC',
  dark: '#705746', steel: '#B7B7CE', fairy: '#D685AD',
};

const STATS_META = {
  hp: { label: 'HP', color: '#FF0000' },
  attack: { label: 'Attack', color: '#F08030' },
  defense: { label: 'Defense', color: '#F8D030' },
  'special-attack': { label: 'Sp. Atk', color: '#6890F0' },
  'special-defense': { label: 'Sp. Def', color: '#78C850' },
  speed: { label: 'Speed', color: '#F85888' },
};

export default function PokemonDetail() {
  const { id } = useParams();
  const [pokemon, setPokemon] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const result = await getPokemonById(id);
        setPokemon(result);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    if (id) load();
  }, [id]);

  if (loading) {
    return (
      <div className="container">
        <div className="loading-state">
          <div className="pokeball-loader" />
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  if (error || !pokemon) {
    return (
      <div className="container">
        <div className="error-banner"><span className="error-icon">!</span> {error || 'Pokemon not found'}</div>
        <Link href="/" className="back-link">&larr; Back to Pokédex</Link>
      </div>
    );
  }

  const raw = pokemon.rawData;
  const sprite = raw?.sprites?.other?.['official-artwork']?.front_default
    || raw?.sprites?.front_default;
  const types = pokemon.description.split(', ');
  const mainType = types[0];
  const accent = TYPE_COLORS[mainType] || '#999';

  return (
    <div className="container">
      <Link href="/" className="back-link">&larr; Back to Pokédex</Link>

      <div className="detail-card" style={{ borderColor: accent }}>
        <div className="detail-header">
          <div className="detail-id" style={{ color: accent }}>
            #{pokemon.externalId.padStart(4, '0')}
          </div>
          <div className="detail-image-wrap" style={{ background: `${accent}22` }}>
            {sprite && <img src={sprite} alt={pokemon.title} className="detail-image" />}
          </div>
          <div className="detail-title-section">
            <h1 className="detail-name">{pokemon.title}</h1>
            <div className="card-types">
              {types.map((type) => (
                <span key={type} className="type-badge type-badge-lg" style={{ backgroundColor: TYPE_COLORS[type] || '#999' }}>
                  {type}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="detail-body">
          <div className="detail-info-grid">
            <div className="info-item">
              <span className="info-label">Height</span>
              <span className="info-value">{(raw?.height / 10).toFixed(1)} m</span>
            </div>
            <div className="info-item">
              <span className="info-label">Weight</span>
              <span className="info-value">{(raw?.weight / 10).toFixed(1)} kg</span>
            </div>
            <div className="info-item">
              <span className="info-label">Base XP</span>
              <span className="info-value">{raw?.base_experience || 'N/A'}</span>
            </div>
            <div className="info-item">
              <span className="info-label">Abilities</span>
              <span className="info-value">
                {raw?.abilities?.map((a) => a.ability.name.replace('-', ' ')).join(', ') || 'N/A'}
              </span>
            </div>
          </div>

          <h2 className="section-title">Base Stats</h2>
          <div className="stats-list">
            {raw?.stats?.map((stat) => {
              const meta = STATS_META[stat.stat.name] || { label: stat.stat.name, color: '#999' };
              const percent = Math.min(100, (stat.base_stat / 255) * 100);
              return (
                <div key={stat.stat.name} className="stat-row">
                  <span className="stat-label">{meta.label}</span>
                  <span className="stat-value">{stat.base_stat}</span>
                  <div className="stat-bar-bg">
                    <div
                      className="stat-bar-fill"
                      style={{ width: `${percent}%`, backgroundColor: meta.color }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
