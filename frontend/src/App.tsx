import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import { 
  ShieldAlert, 
  LayoutDashboard, 
  Compass, 
  Cpu,
  Moon,
  Sun
} from 'lucide-react';
import { Dashboard } from './pages/Dashboard';
import { Planner } from './pages/Planner';
import flameLogo from './assets/flame.png';

type Theme = 'dark' | 'light';

interface NavbarProps {
  theme: Theme;
  onToggleTheme: () => void;
}

const Navbar: React.FC<NavbarProps> = ({ theme, onToggleTheme }) => {
  const location = useLocation();

  const navLinks = [
    { path: '/', label: 'Dashboard', icon: <LayoutDashboard className="w-4 h-4" /> },
    { path: '/planner', label: 'Evacuation Planner', icon: <Compass className="w-4 h-4" /> },
  ];

  return (
    <header className="bg-slate-900/90 backdrop-blur-md border-b border-slate-800 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand */}
        <Link to="/" className="flex items-center gap-3 group">
          <div className="p-2 rounded-xl bg-gradient-to-br from-rose-500 to-indigo-600 text-white shadow-lg shadow-indigo-500/20 group-hover:scale-105 transition-transform duration-200">
            <img src={flameLogo} alt="" className="w-5 h-5 object-contain" />
          </div>
          <div>
            <div className="font-extrabold text-sm sm:text-base text-slate-100 tracking-tight flex items-center gap-2">
              <span>AgniRakshak</span>
              <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-indigo-500/20 border border-indigo-500/30 text-indigo-400">
                A* Engine
              </span>
            </div>
            <div className="text-[11px] text-slate-400 font-medium hidden sm:block">
              Dynamic Emergency Evacuation & Fire Simulation
            </div>
          </div>
        </Link>

        {/* Navigation Tabs */}
        <nav className="flex items-center gap-1 sm:gap-2">
          {navLinks.map((link) => {
            const isActive = location.pathname === link.path;
            return (
              <Link
                key={link.path}
                to={link.path}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all duration-150 ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
                }`}
              >
                {link.icon}
                <span>{link.label}</span>
              </Link>
            );
          })}
          <button
            type="button"
            onClick={onToggleTheme}
            aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
            aria-pressed={theme === 'light'}
            title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
            className="flex items-center justify-center p-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800/80 transition-colors cursor-pointer"
          >
            {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
        </nav>

        {/* Status Indicator */}
        <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-950 border border-slate-800 text-[11px] font-mono text-emerald-400">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          <span>A* Routing Engine Ready</span>
        </div>
      </div>
    </header>
  );
};

export const App: React.FC = () => {
  const [theme, setTheme] = useState<Theme>(() => {
    const savedTheme = window.localStorage.getItem('evacplanner-theme');
    return savedTheme === 'light' ? 'light' : 'dark';
  });

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    document.documentElement.style.colorScheme = theme;
    window.localStorage.setItem('evacplanner-theme', theme);
  }, [theme]);

  return (
    <Router>
      <div data-theme={theme} className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
        <Navbar theme={theme} onToggleTheme={() => setTheme((current) => current === 'dark' ? 'light' : 'dark')} />

        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/planner" element={<Planner />} />
          </Routes>
        </main>

        <footer className="border-t border-slate-800/80 bg-slate-950 py-4 text-center text-xs text-slate-500">
          <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Cpu className="w-3.5 h-3.5 text-indigo-400" />
              <span>A* Pathfinding with Manhattan Heuristic + Constraint Validation Layer</span>
            </div>
            <div>
              <span>FastAPI Backend • React TypeScript Frontend • SQLite Database</span>
            </div>
          </div>
        </footer>
      </div>
    </Router>
  );
};

export default App;
