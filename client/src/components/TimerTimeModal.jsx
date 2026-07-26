import { useState } from 'react';
import { toDatetimeLocalValue, fromDatetimeLocalValue } from '../format.js';

export default function TimerTimeModal({ action, onConfirm, onCancel }) {
  const [value, setValue] = useState(() => toDatetimeLocalValue(new Date().toISOString()));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const isStop = action === 'stop';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await onConfirm(fromDatetimeLocalValue(value));
    } catch (err) {
      setError(err.message);
      setSaving(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onCancel}>
      <form className="modal" onClick={(e) => e.stopPropagation()} onSubmit={handleSubmit}>
        <h2>{isStop ? 'Stop timer' : 'Start timer'}</h2>

        <label>
          {isStop ? 'Stop time' : 'Start time'}
          <input
            type="datetime-local"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            required
            autoFocus
          />
        </label>

        {error && <p className="error">{error}</p>}

        <div className="modal-actions">
          <button type="button" onClick={onCancel}>Cancel</button>
          <button type="submit" disabled={saving}>{saving ? 'Saving…' : isStop ? 'Stop' : 'Start'}</button>
        </div>
      </form>
    </div>
  );
}
