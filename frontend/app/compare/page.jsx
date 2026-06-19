'use client';

import { Suspense, useState, useEffect, useRef, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { getPokemonList, getPokemonById } from '../../services/backendApi';
import PokemonSprite from '../../components/PokemonSprite';
import CompareRadar from '../../components/CompareRadar';
import { TYPE_COLORS, STATS_META } from '../../lib/constants';

const STAT_NAMES = ['hp', 'attack', 'defense', 'special-attack', 'special-defense', 'speed'];

function highlightText(text, query) {
  if (!query.trim()) return text;
  const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const parts = text.split(new RegExp(`(${escaped})`, 'gi'));
  return parts.map((part, i) =>
    part.toLowerCase() === query.toLowerCase()
      ? <span key={i} className="compare-search-highlight">{part}</span>
      : part
  );
}

function PokemonSelector({ index, pokemon, pokemonData, search, results, loading, onSearchChange, onSelect, onClear, inputRef, onDragStart, onDragOver, onDrop }) {
  const [open, setOpen] = useState(false);
  const [focusIdx, setFocusIdx] = useState(-1);
  const ref = useRef(null);
  const listRef = useRef(null);

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  useEffect(() => { setFocusIdx(-1); }, [results]);

  const handleKeyDown = (e) => {
    if (!open || results.length === 0) return;
    if (e.key === 'ArrowDown') { e.preventDefault(); setFocusIdx(i => Math.min(i + 1, results.length - 1)); }
    if (e.key === 'ArrowUp') { e.preventDefault(); setFocusIdx(i => Math.max(i - 1, 0)); }
    if (e.key === 'Enter' && focusIdx >= 0) { e.preventDefault(); onSelect(results[focusIdx]); setOpen(false); }
    if (e.key === 'Escape') { setOpen(false); }
  };

  useEffect(() => {
    if (focusIdx >= 0 && listRef.current) {
      const el = listRef.current.children[focusIdx];
      if (el) el.scrollIntoView({ block: 'nearest' });
    }
  }, [focusIdx]);

  const sprite = pokemonData?.rawData?.sprites?.other?.['official-artwork']?.front_default || pokemonData?.rawData?.sprites?.front_default;
  const types = pokemonData ? pokemonData.types.split(', ') : [];

  return (
    <div
      className={`compare-slot ${pokemon ? 'compare-slot-filled' : ''}`}
      ref={ref}
      draggable={!!pokemon}
      onDragStart={pokemon ? (e) => { e.dataTransfer.effectAllowed = 'move'; onDragStart(index); } : undefined}
      onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; onDragOver(index); }}
      onDrop={(e) => { e.preventDefault(); onDrop(index); }}
    >
      <div className="compare-slot-header">
        <span className="compare-slot-label">
          {pokemon ? <span className="compare-slot-drag-hint">⠿</span> : null}
          Pokémon {index + 1}
        </span>
        {pokemon && <button className="compare-slot-clear" onClick={onClear}>✕</button>}
      </div>

      {!pokemon ? (
        <div className="compare-search-wrap">
          <svg className="search-icon" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" />
          </svg>
          <input
            ref={inputRef}
            type="text"
            className="compare-search-input"
            placeholder="Search Pokémon..."
            value={search}
            onChange={(e) => { onSearchChange(e.target.value); setOpen(true); }}
            onFocus={() => setOpen(true)}
            onKeyDown={handleKeyDown}
          />
          {open && results.length > 0 && (
            <div className="compare-search-dropdown" ref={listRef}>
              {results.map((p, i) => {
                const s = p.rawData?.sprites?.other?.['official-artwork']?.front_default || p.rawData?.sprites?.front_default;
                return (
                  <button
                    key={p.pokemonId}
                    className={`compare-search-item ${i === focusIdx ? 'focused' : ''}`}
                    onMouseEnter={() => setFocusIdx(i)}
                    onClick={() => { onSelect(p); setOpen(false); }}
                  >
                    <img src={s} alt={p.name} width={36} height={36} className="compare-search-item-sprite" loading="lazy" />
                    <span className="compare-search-item-id">#{p.pokemonId.padStart(4, '0')}</span>
                    <span className="compare-search-item-name">{highlightText(p.name, search)}</span>
                  </button>
                );
              })}
            </div>
          )}
          {loading && <div className="compare-search-loading"><span className="btn-spinner" /></div>}
        </div>
      ) : (
        <div className="compare-selected">
          <div className="compare-selected-sprite">
            <PokemonSprite src={sprite} alt={pokemonData.name} width={140} height={140} />
          </div>
          <Link href={`/pokemon/${pokemonData.pokemonId}`} className="compare-selected-name">{pokemonData.name}</Link>
          <div className="compare-selected-types">
            {types.map((t) => (
              <span key={t} className="type-badge" style={{ backgroundColor: TYPE_COLORS[t] || '#999' }}>{t}</span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function SkeletonSlot() {
  return (
    <div className="compare-slot compare-skeleton">
      <div className="compare-slot-header">
        <span className="compare-slot-label skeleton-pulse" style={{ width: 80, height: 14, display: 'inline-block' }} />
      </div>
      <div className="compare-selected">
        <div className="compare-selected-sprite">
          <div className="skeleton-pulse" style={{ width: 100, height: 100, borderRadius: '50%' }} />
        </div>
        <div className="skeleton-pulse" style={{ width: 120, height: 20, marginTop: 8 }} />
        <div style={{ display: 'flex', gap: 4, marginTop: 8 }}>
          <div className="skeleton-pulse" style={{ width: 50, height: 18 }} />
          <div className="skeleton-pulse" style={{ width: 40, height: 18 }} />
        </div>
      </div>
    </div>
  );
}

function ComparePageContent() {
  const searchParams = useSearchParams();

  const router = useRouter();
  const input1Ref = useRef(null);

  const [search1, setSearch1] = useState('');
  const [search2, setSearch2] = useState('');
  const [results1, setResults1] = useState([]);
  const [results2, setResults2] = useState([]);
  const [searchLoading1, setSearchLoading1] = useState(false);
  const [searchLoading2, setSearchLoading2] = useState(false);
  const [pokemon1, setPokemon1] = useState(null);
  const [pokemon2, setPokemon2] = useState(null);
  const [pokemonData1, setPokemonData1] = useState(null);
  const [pokemonData2, setPokemonData2] = useState(null);
  const [loadingDetail1, setLoadingDetail1] = useState(false);
  const [loadingDetail2, setLoadingDetail2] = useState(false);
  const [statsAnimated, setStatsAnimated] = useState(false);
  const [dragIdx, setDragIdx] = useState(null);
  const timer1 = useRef(null);
  const timer2 = useRef(null);

  const stats1 = {};
  const stats2 = {};
  if (pokemonData1 && pokemonData2) {
    (pokemonData1.rawData?.stats || []).forEach((s) => { stats1[s.stat.name] = s.base_stat; });
    (pokemonData2.rawData?.stats || []).forEach((s) => { stats2[s.stat.name] = s.base_stat; });
  }
  const bst1 = Object.values(stats1).reduce((a, b) => a + b, 0);
  const bst2 = Object.values(stats2).reduce((a, b) => a + b, 0);
  const ready = pokemonData1 && pokemonData2;

  useEffect(() => { if (input1Ref.current) input1Ref.current.focus(); }, []);

  useEffect(() => {
    if (!ready) return;
    setStatsAnimated(false);
    const t = setTimeout(() => setStatsAnimated(true), 100);
    return () => clearTimeout(t);
  }, [ready]);

  const doSearch = useCallback(async (query, setResults, setLoading) => {
    if (!query.trim()) { setResults([]); setLoading(false); return; }
    setLoading(true);
    try {
      const result = await getPokemonList({ search: query, limit: 10, sort: 'id' });
      setResults(result.data || []);
    } catch { setResults([]); }
    setLoading(false);
  }, []);

  const handleSearchChange1 = (val) => {
    setSearch1(val);
    if (timer1.current) clearTimeout(timer1.current);
    timer1.current = setTimeout(() => doSearch(val, setResults1, setSearchLoading1), 300);
  };

  const handleSearchChange2 = (val) => {
    setSearch2(val);
    if (timer2.current) clearTimeout(timer2.current);
    timer2.current = setTimeout(() => doSearch(val, setResults2, setSearchLoading2), 300);
  };

  const selectPokemon = async (slot, p) => {
    const setPokemon = slot === 1 ? setPokemon1 : setPokemon2;
    const setPokemonData = slot === 1 ? setPokemonData1 : setPokemonData2;
    const setSearch = slot === 1 ? setSearch1 : setSearch2;
    const setResults = slot === 1 ? setResults1 : setResults2;
    const setLoadingDetail = slot === 1 ? setLoadingDetail1 : setLoadingDetail2;

    setPokemon(p.pokemonId);
    setSearch('');
    setResults([]);
    setLoadingDetail(true);
    try {
      const detail = await getPokemonById(p.pokemonId);
      setPokemonData(detail);
    } catch { setPokemonData(p); }
    setLoadingDetail(false);

    updateURL(slot === 1 ? p.pokemonId : undefined, slot === 2 ? p.pokemonId : undefined);
  };

  const clearPokemon = (slot) => {
    if (slot === 1) { setPokemon1(null); setPokemonData1(null); setSearch1(''); setResults1([]); }
    else { setPokemon2(null); setPokemonData2(null); setSearch2(''); setResults2([]); }
    updateURL(slot === 1 ? null : undefined, slot === 2 ? null : undefined);
  };

  const updateURL = (p1, p2) => {
    const params = new URLSearchParams();
    const id1 = p1 !== undefined ? p1 : pokemon1;
    const id2 = p2 !== undefined ? p2 : pokemon2;
    if (id1) params.set('p1', id1);
    if (id2) params.set('p2', id2);
    router.replace(params.toString() ? `/compare?${params}` : '/compare', { scroll: false });
  };

  useEffect(() => {
    const p1 = searchParams.get('p1');
    const p2 = searchParams.get('p2');
    if (p1 && !pokemon1) selectPokemon(1, { pokemonId: p1 });
    if (p2 && !pokemon2) selectPokemon(2, { pokemonId: p2 });
  }, []);

  const handleDragStart = (i) => setDragIdx(i);
  const handleDragOver = (i) => {};
  const handleDrop = (i) => {
    if (dragIdx === null || dragIdx === i) { setDragIdx(null); return; }
    const swap = () => {
      const p1 = pokemon1; const pd1 = pokemonData1; const s1 = search1; const r1 = results1;
      const p2 = pokemon2; const pd2 = pokemonData2; const s2 = search2; const r2 = results2;
      if (dragIdx === 0 && i === 1) {
        setPokemon1(p2); setPokemonData1(pd2); setSearch1(s2); setResults1(r2);
        setPokemon2(p1); setPokemonData2(pd1); setSearch2(s1); setResults2(r1);
      } else {
        setPokemon2(p1); setPokemonData2(pd1); setSearch2(s1); setResults2(r1);
        setPokemon1(p2); setPokemonData1(pd2); setSearch1(s2); setResults1(r2);
      }
      updateURL(dragIdx === 0 ? p2 : p1, dragIdx === 0 ? p1 : p2);
    };
    swap();
    setDragIdx(null);
  };

  return (
    <div className="container compare-page">
      <Link href="/" className="back-link">&larr; Back</Link>

      <header className="header">
        <div className="header-brand">
          <div className="pokeball-icon" />
          <div>
            <h1>Compare</h1>
            <p className="header-subtitle">Compare two Pokémon side by side</p>
          </div>
        </div>
      </header>

      <div className="compare-slots">
        {loadingDetail1 ? <SkeletonSlot /> : (
          <PokemonSelector
            index={0}
            pokemon={pokemon1}
            pokemonData={pokemonData1}
            search={search1}
            results={results1}
            loading={searchLoading1}
            onSearchChange={handleSearchChange1}
            onSelect={(p) => selectPokemon(1, p)}
            onClear={() => clearPokemon(1)}
            inputRef={input1Ref}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
          />
        )}
        <div className="compare-vs"><span className="compare-vs-text">VS</span></div>
        {loadingDetail2 ? <SkeletonSlot /> : (
          <PokemonSelector
            index={1}
            pokemon={pokemon2}
            pokemonData={pokemonData2}
            search={search2}
            results={results2}
            loading={searchLoading2}
            onSearchChange={handleSearchChange2}
            onSelect={(p) => selectPokemon(2, p)}
            onClear={() => clearPokemon(2)}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
          />
        )}
      </div>

      {ready && (
        <div className="compare-results">
          <div className="compare-stats-section">
            <h2 className="section-title">Base Stats</h2>
            <div className="compare-stats-grid">
              {STAT_NAMES.map((name, idx) => {
                const meta = STATS_META[name];
                const v1 = stats1[name] || 0;
                const v2 = stats2[name] || 0;
                const diff = v1 - v2;
                const p1 = (v1 / 255) * 100;
                const p2 = (v2 / 255) * 100;
                const delay = idx * 80;
                return (
                  <div key={name} className="compare-stat-group" style={{ animationDelay: `${delay}ms` }}>
                    <span className="compare-stat-label">{meta?.label || name}</span>
                    <div className="compare-stat-bars">
                      <div className="compare-stat-row">
                        <span className="compare-stat-val compare-stat-val-1">{v1}</span>
                        <div className="compare-stat-bar-bg">
                          <div
                            className="compare-stat-bar-fill"
                            style={{
                              width: statsAnimated ? `${p1}%` : '0%',
                              backgroundColor: v1 >= v2 ? meta?.color : 'var(--stat-bar-bg)',
                              transitionDelay: `${delay}ms`,
                            }}
                          />
                        </div>
                      </div>
                      <div className="compare-stat-row">
                        <span className="compare-stat-val compare-stat-val-2">{v2}</span>
                        <div className="compare-stat-bar-bg">
                          <div
                            className="compare-stat-bar-fill"
                            style={{
                              width: statsAnimated ? `${p2}%` : '0%',
                              backgroundColor: v2 >= v1 ? meta?.color : 'var(--stat-bar-bg)',
                              transitionDelay: `${delay}ms`,
                            }}
                          />
                        </div>
                      </div>
                    </div>
                    <span className={`compare-stat-diff ${diff > 0 ? 'positive' : diff < 0 ? 'negative' : 'equal'}`}>
                      {diff > 0 ? `+${diff} ▲` : diff < 0 ? `${diff} ▼` : '—'}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="compare-radar-section">
            <h2 className="section-title">Radar Comparison</h2>
            <CompareRadar stats1={pokemonData1.rawData?.stats} stats2={pokemonData2.rawData?.stats} />
          </div>

          <div className="compare-info-section">
            <h2 className="section-title">Details</h2>
            <div className="compare-info-grid">
              <div className="compare-info-col">
                {[
                  { label: 'Height', value: `${(pokemonData1.rawData?.height / 10).toFixed(1)} m` },
                  { label: 'Weight', value: `${(pokemonData1.rawData?.weight / 10).toFixed(1)} kg` },
                  { label: 'Base XP', value: pokemonData1.rawData?.base_experience || 'N/A' },
                  { label: 'BST', value: bst1 },
                ].map((item) => (
                  <div key={item.label} className="compare-info-card">
                    <span className="info-label">{item.label}</span>
                    <span className="info-value">{item.value}</span>
                  </div>
                ))}
              </div>
              <div className="compare-vs-col"><div className="compare-vs-small">VS</div></div>
              <div className="compare-info-col">
                {[
                  { label: 'Height', value: `${(pokemonData2.rawData?.height / 10).toFixed(1)} m` },
                  { label: 'Weight', value: `${(pokemonData2.rawData?.weight / 10).toFixed(1)} kg` },
                  { label: 'Base XP', value: pokemonData2.rawData?.base_experience || 'N/A' },
                  { label: 'BST', value: bst2 },
                ].map((item) => (
                  <div key={item.label} className="compare-info-card">
                    <span className="info-label">{item.label}</span>
                    <span className="info-value">{item.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="compare-verdict">
            <div className="compare-verdict-card">
              <div className="verdict-crown">{bst1 === bst2 ? '🤝' : '👑'}</div>
              <h3 className="verdict-title">
                {bst1 > bst2 ? pokemonData1.name : bst2 > bst1 ? pokemonData2.name : 'It\'s a tie!'}
              </h3>
              <p className="verdict-sub">
                {bst1 > bst2
                  ? `${pokemonData1.name} wins with ${bst1} BST vs ${bst2} BST`
                  : bst2 > bst1
                    ? `${pokemonData2.name} wins with ${bst2} BST vs ${bst1} BST`
                    : `Both have ${bst1} BST`}
              </p>
              <div className="verdict-stats">
                {STAT_NAMES.map((name) => {
                  const meta = STATS_META[name];
                  const v1 = stats1[name] || 0;
                  const v2 = stats2[name] || 0;
                  const winner = v1 > v2 ? 1 : v2 > v1 ? 2 : 0;
                  return (
                    <div key={name} className="verdict-stat">
                      <span className="verdict-stat-label">{meta?.label}</span>
                      <div className="verdict-stat-bars">
                        <span className={`verdict-stat-val ${winner === 1 ? 'win' : winner === 0 ? 'tie' : 'lose'}`}>{v1}</span>
                        <span className="verdict-stat-divider">:</span>
                        <span className={`verdict-stat-val ${winner === 2 ? 'win' : winner === 0 ? 'tie' : 'lose'}`}>{v2}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function ComparePage() {
  return (
    <Suspense fallback={<div className="container"><p>Loading...</p></div>}>
      <ComparePageContent />
    </Suspense>
  );
}
