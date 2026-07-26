async function request(path, options = {}) {
  const res = await fetch(`/api${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });

  if (res.status === 204) return null;

  const data = await res.json().catch(() => null);

  if (!res.ok) {
    throw new Error(data?.error || `request failed: ${res.status}`);
  }

  return data;
}

export const api = {
  getProjects: () => request('/projects'),
  getProject: (id) => request(`/projects/${id}`),
  createProject: (project) => request('/projects', { method: 'POST', body: JSON.stringify(project) }),
  updateProject: (id, project) => request(`/projects/${id}`, { method: 'PUT', body: JSON.stringify(project) }),
  deleteProject: (id) => request(`/projects/${id}`, { method: 'DELETE' }),
  getProjectEntries: (id) => request(`/projects/${id}/entries`),

  createEntry: (entry) => request('/entries', { method: 'POST', body: JSON.stringify(entry) }),
  updateEntry: (id, entry) => request(`/entries/${id}`, { method: 'PUT', body: JSON.stringify(entry) }),
  deleteEntry: (id) => request(`/entries/${id}`, { method: 'DELETE' }),

  getActiveTimer: () => request('/timer/active'),
  startTimer: (project_id) => request('/timer/start', { method: 'POST', body: JSON.stringify({ project_id }) }),
  stopTimer: () => request('/timer/stop', { method: 'POST' }),
};
