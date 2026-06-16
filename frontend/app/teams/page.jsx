'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { getTeams, deleteTeam } from '../../services/backendApi';
import TeamCard from '../../components/TeamCard';
import TeamModal from '../../components/TeamModal';

export default function TeamsPage() {
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(null);
  const [error, setError] = useState(null);
  const [teamModalOpen, setTeamModalOpen] = useState(false);
  const [editingTeamId, setEditingTeamId] = useState(null);

  const fetchTeams = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await getTeams();
      setTeams(result);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchTeams(); }, []);

  const handleDelete = async (id) => {
    if (!confirm('Delete this team?')) return;
    setDeleting(id);
    try {
      await deleteTeam(id);
      setTeams(teams.filter((t) => t._id !== id));
    } catch (err) {
      setError(err.message);
    } finally {
      setDeleting(null);
    }
  };

  const openEditTeam = (teamId) => {
    setEditingTeamId(teamId);
    setTeamModalOpen(true);
  };

  return (
    <div className="container">
      <header className="header">
        <div className="header-brand">
          <div className="pokeball-icon" />
          <div>
            <h1>My Teams</h1>
            <p className="header-subtitle">Build your dream team</p>
          </div>
        </div>
        <div className="header-actions">
          <button onClick={() => { setEditingTeamId(null); setTeamModalOpen(true); }} className="btn btn-sync">
            + New Team
          </button>
          <Link href="/" className="btn btn-header">&larr; Pokédex</Link>
        </div>
      </header>

      {error && (
        <div className="error-banner">
          <span className="error-icon">!</span> {error}
        </div>
      )}

      {loading && (
        <div className="loading-state">
          <div className="pokeball-loader" />
          <p>Loading teams...</p>
        </div>
      )}

      {!loading && teams.length === 0 && !error && (
        <div className="empty-state">
          <div className="empty-icon">🏆</div>
          <p>No teams yet. Create your first team!</p>
          <button onClick={() => { setEditingTeamId(null); setTeamModalOpen(true); }} className="btn btn-sync">
            + New Team
          </button>
        </div>
      )}

      {!loading && teams.length > 0 && (
        <div className="teams-grid">
          {teams.map((team) => (
            <div key={team._id} className="team-card-wrapper">
              <TeamCard team={team} />
              <div className="team-card-actions">
                <button
                  className="btn btn-small btn-edit-team"
                  onClick={() => openEditTeam(team._id)}
                >
                  Edit
                </button>
                <button
                  className="btn btn-small btn-delete-team"
                  onClick={() => handleDelete(team._id)}
                  disabled={deleting === team._id}
                >
                  {deleting === team._id ? '...' : 'Delete'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {teamModalOpen && (
        <TeamModal
          teamId={editingTeamId}
          onClose={() => { setTeamModalOpen(false); setEditingTeamId(null); }}
          onSaved={() => { setTeamModalOpen(false); setEditingTeamId(null); fetchTeams(); }}
        />
      )}
    </div>
  );
}
