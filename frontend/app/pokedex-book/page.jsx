'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { getPokemonList } from '../../services/backendApi';
import PokemonSprite from '../../components/PokemonSprite';
import { TYPE_COLORS, ALL_TYPES } from '../../lib/constants';

const ITEMS_PER_PAGE = 30;

function PokedexRow({ pokemon, selected, onSelect }) {
  const sprite = pokemon.rawData?.sprites?.front_default || pokemon.rawData?.sprites?.other?.['official-artwork']?.front_default;
  const types = pokemon.types.split(', ');
  const isActive = selected?.pokemonId === pokemon.pokemonId;

  return (
    <button
      data-id={pokemon.pokemonId}
      className={`ds-row ${isActive ? 'active' : ''}`}
      onClick={() => onSelect(pokemon)}
    >
      <span className="ds-row-num">#{pokemon.pokemonId.padStart(4, '0')}</span>
      <div className="ds-row-sprite">
        <PokemonSprite src={sprite} alt="" width={36} height={36} />
      </div>
      <span className="ds-row-name">{pokemon.name}</span>
      <div className="ds-row-types">
        {types.map(t => (
          <span key={t} className="ds-row-type" style={{ backgroundColor: TYPE_COLORS[t] }}>
            {t.slice(0, 3)}
          </span>
        ))}
      </div>
    </button>
  );
}

