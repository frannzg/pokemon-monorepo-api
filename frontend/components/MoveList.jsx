'use client';

import { useState, useMemo } from 'react';

export default function MoveList({ rawData }) {
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('level');
  const moves = rawData?.moves || [];

  const grouped = useMemo(() => {
    const map = {};
    moves.forEach((m) => {
      const details = m.version_group_details?.slice(-1)?.[0];
      if (!details) return;
      const method = details.move_learn_method?.name || 'other';
      const level = details.level_learned_at || 0;
      if (!map[method]) map[method] = [];
      map[method].push({
        name: m.move.name.replace('-', ' '),
        level,
        url: m.move.url,
        method,
      });
    });

    Object.keys(map).forEach((key) => {
      map[key].sort((a, b) => {
        if (sortBy === 'level') return a.level - b.level;
        return a.name.localeCompare(b.name);
      });
    });

    const order = ['level-up', 'egg', 'machine', 'tutor', 'other'];
    return order
      .filter((k) => map[k])
      .map((k) => ({ method: k, moves: map[k] }));
  }, [moves, sortBy]);

  const filtered = useMemo(() => {
    if (!search.trim()) return grouped;
    return grouped
      .map((g) => ({
        ...g,
        moves: g.moves.filter((m) =>
          m.name.toLowerCase().includes(search.toLowerCase())
        ),
      }))
      .filter((g) => g.moves.length > 0);
  }, [grouped, search]);

  const methodLabels = {
    'level-up': 'Level Up',
    egg: 'Egg',
    machine: 'TR/TM',
    tutor: 'Tutor',
    other: 'Other',
  };

  const totalMoves = moves.length;

  return (
    <div className="moves-section">
      <h2 className="section-title">
        Moves
        <span className="moves-count">{totalMoves}</span>
      </h2>
      <div className="moves-controls">
        <input
          type="text"
          className="input moves-search"
          placeholder="Search move..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select
          className="input moves-sort"
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
        >
          <option value="level">By Level</option>
          <option value="name">Alphabetical</option>
        </select>
      </div>
      <div className="moves-list">
        {filtered.map((group) => (
          <div key={group.method} className="move-group">
            <div className="move-group-label">
              {methodLabels[group.method] || group.method}
              <span className="move-group-count">{group.moves.length}</span>
            </div>
            <div className="move-tags">
              {group.moves.map((m) => (
                <span key={m.name} className="move-tag">
                  {m.method === 'level-up' && m.level > 0 && (
                    <span className="move-level">{m.level}</span>
                  )}
                  {m.name}
                </span>
              ))}
            </div>
          </div>
        ))}
        {filtered.length === 0 && (
          <p className="moves-empty">No moves match your search.</p>
        )}
      </div>
    </div>
  );
}
