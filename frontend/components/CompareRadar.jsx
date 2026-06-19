'use client';

import { STATS_META } from '../lib/constants';

const SIZE = 280;
const CENTER = SIZE / 2;
const RADIUS = 100;
const STAT_NAMES = ['hp', 'attack', 'defense', 'special-defense', 'special-attack', 'speed'];
const MAX_STAT = 255;

function polarToCartesian(cx, cy, r, angleDeg) {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

function buildPolygon(stats) {
  const statMap = {};
  (stats || []).forEach((s) => { statMap[s.stat.name] = s.base_stat; });
  const angleStep = 360 / STAT_NAMES.length;
  return STAT_NAMES.map((name, i) => {
    const val = statMap[name] || 0;
    const r = (Math.min(val, MAX_STAT) / MAX_STAT) * RADIUS;
    return polarToCartesian(CENTER, CENTER, r, angleStep * i);
  });
}

export default function CompareRadar({ stats1, stats2 }) {
  const points1 = buildPolygon(stats1);
  const points2 = buildPolygon(stats2);

  const gridLevels = [0.25, 0.5, 0.75, 1];
  const gridPolygons = gridLevels.map((level) =>
    STAT_NAMES.map((_, i) => polarToCartesian(CENTER, CENTER, RADIUS * level, (360 / STAT_NAMES.length) * i))
  );

  return (
    <div className="compare-radar-wrap">
      <svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`} className="radar-chart">
        {gridPolygons.map((poly, pi) => (
          <polygon
            key={pi}
            points={poly.map((p) => `${p.x},${p.y}`).join(' ')}
            fill="rgba(239, 35, 60, 0.02)"
            stroke="rgba(0,0,0,0.08)"
            strokeWidth="1"
          />
        ))}
        {STAT_NAMES.map((name, i) => {
          const end = polarToCartesian(CENTER, CENTER, RADIUS, (360 / STAT_NAMES.length) * i);
          return (
            <line key={name} x1={CENTER} y1={CENTER} x2={end.x} y2={end.y} stroke="rgba(0,0,0,0.06)" strokeWidth="1" />
          );
        })}
        <polygon
          points={points1.map((p) => `${p.x},${p.y}`).join(' ')}
          fill="rgba(239, 35, 60, 0.25)"
          stroke="#ef233c"
          strokeWidth="2.5"
          className="radar-data"
        />
        <polygon
          points={points2.map((p) => `${p.x},${p.y}`).join(' ')}
          fill="rgba(59, 76, 202, 0.25)"
          stroke="#3b4cca"
          strokeWidth="2.5"
          className="radar-data"
        />
        {STAT_NAMES.map((name, i) => {
          const meta = STATS_META[name];
          const end = polarToCartesian(CENTER, CENTER, RADIUS + 22, (360 / STAT_NAMES.length) * i);
          return (
            <text
              key={name}
              x={end.x}
              y={end.y}
              textAnchor="middle"
              dominantBaseline="middle"
              fontSize="10"
              fontWeight="700"
              fill="var(--text-secondary)"
            >
              {meta?.label || name}
            </text>
          );
        })}
      </svg>
      <div className="compare-radar-legend">
        <span className="compare-radar-legend-item">
          <span className="compare-radar-legend-dot" style={{ background: '#ef233c' }} />
          Pokémon 1
        </span>
        <span className="compare-radar-legend-item">
          <span className="compare-radar-legend-dot" style={{ background: '#3b4cca' }} />
          Pokémon 2
        </span>
      </div>
    </div>
  );
}
