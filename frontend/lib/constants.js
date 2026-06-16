export const TYPE_COLORS = {
  normal: '#A8A77A', fire: '#EE8130', water: '#6390F0',
  electric: '#F7D02C', grass: '#7AC74C', ice: '#96D9D6',
  fighting: '#C22E28', poison: '#A33EA1', ground: '#E2BF65',
  flying: '#A98FF3', psychic: '#F95587', bug: '#A6B91A',
  rock: '#B6A136', ghost: '#735797', dragon: '#6F35FC',
  dark: '#705746', steel: '#B7B7CE', fairy: '#D685AD',
};

export const ALL_TYPES = Object.keys(TYPE_COLORS);

export const STATS_META = {
  hp: { label: 'HP', color: '#FF0000' },
  attack: { label: 'Attack', color: '#F08030' },
  defense: { label: 'Defense', color: '#F8D030' },
  'special-attack': { label: 'Sp. Atk', color: '#6890F0' },
  'special-defense': { label: 'Sp. Def', color: '#78C850' },
  speed: { label: 'Speed', color: '#F85888' },
};

export const TYPE_CHART = {
  normal: { weak: ['fighting'], resist: [], immune: ['ghost'] },
  fire: { weak: ['water', 'ground', 'rock'], resist: ['fire', 'grass', 'ice', 'bug', 'steel', 'fairy'], immune: [] },
  water: { weak: ['electric', 'grass'], resist: ['fire', 'water', 'ice', 'steel'], immune: [] },
  electric: { weak: ['ground'], resist: ['electric', 'flying', 'steel'], immune: [] },
  grass: { weak: ['fire', 'ice', 'poison', 'flying', 'bug'], resist: ['water', 'electric', 'grass', 'ground'], immune: [] },
  ice: { weak: ['fire', 'fighting', 'rock', 'steel'], resist: ['ice'], immune: [] },
  fighting: { weak: ['flying', 'psychic', 'fairy'], resist: ['bug', 'rock', 'dark'], immune: [] },
  poison: { weak: ['ground', 'psychic'], resist: ['grass', 'fighting', 'poison', 'bug', 'fairy'], immune: [] },
  ground: { weak: ['water', 'grass', 'ice'], resist: ['poison', 'rock'], immune: ['electric'] },
  flying: { weak: ['electric', 'ice', 'rock'], resist: ['grass', 'fighting', 'bug'], immune: ['ground'] },
  psychic: { weak: ['bug', 'ghost', 'dark'], resist: ['fighting', 'psychic'], immune: [] },
  bug: { weak: ['fire', 'flying', 'rock'], resist: ['grass', 'fighting', 'ground'], immune: [] },
  rock: { weak: ['water', 'grass', 'fighting', 'ground', 'steel'], resist: ['normal', 'fire', 'poison', 'flying'], immune: [] },
  ghost: { weak: ['ghost', 'dark'], resist: ['poison', 'bug'], immune: ['normal', 'fighting'] },
  dragon: { weak: ['ice', 'dragon', 'fairy'], resist: ['fire', 'water', 'electric', 'grass'], immune: [] },
  dark: { weak: ['fighting', 'bug', 'fairy'], resist: ['ghost', 'dark'], immune: ['psychic'] },
  steel: { weak: ['fire', 'fighting', 'ground'], resist: ['normal', 'grass', 'ice', 'flying', 'psychic', 'bug', 'rock', 'dragon', 'steel', 'fairy'], immune: ['poison'] },
  fairy: { weak: ['poison', 'steel'], resist: ['fighting', 'bug', 'dark'], immune: ['dragon'] },
};

export function calcTeamWeaknesses(teamTypes) {
  const weaknesses = {};
  const resistances = {};
  ALL_TYPES.forEach((t) => {
    weaknesses[t] = 0;
    resistances[t] = 0;
  });

  teamTypes.forEach((type) => {
    const chart = TYPE_CHART[type];
    if (!chart) return;
    chart.weak.forEach((t) => { weaknesses[t]++; });
    chart.resist.forEach((t) => { resistances[t]++; });
    chart.immune.forEach((t) => { resistances[t] += 99; });
  });

  const result = [];
  ALL_TYPES.forEach((t) => {
    const net = weaknesses[t] - resistances[t];
    if (net !== 0) {
      result.push({
        type: t,
        multiplier: net > 0 ? Math.min(4, net) : (net < -10 ? 0 : 0.5),
        weak: net > 0,
      });
    }
  });
  return result.sort((a, b) => b.multiplier - a.multiplier);
}

export function debounce(fn, delay = 300) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}
