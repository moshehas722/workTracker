import { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../api.js';
import { formatDuration, formatHours, formatMoney } from '../format.js';
import { entriesToCsv, parseCsv, downloadCsv } from '../csv.js';
import ProjectFormModal from '../components/ProjectFormModal.jsx';
import EntryForm from '../components/EntryForm.jsx';
import TimerTimeModal from '../components/TimerTimeModal.jsx';

export default function ProjectDetail({ activeTimer, onTimerChange }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const importInputRef = useRef(null);

  const [project, setProject] = useState(null);
  const [entries, setEntries] = useState(null);
  const [showEditProject, setShowEditProject] = useState(false);
  const [showAddEntry, setShowAddEntry] = useState(false);
  const [editingEntryId, setEditingEntryId] = useState(null);
  const [error, setError] = useState(null);
  const [importing, setImporting] = useState(false);
  const [timerAction, setTimerAction] = useState(null);

  const load = async () => {
    const [projectData, entriesData] = await Promise.all([
      api.getProject(id),
      api.getProjectEntries(id),
    ]);
    setProject(projectData);
    setEntries(entriesData);
  };

  useEffect(() => {
    load();
  }, [id]);

  useEffect(() => {
    load();
  }, [activeTimer?.id]);

  if (!project || !entries) return <p className="loading">Loading…</p>;

  const isCompleted = project.status === 'completed';
  const isActive = activeTimer && Number(activeTimer.project_id) === Number(id);
  const isBlocked = activeTimer && !isActive;

  const handleStart = async (startTime) => {
    await api.startTimer(id, startTime);
    await onTimerChange();
  };

  const handleStop = async (endTime) => {
    await api.stopTimer(endTime);
    await onTimerChange();
  };

  const handleDeleteProject = async () => {
    if (!confirm(`Delete project "${project.name}" and all its time entries?`)) return;
    await api.deleteProject(id);
    navigate('/');
  };

  const handleDeleteEntry = async (entryId) => {
    if (!confirm('Delete this time entry?')) return;
    await api.deleteEntry(entryId);
    await load();
  };

  const handleMarkCompleted = async () => {
    if (!confirm(`Mark "${project.name}" as completed? It will become view-only until reopened.`)) return;
    await api.setProjectStatus(id, 'completed');
    await load();
  };

  const handleReopen = async () => {
    await api.setProjectStatus(id, 'new');
    await load();
  };

  const handleExport = () => {
    const csv = entriesToCsv(entries, project);
    const filename = `${project.name.replace(/[^a-z0-9]+/gi, '_') || 'project'}-entries.csv`;
    downloadCsv(filename, csv);
  };

  const handleImportFile = async (e) => {
    const file = e.target.files[0];
    e.target.value = '';
    if (!file) return;

    const text = await file.text();
    const rows = parseCsv(text);
    const importable = rows.filter((row) => row.start_time && row.end_time);

    if (importable.length === 0) {
      setError('No importable rows found. The CSV needs start_time and end_time columns.');
      return;
    }

    setImporting(true);
    setError(null);
    let imported = 0;
    try {
      for (const row of importable) {
        await api.createEntry({
          project_id: Number(id),
          start_time: new Date(row.start_time).toISOString(),
          end_time: new Date(row.end_time).toISOString(),
          note: row.note || null,
        });
        imported += 1;
      }
      await load();
    } catch (err) {
      setError(`Import stopped after ${imported} of ${importable.length} rows: ${err.message}`);
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="project-detail">
      <button className="back-link icon-button" onClick={() => navigate('/')} title="All projects" aria-label="All projects">&larr;</button>

      <div className="project-detail-header">
        <div>
          <h1>
            {project.name}
            <span className={`status-badge status-${project.status}`}>{project.status}</span>
          </h1>
          {project.customer_name && <p className="project-customer">{project.customer_name}</p>}
          <p className="project-rate">{formatMoney(project.hourly_rate, project.currency)} / h</p>
        </div>
        <div className="project-detail-actions">
          {isCompleted ? (
            <button className="icon-button" onClick={handleReopen} title="Reopen" aria-label="Reopen">&#8635;</button>
          ) : (
            <>
              <button className="icon-button" onClick={() => setShowEditProject(true)} title="Edit" aria-label="Edit">&#9998;</button>
              <button className="icon-button" onClick={handleMarkCompleted} title="Mark completed" aria-label="Mark completed">&#10003;</button>
              <button className="icon-button" onClick={handleDeleteProject} title="Delete" aria-label="Delete">&#10005;</button>
            </>
          )}
        </div>
      </div>

      <div className="project-stats-row">
        <span>{formatHours(project.accumulated_seconds)} h accumulated</span>
        <span>{formatMoney(project.accumulated_amount, project.currency)}</span>
      </div>

      {error && <p className="error">{error}</p>}

      {isCompleted ? (
        <p className="empty">This project is completed and view-only. Reopen it to make changes.</p>
      ) : (
        <div className="timer-controls">
          {isActive ? (
            <button className="icon-button stop-button" onClick={() => setTimerAction('stop')} title="Stop timer" aria-label="Stop timer">&#9632;</button>
          ) : (
            <button className="icon-button" disabled={isBlocked} onClick={() => setTimerAction('start')} title="Start timer" aria-label="Start timer">&#9654;</button>
          )}
        </div>
      )}

      <div className="entries-header">
        <h2>Time entries</h2>
        <div className="entries-header-actions">
          <button className="icon-button" onClick={handleExport} disabled={entries.length === 0} title="Export CSV" aria-label="Export CSV">&#8681;</button>
          {!isCompleted && (
            <>
              <button className="icon-button" onClick={() => importInputRef.current?.click()} disabled={importing} title="Import CSV" aria-label="Import CSV">&#8679;</button>
              <input
                ref={importInputRef}
                type="file"
                accept=".csv,text/csv"
                onChange={handleImportFile}
                style={{ display: 'none' }}
              />
              <button className="icon-button" onClick={() => setShowAddEntry((v) => !v)} title={showAddEntry ? 'Cancel' : 'Add manual entry'} aria-label={showAddEntry ? 'Cancel' : 'Add manual entry'}>
                {showAddEntry ? '✕' : '+'}
              </button>
            </>
          )}
        </div>
      </div>

      {!isCompleted && showAddEntry && (
        <EntryForm
          onSubmit={async (data) => {
            await api.createEntry({ ...data, project_id: Number(id) });
            setShowAddEntry(false);
            await load();
          }}
          onCancel={() => setShowAddEntry(false)}
        />
      )}

      <div className="entries-table-wrapper">
        <table className="entries-table">
          <thead>
            <tr>
              <th>Start</th>
              <th>End</th>
              <th>Duration</th>
              <th>Amount</th>
              <th>Note</th>
              <th>Type</th>
              {!isCompleted && <th></th>}
            </tr>
          </thead>
          <tbody>
            {entries.map((entry) =>
              editingEntryId === entry.id ? (
                <tr key={entry.id}>
                  <td colSpan={7}>
                    <EntryForm
                      initial={entry}
                      onSubmit={async (data) => {
                        await api.updateEntry(entry.id, data);
                        setEditingEntryId(null);
                        await load();
                      }}
                      onCancel={() => setEditingEntryId(null)}
                    />
                  </td>
                </tr>
              ) : (
                <tr key={entry.id}>
                  <td>{entry.start_time ? new Date(entry.start_time).toLocaleString() : '—'}</td>
                  <td>{entry.end_time ? new Date(entry.end_time).toLocaleString() : 'running…'}</td>
                  <td>{entry.duration_seconds != null ? formatDuration(entry.duration_seconds) : '—'}</td>
                  <td>{entry.amount != null ? formatMoney(entry.amount, entry.currency || project.currency) : '—'}</td>
                  <td>{entry.note || ''}</td>
                  <td>{entry.is_manual ? 'Manual' : 'Tracked'}</td>
                  {!isCompleted && (
                    <td className="entry-row-actions">
                      {entry.end_time && (
                        <>
                          <button className="icon-button" onClick={() => setEditingEntryId(entry.id)} title="Edit" aria-label="Edit">&#9998;</button>
                          <button className="icon-button" onClick={() => handleDeleteEntry(entry.id)} title="Delete" aria-label="Delete">&#10005;</button>
                        </>
                      )}
                    </td>
                  )}
                </tr>
              ),
            )}
            {entries.length === 0 && (
              <tr>
                <td colSpan={7} className="empty">No time entries yet.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {showEditProject && (
        <ProjectFormModal
          initial={project}
          onSubmit={async (data) => {
            await api.updateProject(id, data);
            await load();
          }}
          onClose={() => setShowEditProject(false)}
        />
      )}

      {timerAction && (
        <TimerTimeModal
          action={timerAction}
          onConfirm={async (time) => {
            if (timerAction === 'start') {
              await handleStart(time);
            } else {
              await handleStop(time);
            }
            setTimerAction(null);
          }}
          onCancel={() => setTimerAction(null)}
        />
      )}
    </div>
  );
}
