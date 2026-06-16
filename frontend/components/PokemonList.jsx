'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
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

export default function PokemonList() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [sortBy, setSortBy] = useState('id');
  const [page, setPage] = useState(1);

  const allTypes = [...new Set(data.flatMap((p) => p.description.split(', ')))];

  const sorted = [...data].sort((a, b) => {
    if (sortBy === 'name') return a.title.localeCompare(b.title);
    return Number(a.externalId) - Number(b.externalId);
  });

  const filtered = sorted.filter((p) => {
    const matchesName = p.title.toLowerCase().includes(search.toLowerCase());
    const matchesType = !typeFilter || p.description.includes(typeFilter);
    return matchesName && matchesType;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  const safePage = Math.min(page, totalPages);
  const paginated = filtered.slice((safePage - 1) * ITEMS_PER_PAGE, safePage * ITEMS_PER_PAGE);

  useEffect(() => { setPage(1); }, [search, typeFilter, sortBy]);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await getExternalData();
      setData(result);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

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
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
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
        <div className="header-actions">
          <button onClick={handleSync} disabled={syncing} className="btn btn-sync">
            {syncing ? (
              <><span className="btn-spinner" /> Syncing...</>
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
              onChange={(e) => setSearch(e.target.value)}
              className="search-input"
            />
          </div>
          <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className="filter-select">
            <option value="">All types</option>
            {allTypes.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
          <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="filter-select">
            <option value="id">Sort by #</option>
            <option value="name">Sort by name</option>
          </select>
        </div>
        {!loading && data.length > 0 && (
          <p className="filter-count">
            {filtered.length} of {data.length} pokemon
            {filtered.length !== data.length && (
              <button className="clear-filter" onClick={() => { setSearch(''); setTypeFilter(''); }}>
                Clear filters
              </button>
            )}
          </p>
        )}
      </div>

      {error && <div className="error-banner"><span className="error-icon">!</span> {error}</div>}

      {(loading || syncing) && (
        <div className="loading-state">
          <div className="pokeball-loader" />
          <p>{syncing ? 'Catching pokemon from PokeAPI...' : 'Loading...'}</p>
        </div>
      )}

      {!loading && !syncing && filtered.length === 0 && (
        <div className="empty-state">
          <div className="empty-icon">?</div>
          <p>{data.length === 0 ? 'No pokemon yet. Hit Sync!' : 'No matches. Try different filters.'}</p>
        </div>
      )}

      {!loading && !syncing && paginated.length > 0 && (
        <>
          <div className="grid">
            {paginated.map((pokemon) => {
              const sprite = pokemon.rawData?.sprites?.other?.['official-artwork']?.front_default
                || pokemon.rawData?.sprites?.front_default;
              const types = pokemon.description.split(', ');

              return (
                <Link
                  key={pokemon.externalId}
                  href={`/pokemon/${pokemon.externalId}`}
                  className="card-link"
                >
                  <div className="card">
                    <div className="card-id">#{pokemon.externalId.padStart(4, '0')}</div>
                    <div className="card-image">
                      {sprite ? (
                        <img src={sprite} alt={pokemon.title} loading="lazy" />
                      ) : (
                        <div className="no-sprite">?</div>
                      )}
                    </div>
                    <div className="card-body">
                      <h3 className="card-name">{pokemon.title}</h3>
                      <div className="card-types">
                        {types.map((type) => (
                          <span key={type} className="type-badge" style={{ backgroundColor: TYPE_COLORS[type] || '#999' }}>
                            {type}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>

          {totalPages > 1 && (
            <div className="pagination">
              <button
                className="page-btn"
                disabled={safePage <= 1}
                onClick={() => setPage(safePage - 1)}
              >
                &laquo; Prev
              </button>
              <div className="page-numbers">
                {pageNumbers.map((num) => (
                  <button
                    key={num}
                    className={`page-num ${num === safePage ? 'active' : ''}`}
                    onClick={() => setPage(num)}
                  >
                    {num}
                  </button>
                ))}
              </div>
              <button
                className="page-btn"
                disabled={safePage >= totalPages}
                onClick={() => setPage(safePage + 1)}
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
