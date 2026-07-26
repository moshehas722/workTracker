import { useState } from 'react';
import { toDatetimeLocalValue, fromDatetimeLocalValue } from '../format.js';

export default function EntryForm({ initial, onSubmit, onCancel }) {
  const [startTime, setStartTime] = useState(toDatetimeLocalValue(initial?.start_time) || '');
  const [endTime, setEndTime] = useState(toDatetimeLocalValue(initial?.end_time) || '');
  const [note, setNote] = useState(initial?.note || '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await onSubmit({
        start_time: fromDatetimeLocalValue(startTime),
        end_time: fromDatetimeLocalValue(endTime),
        note: note || null,
      });
    } catch (err) {
      setError(err.message);
      setSaving(false);
    }
  };

  return (
    <form className="entry-form" onSubmit={handleSubmit}>
      <label>
        Start
        <input type="datetime-local" value={startTime} onChange={(e) => setStartTime(e.target.value)} required />
      </label>
      <label>
        End
        <input type="datetime-local" value={endTime} onChange={(e) => setEndTime(e.target.value)} required />
      </label>
      <label className="note-field">
        Note
        <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="optional" />
      </label>

      {error && <p className="error">{error}</p>}

      <div className="entry-form-actions">
        {onCancel && <button type="button" onClick={onCancel}>Cancel</button>}
        <button type="submit" disabled={saving}>{saving ? 'Saving…' : 'Save'}</button>
      </div>
    </form>
  );
}
