'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { getExternalData } from '../../services/backendApi';
import PokemonSprite from '../../components/PokemonSprite';
import { TYPE_COLORS } from '../../lib/constants';

const BADGES = [
  { id: 'boulder', name: 'Boulder', color: '#8B4513', icon: '🪨' },
  { id: 'cascade', name: 'Cascade', color: '#3399FF', icon: '💧' },
  { id: 'thunder', name: 'Thunder', color: '#FFD700', icon: '⚡' },
  { id: 'rainbow', name: 'Rainbow', color: '#FF6B6B', icon: '🌈' },
  { id: 'soul', name: 'Soul', color: '#FF69B4', icon: '💜' },
  { id: 'marsh', name: 'Marsh', color: '#9B59B6', icon: '🌀' },
  { id: 'volcano', name: 'Volcano', color: '#E74C3C', icon: '🔥' },
  { id: 'earth', name: 'Earth', color: '#2ECC71', icon: '🌍' },
];

const BORDER_STYLES = [
  { id: 'classic', label: 'Classic', outer: '#D4A017', inner: '#F5E6B8', bg: '#FFF8E7' },
  { id: 'premier', label: 'Premier', outer: '#C0C0C0', inner: '#F0F0F0', bg: '#FFFFFF' },
  { id: 'dark', label: 'Dark', outer: '#444', inner: '#222', bg: '#1A1A2E' },
  { id: 'royal', label: 'Royal', outer: '#1E3A5F', inner: '#4A90D9', bg: '#E8F0FE' },
  { id: 'emerald', label: 'Emerald', outer: '#1B5E20', inner: '#A5D6A7', bg: '#E8F5E9' },
  { id: 'crimson', label: 'Crimson', outer: '#8B0000', inner: '#EF9A9A', bg: '#FFEBEE' },
];

