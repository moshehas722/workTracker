import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { formatDuration } from '../format.js';
import { api } from '../api.js';

export default function ActiveTimerBanner({ active, onStopped }) {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (!active) return undefined;

    const update = () => setElapsed((Date.now() - new Date(active.start_time).getTime()) / 1000);
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [active]);

  if (!active) return null;

  const handleStop = async () => {
    await api.stopTimer();
    onStopped();
  };

  return (
    <div className="active-timer-banner">
      <span>
        Tracking <Link to={`/projects/${active.project_id}`}>{active.project_name}</Link> — {formatDuration(elapsed)}
      </span>
      <button onClick={handleStop}>Stop</button>
    </div>
  );
}
