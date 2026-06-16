'use client';

import { useState, useRef } from 'react';
import Image from 'next/image';
import { TYPE_COLORS } from '../lib/constants';

export default function TeamRoster({ roster, onRemove, onReorder }) {
  const [dragIdx, setDragIdx] = useState(null);
  const dropRef = useRef(null);

  const MAX_SLOTS = 6;
  const slots = [];

  const handleDragStart = (i) => (e) => {
    setDragIdx(i);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', String(i));
  };

  const handleDragOver = (i) => (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (i) => (e) => {
    e.preventDefault();
    if (dragIdx !== null && dragIdx !== i && onReorder) {
      onReorder(dragIdx, i);
    }
    setDragIdx(null);
  };

  const handleDragEnd = () => setDragIdx(null);

  for (let i = 0; i < MAX_SLOTS; i++) {
    const pokemon = roster[i] || null;
    const sprite =
      pokemon?.rawData?.sprites?.other?.['official-artwork']?.front_default ||
      pokemon?.rawData?.sprites?.front_default;
    const types = pokemon ? pokemon.description.split(', ') : [];
    const mainType = types[0];
    const accent = TYPE_COLORS[mainType] || '#333';

    slots.push(
      <div
        key={pokemon?._id || pokemon?.externalId || `empty-${i}`}
        className={`team-slot ${pokemon ? 'team-slot-filled' : 'team-slot-empty'} ${dragIdx === i ? 'dragging' : ''}`}
        style={pokemon ? { borderColor: accent } : {}}
        draggable={!!pokemon}
        onDragStart={pokemon ? handleDragStart(i) : undefined}
        onDragOver={handleDragOver(i)}
        onDrop={handleDrop(i)}
        onDragEnd={handleDragEnd}
      >
        {pokemon ? (
          <>
            <span className="team-slot-drag-handle">⠿</span>
            {sprite ? (
              <Image
                src={sprite}
                alt={pokemon.title}
                width={64}
                height={64}
                className="team-slot-img"
              />
            ) : (
              <div className="team-slot-placeholder">?</div>
            )}
            <span className="team-slot-name">{pokemon.title}</span>
            <button
              className="btn-remove-slot"
              onClick={() => onRemove(pokemon.externalId)}
              title={`Remove ${pokemon.title}`}
            >
              ✕
            </button>
          </>
        ) : (
          <div className="team-slot-placeholder">+</div>
        )}
        <span className="team-slot-number">{i + 1}</span>
      </div>
    );
  }

  return <div className="team-roster" ref={dropRef}>{slots}</div>;
}
