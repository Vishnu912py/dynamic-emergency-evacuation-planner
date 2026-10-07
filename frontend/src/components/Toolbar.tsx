import React from 'react';
import { 
  MousePointer, 
  Square, 
  User, 
  DoorOpen, 
  Flame, 
  Eraser, 
  RotateCcw, 
  Sparkles, 
  Route
} from 'lucide-react';
import { ToolType } from '../types/evacuation';

interface ToolbarProps {
  selectedTool: ToolType;
  onSelectTool: (tool: ToolType) => void;
  gridSize: number;
  onGridSizeChange: (size: number) => void;
  onCalculateRoutes: () => void;
  onLoadDemo: () => void;
  onClearGrid: () => void;
  isCalculating: boolean;
  disabled?: boolean;
}

export const Toolbar: React.FC<ToolbarProps> = ({
  selectedTool,
  onSelectTool,
  gridSize,
  onGridSizeChange,
  onCalculateRoutes,
  onLoadDemo,
  onClearGrid,
  isCalculating,
  disabled = false,
}) => {
  const tools: { id: ToolType; label: string; icon: React.ReactNode; color: string; activeColor: string }[] = [
    { 
      id: 'select', 
      label: 'Select', 
      icon: <MousePointer className="w-4 h-4" />, 
      color: 'hover:bg-slate-800 text-slate-300', 
      activeColor: 'bg-indigo-600 text-white shadow-indigo-500/25' 
    },
    { 
      id: 'wall', 
      label: 'Wall', 
      icon: <Square className="w-4 h-4 fill-current" />, 
      color: 'hover:bg-slate-800 text-slate-400', 
      activeColor: 'bg-slate-700 text-slate-100 shadow-slate-900/50' 
    },
    { 
      id: 'person', 
      label: 'Person', 
      icon: <User className="w-4 h-4" />, 
      color: 'hover:bg-slate-800 text-sky-400', 
      activeColor: 'bg-sky-600 text-white shadow-sky-500/25' 
    },
    { 
      id: 'exit', 
      label: 'Exit', 
      icon: <DoorOpen className="w-4 h-4" />, 
      color: 'hover:bg-slate-800 text-emerald-400', 
      activeColor: 'bg-emerald-600 text-white shadow-emerald-500/25' 
    },
    { 
      id: 'fire', 
      label: 'Fire', 
      icon: <Flame className="w-4 h-4 fill-current" />, 
      color: 'hover:bg-slate-800 text-amber-500', 
      activeColor: 'bg-rose-600 text-white shadow-rose-500/25' 
    },
    { 
      id: 'erase', 
      label: 'Erase', 
      icon: <Eraser className="w-4 h-4" />, 
      color: 'hover:bg-slate-800 text-rose-400', 
      activeColor: 'bg-rose-700/80 text-white shadow-rose-700/25' 
    },
  ];

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-xl flex flex-wrap gap-4 items-center justify-between">
      {/* Editor Tools */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 mr-1">
          Editor Tools
        </span>
        <div className="inline-flex bg-slate-950 p-1 rounded-lg border border-slate-800 gap-1">
          {tools.map((t) => {
            const isActive = selectedTool === t.id;
            return (
              <button
                key={t.id}
                onClick={() => onSelectTool(t.id)}
                disabled={disabled}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-150 ${
                  isActive
                    ? `${t.activeColor} shadow-md`
                    : `${t.color} text-slate-300`
                } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                title={`Select ${t.label} tool`}
              >
                {t.icon}
                <span>{t.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Grid Size Select */}
      <div className="flex items-center gap-2">
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
          Grid:
        </span>
        <select
          value={gridSize}
          onChange={(e) => onGridSizeChange(Number(e.target.value))}
          disabled={disabled}
          className="bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-indigo-500 cursor-pointer disabled:opacity-50"
        >
          <option value={10}>10 x 10</option>
          <option value={15}>15 x 15</option>
          <option value={20}>20 x 20 (Standard)</option>
          <option value={25}>25 x 25</option>
        </select>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap items-center gap-2">
        <button
          onClick={onLoadDemo}
          disabled={disabled || isCalculating}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-indigo-950/80 hover:bg-indigo-900 border border-indigo-700/60 text-indigo-300 transition cursor-pointer disabled:opacity-50"
          title="Load preconfigured demo building with corridors, fire, exits and people"
        >
          <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
          <span>Load Demo Scenario</span>
        </button>

        <button
          onClick={onClearGrid}
          disabled={disabled || isCalculating}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-300 transition cursor-pointer disabled:opacity-50"
          title="Clear grid layout"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Clear</span>
        </button>

        <button
          onClick={onCalculateRoutes}
          disabled={isCalculating}
          className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white shadow-lg shadow-emerald-600/25 transition cursor-pointer disabled:opacity-50"
          title="Run A* pathfinding to calculate shortest safe evacuation routes"
        >
          <Route className="w-4 h-4" />
          <span>{isCalculating ? 'Calculating...' : 'Calculate Routes'}</span>
        </button>
      </div>
    </div>
  );
};
