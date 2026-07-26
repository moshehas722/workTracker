import { useEffect, useState } from 'react';
import { api } from '../api.js';

const CURRENCIES = ['USD', 'EUR', 'GBP', 'ILS'];

export default function ProjectFormModal({ initial, onSubmit, onClose }) {
  const [name, setName] = useState(initial?.name || '');
  const [customerName, setCustomerName] = useState(initial?.customer_name || '');
  const [hourlyRate, setHourlyRate] = useState(initial?.hourly_rate ?? 0);
  const [currency, setCurrency] = useState(initial?.currency || 'USD');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [customerOptions, setCustomerOptions] = useState([]);

  useEffect(() => {
    api.getProjects().then((projects) => {
      const names = [...new Set(projects.map((p) => p.customer_name).filter(Boolean))].sort();
      setCustomerOptions(names);
    });
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await onSubmit({ name, customer_name: customerName.trim() || null, hourly_rate: Number(hourlyRate), currency });
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
          Customer name
          <input
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
            list="customer-name-options"
            placeholder="optional"
          />
          <datalist id="customer-name-options">
            {customerOptions.map((c) => (
              <option key={c} value={c} />
            ))}
          </datalist>
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
