import { useState } from 'react';

const CURRENCIES = ['USD', 'EUR', 'GBP', 'ILS'];

export default function ProjectFormModal({ initial, onSubmit, onClose }) {
  const [name, setName] = useState(initial?.name || '');
  const [hourlyRate, setHourlyRate] = useState(initial?.hourly_rate ?? 0);
  const [currency, setCurrency] = useState(initial?.currency || 'USD');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await onSubmit({ name, hourly_rate: Number(hourlyRate), currency });
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <form className="modal" onClick={(e) => e.stopPropagation()} onSubmit={handleSubmit}>
        <h2>{initial ? 'Edit project' : 'New project'}</h2>

        <label>
          Name
          <input value={name} onChange={(e) => setName(e.target.value)} required autoFocus />
        </label>

        <label>
          Hourly rate
          <input
            type="number"
            min="0"
            step="0.01"
            value={hourlyRate}
            onChange={(e) => setHourlyRate(e.target.value)}
          />
        </label>

        <label>
          Currency
          <select value={currency} onChange={(e) => setCurrency(e.target.value)}>
            {CURRENCIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </label>

        {error && <p className="error">{error}</p>}

        <div className="modal-actions">
          <button type="button" onClick={onClose}>Cancel</button>
          <button type="submit" disabled={saving}>{saving ? 'Saving…' : 'Save'}</button>
        </div>
      </form>
    </div>
  );
}
