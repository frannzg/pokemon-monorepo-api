'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { getPokemonById, getPokemonEvolution } from '../services/backendApi';

function parseChain(chain) {
  const speciesId = chain.species.url.split('/').filter(Boolean).pop();
  const evo = { name: chain.species.name, id: speciesId, details: [] };
  if (chain.evolution_details?.length) {
    chain.evolution_details.forEach((d) => {
      const detail = [];
      if (d.min_level) detail.push(`Lv.${d.min_level}`);
      if (d.item) detail.push(d.item.name.replace('-', ' '));
      if (d.trigger?.name === 'trade') detail.push('Trade');
      if (d.held_item) detail.push(`Hold ${d.held_item.name.replace('-', ' ')}`);
      evo.details.push(detail.join(' + '));
    });
  }
  if (chain.evolves_to?.length) {
    evo.evolvesTo = chain.evolves_to.map((c) => parseChain(c));
  }
  return evo;
}

function EvoNode({ node, sprites, compact }) {
  const sprite = sprites[node.id];
  return (
    <div className={`evo-node ${node.id >= 100000 ? 'evo-custom' : ''}`}>
      <Link href={`/pokemon/${node.id}`}>
        <div className="evo-sprite-wrap">
          {sprite ? (
            <img src={sprite} alt={node.name} width={compact ? 64 : 80} height={compact ? 64 : 80} />
          ) : (
            <div className="evo-placeholder">?</div>
          )}
        </div>
        <div className="evo-name">{node.name}</div>
      </Link>
      {node.details.length > 0 && (
        <div className="evo-details">{node.details.join(' / ')}</div>
      )}
    </div>
  );
}

function EvoBranch({ chain, sprites, compact }) {
  return (
    <div className="evo-branch">
      <EvoNode node={chain} sprites={sprites} compact={compact} />
      {chain.evolvesTo && chain.evolvesTo.length > 0 && (
        <div className="evo-children">
          {chain.evolvesTo.map((child, i) => (
            <div key={i} className="evo-child-group">
              <div className="evo-arrow">&rarr;</div>
              <EvoBranch chain={child} sprites={sprites} compact={compact} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function EvolutionChain({ externalId }) {
  const [chain, setChain] = useState(null);
  const [sprites, setSprites] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!externalId) return;
    setLoading(true);
    setError(null);
    getPokemonEvolution(externalId)
      .then((evoData) => {
        const parsed = parseChain(evoData.chain);
        setChain(parsed);
        const ids = [];
        function collectIds(node) {
          ids.push(node.id);
          (node.evolvesTo || []).forEach(collectIds);
        }
        collectIds(parsed);
        return ids;
      })
      .then((ids) =>
        Promise.allSettled(ids.map((id) => getPokemonById(id)))
      )
      .then((results) => {
        const spriteMap = {};
        results.forEach((r) => {
          if (r.status === 'fulfilled' && r.value) {
            const raw = r.value.rawData;
            spriteMap[r.value.externalId] =
              raw?.sprites?.other?.['official-artwork']?.front_default ||
              raw?.sprites?.front_default;
          }
        });
        setSprites(spriteMap);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [externalId]);

  if (loading) return <div className="evo-loading">Loading evolution...</div>;
  if (error) return <div className="evo-error">Evolution data unavailable</div>;
  if (!chain) return null;

  return (
    <div className="evolution-chain">
      <h2 className="section-title">Evolution Chain</h2>
      <div className="evo-tree">
        <EvoBranch chain={chain} sprites={sprites} />
      </div>
    </div>
  );
}
