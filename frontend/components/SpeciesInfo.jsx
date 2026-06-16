'use client';

import { useState, useEffect } from 'react';
import { getPokemonSpecies } from '../services/backendApi';

export default function SpeciesInfo({ externalId }) {
  const [species, setSpecies] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!externalId) return;
    setLoading(true);
    setError(null);
    getPokemonSpecies(externalId)
      .then((data) => setSpecies(data))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [externalId]);

  const flavorText = species?.flavor_text_entries
    ?.filter((e) => e.language.name === 'en')
    ?.pop()?.flavor_text;

  const genus = species?.genera
    ?.filter((g) => g.language.name === 'en')
    ?.pop()?.genus;

  if (loading) return null;
  if (error) return null;
  if (!species) return null;

  return (
    <div className="species-info">
      {genus && <p className="species-genus">{genus}</p>}
      {flavorText && (
        <p className="species-flavor">
          {flavorText.replace(/[\n\f]/g, ' ')}
        </p>
      )}
    </div>
  );
}
