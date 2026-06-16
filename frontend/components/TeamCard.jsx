'use client';

import Link from 'next/link';

export default function TeamCard({ team }) {
  const count = team.pokemon?.length || 0;

  return (
    <Link href={`/teams/${team._id}`} className="team-card-link">
      <div className="team-card">
        <div className="team-card-header">
          <h3 className="team-card-name">{team.name}</h3>
          <span className="team-card-count">{count}/6</span>
        </div>
        <div className="team-card-roster">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className={`team-card-mini ${team.pokemon?.[i] ? 'filled' : 'empty'}`}
            >
              {team.pokemon?.[i] ? (
                <span className="team-card-mini-id">
                  #{String(team.pokemon[i]).padStart(3, '0')}
                </span>
              ) : (
                <span className="team-card-mini-empty">{i + 1}</span>
              )}
            </div>
          ))}
        </div>
        <div className="team-card-footer">
          <span className="team-card-date">
            Updated {new Date(team.updatedAt).toLocaleDateString()}
          </span>
        </div>
      </div>
    </Link>
  );
}
