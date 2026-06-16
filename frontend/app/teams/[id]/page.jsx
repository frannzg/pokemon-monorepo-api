'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { getTeamById, updateTeam, deleteTeam } from '../../../services/backendApi';
import PokemonSprite from '../../../components/PokemonSprite';
import { useToast } from '../../../components/Toast';
import { useConfirm } from '../../../components/ConfirmModal';
import { TYPE_COLORS, ALL_TYPES, STATS_META, calcTeamWeaknesses } from '../../../lib/constants';
import TeamModal from '../../../components/TeamModal';

export default function TeamDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const showToast = useToast();
  const [confirmModal, confirm] = useConfirm();
  const [team, setTeam] = useState(null);
  const [pokemonData, setPokemonData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dragIdx, setDragIdx] = useState(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await getTeamById(id);
      setTeam(result);
      setPokemonData(result.pokemonData || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { if (id) load(); }, [id]);

  const handleDragStart = (i) => (e) => {
    setDragIdx(i);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', String(i));
  };

  const handleDragOver = (i) => (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (i) => async (e) => {
    e.preventDefault();
    const from = dragIdx;
    if (from === null || from === i) { setDragIdx(null); return; }

    const newData = [...pokemonData];
    const [moved] = newData.splice(from, 1);
    newData.splice(i, 0, moved);
    setPokemonData(newData);
    setDragIdx(null);

    setSaving(true);
    try {
      const newIds = newData.map((p) => p.externalId);
      await updateTeam(id, { pokemon: newIds });
    } catch (err) {
      setError(err.message);
      load();
    } finally {
      setSaving(false);
    }
  };

  const handleDragEnd = () => setDragIdx(null);

  const handleDelete = async () => {
    const ok = await confirm(`Delete team "${team?.name}"?`);
    if (!ok) return;
    setDeleting(true);
    try {
      await deleteTeam(id);
      showToast('Team deleted', 'success');
      router.push('/teams');
    } catch (err) {
      setError(err.message);
    } finally {
      setDeleting(false);
    }
  };

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
  pokemonData.forEach((p) => {
    p.description.split(', ').forEach((t) => { if (!teamTypes.includes(t)) teamTypes.push(t); });
  });

  const teamStats = {};
  pokemonData.forEach((p) => {
    (p?.rawData?.stats || []).forEach((s) => {
      const name = s.stat.name;
      teamStats[name] = (teamStats[name] || 0) + s.base_stat;
    });
  });

  const weaknesses = calcTeamWeaknesses(teamTypes);

  return (
    <div className="container">
      {confirmModal}
      <div className="team-detail">
        <div className="team-detail-header">
          <Link href="/teams" className="back-link">&larr; Teams</Link>
          <div className="team-detail-actions">
            <button
              className="btn btn-sync btn-small"
              onClick={() => setEditModalOpen(true)}
            >
              Edit Team
            </button>
            <button
              className="btn btn-small btn-delete-detail"
              onClick={handleDelete}
              disabled={deleting}
            >
              {deleting ? '...' : '🗑️ Delete'}
            </button>
          </div>
        </div>

        <header className="header" style={{ marginBottom: '1.5rem' }}>
          <div className="header-brand">
            <div className="pokeball-icon" />
            <div>
              <h1>{team.name}</h1>
              <p className="header-subtitle">
                {pokemonData.length}/6 Pokémon {saving && <span style={{ color: '#ffcb05', marginLeft: '0.5rem' }}>Saving...</span>}
              </p>
            </div>
          </div>
        </header>

        <div className="team-detail-grid detail-drag-grid">
          {pokemonData.map((pokemon, i) => {
            const sprite =
              pokemon.rawData?.sprites?.other?.['official-artwork']?.front_default ||
              pokemon.rawData?.sprites?.front_default;
            const types = pokemon.description.split(', ');
            const mainType = types[0];
            const accent = TYPE_COLORS[mainType] || '#999';

            return (
              <div
                key={pokemon.externalId}
                className={`detail-slot ${dragIdx === i ? 'dragging' : ''}`}
                style={{ borderColor: accent }}
                draggable
                onDragStart={handleDragStart(i)}
                onDragOver={handleDragOver(i)}
                onDrop={handleDrop(i)}
                onDragEnd={handleDragEnd}
              >
                <span className="detail-slot-drag-handle">⠿</span>
                <span className="detail-slot-idx">{i + 1}</span>
                <Link href={`/pokemon/${pokemon.externalId}`} className="detail-slot-link">
                  <div className="card" style={{ borderColor: 'transparent', boxShadow: 'none' }}>
                    <div className="card-id">
                      #{pokemon.externalId.padStart(4, '0')}
                    </div>
                    <div className="card-image">
                      <PokemonSprite src={sprite} alt={pokemon.title} width={110} height={110} className="card-img" />
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
              </div>
            );
          })}
          {Array.from({ length: Math.max(0, 6 - pokemonData.length) }).map((_, i) => (
            <div key={`empty-${i}`} className="card team-slot-empty-card">
              <div className="card-image">
                <div className="no-sprite" style={{ fontSize: '1.5rem' }}>
                  Empty
                </div>
              </div>
              <div className="card-body">
                <div className="card-name" style={{ textAlign: 'center', color: '#999' }}>
                  Slot {pokemonData.length + i + 1}
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

        {pokemonData.length > 0 && (
          <div className="team-stats-section">
            <h2 className="section-title">Team Stats</h2>
            <div className="team-stats-grid">
              {Object.entries(STATS_META).map(([key, meta]) => {
                const total = teamStats[key] || 0;
                const max = key === 'hp' ? 6 * 255 : 6 * 200;
                const percent = Math.min(100, (total / max) * 100);
                return (
                  <div key={key} className="stat-row team-stat-row">
                    <span className="stat-label">{meta.label}</span>
                    <span className="stat-value">{total}</span>
                    <div className="stat-bar-bg">
                      <div
                        className="stat-bar-fill"
                        style={{ width: `${percent}%`, backgroundColor: meta.color }}
                      />
                    </div>
                  </div>
                );
              })}
              <div className="stat-row team-stat-row team-stat-total">
                <span className="stat-label">Total BST</span>
                <span className="stat-value">
                  {Object.values(teamStats).reduce((a, b) => a + b, 0)}
                </span>
              </div>
            </div>
          </div>
        )}

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

      {editModalOpen && (
        <TeamModal
          teamId={id}
          onClose={() => setEditModalOpen(false)}
          onSaved={() => { setEditModalOpen(false); load(); }}
        />
      )}
    </div>
  );
}
