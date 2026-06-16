'use client';

import { useState, useEffect, memo, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  getExternalData,
  syncExternalData,
  deleteExternalData,
} from '../services/backendApi';

const ITEMS_PER_PAGE = 60;

const TYPE_COLORS = {
  normal: '#A8A77A', fire: '#EE8130', water: '#6390F0',
  electric: '#F7D02C', grass: '#7AC74C', ice: '#96D9D6',
  fighting: '#C22E28', poison: '#A33EA1', ground: '#E2BF65',
  flying: '#A98FF3', psychic: '#F95587', bug: '#A6B91A',
  rock: '#B6A136', ghost: '#735797', dragon: '#6F35FC',
  dark: '#705746', steel: '#B7B7CE', fairy: '#D685AD',
};

const ALL_POKEMON_TYPES = Object.keys(TYPE_COLORS);

const PokemonCard = memo(function PokemonCard({ pokemon }) {
  const sprite =
    pokemon.rawData?.sprites?.other?.['official-artwork']?.front_default ||
    pokemon.rawData?.sprites?.front_default;
  const types = pokemon.description.split(', ');

  return (
    <Link href={`/pokemon/${pokemon.externalId}`} className="card-link">
      <div className="card">
        <div className="card-id">#{pokemon.externalId.padStart(4, '0')}</div>
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
  const [typeFilter, setTypeFilter] = useState([]);
  const [sortBy, setSortBy] = useState('id');
  const [page, setPage] = useState(1);
  const [menuOpen, setMenuOpen] = useState(false);

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
      setData(result.data);
      setTotal(result.total);
      setTotalPages(result.totalPages);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [search, typeFilter, page, sortBy]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

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

  const handleDelete = async () => {
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

  const handleSearchChange = (e) => {
    setSearch(e.target.value);
    setPage(1);
  };

  const handleSortChange = (e) => {
    setSortBy(e.target.value);
    setPage(1);
  };

  const pageNumbers = [];
  for (let i = 1; i <= totalPages; i++) {
    pageNumbers.push(i);
  }

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
          <button onClick={handleSync} disabled={syncing} className="btn btn-sync">
            {syncing ? (
              <>
                <span className="btn-spinner" /> Syncing...
              </>
            ) : (
              'Sync from PokeAPI'
            )}
          </button>
          <button
            onClick={handleDelete}
            disabled={loading || data.length === 0}
            className="btn btn-delete"
          >
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
            <input
              type="text"
              placeholder="Search pokemon..."
              value={search}
              onChange={handleSearchChange}
              className="search-input"
            />
          </div>
          <div className="filter-header">
            <span className="filter-label">Tipo {typeFilter.length > 0 && `(${typeFilter.length})`}</span>
            {typeFilter.length > 0 && (
              <button className="filter-reset-btn" onClick={() => { setTypeFilter([]); setPage(1); }}>
                ✕ Limpiar
              </button>
            )}
          </div>
          <div className="type-filter-bar">
            {ALL_POKEMON_TYPES.map((type) => (
              <button
                key={type}
                className={`type-filter-badge ${typeFilter.includes(type) ? 'active' : ''}`}
                style={{ backgroundColor: TYPE_COLORS[type] }}
                onClick={() => {
                  setTypeFilter(prev => prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]);
                  setPage(1);
                }}
              >
                {type}
              </button>
            ))}
          </div>
          <select value={sortBy} onChange={handleSortChange} className="filter-select">
            <option value="id">Sort by #</option>
            <option value="name">Sort by name</option>
          </select>
        </div>
        {!loading && total > 0 && (
          <p className="filter-count">
            {data.length} of {total} pokemon
            {(search || typeFilter.length > 0) && (
              <button className="clear-filter" onClick={() => { setSearch(''); setTypeFilter([]); setPage(1); }}>
                Clear filters
              </button>
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
          {Array.from({ length: 12 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      )}

      {!loading && !syncing && data.length === 0 && !error && (
        <div className="empty-state">
          <div className="empty-icon">?</div>
          <p>{total === 0 ? 'No pokemon yet. Hit Sync!' : 'No matches. Try different filters.'}</p>
        </div>
      )}

      {!loading && !syncing && data.length > 0 && (
        <>
          <div className="grid staggered-fade">
            {data.map((pokemon) => (
              <PokemonCard key={pokemon.externalId} pokemon={pokemon} />
            ))}
          </div>

          {totalPages > 1 && (
            <div className="pagination">
              <button
                className="page-btn"
                disabled={page <= 1}
                onClick={() => setPage(page - 1)}
              >
                &laquo; Prev
              </button>
              <div className="page-numbers">
                {pageNumbers.map((num) => (
                  <button
                    key={num}
                    className={`page-num ${num === page ? 'active' : ''}`}
                    onClick={() => setPage(num)}
                  >
                    {num}
                  </button>
                ))}
              </div>
              <button
                className="page-btn"
                disabled={page >= totalPages}
                onClick={() => setPage(page + 1)}
              >
                Next &raquo;
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
