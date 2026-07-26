import { useCallback, useEffect, useState } from 'react';
import { api } from './api.js';

export function useActiveTimer() {
  const [active, setActive] = useState(undefined); // undefined = loading, null = none running

  const refresh = useCallback(async () => {
    const result = await api.getActiveTimer();
    setActive(result);
    return result;
  }, []);

  useEffect(() => {
    refresh();
    const interval = setInterval(refresh, 5000);
    return () => clearInterval(interval);
  }, [refresh]);

  return { active, refresh };
}
