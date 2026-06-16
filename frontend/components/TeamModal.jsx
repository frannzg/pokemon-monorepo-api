'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import {
  getExternalData,
  getTeamById,
  createTeam,
  updateTeam,
} from '../services/backendApi';
import TeamRoster from './TeamRoster';
import { TYPE_COLORS, ALL_TYPES } from '../lib/constants';

const ITEMS_PER_PAGE = 30;

export default function TeamModal({ teamId, initialPokemon, onClose, onSaved }) {
  const [teamName, setTeamName] = useState('Mi equipo');
  const [roster, setRoster] = useState([]);
  const [rosterData, setRosterData] = useState([]);
  const [search, setSearch] = useState('');
  const [pokemonList, setPokemonList] = useState([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (teamId) {
      getTeamById(teamId).then((team) => {
        setTeamName(team.name);
        setRoster(team.pokemon || []);
        setRosterData(team.pokemonData || []);
      }).catch(() => {});
    }
  }, [teamId]);

  useEffect(() => {
    if (initialPokemon && !teamId) {
      setRoster([initialPokemon.externalId]);
      setRosterData([initialPokemon]);
    }
  }, [initialPokemon, teamId]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await getExternalData({
        search: search || undefined,
        page,
        limit: ITEMS_PER_PAGE,
        sort: 'id',
      });
      setPokemonList(result.data);
      setTotal(result.total);
      setTotalPages(result.totalPages);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [search, page]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const addToRoster = (pokemon) => {
    if (roster.length >= 6 || roster.includes(pokemon.externalId)) return;
    setRoster([...roster, pokemon.externalId]);
    setRosterData([...rosterData, pokemon]);
  };

  const removeFromRoster = (externalId) => {
    setRoster(roster.filter((id) => id !== externalId));
    setRosterData(rosterData.filter((p) => p.externalId !== externalId));
  };

  const reorderRoster = (fromIdx, toIdx) => {
    const newIds = [...roster];
    const newData = [...rosterData];
    const [movedId] = newIds.splice(fromIdx, 1);
    const [movedData] = newData.splice(fromIdx, 1);
    newIds.splice(toIdx, 0, movedId);
    newData.splice(toIdx, 0, movedData);
    setRoster(newIds);
    setRosterData(newData);
  };

  const handleRandomTeam = async () => {
    try {
      const result = await getExternalData({ page: 1, limit: 2000, sort: 'id' });
      const all = result.data || [];
      if (all.length === 0) return;
      const shuffled = all.sort(() => Math.random() - 0.5);
      const picked = shuffled.slice(0, 6);
      setRoster(picked.map((p) => p.externalId));
      setRosterData(picked);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleSave = async () => {
    if (roster.length === 0) return;
    setSaving(true);
    setError(null);
    try {
      const data = { name: teamName, pokemon: roster };
      const saved = teamId ? await updateTeam(teamId, data) : await createTeam(data);
      onSaved?.(saved);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content team-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <input
            type="text"
            value={teamName}
            onChange={(e) => setTeamName(e.target.value)}
            className="team-modal-name"
            placeholder="Team name"
            maxLength={40}
          />
          <span className="team-modal-count">{roster.length}/6</span>
          <div className="modal-actions">
            <button className="btn btn-header btn-small" onClick={handleRandomTeam} title="Random team">
              🎲 Random
            </button>
            <button className="btn btn-sync btn-small" onClick={handleSave} disabled={saving || roster.length === 0}>
              {saving ? '...' : 'Save'}
            </button>
            <button className="btn btn-header btn-small" onClick={onClose}>Cancel</button>
          </div>
        </div>

        <TeamRoster roster={rosterData} onRemove={removeFromRoster} onReorder={reorderRoster} />

        <div className="team-modal-search">
          <svg className="search-icon" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8" />
            <path d="M21 21l-4.35-4.35" />
          </svg>
          <input
            type="text"
            placeholder="Search pokemon to add..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="modal-search-input"
          />
        </div>

        {error && <div className="error-banner" style={{ margin: '0.5rem 0' }}><span className="error-icon">!</span> {error}</div>}

        <div className="team-modal-grid">
          {loading && Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="card skeleton" style={{ minHeight: 120 }}>
              <div className="card-image skeleton-pulse" />
            </div>
          ))}
          {!loading && pokemonList.map((pokemon) => {
            const inRoster = roster.includes(pokemon.externalId);
            const sprite = pokemon.rawData?.sprites?.other?.['official-artwork']?.front_default || pokemon.rawData?.sprites?.front_default;
            const types = pokemon.description.split(', ');
            return (
              <div key={pokemon.externalId} className={`team-modal-pokemon ${inRoster ? 'in-roster' : ''}`}>
                <div className="team-modal-pokemon-img">
                  {sprite ? (
                    <Image src={sprite} alt={pokemon.title} width={48} height={48} />
                  ) : (
                    <span className="no-sprite" style={{ width: 48, height: 48, fontSize: '1rem' }}>?</span>
                  )}
                </div>
                <div className="team-modal-pokemon-info">
                  <span className="team-modal-pokemon-name">{pokemon.title}</span>
                  <div className="card-types">
                    {types.map((t) => (
                      <span key={t} className="type-badge" style={{ backgroundColor: TYPE_COLORS[t] || '#999', fontSize: '0.6rem' }}>
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
                <button
                  className={`team-modal-add-btn ${inRoster ? 'added' : ''}`}
                  onClick={() => !inRoster && addToRoster(pokemon)}
                  disabled={inRoster || roster.length >= 6}
                >
                  {inRoster ? '✓' : '+'}
                </button>
              </div>
            );
          })}
          {!loading && pokemonList.length === 0 && !error && (
            <div className="empty-state" style={{ gridColumn: '1/-1', padding: '1rem' }}>
              <p>No pokemon found.</p>
            </div>
          )}
        </div>

        {totalPages > 1 && (
          <div className="pagination" style={{ marginTop: '0.75rem' }}>
            <button className="page-btn" disabled={page <= 1} onClick={() => setPage(page - 1)}>&laquo;</button>
            <div className="page-numbers">
              {(() => {
                const pages = [];
                const range = (lo, hi) => { for (let i = lo; i <= hi; i++) pages.push(i); };
                range(1, Math.min(3, totalPages));
                if (page > 5) pages.push('...');
                range(Math.max(4, page - 1), Math.min(totalPages - 3, page + 1));
                if (page < totalPages - 4) pages.push('...');
                range(Math.max(totalPages - 2, 4), totalPages);
                return [...new Set(pages)].map((p, idx) =>
                  p === '...'
                    ? <span key={`e-${idx}`} className="page-ellipsis">...</span>
                    : <button key={p} className={`page-num ${p === page ? 'active' : ''}`} onClick={() => setPage(p)}>{p}</button>
                );
              })()}
            </div>
            <button className="page-btn" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>&raquo;</button>
          </div>
        )}
      </div>
    </div>
  );
}
