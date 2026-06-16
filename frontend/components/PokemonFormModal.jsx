'use client';

import { useState } from 'react';
import { createPokemon, updatePokemon } from '../services/backendApi';
import { TYPE_COLORS, ALL_TYPES } from '../lib/constants';

const STAT_LABELS = {
  hp: 'HP',
  attack: 'Attack',
  defense: 'Defense',
  'special-attack': 'Sp. Atk',
  'special-defense': 'Sp. Def',
  speed: 'Speed',
};

function StatInput({ label, value, onChange }) {
  return (
    <div className="pokemon-form-stat">
      <label className="pokemon-form-stat-label">{label}</label>
      <input
        type="number"
        min="0"
        max="255"
        value={value}
        onChange={(e) => onChange(Math.max(0, Math.min(255, parseInt(e.target.value) || 0)))}
        className="pokemon-form-stat-input"
      />
    </div>
  );
}

export default function PokemonFormModal({ pokemon, onClose, onSaved }) {
  const isEdit = !!pokemon;
  const prevRaw = pokemon?.rawData || {};
  const prevStats = {};
  (prevRaw.stats || []).forEach((s) => { prevStats[s.stat.name] = s.base_stat; });

  const [name, setName] = useState(pokemon?.title || '');
  const [types, setTypes] = useState(pokemon?.description ? pokemon.description.split(', ') : []);
  const [hp, setHp] = useState(prevStats.hp || 0);
  const [attack, setAttack] = useState(prevStats.attack || 0);
  const [defense, setDefense] = useState(prevStats.defense || 0);
  const [spAttack, setSpAttack] = useState(prevStats['special-attack'] || 0);
  const [spDefense, setSpDefense] = useState(prevStats['special-defense'] || 0);
  const [speed, setSpeed] = useState(prevStats.speed || 0);
  const [height, setHeight] = useState(prevRaw.height || 0);
  const [weight, setWeight] = useState(prevRaw.weight || 0);
  const [baseXp, setBaseXp] = useState(prevRaw.base_experience || 0);
  const [abilities, setAbilities] = useState(
    (prevRaw.abilities || []).map((a) => a.ability.name).join(', ')
  );
  const [sprite, setSprite] = useState(prevRaw.sprites?.other?.['official-artwork']?.front_default || '');
  const [shinySprite, setShinySprite] = useState(prevRaw.sprites?.other?.['official-artwork']?.front_shiny || '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const toggleType = (t) => {
    setTypes((prev) => prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) { setError('Name is required'); return; }
    if (types.length === 0) { setError('At least one type is required'); return; }
    setSaving(true);
    setError(null);
    try {
      const data = {
        title: name.trim(),
        types,
        stats: { hp, attack, defense, 'special-attack': spAttack, 'special-defense': spDefense, speed },
        height,
        weight,
        baseExperience: baseXp,
        abilities,
        sprite,
        shinySprite,
      };
      const result = isEdit ? await updatePokemon(pokemon.externalId, data) : await createPokemon(data);
      onSaved?.(result);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content pokemon-form-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">{isEdit ? 'Edit Pokemon' : 'Create Pokemon'}</h2>
          <div className="modal-actions">
            <button className="btn btn-sync btn-small" onClick={handleSubmit} disabled={saving}>
              {saving ? '...' : isEdit ? 'Update' : 'Create'}
            </button>
            <button className="btn btn-header btn-small" onClick={onClose}>Cancel</button>
          </div>
        </div>

        {error && <div className="error-banner" style={{ margin: '0 0 1rem' }}><span className="error-icon">!</span> {error}</div>}

        <form onSubmit={handleSubmit} className="pokemon-form">
          <div className="pokemon-form-section">
            <label className="pokemon-form-label">Name *</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="pokemon-form-input" placeholder="Pokemon name" required />
          </div>

          <div className="pokemon-form-section">
            <label className="pokemon-form-label">Types *</label>
            <div className="type-filter-bar">
              {ALL_TYPES.map((t) => (
                <button
                  key={t}
                  type="button"
                  className={`type-filter-badge ${types.includes(t) ? 'active' : ''}`}
                  style={{ backgroundColor: TYPE_COLORS[t] }}
                  onClick={() => toggleType(t)}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          <div className="pokemon-form-section">
            <label className="pokemon-form-label">Base Stats</label>
            <div className="pokemon-form-stats">
              <StatInput label="HP" value={hp} onChange={setHp} />
              <StatInput label="Attack" value={attack} onChange={setAttack} />
              <StatInput label="Defense" value={defense} onChange={setDefense} />
              <StatInput label="Sp. Atk" value={spAttack} onChange={setSpAttack} />
              <StatInput label="Sp. Def" value={spDefense} onChange={setSpDefense} />
              <StatInput label="Speed" value={speed} onChange={setSpeed} />
            </div>
          </div>

          <div className="pokemon-form-row">
            <div className="pokemon-form-section">
              <label className="pokemon-form-label">Height (dm)</label>
              <input type="number" min="0" value={height} onChange={(e) => setHeight(parseInt(e.target.value) || 0)} className="pokemon-form-input" />
            </div>
            <div className="pokemon-form-section">
              <label className="pokemon-form-label">Weight (hg)</label>
              <input type="number" min="0" value={weight} onChange={(e) => setWeight(parseInt(e.target.value) || 0)} className="pokemon-form-input" />
            </div>
            <div className="pokemon-form-section">
              <label className="pokemon-form-label">Base XP</label>
              <input type="number" min="0" value={baseXp} onChange={(e) => setBaseXp(parseInt(e.target.value) || 0)} className="pokemon-form-input" />
            </div>
          </div>

          <div className="pokemon-form-section">
            <label className="pokemon-form-label">Abilities (comma separated)</label>
            <input type="text" value={abilities} onChange={(e) => setAbilities(e.target.value)} className="pokemon-form-input" placeholder="overgrow, chlorophyll" />
          </div>

          <div className="pokemon-form-section">
            <label className="pokemon-form-label">Sprite URL</label>
            <input type="text" value={sprite} onChange={(e) => setSprite(e.target.value)} className="pokemon-form-input" placeholder="https://..." />
          </div>

          <div className="pokemon-form-section">
            <label className="pokemon-form-label">Shiny Sprite URL</label>
            <input type="text" value={shinySprite} onChange={(e) => setShinySprite(e.target.value)} className="pokemon-form-input" placeholder="https://..." />
          </div>
        </form>
      </div>
    </div>
  );
}
