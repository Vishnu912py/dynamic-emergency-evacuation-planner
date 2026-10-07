import React, { useState } from 'react';
import { 
  Square, 
  User, 
  DoorOpen, 
  Flame, 
  AlertTriangle,
  Footprints
} from 'lucide-react';
import { 
  CellType, 
  ToolType, 
  Person, 
  Exit, 
  FireZone, 
  EvacuationRoute 
} from '../types/evacuation';

interface BuildingGridProps {
  grid: CellType[][];
  people: Person[];
  exits: Exit[];
  fires: FireZone[];
  routes: EvacuationRoute[];
  selectedPersonId: string | null;
  onSelectPerson: (id: string | null) => void;
  selectedTool: ToolType;
  onCellClick: (row: number, col: number) => void;
  onCellDrag: (row: number, col: number) => void;
  simulationActive: boolean;
}

export const BuildingGrid: React.FC<BuildingGridProps> = ({
  grid,
  people,
  exits,
  fires,
  routes,
  selectedPersonId,
  onSelectPerson,
  selectedTool,
  onCellClick,
  onCellDrag,
  simulationActive,
}) => {
  const [isMouseDown, setIsMouseDown] = useState(false);

  const rows = grid.length;
  const cols = rows > 0 ? grid[0].length : 0;

  // Build lookups for fast cell rendering
  const peopleMap = new Map<string, Person>();
  people.forEach((p) => {
    peopleMap.set(`${p.row},${p.col}`, p);
  });

  const exitMap = new Map<string, Exit>();
  exits.forEach((e) => {
    exitMap.set(`${e.row},${e.col}`, e);
  });

  // Calculate path cell overlays:
  // Map key "r,c" -> list of route paths passing through
  const pathCells = new Map<string, { route: EvacuationRoute; isSelected: boolean }[]>();

  routes.forEach((r) => {
    if (r.path && r.path.length > 0) {
      const isSel = r.person_id === selectedPersonId;
      r.path.forEach(([pr, pc]) => {
        const key = `${pr},${pc}`;
        const existing = pathCells.get(key) || [];
        existing.push({ route: r, isSelected: isSel });
        pathCells.set(key, existing);
      });
    }
  });

  const handleMouseDown = (r: number, c: number) => {
    setIsMouseDown(true);
    if (selectedTool === 'select') {
      const personHere = peopleMap.get(`${r},${c}`);
      if (personHere) {
        onSelectPerson(personHere.id === selectedPersonId ? null : personHere.id);
        return;
      } else {
        onSelectPerson(null);
      }
    }
    onCellClick(r, c);
  };

  const handleMouseEnter = (r: number, c: number) => {
    if (isMouseDown && (selectedTool === 'wall' || selectedTool === 'erase' || selectedTool === 'fire')) {
      onCellDrag(r, c);
    }
  };

  const handleMouseUp = () => {
    setIsMouseDown(false);
  };

  return (
    <div 
      className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-xl flex flex-col items-center select-none"
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      {/* Legend Bar */}
      <div className="w-full flex flex-wrap items-center justify-between gap-2 pb-3 mb-3 border-b border-slate-800 text-xs text-slate-300">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-1.5">
            <span className="w-3.5 h-3.5 rounded bg-slate-950 border border-slate-800 inline-block"></span>
            <span>Empty</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3.5 h-3.5 rounded bg-slate-700 inline-block"></span>
            <span>Wall</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3.5 h-3.5 rounded bg-sky-500/20 border border-sky-400 text-sky-400 flex items-center justify-center">
              <User className="w-2.5 h-2.5" />
            </span>
            <span>Person</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3.5 h-3.5 rounded bg-emerald-500/20 border border-emerald-400 text-emerald-400 flex items-center justify-center">
              <DoorOpen className="w-2.5 h-2.5" />
            </span>
            <span>Exit</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3.5 h-3.5 rounded bg-rose-500/20 border border-rose-500 text-rose-500 flex items-center justify-center">
              <Flame className="w-2.5 h-2.5" />
            </span>
            <span>Fire</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3.5 h-3.5 rounded bg-indigo-500/30 border border-indigo-400/80 inline-block"></span>
            <span>A* Route</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3.5 h-3.5 rounded bg-amber-500/40 border border-amber-300 inline-block"></span>
            <span>Selected Route</span>
          </div>
        </div>

        {selectedPersonId && (
          <div className="flex items-center gap-2 px-2.5 py-1 rounded bg-amber-500/10 border border-amber-500/30 text-amber-300 font-mono text-[11px]">
            <span>Selected: <strong>{selectedPersonId}</strong></span>
            <button
              onClick={() => onSelectPerson(null)}
              className="text-slate-400 hover:text-white ml-1 cursor-pointer"
            >
              ×
            </button>
          </div>
        )}
      </div>

      {/* Grid Container */}
      <div 
        className="overflow-auto max-w-full max-h-[680px] p-2 bg-slate-950/80 rounded-lg border border-slate-800 shadow-inner"
        style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
          gap: cols > 20 ? '2px' : '3px',
        }}
      >
        {grid.map((rowArr, r) =>
          rowArr.map((cellType, c) => {
            const key = `${r},${c}`;
            const personHere = peopleMap.get(key);
            const exitHere = exitMap.get(key);
            const pathInfo = pathCells.get(key);

            const hasActiveRoute = pathInfo && pathInfo.length > 0;
            const hasSelectedRoute = pathInfo && pathInfo.some((p) => p.isSelected);
            const isTrappedPerson = personHere && personHere.status === 'TRAPPED';
            const isEvacuatingPerson = personHere && personHere.status === 'EVACUATING';
            const isEvacuatedPerson = personHere && personHere.status === 'EVACUATED';
            const isSelectedPerson = personHere && personHere.id === selectedPersonId;

            // Compute background and styling based on primary state and path overlay
            let cellBg = 'bg-slate-900/60 hover:bg-slate-800/80 border-slate-800/60';
            let cellContent = null;

            if (cellType === 'wall') {
              cellBg = 'bg-slate-700 border-slate-600 shadow-sm';
              cellContent = <Square className="w-3 h-3 text-slate-500 fill-slate-600 opacity-60" />;
            } else if (cellType === 'fire') {
              cellBg = 'bg-rose-950/90 border-rose-600 shadow-rose-900/40 shadow-inner animate-pulse-fire';
              cellContent = <Flame className="w-4 h-4 text-rose-500 fill-rose-600 drop-shadow-md" />;
            } else if (cellType === 'exit' || exitHere) {
              cellBg = 'bg-emerald-950/80 border-emerald-500 shadow-emerald-900/40';
              cellContent = (
                <div className="flex flex-col items-center justify-center">
                  <DoorOpen className="w-4 h-4 text-emerald-400" />
                  <span className="text-[9px] font-bold text-emerald-300 leading-none mt-0.5">
                    {exitHere ? exitHere.id : 'EXIT'}
                  </span>
                </div>
              );
            } else if (cellType === 'person' || personHere) {
              if (isTrappedPerson) {
                cellBg = 'bg-rose-950/80 border-rose-500 shadow-rose-900/50';
              } else if (isSelectedPerson) {
                cellBg = 'bg-amber-950/90 border-amber-400 ring-2 ring-amber-400 shadow-lg';
              } else if (isEvacuatingPerson) {
                cellBg = 'bg-sky-950/80 border-sky-400';
              } else if (isEvacuatedPerson) {
                cellBg = 'bg-slate-900/40 border-slate-700 opacity-40';
              } else {
                cellBg = 'bg-sky-950/80 border-sky-400';
              }

              cellContent = (
                <div className="flex flex-col items-center justify-center relative">
                  {isTrappedPerson ? (
                    <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
                  ) : (
                    <User className={`w-3.5 h-3.5 ${isSelectedPerson ? 'text-amber-300 font-bold' : 'text-sky-300'}`} />
                  )}
                  <span className={`text-[9px] font-bold leading-none mt-0.5 ${
                    isTrappedPerson ? 'text-rose-300' : isSelectedPerson ? 'text-amber-200' : 'text-sky-200'
                  }`}>
                    {personHere ? personHere.id : 'P'}
                  </span>
                </div>
              );
            } else if (hasSelectedRoute) {
              // Highlight route for selected person
              cellBg = 'bg-amber-500/25 border-amber-400/90 shadow-amber-500/20 shadow-sm';
              cellContent = <Footprints className="w-3 h-3 text-amber-300 opacity-90" />;
            } else if (hasActiveRoute) {
              // General route overlay
              cellBg = 'bg-indigo-500/20 border-indigo-400/70 shadow-indigo-500/20';
              cellContent = <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 shadow-indigo-400/80 shadow-sm inline-block"></span>;
            }

            return (
              <div
                key={key}
                onMouseDown={() => handleMouseDown(r, c)}
                onMouseEnter={() => handleMouseEnter(r, c)}
                className={`
                  relative flex items-center justify-center 
                  transition-all duration-100 cursor-pointer 
                  border rounded-[4px]
                  ${cols > 20 ? 'w-6 h-6' : cols > 15 ? 'w-8 h-8' : cols > 10 ? 'w-10 h-10' : 'w-12 h-12'}
                  ${cellBg}
                `}
                title={`[${r}, ${c}] ${cellType.toUpperCase()}${personHere ? ` - ${personHere.label || personHere.id} (${personHere.status})` : ''}${exitHere ? ` - ${exitHere.label || exitHere.id}` : ''}`}
              >
                {cellContent}
              </div>
            );
          })
        )}
      </div>

      <div className="w-full flex items-center justify-between text-[11px] text-slate-500 pt-2 px-1">
        <span>Click or drag cells to apply active tool</span>
        <span>Grid: {rows} × {cols}</span>
      </div>
    </div>
  );
};
