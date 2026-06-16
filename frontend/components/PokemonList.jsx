'use client';

import { useState, useEffect, memo, useCallback, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  getExternalData,
  syncExternalData,
  deleteExternalData,
  deletePokemon,
} from '../services/backendApi';
import TeamModal from './TeamModal';
import PokemonFormModal from './PokemonFormModal';
import { TYPE_COLORS, ALL_TYPES } from '../lib/constants';

const ITEMS_PER_PAGE = 60;

function Pagination({ page, totalPages, onChange }) {
  if (totalPages <= 1) return null;
  const pages = [];
  const range = (lo, hi) => { for (let i = lo; i <= hi; i++) pages.push(i); };

  range(1, Math.min(3, totalPages));
  if (page > 5) { pages.push('...'); }
  range(Math.max(4, page - 1), Math.min(totalPages - 3, page + 1));
  if (page < totalPages - 4) { pages.push('...'); }
  range(Math.max(totalPages - 2, 4), totalPages);

  const uniquePages = [...new Set(pages)];

  return (
    <div className="pagination">
      <button className="page-btn" disabled={page <= 1} onClick={() => onChange(page - 1)}>&laquo; Prev</button>
      <div className="page-numbers">
        {uniquePages.map((p, idx) =>
          p === '...' ? (
            <span key={`ellipsis-${idx}`} className="page-ellipsis">...</span>
          ) : (
            <button key={p} className={`page-num ${p === page ? 'active' : ''}`} onClick={() => onChange(p)}>{p}</button>
          )
        )}
      </div>
      <button className="page-btn" disabled={page >= totalPages} onClick={() => onChange(page + 1)}>Next &raquo;</button>
    </div>
  );
}

const PokemonCard = memo(function PokemonCard({ pokemon, onAddToTeam, onEdit, onDelete, isFavorite, onToggleFavorite }) {
  const sprite =
    pokemon.rawData?.sprites?.other?.['official-artwork']?.front_default ||
    pokemon.rawData?.sprites?.front_default;
  const types = pokemon.description.split(', ');

  return (
    <div className="card-link-wrapper">
      <Link href={`/pokemon/${pokemon.externalId}`} className="card-link">
        <div className="card">
          <div className="card-id">#{pokemon.externalId.padStart(4, '0')}</div>
          <button
            className={`btn-fav ${isFavorite ? 'fav-active' : ''}`}
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); onToggleFavorite(pokemon.externalId); }}
            title={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
          >
            {isFavorite ? '★' : '☆'}
          </button>
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
      <button
        className="btn-card-add"
        onClick={(e) => { e.preventDefault(); onAddToTeam(pokemon); }}
        title="Add to team"
      >
        +
      </button>
      <div className="card-actions">
        <button
          className="btn-card-action btn-card-edit"
          onClick={(e) => { e.preventDefault(); onEdit(pokemon); }}
          title="Edit"
        >
          ✏️
        </button>
        <button
          className="btn-card-action btn-card-delete"
          onClick={(e) => { e.preventDefault(); onDelete(pokemon); }}
          title="Delete"
        >
          🗑️
        </button>
      </div>
    </div>
  );
});

function SkeletonCard() {
  return (
    <div className="card skeleton">
      <div className="card-image skeleton-pulse" />
      <div className="card-body">
        <div className="skeleton-line skeleton-pulse" style={{ width: '70%', height: 14 }} />
        <div style={{ display: 'flex', gap: 4, marginTop: 8 }}>
          <div className="skeleton-line skeleton-pulse" style={{ width: 50, height: 20 }} />
          <div className="skeleton-line skeleton-pulse" style={{ width: 40, height: 20 }} />
        </div>
      </div>
    </div>
  );
}

