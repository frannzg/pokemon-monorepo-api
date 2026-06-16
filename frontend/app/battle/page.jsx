'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { getTeams, getTeamById } from '../../services/backendApi';
import { planBattle } from '../../lib/battle';
import { useToast } from '../../components/Toast';
import PokemonSprite from '../../components/PokemonSprite';
import { TYPE_COLORS } from '../../lib/constants';

const SPEEDS = [1, 2, 5];

function cleanName(name) {
  if (!name) return '';
  return name.charAt(0).toUpperCase() + name.slice(1).replace(/-/g, ' ');
}

function MoveTypeBadge({ type }) {
  const color = TYPE_COLORS[type] || '#999';
  return (
    <span className="move-type-badge" style={{ backgroundColor: color }}>
      {type}
    </span>
  );
}

function RosterSlot({ pokemon, isActive }) {
  const pct = pokemon.maxHP > 0 ? (pokemon.currentHP / pokemon.maxHP) * 100 : 0;
  let hpColor = '#2ecc71';
  if (pct <= 20) hpColor = '#e74c3c';
  else if (pct <= 50) hpColor = '#f1c40f';

  return (
    <div className={`roster-slot ${isActive ? 'slot-active' : ''} ${pokemon.fainted ? 'slot-fainted' : ''}`}>
      <PokemonSprite src={pokemon.sprite} alt={cleanName(pokemon.title)} width={52} height={52} />
      <div className="roster-slot-info">
        <div className="roster-slot-name">{cleanName(pokemon.title)}</div>
        <div className="roster-slot-bar">
          <div className="roster-slot-hp" style={{ width: `${Math.max(0, pct)}%`, backgroundColor: hpColor }} />
        </div>
        <div className="roster-slot-hp-text">{pokemon.currentHP}/{pokemon.maxHP}</div>
      </div>
    </div>
  );
}

function ActiveBattle({ pokemon, team, shake, damagePopupData, lastDamage }) {
  return (
    <div className={`active-pokemon ${team === 1 ? 'team1' : 'team2'} ${shake ? 'shake' : ''}`}>
      <div className="active-sprite-wrap">
        <PokemonSprite
          src={pokemon?.sprite}
          alt={cleanName(pokemon?.title)}
          width={140} height={140}
          className={`active-sprite ${pokemon?.fainted ? 'fainted' : ''}`}
        />
        {pokemon?.fainted && <div className="active-faint-overlay">💀</div>}
        {damagePopupData && damagePopupData > 0 && (
          <div className="damage-popup" key={lastDamage + Math.random()}>-{damagePopupData}</div>
        )}
      </div>
      <div className={`active-panel ${team === 1 ? 'panel-team1' : 'panel-team2'}`}>
        <div className="active-name">{cleanName(pokemon?.title)}</div>
        <div className="hp-bar-track">
          <div className="hp-bar-fill" style={{
            width: `${pokemon ? Math.min(100, (pokemon.currentHP / pokemon.maxHP) * 100) : 0}%`,
            backgroundColor: (() => {
              const pct = pokemon ? (pokemon.currentHP / pokemon.maxHP) * 100 : 0;
              if (pct <= 20) return '#e74c3c';
              if (pct <= 50) return '#f1c40f';
              return '#2ecc71';
            })()
          }} />
        </div>
        <div className="active-hp-text">{pokemon?.currentHP || 0} / {pokemon?.maxHP || 0}</div>
      </div>
    </div>
  );
}

