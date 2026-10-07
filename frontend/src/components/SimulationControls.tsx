import React from 'react';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  Flame, 
  FastForward, 
  Footprints,
  Clock
} from 'lucide-react';
import { SimStatus } from '../types/evacuation';

interface SimulationControlsProps {
  simulationStatus: SimStatus;
  onStartSimulation: () => void;
  onPauseSimulation: () => void;
  onResetSimulation: () => void;
  onStepFire: () => void;
  onStepEvacuation: () => void;
  isEvacuating: boolean;
  onToggleAutoEvacuation: () => void;
  fireSpreadIntervalSeconds: number;
  onIntervalChange: (seconds: number) => void;
  disabled?: boolean;
}

export const SimulationControls: React.FC<SimulationControlsProps> = ({
  simulationStatus,
  onStartSimulation,
  onPauseSimulation,
  onResetSimulation,
  onStepFire,
  onStepEvacuation,
  isEvacuating,
  onToggleAutoEvacuation,
  fireSpreadIntervalSeconds,
  onIntervalChange,
  disabled = false,
}) => {
  const isRunning = simulationStatus === 'ACTIVE';

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-xl flex flex-wrap items-center justify-between gap-4">
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          {isRunning ? (
            <button
              onClick={onPauseSimulation}
              disabled={disabled}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold bg-amber-600 hover:bg-amber-500 text-white shadow-lg shadow-amber-600/20 transition cursor-pointer disabled:opacity-50"
              title="Pause fire spread simulation"
            >
              <Pause className="w-4 h-4 fill-current" />
              <span>Pause Fire</span>
            </button>
          ) : (
            <button
              onClick={onStartSimulation}
              disabled={disabled}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-600/25 transition cursor-pointer disabled:opacity-50"
              title="Start periodic fire spread simulation (every 2 seconds)"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>Start Fire Spread</span>
            </button>
          )}

          <button
            onClick={onStepFire}
            disabled={disabled || isRunning}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-amber-300 border border-slate-700 transition cursor-pointer disabled:opacity-50"
            title="Step fire spread forward by 1 tick"
          >
            <Flame className="w-3.5 h-3.5" />
            <span>Step Fire</span>
          </button>
        </div>

        <div className="h-6 w-px bg-slate-800 hidden sm:block"></div>

        {/* Evacuation Movement Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={onToggleAutoEvacuation}
            disabled={disabled}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition cursor-pointer shadow-lg disabled:opacity-50 ${
              isEvacuating
                ? 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-600/25 ring-2 ring-indigo-400/40'
                : 'bg-indigo-950/80 hover:bg-indigo-900 border border-indigo-700/80 text-indigo-300'
            }`}
            title="Animate people moving step-by-step along their evacuation paths"
          >
            <Footprints className="w-4 h-4" />
            <span>{isEvacuating ? 'Stop Evacuation' : 'Animate Evacuation'}</span>
          </button>

          <button
            onClick={onStepEvacuation}
            disabled={disabled || isEvacuating}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition cursor-pointer disabled:opacity-50"
            title="Move people 1 step forward along their paths"
          >
            <FastForward className="w-3.5 h-3.5" />
            <span>Step Movement</span>
          </button>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {/* Fire spread speed selector */}
        <div className="flex items-center gap-2 bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-800 text-xs">
          <Clock className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-slate-400">Fire Interval:</span>
          <select
            value={fireSpreadIntervalSeconds}
            onChange={(e) => onIntervalChange(Number(e.target.value))}
            className="bg-transparent text-slate-200 font-medium focus:outline-none cursor-pointer"
          >
            <option value={1} className="bg-slate-900">1s</option>
            <option value={2} className="bg-slate-900">2s (Standard)</option>
            <option value={3} className="bg-slate-900">3s</option>
            <option value={5} className="bg-slate-900">5s</option>
          </select>
        </div>

        {/* Reset button */}
        <button
          onClick={onResetSimulation}
          disabled={disabled}
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium bg-slate-800/80 hover:bg-rose-950/40 hover:text-rose-300 hover:border-rose-800 border border-slate-700 text-slate-300 transition cursor-pointer disabled:opacity-50"
          title="Reset simulation state"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Reset Simulation</span>
        </button>
      </div>
    </div>
  );
};