export default function PokedexBookPage() {
  const [data, setData] = useState([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [typeFilter, setTypeFilter] = useState([]);
  const [selected, setSelected] = useState(null);
  const [fadeKey, setFadeKey] = useState(0);
  const [showAllTypes, setShowAllTypes] = useState(false);
  const listRef = useRef(null);
  const topRef = useRef(null);
  const prevSelectedRef = useRef(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const result = await getPokemonList({
        search: search || undefined,
        type: typeFilter.length > 0 ? typeFilter.join(',') : undefined,
        page,
        limit: ITEMS_PER_PAGE,
        sort: 'id',
      });
      setData(result.data);
      setTotal(result.total);
      setTotalPages(result.totalPages);
      if (!selected && result.data.length > 0) {
        setSelected(result.data[0]);
      }
    } catch { setData([]); }
    setLoading(false);
  }, [search, typeFilter, page]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const searchTimerRef = useRef(null);
  const handleSearchChange = (e) => {
    setSearchInput(e.target.value);
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    searchTimerRef.current = setTimeout(() => {
      setSearch(e.target.value);
      setPage(1);
    }, 300);
  };

  const handleSelect = (pokemon) => {
    if (selected?.pokemonId !== pokemon.pokemonId) {
      prevSelectedRef.current = selected;
      setFadeKey(k => k + 1);
    }
    setSelected(pokemon);
    if (listRef.current) {
      const el = listRef.current.querySelector(`[data-id="${pokemon.pokemonId}"]`);
      if (el) el.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }
  };

  const visibleTypes = showAllTypes ? ALL_TYPES : ALL_TYPES.slice(0, 6);
  const selectedSprite = selected?.rawData?.sprites?.other?.['official-artwork']?.front_default || selected?.rawData?.sprites?.front_default;
  const selectedTypes = selected ? selected.types.split(', ') : [];

  return (
    <div className="container ds-page">
      <div className="ds-console">
        <div className="ds-top-screen">
          <div className="ds-screen-label">POKéDEX</div>
          {selected ? (
            <div key={fadeKey} className="ds-top-content ds-fade-in" ref={topRef}>
              <div className="ds-sprite-wrap">
                <Link href={`/pokemon/${selected.pokemonId}`}>
                  <PokemonSprite src={selectedSprite} alt={selected.name} width={140} height={140} priority />
                </Link>
              </div>
              <div className="ds-top-info">
                <div className="ds-top-number">#{selected.pokemonId.padStart(4, '0')}</div>
                <div className="ds-top-name">{selected.name}</div>
                <div className="ds-top-types">
                  {selectedTypes.map(t => (
                    <span key={t} className="type-badge ds-type-badge" style={{ backgroundColor: TYPE_COLORS[t] }}>
                      {t}
                    </span>
                  ))}
                </div>
                <div className="ds-top-meta">
                  <span className="ds-top-meta-item">
                    HT: {selected.rawData?.height ? (selected.rawData.height * 10) + ' cm' : '??'}
                  </span>
                  <span className="ds-top-meta-divider">|</span>
                  <span className="ds-top-meta-item">
                    WT: {selected.rawData?.weight ? (selected.rawData.weight / 10) + ' kg' : '??'}
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <div className="ds-top-empty">
              <span>Select a Pokémon</span>
            </div>
          )}
          <div className="ds-screen-glare" />
        </div>

        <div className="ds-hinge" />

        <div className="ds-bottom-screen">
          <div className="ds-bottom-header">
            <div className="ds-search-wrap">
              <svg className="ds-search-icon" viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" />
              </svg>
              <input
                type="text"
                className="ds-search-input"
                placeholder="Search..."
                value={searchInput}
                onChange={handleSearchChange}
              />
            </div>
            <div className="ds-type-filter">
              {visibleTypes.map(t => (
                <button
                  key={t}
                  className={`ds-type-chip ${typeFilter.includes(t) ? 'active' : ''}`}
                  style={typeFilter.includes(t) ? { backgroundColor: TYPE_COLORS[t], borderColor: TYPE_COLORS[t] } : {}}
                  onClick={() => { setTypeFilter(prev => prev.includes(t) ? prev.filter(x => x !== t) : [t]); setPage(1); }}
                >
                  {t}
                </button>
              ))}
              {ALL_TYPES.length > 6 && (
                <button className="ds-type-more" onClick={() => setShowAllTypes(s => !s)}>
                  {showAllTypes ? '▲' : '▼'}
                </button>
              )}
              {typeFilter.length > 0 && (
                <button className="ds-type-clear" onClick={() => { setTypeFilter([]); setPage(1); }}>✕</button>
              )}
            </div>
          </div>

          <div className="ds-list" ref={listRef}>
            {loading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="ds-row ds-row-skeleton">
                  <span className="ds-row-num skeleton-pulse" style={{ display: 'inline-block', width: 36, height: 12 }} />
                  <div className="ds-row-sprite skeleton-pulse" style={{ width: 36, height: 36, borderRadius: 4 }} />
                  <span className="ds-row-name skeleton-pulse" style={{ display: 'inline-block', width: 100, height: 14 }} />
                </div>
              ))
            ) : data.length === 0 ? (
              <div className="ds-loading">No Pokémon found</div>
            ) : (
              data.map(pokemon => (
                <PokedexRow key={pokemon.pokemonId} pokemon={pokemon} selected={selected} onSelect={handleSelect} />
              ))
            )}
          </div>

          <div className="ds-bottom-controls">
            <div className="ds-dpad">
              <div className="ds-dpad-up" />
              <div className="ds-dpad-down" />
              <div className="ds-dpad-left" />
              <div className="ds-dpad-right" />
              <div className="ds-dpad-center" />
            </div>

            {totalPages > 1 && (
              <div className="ds-pagination">
                <button className="ds-page-btn" disabled={page <= 1} onClick={() => setPage(p => Math.max(1, p - 1))}>
                  ◀
                </button>
                <span className="ds-page-info">{page} / {totalPages}</span>
                <button className="ds-page-btn" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>
                  ▶
                </button>
              </div>
            )}

            <div className="ds-ab-buttons">
              <div className="ds-btn ds-btn-b">B</div>
              <div className="ds-btn ds-btn-a">A</div>
            </div>
          </div>

          <div className="ds-bottom-glare" />
        </div>
      </div>
    </div>
  );
}
