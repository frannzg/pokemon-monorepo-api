'use client';

import Link from 'next/link';
import PokemonSprite from './PokemonSprite';
import { TYPE_COLORS } from '../lib/constants';

export default function TeamCard({ team }) {
  const count = team.pokemon?.length || 0;
  const pokemonData = team.pokemonData || [];

  return (
    <Link href={`/teams/${team._id}`} className="team-card-link">
      <div className="team-card">
        <div className="team-card-header">
          <h3 className="team-card-name">{team.name}</h3>
          <span className="team-card-count">{count}/6</span>
        </div>
        <div className="team-card-roster">
          {Array.from({ length: 6 }).map((_, i) => {
            const pokemon = pokemonData[i] || null;
            const sprite =
              pokemon?.rawData?.sprites?.other?.['official-artwork']?.front_default ||
              pokemon?.rawData?.sprites?.front_default;
            const types = pokemon ? pokemon.types.split(', ') : [];
            const mainType = types[0];
            const accent = TYPE_COLORS[mainType] || '#999';

            return (
              <div
                key={i}
                className={`team-card-slot ${pokemon ? 'filled' : 'empty'}`}
                style={pokemon ? { borderColor: accent } : {}}
              >
                {pokemon ? (
                  <>
                    <PokemonSprite src={sprite} alt={pokemon.name} width={64} height={64} className="team-card-slot-img" />
                    <span className="team-card-slot-name">{pokemon.name}</span>
                    <div className="team-card-slot-types">
                      {types.map((t) => (
                        <span
                          key={t}
                          className="type-badge"
                          style={{ backgroundColor: TYPE_COLORS[t] || '#999' }}
                        >
                          {t}
                        </span>
                      ))}
                    </div>
                  </>
                ) : (
                  <div className="team-card-slot-empty-inner">
                    <span className="team-card-slot-plus">+</span>
                    <span className="team-card-slot-number">Slot {i + 1}</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
        <div className="team-card-footer">
          <span className="team-card-date">
            Updated {new Date(team.updatedAt).toLocaleDateString()}
          </span>
        </div>
      </div>
    </Link>
  );
}
