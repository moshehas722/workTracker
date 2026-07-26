import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { formatDuration } from '../format.js';

export default function ActiveTimerBanner({ active }) {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (!active) return undefined;

    const update = () => setElapsed((Date.now() - new Date(active.start_time).getTime()) / 1000);
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [active]);

  if (!active) return null;

  return (
    <Link to={`/projects/${active.project_id}`} className="active-timer-banner">
      <span>Tracking <strong>{active.project_name}</strong> — {formatDuration(elapsed)}</span>
    </Link>
  );
}