export default function BattlePage() {
  const showToast = useToast();
  const [teams, setTeams] = useState([]);
  const [team1Id, setTeam1Id] = useState('');
  const [team2Id, setTeam2Id] = useState('');
  const [phase, setPhase] = useState('select');
  const [snapshots, setSnapshots] = useState([]);
  const [damageLog, setDamageLog] = useState({});
  const [currentSnapshot, setCurrentSnapshot] = useState(null);
  const [speed, setSpeed] = useState(1);
  const [winner, setWinner] = useState(null);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [shakeTeam, setShakeTeam] = useState(null);
  const [lastDamage, setLastDamage] = useState({ team: null, amount: 0, key: 0 });
  const [damagePopup, setDamagePopup] = useState({ team: null, amount: 0, key: 0 });
  const [paused, setPaused] = useState(false);

  const timerRef = useRef(null);
  const stepRef = useRef(0);
  const logRef = useRef(null);

  useEffect(() => {
    getTeams().then(setTeams).catch(() => {});
  }, []);

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const runBattle = useCallback(async () => {
    if (!team1Id || !team2Id) {
      showToast('Select both teams', 'error');
      return;
    }
    if (team1Id === team2Id) {
      showToast('Select two different teams', 'error');
      return;
    }
    setPhase('loading');
    setLoadingMessage('Preparing battle...');
    try {
      const [t1, t2] = await Promise.all([getTeamById(team1Id), getTeamById(team2Id)]);
      const team1Pkmn = t1.pokemonData || [];
      const team2Pkmn = t2.pokemonData || [];
      if (team1Pkmn.length === 0 || team2Pkmn.length === 0) {
        showToast('Both teams need at least 1 Pokémon', 'error');
        setPhase('select');
        return;
      }
      setLoadingMessage('Fetching move data...');
      const result = await planBattle(team1Pkmn, team2Pkmn);
      setSnapshots(result.snapshots);
      setDamageLog(result.damageLog);
      stepRef.current = 0;
      setCurrentSnapshot(result.snapshots[0]);
      setPhase('battle');
    } catch (err) {
      showToast('Battle failed: ' + err.message, 'error');
      setPhase('select');
    }
  }, [team1Id, team2Id, showToast]);

  useEffect(() => {
    if (phase !== 'battle' || paused) return;
    const advance = () => {
      const next = stepRef.current + 1;
      if (next >= snapshots.length) {
        setWinner(snapshots[snapshots.length - 1]?.winner || null);
        setPhase('result');
        return;
      }
      stepRef.current = next;
      const s = snapshots[next];
      setCurrentSnapshot(s);
      if (s.type === 'attack') {
        setShakeTeam(s.defenderTeam);
        setLastDamage({ team: s.defenderTeam, amount: s.damage, key: next });
        setDamagePopup({ team: s.defenderTeam, amount: s.damage, key: next });
        setTimeout(() => setShakeTeam(null), 300);
        setTimeout(() => setDamagePopup(p => p.key === next ? { team: null, amount: 0, key: 0 } : p), 600);
      }
      timerRef.current = setTimeout(advance, 900 / speed);
    };
    timerRef.current = setTimeout(advance, 700 / speed);
    return () => clearTimer();
  }, [phase, snapshots, speed, clearTimer, paused]);

  useEffect(() => {
    if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight;
  }, [currentSnapshot]);

  const changeSpeed = useCallback((s) => setSpeed(s), []);
  const togglePause = useCallback(() => setPaused(p => !p), []);
  const reset = useCallback(() => {
    clearTimer();
    setPaused(false);
    setPhase('select');
    setSnapshots([]);
    setCurrentSnapshot(null);
    setWinner(null);
    setShakeTeam(null);
    setLastDamage({ team: null, amount: 0, key: 0 });
    setDamagePopup({ team: null, amount: 0, key: 0 });
    stepRef.current = 0;
  }, [clearTimer]);

  const s = currentSnapshot;
  const battleTeam1Name = teams.find(t => t._id === team1Id)?.name || 'Team 1';
  const battleTeam2Name = teams.find(t => t._id === team2Id)?.name || 'Team 2';

  return (
    <div className="container battle-page">
      <Link href="/" className="back-link">&larr; Back</Link>

      {phase === 'select' && (
        <div className="battle-select">
          <div className="battle-select-header">
            <span className="battle-select-icon">⚔️</span>
            <h2>Team Battle</h2>
            <p>Select two teams to fight</p>
          </div>
          <div className="battle-select-grid">
            <div className="battle-select-col">
              <label className="battle-select-label">Team 1</label>
              <select className="input battle-select-input" value={team1Id} onChange={e => setTeam1Id(e.target.value)}>
                <option value="">— Choose —</option>
                {teams.map(t => (
                  <option key={t._id} value={t._id}>{t.name} ({t.pokemon?.length || 0}/6)</option>
                ))}
              </select>
            </div>
            <div className="battle-vs-badge">VS</div>
            <div className="battle-select-col">
              <label className="battle-select-label">Team 2</label>
              <select className="input battle-select-input" value={team2Id} onChange={e => setTeam2Id(e.target.value)}>
                <option value="">— Choose —</option>
                {teams.map(t => (
                  <option key={t._id} value={t._id}>{t.name} ({t.pokemon?.length || 0}/6)</option>
                ))}
              </select>
            </div>
          </div>
          <button className="btn-battle-go" onClick={runBattle}>
            <span className="btn-battle-go-icon">⚔</span>
            <span>Start Battle!</span>
          </button>
        </div>
      )}

      {phase === 'loading' && (
        <div className="loading-state">
          <div className="pokeball-loader" />
          <p>{loadingMessage || 'Loading...'}</p>
        </div>
      )}

      {phase === 'battle' && s && (
        <div className="battle-layout">
          {/* Team 1 roster — left column */}
          <div className="battle-roster roster-left">
            <div className="roster-header">
              <span className="roster-tag team1-tag">TEAM 1</span>
              <span className="roster-name">{battleTeam1Name}</span>
              <span className="roster-count">{s.team1.filter(p => !p.fainted).length} alive</span>
            </div>
            <div className="roster-list">
              {s.team1.map((p, i) => (
                <RosterSlot key={p.externalId} pokemon={p} isActive={i === s.active1} />
              ))}
            </div>
          </div>

          {/* Arena — center column */}
          <div className="battle-arena">
            <div className="battle-arena-bg">
              <div className="battle-actives">
                <ActiveBattle
                  pokemon={s.team1[s.active1]}
                  team={1}
                  shake={shakeTeam === 1}
                  damagePopupData={damagePopup.team === 1 && damagePopup.key > 0 ? lastDamage.amount : null}
                  lastDamage={lastDamage.key}
                />
                <div className="battle-vs-center">VS</div>
                <ActiveBattle
                  pokemon={s.team2[s.active2]}
                  team={2}
                  shake={shakeTeam === 2}
                  damagePopupData={damagePopup.team === 2 && damagePopup.key > 0 ? lastDamage.amount : null}
                  lastDamage={lastDamage.key}
                />
              </div>
              <div className="battle-center-log" ref={logRef}>
                {s.type === 'attack' && (
                  <div className={`battle-msg ${s.attackerTeam === 1 ? 'msg-team1' : 'msg-team2'}`}>
                    <span className="battle-msg-team">[{s.attackerTeam === 1 ? 'P1' : 'P2'}]</span>
                    {' '}<strong>{cleanName(s.attacker)}</strong> used{' '}
                    <MoveTypeBadge type={s.moveType} />
                    {' '}{s.move}
                    {s.critical && <span className="msg-crit"> Critical hit!</span>}
                    {s.effectiveness > 1 && <span className="msg-eff eff-strong"> Super effective!</span>}
                    {s.effectiveness === 0 && <span className="msg-eff eff-none"> No effect!</span>}
                    {s.effectiveness > 0 && s.effectiveness < 1 && <span className="msg-eff eff-weak"> Not very effective...</span>}
                    {s.damage > 0 && <> — <strong>{s.damage}</strong> dmg</>}
                  </div>
                )}
                {s.type === 'faint' && (
                  <div className="battle-msg msg-faint">
                    💀 <strong>{cleanName(s.fainted)}</strong> fainted!
                  </div>
                )}
              </div>
            </div>

            {/* Controls */}
            <div className="battle-controls">
            <div className="battle-speed-group">
              <span className="speed-label">Speed</span>
              {SPEEDS.map(s => (
                <button key={s} className={`speed-btn ${speed === s ? 'speed-active' : ''}`} onClick={() => changeSpeed(s)}>
                  {s}×
                </button>
              ))}
            </div>
            <button className="btn-pause" onClick={togglePause}>
              {paused ? '▶ Resume' : '⏸ Pause'}
            </button>
            <button className="btn-reset" onClick={reset}>✕ Stop</button>
          </div>
        </div>

        {/* Team 2 roster — right column */}
        <div className="battle-roster roster-right">
          <div className="roster-header">
            <span className="roster-count">{s.team2.filter(p => !p.fainted).length} alive</span>
            <span className="roster-name">{battleTeam2Name}</span>
            <span className="roster-tag team2-tag">TEAM 2</span>
          </div>
          <div className="roster-list">
            {s.team2.map((p, i) => (
              <RosterSlot key={p.externalId} pokemon={p} isActive={i === s.active2} />
            ))}
          </div>
        </div>
      </div>
      )}

      {phase === 'result' && (
        <div className="battle-result">
          <div className={`result-card ${winner === 1 ? 'wins-team1' : 'wins-team2'}`}>
            <div className="result-crown">👑</div>
            <h2 className="result-title">{winner === 1 ? battleTeam1Name : battleTeam2Name} Wins!</h2>
            <p className="result-sub">
              {snapshots.filter(x => x.type === 'attack').length} turns
            </p>
            <div className="result-teams">
              <div className="result-team">
                <h4 className={winner === 1 ? 'result-winner' : ''}>{battleTeam1Name}</h4>
                {snapshots[snapshots.length - 1]?.team1.map(p => (
                  <div key={p.externalId} className={`result-member ${p.fainted ? 'fallen' : 'alive'}`}>
                    <span>{p.fainted ? '💀' : '✅'}</span>
                    <span>{cleanName(p.title)}</span>
                    <span className="result-hp">{p.currentHP}/{p.maxHP}</span>
                    <span className="result-dmg">{damageLog[p.title] || 0} dmg</span>
                  </div>
                ))}
              </div>
              <div className="result-divider" />
              <div className="result-team">
                <h4 className={winner === 2 ? 'result-winner' : ''}>{battleTeam2Name}</h4>
                {snapshots[snapshots.length - 1]?.team2.map(p => (
                  <div key={p.externalId} className={`result-member ${p.fainted ? 'fallen' : 'alive'}`}>
                    <span>{p.fainted ? '💀' : '✅'}</span>
                    <span>{cleanName(p.title)}</span>
                    <span className="result-hp">{p.currentHP}/{p.maxHP}</span>
                    <span className="result-dmg">{damageLog[p.title] || 0} dmg</span>
                  </div>
                ))}
              </div>
            </div>
            <button className="btn-battle-go" onClick={reset}>
              <span>⚔ New Battle</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