export default function PokemonList() {
  const [data, setData] = useState([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [typeFilter, setTypeFilter] = useState([]);
  const [sortBy, setSortBy] = useState('id');
  const [page, setPage] = useState(1);
  const [menuOpen, setMenuOpen] = useState(false);
  const [favorites, setFavorites] = useState(() => {
    try { return JSON.parse(localStorage.getItem('pokemon-favs') || '[]'); }
    catch { return []; }
  });
  const [favoriteFilter, setFavoriteFilter] = useState(false);

  const [teamModalOpen, setTeamModalOpen] = useState(false);
  const [teamModalPokemon, setTeamModalPokemon] = useState(null);
  const [formModalOpen, setFormModalOpen] = useState(false);
  const [editingPokemon, setEditingPokemon] = useState(null);

  const toggleFavorite = (id) => {
    setFavorites((prev) => {
      const next = prev.includes(id) ? prev.filter((f) => f !== id) : [...prev, id];
      localStorage.setItem('pokemon-favs', JSON.stringify(next));
      return next;
    });
  };

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await getExternalData({
        search: search || undefined,
        type: typeFilter.length > 0 ? typeFilter.join(',') : undefined,
        page,
        limit: ITEMS_PER_PAGE,
        sort: sortBy,
      });
      let filtered = result.data;
      if (favoriteFilter) {
        filtered = filtered.filter((p) => favorites.includes(p.externalId));
      }
      setData(filtered);
      setTotal(result.total);
      setTotalPages(result.totalPages);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [search, typeFilter, page, sortBy, favoriteFilter, favorites]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleSync = async () => {
    setSyncing(true);
    setError(null);
    try {
      await syncExternalData();
      await fetchData();
    } catch (err) {
      setError(err.message);
    } finally {
      setSyncing(false);
    }
  };

  const handleDeleteAll = async () => {
    if (!confirm('Delete ALL pokemon data?')) return;
    setLoading(true);
    setError(null);
    try {
      await deleteExternalData();
      setData([]);
      setTotal(0);
      setTotalPages(0);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePokemon = async (pokemon) => {
    if (!confirm(`Delete ${pokemon.title}?`)) return;
    try {
      await deletePokemon(pokemon.externalId);
      await fetchData();
    } catch (err) {
      setError(err.message);
    }
  };

  const openTeamModal = (pokemon = null) => {
    setTeamModalPokemon(pokemon);
    setTeamModalOpen(true);
  };

  const openFormModal = (pokemon = null) => {
    setEditingPokemon(pokemon);
    setFormModalOpen(true);
  };

  const handleFormSaved = async () => {
    setFormModalOpen(false);
    setEditingPokemon(null);
    await fetchData();
  };

  const searchTimerRef = useRef(null);
  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchInput(value);
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    searchTimerRef.current = setTimeout(() => {
      setSearch(value);
      setPage(1);
    }, 300);
  };
  const handleSortChange = (e) => { setSortBy(e.target.value); setPage(1); };

  return (
    <div className="container">
      <header className="header">
        <div className="header-brand">
          <div className="pokeball-icon" />
          <div>
            <h1>Pokédex</h1>
            <p className="header-subtitle">Gotta fetch &apos;em all!</p>
          </div>
        </div>
        <button
          className={`menu-toggle ${menuOpen ? 'open' : ''}`}
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Toggle menu"
        >
          <span /><span /><span />
        </button>
        <div className={`header-actions ${menuOpen ? 'open' : ''}`}>
          <button onClick={() => openTeamModal()} className="btn btn-sync">
            Teams
          </button>
          <button onClick={() => openFormModal()} className="btn btn-header">
            + Pokemon
          </button>
          <button onClick={handleSync} disabled={syncing} className="btn btn-sync">
            {syncing ? <><span className="btn-spinner" /> Syncing...</> : 'Sync'}
          </button>
          <button onClick={handleDeleteAll} disabled={loading || data.length === 0} className="btn btn-delete">
            Delete all
          </button>
        </div>
      </header>

      <div className="filters-bar">
        <div className="filters-row">
          <div className="search-wrap">
            <svg className="search-icon" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8" />
              <path d="M21 21l-4.35-4.35" />
            </svg>
            <input type="text" placeholder="Search pokemon..." value={searchInput} onChange={handleSearchChange} className="search-input" />
          </div>
          <div className="filter-header">
            <span className="filter-label">Tipo {typeFilter.length > 0 && `(${typeFilter.length})`}</span>
            {typeFilter.length > 0 && (
              <button className="filter-reset-btn" onClick={() => { setTypeFilter([]); setPage(1); }}>✕ Limpiar</button>
            )}
          </div>
          <div className="type-filter-bar">
            {ALL_TYPES.map((type) => (
              <button
                key={type}
                className={`type-filter-badge ${typeFilter.includes(type) ? 'active' : ''}`}
                style={{ backgroundColor: TYPE_COLORS[type] }}
                onClick={() => { setTypeFilter(prev => prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]); setPage(1); }}
              >
                {type}
              </button>
            ))}
          </div>
          <select value={sortBy} onChange={handleSortChange} className="filter-select">
            <option value="id">Sort by #</option>
            <option value="name">Sort by name</option>
          </select>
          <button
            className={`btn btn-fav-filter ${favoriteFilter ? 'fav-active' : ''}`}
            onClick={() => { setFavoriteFilter(!favoriteFilter); setPage(1); }}
            title="Show favorites only"
          >
            {favoriteFilter ? '★ Favorites' : '☆ Favorites'}
          </button>
        </div>
        {!loading && total > 0 && (
          <p className="filter-count">
            {data.length} of {total} pokemon {favoriteFilter && `(favorites: ${favorites.length})`}
            {(search || typeFilter.length > 0 || favoriteFilter) && (
              <button className="clear-filter" onClick={() => { setSearchInput(''); setSearch(''); setTypeFilter([]); setPage(1); setFavoriteFilter(false); }}>Clear filters</button>
            )}
          </p>
        )}
      </div>

      {error && (
        <div className="error-banner">
          <span className="error-icon">!</span> {error}
        </div>
      )}

      {syncing && (
        <div className="loading-state">
          <div className="pokeball-loader" />
          <p>Catching pokemon from PokeAPI...</p>
        </div>
      )}

      {loading && !syncing && (
        <div className="grid">
          {Array.from({ length: 12 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      )}

      {!loading && !syncing && data.length === 0 && !error && (
        <div className="empty-state">
          <div className="empty-icon">?</div>
          <p>{total === 0 ? 'No pokemon yet. Hit Sync!' : favoriteFilter ? 'No favorites yet. Star some Pokémon!' : 'No matches. Try different filters.'}</p>
        </div>
      )}

      {!loading && !syncing && data.length > 0 && (
        <>
          <div className="grid staggered-fade">
            {data.map((pokemon) => (
              <PokemonCard
                key={pokemon.externalId}
                pokemon={pokemon}
                onAddToTeam={openTeamModal}
                onEdit={openFormModal}
                onDelete={handleDeletePokemon}
                isFavorite={favorites.includes(pokemon.externalId)}
                onToggleFavorite={toggleFavorite}
              />
            ))}
          </div>

          <Pagination page={page} totalPages={totalPages} onChange={setPage} />
        </>
      )}

      {teamModalOpen && (
        <TeamModal
          initialPokemon={teamModalPokemon}
          onClose={() => { setTeamModalOpen(false); setTeamModalPokemon(null); }}
          onSaved={() => { setTeamModalOpen(false); setTeamModalPokemon(null); }}
        />
      )}

      {formModalOpen && (
        <PokemonFormModal
          pokemon={editingPokemon}
          onClose={() => { setFormModalOpen(false); setEditingPokemon(null); }}
          onSaved={handleFormSaved}
        />
      )}
    </div>
  );
}
