import { TYPE_CHART } from './constants';

const LEVEL = 50;
const moveCache = {};

function getSpriteUrl(pokemon) {
  return pokemon.rawData?.sprites?.other?.['official-artwork']?.front_default
    || pokemon.rawData?.sprites?.front_default
    || '';
}

function getStat(pokemon, name) {
  return pokemon.rawData?.stats?.find(s => s.stat.name === name)?.base_stat || 50;
}

async function fetchMoveDetails(url) {
  if (moveCache[url]) return moveCache[url];
  try {
    const res = await fetch(url);
    const data = await res.json();
    moveCache[url] = {
      name: data.name,
      type: data.type?.name || 'normal',
      power: data.power || 40,
      damageClass: data.damage_class?.name || 'physical',
    };
  } catch {
    moveCache[url] = { name: 'tackle', type: 'normal', power: 40, damageClass: 'physical' };
  }
  return moveCache[url];
}

function rawDamage(attacker, defender, power, isSpecial) {
  const atk = isSpecial ? getStat(attacker, 'special-attack') : getStat(attacker, 'attack');
  const def = isSpecial ? getStat(defender, 'special-defense') : getStat(defender, 'defense');
  return Math.floor(((2 * LEVEL / 5 + 2) * power * Math.max(atk, 1) / Math.max(def, 1)) / 50 + 2);
}

export function typeEffectiveness(moveType, defenderTypes) {
  let mult = 1;
  for (const t of defenderTypes) {
    const entry = TYPE_CHART[moveType];
    if (!entry) continue;
    if (entry.immune?.includes(t)) return 0;
    if (entry.weak?.includes(t)) mult *= 2;
    if (entry.resist?.includes(t)) mult *= 0.5;
  }
  return mult;
}

function scoreMove(attacker, defender, move) {
  const power = move.power || 40;
  const isSpecial = move.damageClass === 'special';
  const base = rawDamage(attacker, defender, power, isSpecial);
  const stab = attacker.types.includes(move.type) ? 1.5 : 1.0;
  const eff = typeEffectiveness(move.type, defender.types);
  return Math.floor(base * stab * Math.max(eff, 0));
}

export function calcDamage(attacker, defender, move) {
  const isSpecial = move.damageClass === 'special';
  const base = rawDamage(attacker, defender, move.power || 40, isSpecial);
  const stab = attacker.types.includes(move.type) ? 1.5 : 1.0;
  const eff = typeEffectiveness(move.type, defender.types);
  if (eff === 0) return { damage: 0, effectiveness: 0 };
  const rng = 0.85 + Math.random() * 0.15;
  const crit = Math.random() < 0.1;
  const critMult = crit ? 1.5 : 1.0;
  return {
    damage: Math.floor(base * stab * eff * rng * critMult),
    effectiveness: eff,
    critical: crit,
  };
}

export function pickBestMove(attacker, defender, moves) {
  let best = null;
  let bestScore = -Infinity;
  for (const m of moves) {
    const score = scoreMove(attacker, defender, m);
    if (score > bestScore) {
      bestScore = score;
      best = m;
    }
  }
  if (!best) {
    return { name: 'struggle', type: 'normal', power: 50, damageClass: 'physical' };
  }
  return best;
}

function maxHP(pokemon) {
  return getStat(pokemon, 'hp') * 2 + 50;
}

export async function preparePokemon(pokemon) {
  const types = pokemon.description?.split(', ') || [];
  const moves = pokemon.rawData?.moves || [];

  const topMoves = moves
    .filter(m => m.move?.url)
    .sort((a, b) => {
      const aLevel = a.version_group_details?.[0]?.level_learned_at || 999;
      const bLevel = b.version_group_details?.[0]?.level_learned_at || 999;
      return bLevel - aLevel;
    })
    .slice(0, 12);

  const moveDetails = await Promise.all(topMoves.map(m => fetchMoveDetails(m.move.url)));

  const hp = maxHP(pokemon);
  return {
    externalId: pokemon.externalId,
    title: pokemon.title,
    types,
    sprite: getSpriteUrl(pokemon),
    maxHP: hp,
    currentHP: hp,
    fainted: false,
    movesWithDetails: moveDetails.filter(Boolean),
  };
}

export async function planBattle(team1Raw, team2Raw) {
  const t1 = await Promise.all(team1Raw.map(preparePokemon));
  const t2 = await Promise.all(team2Raw.map(preparePokemon));

  const snapshots = [];
  let idx1 = 0;
  let idx2 = 0;
  const damageLog = {};

  function snapshot(action) {
    snapshots.push({
      team1: t1.map(p => ({ ...p, movesWithDetails: undefined })),
      team2: t2.map(p => ({ ...p, movesWithDetails: undefined })),
      active1: idx1,
      active2: idx2,
      ...action,
    });
  }

  while (idx1 < t1.length && idx2 < t2.length) {
    const a = t1[idx1];
    const b = t2[idx2];

    const speedA = getStat(a, 'speed');
    const speedB = getStat(b, 'speed');
    const aFirst = speedA > speedB || (speedA === speedB && Math.random() > 0.5);

    const executeTurn = (attacker, defender, attackerTeam) => {
      const move = pickBestMove(attacker, defender, attacker.movesWithDetails);
      const { damage, effectiveness, critical } = calcDamage(attacker, defender, move);
      defender.currentHP = Math.max(0, defender.currentHP - damage);

      const attackerKey = attacker.title;
      damageLog[attackerKey] = (damageLog[attackerKey] || 0) + damage;

      snapshot({
        type: 'attack',
        attacker: attacker.title,
        attackerTeam,
        defender: defender.title,
        defenderTeam: attackerTeam === 1 ? 2 : 1,
        move: move.name,
        moveType: move.type,
        damage,
        effectiveness,
        critical,
      });
      if (defender.currentHP <= 0) {
        defender.fainted = true;
        snapshot({ type: 'faint', fainted: defender.title, faintedTeam: attackerTeam === 1 ? 2 : 1 });
        return true;
      }
      return false;
    };

    if (aFirst) {
      if (executeTurn(a, b, 1)) { idx2++; continue; }
      if (executeTurn(b, a, 2)) { idx1++; }
    } else {
      if (executeTurn(b, a, 2)) { idx1++; continue; }
      if (executeTurn(a, b, 1)) { idx2++; }
    }
  }

  snapshot({ type: 'result', winner: idx1 >= t1.length ? 2 : 1 });
  return { snapshots, team1: t1, team2: t2, damageLog };
}
