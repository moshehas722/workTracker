import { useEffect, useState } from 'react';
import { Routes, Route, Link } from 'react-router-dom';
import Dashboard from './pages/Dashboard.jsx';
import ProjectDetail from './pages/ProjectDetail.jsx';
import ActiveTimerBanner from './components/ActiveTimerBanner.jsx';
import { useActiveTimer } from './useActiveTimer.js';

function getInitialTheme() {
  const stored = localStorage.getItem('theme');
  if (stored === 'light' || stored === 'dark') return stored;
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export default function App() {
  const { active, refresh } = useActiveTimer();
  const [theme, setTheme] = useState(getInitialTheme);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => setTheme((t) => (t === 'dark' ? 'light' : 'dark'));

  return (
    <div className="app">
      <header className="app-header">
        <Link to="/" className="app-title">Work Tracker</Link>
        <button
          className="icon-button"
          onClick={toggleTheme}
          title={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
          aria-label="Toggle theme"
        >
          {theme === 'dark' ? '☀' : '☾'}
        </button>
      </header>

      <ActiveTimerBanner active={active} />

      <main>
        <Routes>
          <Route path="/" element={<Dashboard activeTimer={active} />} />
          <Route path="/projects/:id" element={<ProjectDetail activeTimer={active} onTimerChange={refresh} />} />
        </Routes>
      </main>
    </div>
  );
}
