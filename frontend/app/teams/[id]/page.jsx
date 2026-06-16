'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { getTeamById } from '../../../services/backendApi';
import { TYPE_COLORS, ALL_TYPES, calcTeamWeaknesses } from '../../../lib/constants';

export default function TeamDetailPage() {
  const { id } = useParams();
  const [team, setTeam] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const result = await getTeamById(id);
        setTeam(result);
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
          <p>Loading team...</p>
        </div>
      </div>
    );
  }

  if (error || !team) {
    return (
      <div className="container">
        <div className="error-banner">
          <span className="error-icon">!</span> {error || 'Team not found'}
        </div>
        <Link href="/teams" className="back-link">&larr; Back to Teams</Link>
      </div>
    );
  }

  const teamTypes = [];
  team.pokemonData?.forEach((p) => {
    p.description.split(', ').forEach((t) => { if (!teamTypes.includes(t)) teamTypes.push(t); });
  });

  const weaknesses = calcTeamWeaknesses(teamTypes);

  return (
    <div className="container">
      <div className="team-detail">
        <div className="team-detail-header">
          <Link href="/teams" className="back-link">&larr; Teams</Link>
          <div className="team-detail-actions">
              <Link
                href={`/teams`}
                className="btn btn-sync btn-small"
              >
                Edit Team
              </Link>
          </div>
        </div>

        <header className="header" style={{ marginBottom: '1.5rem' }}>
          <div className="header-brand">
            <div className="pokeball-icon" />
            <div>
              <h1>{team.name}</h1>
              <p className="header-subtitle">
                {team.pokemonData?.length || 0}/6 Pokémon
              </p>
            </div>
          </div>
        </header>

        <div className="team-detail-grid">
          {team.pokemonData?.map((pokemon) => {
            const sprite =
              pokemon.rawData?.sprites?.other?.['official-artwork']?.front_default ||
              pokemon.rawData?.sprites?.front_default;
            const types = pokemon.description.split(', ');
            const mainType = types[0];
            const accent = TYPE_COLORS[mainType] || '#999';

            return (
              <Link
                key={pokemon.externalId}
                href={`/pokemon/${pokemon.externalId}`}
                className="card-link"
              >
                <div className="card" style={{ borderColor: accent }}>
                  <div className="card-id">
                    #{pokemon.externalId.padStart(4, '0')}
                  </div>
                  <div className="card-image">
                    {sprite ? (
                      <Image
                        src={sprite}
                        alt={pokemon.title}
                        width={110}
                        height={110}
                        className="card-img"
                        loading="lazy"
                      />
                    ) : (
                      <div className="no-sprite">?</div>
                    )}
                  </div>
                  <div className="card-body">
                    <h3 className="card-name">{pokemon.title}</h3>
                    <div className="card-types">
                      {types.map((type) => (
                        <span
                          key={type}
                          className="type-badge"
                          style={{ backgroundColor: TYPE_COLORS[type] || '#999' }}
                        >
                          {type}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
          {Array.from({ length: Math.max(0, 6 - (team.pokemonData?.length || 0)) }).map((_, i) => (
            <div key={`empty-${i}`} className="card team-slot-empty-card">
              <div className="card-image">
                <div className="no-sprite" style={{ fontSize: '1.5rem' }}>
                  Empty
                </div>
              </div>
              <div className="card-body">
                <div className="card-name" style={{ textAlign: 'center', color: '#999' }}>
                  Slot {team.pokemonData?.length + i + 1}
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="type-coverage">
          <h2 className="section-title">Type Coverage</h2>
          <div className="type-coverage-grid">
            {ALL_TYPES.map((type) => (
              <div
                key={type}
                className={`type-coverage-cell ${teamTypes.includes(type) ? 'present' : ''}`}
                style={{
                  backgroundColor: teamTypes.includes(type) ? TYPE_COLORS[type] : '#f0f0f0',
                  color: teamTypes.includes(type) ? '#fff' : '#999',
                }}
              >
                {type}
              </div>
            ))}
          </div>
        </div>

        <div className="type-weaknesses">
          <h2 className="section-title">Weaknesses & Resistances</h2>
          {weaknesses.length === 0 && (
            <p className="empty-state" style={{ padding: '1rem' }}>No significant weaknesses!</p>
          )}
          {weaknesses.length > 0 && (
            <div className="weakness-grid">
              {weaknesses.map((w) => {
                const isWeak = w.multiplier >= 1;
                const isImmune = w.multiplier === 0;
                return (
                  <div
                    key={w.type}
                    className={`weakness-cell ${isImmune ? 'immune' : isWeak ? 'weak' : 'resist'}`}
                    style={{ backgroundColor: isImmune ? '#555' : TYPE_COLORS[w.type] }}
                  >
                    <span className="weakness-type">{w.type}</span>
                    <span className="weakness-mult">
                      {isImmune ? '0×' : isWeak ? `×${w.multiplier}` : '½×'}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
