import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api.js';
import { formatHours, formatMoney } from '../format.js';
import ProjectFormModal from '../components/ProjectFormModal.jsx';

export default function Dashboard({ activeTimer, onTimerChange }) {
  const [projects, setProjects] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState(null);

  const loadProjects = async () => {
    setProjects(await api.getProjects());
  };

  useEffect(() => {
    loadProjects();
  }, []);

  // Refresh accumulated totals whenever the running timer stops/starts.
  useEffect(() => {
    loadProjects();
  }, [activeTimer?.id]);

  const handleStart = async (projectId) => {
    setError(null);
    try {
      await api.startTimer(projectId);
      await onTimerChange();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleStop = async () => {
    await api.stopTimer();
    await onTimerChange();
  };

  if (!projects) return <p className="loading">Loading…</p>;

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h1>Projects</h1>
        <button onClick={() => setShowForm(true)}>+ New project</button>
      </div>

      {error && <p className="error">{error}</p>}

      {projects.length === 0 && <p className="empty">No projects yet — create one to start tracking time.</p>}

      <div className="project-grid">
        {projects.map((project) => {
          const isActive = activeTimer && Number(activeTimer.project_id) === Number(project.id);
          const isBlocked = activeTimer && !isActive;

          return (
            <div key={project.id} className={`project-card ${isActive ? 'is-active' : ''}`}>
              <Link to={`/projects/${project.id}`} className="project-name">{project.name}</Link>
              <div className="project-stats">
                <span>{formatHours(project.accumulated_seconds)} h</span>
                <span>{formatMoney(project.accumulated_amount, project.currency)}</span>
              </div>
              <div className="project-rate">{formatMoney(project.hourly_rate, project.currency)} / h</div>

              {isActive ? (
                <button className="stop-button" onClick={handleStop}>Stop</button>
              ) : (
                <button disabled={isBlocked} onClick={() => handleStart(project.id)}>Start</button>
              )}
            </div>
          );
        })}
      </div>

      {showForm && (
        <ProjectFormModal
          onSubmit={async (data) => {
            await api.createProject(data);
            await loadProjects();
          }}
          onClose={() => setShowForm(false)}
        />
      )}
    </div>
  );
}
