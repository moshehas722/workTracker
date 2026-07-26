import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api.js';
import { formatHours, formatMoney } from '../format.js';
import ProjectFormModal from '../components/ProjectFormModal.jsx';

function ProjectCard({ project }) {
  return (
    <Link to={`/projects/${project.id}`} className="project-card">
      <span className="project-name">{project.name}</span>
      <div className="project-stats">
        <span>{formatHours(project.accumulated_seconds)} h</span>
        <span>{formatMoney(project.accumulated_amount, project.currency)}</span>
      </div>
      <div className="project-rate">{formatMoney(project.hourly_rate, project.currency)} / h</div>
    </Link>
  );
}

export default function Dashboard({ activeTimer }) {
  const [projects, setProjects] = useState(null);
  const [showForm, setShowForm] = useState(false);

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

  if (!projects) return <p className="loading">Loading…</p>;

  const newProjects = projects.filter((p) => p.status !== 'completed');
  const completedProjects = projects.filter((p) => p.status === 'completed');

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h1>Projects</h1>
        <button onClick={() => setShowForm(true)}>+ New project</button>
      </div>

      {newProjects.length === 0 && <p className="empty">No active projects yet — create one to start tracking time.</p>}

      <div className="project-grid">
        {newProjects.map((project) => (
          <ProjectCard key={project.id} project={project} />
        ))}
      </div>

      {completedProjects.length > 0 && (
        <details className="completed-section">
          <summary>Completed projects ({completedProjects.length})</summary>
          <div className="project-grid project-grid-completed">
            {completedProjects.map((project) => (
              <ProjectCard key={project.id} project={project} />
            ))}
          </div>
        </details>
      )}

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
