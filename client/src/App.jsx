import { Routes, Route, Link } from 'react-router-dom';
import Dashboard from './pages/Dashboard.jsx';
import ProjectDetail from './pages/ProjectDetail.jsx';
import ActiveTimerBanner from './components/ActiveTimerBanner.jsx';
import { useActiveTimer } from './useActiveTimer.js';

export default function App() {
  const { active, refresh } = useActiveTimer();

  return (
    <div className="app">
      <header className="app-header">
        <Link to="/" className="app-title">Work Tracker</Link>
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
