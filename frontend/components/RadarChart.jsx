'use client';

import { STATS_META } from '../lib/constants';

const SIZE = 200;
const CENTER = SIZE / 2;
const RADIUS = 80;
const STAT_NAMES = ['hp', 'attack', 'defense', 'special-defense', 'special-attack', 'speed'];
const MAX_STAT = 255;

function polarToCartesian(cx, cy, r, angleDeg) {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

function statToRadius(stat) {
  return (Math.min(stat, MAX_STAT) / MAX_STAT) * RADIUS;
}

export default function RadarChart({ stats }) {
  const statMap = {};
  (stats || []).forEach((s) => { statMap[s.stat.name] = s.base_stat; });

  const angleStep = 360 / STAT_NAMES.length;
  const points = STAT_NAMES.map((name, i) => {
    const r = statToRadius(statMap[name] || 0);
    return polarToCartesian(CENTER, CENTER, r, angleStep * i);
  });

  const gridLevels = [0.25, 0.5, 0.75, 1];
  const gridPolygons = gridLevels.map((level) => {
    return STAT_NAMES.map((_, i) => {
      const r = RADIUS * level;
      return polarToCartesian(CENTER, CENTER, r, angleStep * i);
    });
  });

  const dataPolygon = points.map((p) => `${p.x},${p.y}`).join(' ');

  return (
    <svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`} className="radar-chart">
      {gridPolygons.map((poly, pi) => (
        <polygon
          key={pi}
          points={poly.map((p) => `${p.x},${p.y}`).join(' ')}
          fill="rgba(239, 35, 60, 0.03)"
          stroke="rgba(0,0,0,0.08)"
          strokeWidth="1"
        />
      ))}
      {STAT_NAMES.map((name, i) => {
        const end = polarToCartesian(CENTER, CENTER, RADIUS, angleStep * i);
        return (
          <line
            key={name}
            x1={CENTER}
            y1={CENTER}
            x2={end.x}
            y2={end.y}
            stroke="rgba(0,0,0,0.06)"
            strokeWidth="1"
          />
        );
      })}
      <polygon
        points={dataPolygon}
        fill="rgba(239, 35, 60, 0.2)"
        stroke="var(--red)"
        strokeWidth="2"
        className="radar-data"
      />
      {STAT_NAMES.map((name, i) => {
        const meta = STATS_META[name];
        const end = polarToCartesian(CENTER, CENTER, RADIUS + 18, angleStep * i);
        return (
          <text
            key={name}
            x={end.x}
            y={end.y}
            textAnchor="middle"
            dominantBaseline="middle"
            fontSize="9"
            fontWeight="700"
            fill="var(--text-secondary)"
          >
            {meta?.label || name}
          </text>
        );
      })}
    </svg>
  );
}