function highlightText(text, query) {
  if (!query.trim()) return text;
  const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const parts = text.split(new RegExp(`(${escaped})`, 'gi'));
  return parts.map((part, i) =>
    part.toLowerCase() === query.toLowerCase()
      ? <span key={i} className="tc-search-highlight">{part}</span>
      : part
  );
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

export default function TrainerCardPage() {
  const canvasRef = useRef(null);
  const [name, setName] = useState('TRAINER');
  const [badge, setBadge] = useState('boulder');
  const [borderStyle, setBorderStyle] = useState('classic');
  const [bgColor, setBgColor] = useState('#FFF8E7');
  const [pokemon, setPokemon] = useState(null);
  const [searchInput, setSearchInput] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const searchRef = useRef(null);
  const spriteCache = useRef({});

  useEffect(() => {
    const handler = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setSearchOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const doSearch = useCallback(async (q) => {
    if (!q.trim()) { setSearchResults([]); return; }
    setSearchLoading(true);
    try {
      const res = await getExternalData({ search: q, limit: 10, sort: 'id' });
      setSearchResults(res.data);
    } catch { setSearchResults([]); }
    setSearchLoading(false);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => doSearch(searchInput), 300);
    return () => clearTimeout(timer);
  }, [searchInput, doSearch]);

  const drawCard = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const SCALE = 2;
    const W = 400, H = 280;
    canvas.width = W * SCALE;
    canvas.height = H * SCALE;
    canvas.style.width = W + 'px';
    canvas.style.height = H + 'px';
    ctx.scale(SCALE, SCALE);
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    const badgeData = BADGES.find(b => b.id === badge) || BADGES[0];
    const borderData = BORDER_STYLES.find(b => b.id === borderStyle) || BORDER_STYLES[0];
    const colors = { outer: borderData.outer, inner: borderData.inner, bg: borderData.bg };

    const isDark = borderStyle === 'dark';
    const textPrimary = isDark ? '#FFF' : '#222';
    const textSecondary = isDark ? '#CCC' : '#555';
    const textMuted = isDark ? '#888' : '#999';

    ctx.shadowColor = 'rgba(0,0,0,0.2)';
    ctx.shadowBlur = 12;
    ctx.shadowOffsetY = 4;

    roundRect(ctx, 0, 0, W, H, 16);
    ctx.fillStyle = colors.outer;
    ctx.fill();

    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;

    roundRect(ctx, 6, 6, W - 12, H - 12, 12);
    ctx.fillStyle = colors.inner;
    ctx.fill();

    roundRect(ctx, 10, 10, W - 20, H - 20, 10);
    ctx.fillStyle = colors.bg;
    ctx.fill();

    ctx.fillStyle = isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)';
    ctx.fillRect(14, 14, W - 28, (H - 28) / 3);

    ctx.fillStyle = isDark ? '#EEE' : '#C00';
    ctx.font = 'bold 14px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('◆  TRAINER CARD  ◆', W / 2, 32);

    ctx.fillStyle = isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.06)';
    ctx.fillRect(20, 42, W - 40, 1);

    ctx.font = '10px monospace';
    ctx.fillStyle = textMuted;
    ctx.textAlign = 'left';
    ctx.fillText('NAME', 24, 66);
    ctx.font = 'bold 18px monospace';
    ctx.fillStyle = borderData.id === 'dark' ? '#FFD700' : textPrimary;
    ctx.fillText(name.toUpperCase(), 24, 90);

    ctx.font = '10px monospace';
    ctx.fillStyle = textMuted;
    ctx.fillText('BADGE', 24, 112);
    ctx.fillStyle = badgeData.color;

    ctx.shadowColor = badgeData.color;
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.arc(36, 132, 12, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    ctx.fillStyle = '#fff';
    ctx.font = 'bold 10px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(badgeData.name.toUpperCase().slice(0, 4), 36, 136);

    ctx.font = '13px monospace';
    ctx.fillStyle = textPrimary;
    ctx.textAlign = 'left';
    ctx.fillText(badgeData.name + ' Badge', 56, 137);

    ctx.font = '10px monospace';
    ctx.fillStyle = textMuted;
    ctx.fillText('LEVEL', 24, 162);
    ctx.font = 'bold 16px monospace';
    ctx.fillStyle = textPrimary;
    ctx.textAlign = 'center';
    ctx.fillText('50', 36, 182);

    if (pokemon) {
      ctx.font = '10px monospace';
      ctx.fillStyle = textMuted;
      ctx.textAlign = 'left';
      ctx.fillText('PARTNER', 90, 66);
      ctx.fillText('ID', 90, 112);
      ctx.fillText('TYPES', 90, 162);

      ctx.font = 'bold 18px monospace';
      ctx.fillStyle = textPrimary;
      ctx.fillText(pokemon.title, 90, 90);

      ctx.font = 'bold 16px monospace';
      ctx.fillStyle = textMuted;
      ctx.fillText('#' + pokemon.externalId.padStart(4, '0'), 90, 132);

      const types = pokemon.description.split(', ');
      types.forEach((type, i) => {
        ctx.fillStyle = TYPE_COLORS[type] || '#999';
        const x = 90 + i * 72;
        roundRect(ctx, x, 168, 66, 20, 4);
        ctx.fill();
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 10px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(type.toUpperCase(), x + 33, 182);
      });

      const spriteUrl = pokemon.rawData?.sprites?.other?.['official-artwork']?.front_default || pokemon.rawData?.sprites?.front_default;
      if (spriteUrl) {
        if (!spriteCache.current[spriteUrl]) {
          const img = new Image();
          img.crossOrigin = 'anonymous';
          spriteCache.current[spriteUrl] = new Promise((resolve) => {
            img.onload = () => { spriteCache.current[spriteUrl] = img; resolve(img); };
            img.onerror = () => { spriteCache.current[spriteUrl] = null; resolve(null); };
            img.src = spriteUrl;
          });
        }
        const cached = spriteCache.current[spriteUrl];
        if (cached && cached instanceof HTMLImageElement) {
          ctx.save();
          ctx.shadowColor = 'rgba(0,0,0,0.15)';
          ctx.shadowBlur = 8;
          ctx.shadowOffsetY = 2;
          ctx.drawImage(cached, W - 124, 44, 96, 96);
          ctx.restore();
          ctx.fillStyle = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)';
          roundRect(ctx, W - 130, 38, 108, 108, 8);
          ctx.strokeStyle = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)';
          ctx.lineWidth = 1;
          ctx.stroke();
        }
      }
    }

    ctx.fillStyle = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)';
    ctx.fillRect(20, 206, W - 40, 1);

    ctx.font = '8px monospace';
    ctx.fillStyle = textMuted;
    ctx.textAlign = 'center';
    ctx.fillText('POKEMON MONOREPO API', W / 2, H - 12);
  }, [name, badge, borderStyle, bgColor, pokemon]);

  useEffect(() => { drawCard(); }, [drawCard]);

  const handleDownload = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.toBlob((blob) => {
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.download = `trainer-card-${name.toLowerCase().replace(/\s+/g, '-')}.png`;
      a.href = url;
      a.click();
      URL.revokeObjectURL(url);
    }, 'image/png');
  };

  return (
    <div className="container tc-page">
      <h1 className="tc-title">🎮 Trainer Card</h1>

      <div className="tc-layout">
        <div className="tc-preview-wrap">
          <div className="tc-canvas-frame">
            <canvas ref={canvasRef} className="tc-canvas" />
          </div>
          <button className="btn tc-download-btn" onClick={handleDownload}>
            ⬇ Download PNG
          </button>
        </div>

        <div className="tc-controls">
          <div className="tc-field">
            <label className="tc-label">Name</label>
            <input
              type="text"
              className="tc-input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name..."
              maxLength={14}
            />
          </div>

          <div className="tc-field">
            <label className="tc-label">Badge</label>
            <div className="tc-badge-grid">
              {BADGES.map((b) => (
                <button
                  key={b.id}
                  className={`tc-badge-btn ${badge === b.id ? 'active' : ''}`}
                  style={{ '--badge-color': b.color }}
                  onClick={() => setBadge(b.id)}
                  title={b.name}
                >
                  <span className="tc-badge-icon">{b.icon}</span>
                  <span className="tc-badge-name">{b.name}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="tc-field">
            <label className="tc-label">Frame Style</label>
            <div className="tc-border-grid">
              {BORDER_STYLES.map((bs) => (
                <button
                  key={bs.id}
                  className={`tc-border-btn ${borderStyle === bs.id ? 'active' : ''}`}
                  onClick={() => setBorderStyle(bs.id)}
                >
                  {bs.label}
                </button>
              ))}
            </div>
          </div>

          <div className="tc-field" ref={searchRef}>
            <label className="tc-label">Partner Pokémon</label>
            <div className="tc-search-wrap">
              <input
                type="text"
                className="tc-input"
                value={searchInput}
                onChange={(e) => { setSearchInput(e.target.value); setSearchOpen(true); }}
                onFocus={() => setSearchOpen(true)}
                placeholder="Search pokemon..."
              />
              {searchLoading && <span className="tc-search-spinner" />}
              {pokemon && (
                <button className="tc-clear-btn" onClick={() => { setPokemon(null); setSearchInput(''); setSearchResults([]); }}>
                  ✕
                </button>
              )}
              {searchOpen && searchResults.length > 0 && (
                <div className="tc-search-dropdown">
                  {searchResults.map((p) => {
                    const sprite = p.rawData?.sprites?.other?.['official-artwork']?.front_default || p.rawData?.sprites?.front_default;
                    return (
                      <button
                        key={p.externalId}
                        className="tc-search-item"
                        onClick={() => {
                          setPokemon(p);
                          setSearchInput(`#${p.externalId} ${p.title}`);
                          setSearchOpen(false);
                          setSearchResults([]);
                        }}
                      >
                        <PokemonSprite src={sprite} alt="" width={36} height={36} />
                        <span className="tc-search-item-id">#{p.externalId.padStart(4, '0')}</span>
                        <span className="tc-search-item-name">{highlightText(p.title, searchInput)}</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
            {pokemon && (
              <div className="tc-selected-pokemon">
                <PokemonSprite
                  src={pokemon.rawData?.sprites?.other?.['official-artwork']?.front_default || pokemon.rawData?.sprites?.front_default}
                  alt={pokemon.title}
                  width={48}
                  height={48}
                />
                <div>
                  <strong>#{pokemon.externalId.padStart(4, '0')} {pokemon.title}</strong>
                  <div className="tc-selected-types">
                    {pokemon.description.split(', ').map(t => (
                      <span key={t} className="type-badge" style={{ backgroundColor: TYPE_COLORS[t] }}>{t}</span>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
