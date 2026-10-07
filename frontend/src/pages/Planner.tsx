import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Save, 
  FolderOpen, 
  Trash2, 
  Plus, 
  AlertCircle, 
  CheckCircle, 
  Sparkles,
  ShieldAlert,
  Loader2,
  HelpCircle
} from 'lucide-react';
import { Toolbar } from '../components/Toolbar';
import { BuildingGrid } from '../components/BuildingGrid';
import { PersonList } from '../components/PersonList';
import { EventLog } from '../components/EventLog';
import { SimulationControls } from '../components/SimulationControls';
import { evacuationApi } from '../services/api';
import { 
  CellType, 
  ToolType, 
  Person, 
  Exit, 
  FireZone, 
  EvacuationRoute, 
  EventLogItem, 
  SimStatus, 
  Building 
} from '../types/evacuation';

export const Planner: React.FC = () => {
  // Grid state
  const [gridSize, setGridSize] = useState<number>(20);
  const [grid, setGrid] = useState<CellType[][]>(() =>
    Array(20).fill(null).map(() => Array(20).fill('empty'))
  );
  const [people, setPeople] = useState<Person[]>([]);
  const [exits, setExits] = useState<Exit[]>([]);
  const [fires, setFires] = useState<FireZone[]>([]);
  const [routes, setRoutes] = useState<EvacuationRoute[]>([]);
  const [selectedPersonId, setSelectedPersonId] = useState<string | null>(null);
  const [selectedTool, setSelectedTool] = useState<ToolType>('wall');

  // Simulation & Animation states
  const [simulationStatus, setSimulationStatus] = useState<SimStatus>('STOPPED');
  const [isEvacuating, setIsEvacuating] = useState<boolean>(false);
  const [fireIntervalSeconds, setFireIntervalSeconds] = useState<number>(2);
  const [isCalculating, setIsCalculating] = useState<boolean>(false);
  const [events, setEvents] = useState<EventLogItem[]>([]);
  const [alertMessage, setAlertMessage] = useState<{ type: 'error' | 'success' | 'info'; text: string } | null>(null);

  // Buildings list & management
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [currentBuildingName, setCurrentBuildingName] = useState<string>('Office Complex 1');
  const [currentBuildingId, setCurrentBuildingId] = useState<string | null>(null);

  // Refs for animation intervals
  const fireTimerRef = useRef<any>(null);
  const evacuationTimerRef = useRef<any>(null);

  // Helper to show temporary alert banner
  const showAlert = (text: string, type: 'error' | 'success' | 'info' = 'info') => {
    setAlertMessage({ type, text });
    setTimeout(() => {
      setAlertMessage((prev) => (prev?.text === text ? null : prev));
    }, 4500);
  };

  // Add local and backend event
  const addEvent = async (message: string, severity: 'info' | 'warning' | 'danger' | 'success' = 'info') => {
    const newEvent: EventLogItem = {
      id: Math.random().toString(36).substring(2, 9),
      timestamp: new Date().toLocaleTimeString(),
      message,
      severity
    };
    setEvents((prev) => [newEvent, ...prev.slice(0, 99)]);
    try {
      await evacuationApi.logEvent(message, severity);
    } catch {
      // offline/local fallback
    }
  };

  // Load buildings from backend on mount
  useEffect(() => {
    loadBuildingsList();
    // Default load demo scenario on fresh start
    loadDemoScenario();
  }, []);

  const loadBuildingsList = async () => {
    try {
      const data = await evacuationApi.getBuildings();
      setBuildings(data);
    } catch (err) {
      console.error('Error fetching buildings list:', err);
    }
  };

  // Clear or resize grid
  const initGrid = (size: number) => {
    setGridSize(size);
    const newGrid: CellType[][] = Array(size).fill(null).map(() => Array(size).fill('empty'));
    setGrid(newGrid);
    setPeople([]);
    setExits([]);
    setFires([]);
    setRoutes([]);
    setSelectedPersonId(null);
  };

  const handleGridSizeChange = (newSize: number) => {
    if (people.length > 0 || exits.length > 0) {
      if (!window.confirm(`Changing grid to ${newSize}x${newSize} will reset current items. Continue?`)) {
        return;
      }
    }
    initGrid(newSize);
    showAlert(`Grid resized to ${newSize}x${newSize}`, 'info');
  };

  // Load Demo Scenario (Section 28)
  const loadDemoScenario = async () => {
    try {
      setIsCalculating(true);
      const demo = await evacuationApi.loadDemoBuilding();
      setCurrentBuildingId(demo.id);
      setCurrentBuildingName(demo.name);
      setGridSize(demo.rows);

      let parsedGrid: CellType[][] = [];
      if (demo.grid_json) {
        parsedGrid = JSON.parse(demo.grid_json);
      } else {
        parsedGrid = Array(demo.rows).fill(null).map(() => Array(demo.columns).fill('empty'));
      }

      setGrid(parsedGrid);
      setPeople(demo.people || []);
      setExits(demo.exits || []);
      setFires(demo.fires || []);
      setSelectedPersonId(null);

      showAlert('Demo Scenario loaded successfully! Calculating evacuation routes...', 'success');
      await addEvent('Demo scenario loaded with corridors, exits, and fire hazards.', 'info');

      // Immediate route calculation for demo
      setTimeout(() => {
        calculateRoutesDirect(parsedGrid, demo.people, demo.exits, demo.fires);
      }, 200);

      loadBuildingsList();
    } catch (err: any) {
      showAlert(`Failed to load demo scenario: ${err?.response?.data?.detail || err.message}`, 'error');
    } finally {
      setIsCalculating(false);
    }
  };

  // Cell modification handler (Click or Drag)
  const applyToolToCell = (r: number, c: number, tool: ToolType) => {
    if (r < 0 || r >= gridSize || c < 0 || c >= gridSize) return;

    setGrid((prevGrid) => {
      const nextGrid = prevGrid.map((row) => [...row]);
      const currentCell = nextGrid[r][c];

      if (tool === 'erase') {
        // Remove whatever is at cell
        nextGrid[r][c] = 'empty';
        setPeople((prev) => prev.filter((p) => p.row !== r || p.col !== c));
        setExits((prev) => prev.filter((e) => e.row !== r || e.col !== c));
        setFires((prev) => prev.filter((f) => f.row !== r || f.col !== c));
        return nextGrid;
      }

      if (tool === 'wall') {
        if (currentCell === 'wall') {
          nextGrid[r][c] = 'empty';
        } else {
          nextGrid[r][c] = 'wall';
          setPeople((prev) => prev.filter((p) => p.row !== r || p.col !== c));
          setExits((prev) => prev.filter((e) => e.row !== r || e.col !== c));
          setFires((prev) => prev.filter((f) => f.row !== r || f.col !== c));
        }
        return nextGrid;
      }

      if (tool === 'person') {
        if (currentCell === 'person') {
          nextGrid[r][c] = 'empty';
          setPeople((prev) => prev.filter((p) => p.row !== r || p.col !== c));
        } else {
          nextGrid[r][c] = 'person';
          setExits((prev) => prev.filter((e) => e.row !== r || e.col !== c));
          setFires((prev) => prev.filter((f) => f.row !== r || f.col !== c));
          const newId = `P${people.length + 1}`;
          setPeople((prev) => [
            ...prev,
            { id: newId, label: `Person ${people.length + 1}`, row: r, col: c, status: 'WAITING' },
          ]);
        }
        return nextGrid;
      }

      if (tool === 'exit') {
        if (currentCell === 'exit') {
          nextGrid[r][c] = 'empty';
          setExits((prev) => prev.filter((e) => e.row !== r || e.col !== c));
        } else {
          nextGrid[r][c] = 'exit';
          setPeople((prev) => prev.filter((p) => p.row !== r || p.col !== c));
          setFires((prev) => prev.filter((f) => f.row !== r || f.col !== c));
          const exitLetters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
          const newId = `E${exits.length + 1}`;
          const exitLabel = `Exit ${exitLetters[exits.length % 26] || newId}`;
          setExits((prev) => [
            ...prev,
            { id: newId, label: exitLabel, name: exitLabel, row: r, col: c, capacity: 50 },
          ]);
        }
        return nextGrid;
      }

      if (tool === 'fire') {
        if (currentCell === 'fire') {
          nextGrid[r][c] = 'empty';
          setFires((prev) => prev.filter((f) => f.row !== r || f.col !== c));
        } else {
          nextGrid[r][c] = 'fire';
          setPeople((prev) => prev.filter((p) => p.row !== r || p.col !== c));
          setExits((prev) => prev.filter((e) => e.row !== r || e.col !== c));
          setFires((prev) => [...prev, { row: r, col: c, severity: 1, active: true }]);
          addEvent(`Fire ignited at position (${r}, ${c})`, 'danger');
        }
        return nextGrid;
      }

      return nextGrid;
    });
  };

  const handleCellClick = (r: number, c: number) => {
    if (selectedTool === 'select') return;
    applyToolToCell(r, c, selectedTool);
  };

  const handleCellDrag = (r: number, c: number) => {
    if (selectedTool === 'wall' || selectedTool === 'erase' || selectedTool === 'fire') {
      applyToolToCell(r, c, selectedTool);
    }
  };

  // Direct calculation helper
  const calculateRoutesDirect = async (
    currentGrid: CellType[][],
    currentPeople: Person[],
    currentExits: Exit[],
    currentFires: FireZone[],
    triggerReason?: string
  ) => {
    if (currentExits.length === 0) {
      showAlert('No exits configured. At least one exit is required for evacuation.', 'error');
      return;
    }
    if (currentPeople.length === 0) {
      showAlert('No occupants on grid to evacuate.', 'info');
      setRoutes([]);
      return;
    }

    try {
      setIsCalculating(true);
      const res = await evacuationApi.calculateEvacuation({
        grid: currentGrid,
        people: currentPeople,
        exits: currentExits,
        fires: currentFires,
      });

      // Check for route changes to log dynamic rerouting events (Section 18)
      if (routes.length > 0) {
        res.routes.forEach((newRoute) => {
          const oldRoute = routes.find((r) => r.person_id === newRoute.person_id);
          if (oldRoute) {
            if (oldRoute.exit_id !== newRoute.exit_id) {
              if (newRoute.status === 'TRAPPED') {
                addEvent(
                  `Person ${newRoute.person_id} is now TRAPPED! Route to ${oldRoute.exit_id || 'Exit'} blocked.`,
                  'danger'
                );
              } else {
                addEvent(
                  `Route for Person ${newRoute.person_id} changed. Reason: ${triggerReason || 'Obstacle detected'}. Switched: ${oldRoute.exit_id || 'None'} -> ${newRoute.exit_id}.`,
                  'warning'
                );
              }
            }
          }
        });
      }

      setRoutes(res.routes);

      // Update person statuses and assigned exits
      setPeople((prev) =>
        prev.map((p) => {
          const matchingRoute = res.routes.find((r) => r.person_id === p.id);
          if (matchingRoute) {
            return {
              ...p,
              status: matchingRoute.status,
              assigned_exit: matchingRoute.exit_id,
              route: matchingRoute.path,
              route_length: matchingRoute.distance,
            };
          }
          return p;
        })
      );

      // Sync metrics with backend status
      await evacuationApi.updateStatus({
        total_people: currentPeople.length,
        evacuating: res.evacuating_count,
        trapped: res.trapped_count,
        exits_count: currentExits.length,
        fire_zones_count: currentFires.length,
      });

      if (res.trapped_count > 0) {
        showAlert(
          `Routes calculated. Alert: ${res.trapped_count} occupant(s) are TRAPPED with no safe exit reachable!`,
          'error'
        );
      } else {
        showAlert(`A* evacuation routes calculated successfully for ${res.routes.length} people.`, 'success');
      }
    } catch (err: any) {
      showAlert(`Calculation Error: ${err?.response?.data?.detail || err.message}`, 'error');
    } finally {
      setIsCalculating(false);
    }
  };

  const handleCalculateRoutes = () => {
    calculateRoutesDirect(grid, people, exits, fires, 'Manual recalculation requested');
  };

  // Step fire spread (Section 19)
  const handleStepFire = async () => {
    try {
      const res = await evacuationApi.spreadFire({
        grid,
        fires,
      });

      setGrid(res.grid as CellType[][]);
      setFires(res.fires);

      if (res.newly_ignited.length > 0) {
        // Automatically recalculate affected routes! (Section 18 & 19)
        calculateRoutesDirect(res.grid as CellType[][], people, exits, res.fires, 'Fire spread into path');
      }
    } catch (err: any) {
      showAlert(`Fire Spread Error: ${err?.response?.data?.detail || err.message}`, 'error');
    }
  };

  // Simulation controls
  const handleStartSimulation = async () => {
    setSimulationStatus('ACTIVE');
    await evacuationApi.startSimulation();
    addEvent('Fire spread simulation active. Recalculating routes on environmental changes.', 'warning');
  };

  const handlePauseSimulation = async () => {
    setSimulationStatus('PAUSED');
    await evacuationApi.pauseSimulation();
  };

  const handleResetSimulation = async () => {
    setSimulationStatus('STOPPED');
    setIsEvacuating(false);
    if (fireTimerRef.current) clearInterval(fireTimerRef.current);
    if (evacuationTimerRef.current) clearInterval(evacuationTimerRef.current);
    await evacuationApi.resetSimulation();
    loadDemoScenario();
  };

  // Fire spread periodic interval effect
  useEffect(() => {
    if (simulationStatus === 'ACTIVE') {
      fireTimerRef.current = setInterval(() => {
        handleStepFire();
      }, fireIntervalSeconds * 1000);
    } else {
      if (fireTimerRef.current) clearInterval(fireTimerRef.current);
    }
    return () => {
      if (fireTimerRef.current) clearInterval(fireTimerRef.current);
    };
  }, [simulationStatus, fireIntervalSeconds, grid, fires, people, exits, routes]);

  // Step Evacuation Animation (Section 20: 300-500ms per cell)
  const handleStepEvacuation = useCallback(() => {
    setPeople((prevPeople) => {
      let anyMoved = false;
      const nextGrid = grid.map((r) => [...r]);
      const nextRoutes = routes.map((route) => ({ ...route, path: [...route.path] }));

      const updatedPeople = prevPeople.map((person) => {
        if (person.status === 'EVACUATED' || person.status === 'TRAPPED') {
          return person;
        }

        const personRoute = nextRoutes.find((r) => r.person_id === person.id);
        if (!personRoute || !personRoute.path || personRoute.path.length <= 1) {
          return person;
        }

        // Person steps to the next cell along route
        const nextCoord = personRoute.path[1];
        const nextR = nextCoord[0];
        const nextC = nextCoord[1];

        // Check if next cell is blocked by fire
        if (nextGrid[nextR][nextC] === 'fire') {
          addEvent(`Fire blocked Person ${person.id}'s path! Pausing step for rerouting.`, 'danger');
          return person;
        }

        // Check if reached exit
        const reachedExit = exits.find((e) => e.row === nextR && e.col === nextC);
        anyMoved = true;

        if (reachedExit) {
          // Vacate old cell
          nextGrid[person.row][person.col] = 'empty';
          personRoute.path = [];
          personRoute.distance = 0;
          personRoute.status = 'EVACUATED';
          addEvent(`Person ${person.id} successfully reached ${reachedExit.label || reachedExit.id}!`, 'success');
          return {
            ...person,
            row: nextR,
            col: nextC,
            status: 'EVACUATED' as const,
            route: [],
            route_length: 0,
          };
        }

        // Move to next cell
        nextGrid[person.row][person.col] = 'empty';
        nextGrid[nextR][nextC] = 'person';

        // Shorten route
        const updatedPath = personRoute.path.slice(1);
        personRoute.path = updatedPath;
        personRoute.distance = updatedPath.length - 1;

        return {
          ...person,
          row: nextR,
          col: nextC,
          route: updatedPath,
          route_length: updatedPath.length - 1,
        };
      });

      if (anyMoved) {
        setGrid(nextGrid);
        setRoutes(nextRoutes);
      }

      // Check if all evacuated
      const allEvacuated = updatedPeople.every(
        (p) => p.status === 'EVACUATED' || p.status === 'TRAPPED'
      );
      if (allEvacuated && updatedPeople.length > 0) {
        setIsEvacuating(false);
        const trappedCount = updatedPeople.filter((p) => p.status === 'TRAPPED').length;
        const evacuatedCount = updatedPeople.filter((p) => p.status === 'EVACUATED').length;
        addEvent(
          `Evacuation completed! ${evacuatedCount} evacuated, ${trappedCount} trapped.`,
          trappedCount > 0 ? 'warning' : 'success'
        );
      }

      return updatedPeople;
    });
  }, [grid, routes, exits]);

  // Evacuation Animation Loop (400ms per step)
  useEffect(() => {
    if (isEvacuating) {
      evacuationTimerRef.current = setInterval(() => {
        handleStepEvacuation();
      }, 400);
    } else {
      if (evacuationTimerRef.current) clearInterval(evacuationTimerRef.current);
    }
    return () => {
      if (evacuationTimerRef.current) clearInterval(evacuationTimerRef.current);
    };
  }, [isEvacuating, handleStepEvacuation]);

  const handleToggleAutoEvacuation = () => {
    if (!isEvacuating && routes.length === 0) {
      showAlert('Please calculate routes first before starting evacuation movement.', 'error');
      return;
    }
    setIsEvacuating(!isEvacuating);
  };

  // Building Save & Load
  const handleSaveBuilding = async () => {
    try {
      const payload: Partial<Building> = {
        name: currentBuildingName,
        rows: gridSize,
        columns: gridSize,
        grid_json: JSON.stringify(grid),
        people,
        exits,
        fires,
      };

      if (currentBuildingId && currentBuildingId !== 'demo-office-01') {
        await evacuationApi.updateBuilding(currentBuildingId, payload);
        showAlert(`Building "${currentBuildingName}" updated successfully.`, 'success');
      } else {
        const created = await evacuationApi.createBuilding(payload);
        setCurrentBuildingId(created.id);
        showAlert(`Building "${currentBuildingName}" created and saved.`, 'success');
      }
      loadBuildingsList();
    } catch (err: any) {
      showAlert(`Save Error: ${err?.response?.data?.detail || err.message}`, 'error');
    }
  };

  const handleLoadBuilding = async (bId: string) => {
    try {
      const b = await evacuationApi.getBuilding(bId);
      setCurrentBuildingId(b.id);
      setCurrentBuildingName(b.name);
      setGridSize(b.rows);
      if (b.grid_json) {
        setGrid(JSON.parse(b.grid_json));
      }
      setPeople(b.people || []);
      setExits(b.exits || []);
      setFires(b.fires || []);
      setRoutes([]);
      setSelectedPersonId(null);
      showAlert(`Loaded "${b.name}"`, 'success');
    } catch (err: any) {
      showAlert(`Load Error: ${err?.response?.data?.detail || err.message}`, 'error');
    }
  };

  const handleDeleteBuilding = async (bId: string) => {
    if (!window.confirm('Are you sure you want to delete this building layout?')) return;
    try {
      await evacuationApi.deleteBuilding(bId);
      showAlert('Building deleted.', 'info');
      loadBuildingsList();
      if (currentBuildingId === bId) {
        loadDemoScenario();
      }
    } catch (err: any) {
      showAlert(`Delete Error: ${err?.response?.data?.detail || err.message}`, 'error');
    }
  };

  const handleRemovePerson = (id: string) => {
    const person = people.find((p) => p.id === id);
    if (person) {
      setGrid((prev) => {
        const next = prev.map((r) => [...r]);
        if (next[person.row][person.col] === 'person') {
          next[person.row][person.col] = 'empty';
        }
        return next;
      });
      setPeople((prev) => prev.filter((p) => p.id !== id));
      setRoutes((prev) => prev.filter((r) => r.person_id !== id));
      if (selectedPersonId === id) setSelectedPersonId(null);
      showAlert(`Removed Person ${id}`, 'info');
    }
  };

  return (
    <div className="space-y-4">
      {/* Alert Banner */}
      {alertMessage && (
        <div
          className={`p-3.5 rounded-xl border flex items-center justify-between text-xs shadow-lg transition-all ${
            alertMessage.type === 'error'
              ? 'bg-rose-950/80 border-rose-600/80 text-rose-200'
              : alertMessage.type === 'success'
              ? 'bg-emerald-950/80 border-emerald-600/80 text-emerald-200'
              : 'bg-indigo-950/80 border-indigo-600/80 text-indigo-200'
          }`}
        >
          <div className="flex items-center gap-2.5">
            {alertMessage.type === 'error' ? (
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            ) : alertMessage.type === 'success' ? (
              <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
            ) : (
              <Sparkles className="w-4 h-4 text-indigo-400 shrink-0" />
            )}
            <span className="font-medium">{alertMessage.text}</span>
          </div>
          <button
            onClick={() => setAlertMessage(null)}
            className="text-slate-400 hover:text-white text-xs px-2 cursor-pointer"
          >
            ×
          </button>
        </div>
      )}

      {/* Building Header & Persistence Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-xl flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-indigo-950/80 border border-indigo-800 text-indigo-400">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={currentBuildingName}
                onChange={(e) => setCurrentBuildingName(e.target.value)}
                className="bg-slate-950 border border-slate-800 text-slate-100 font-bold text-sm px-2.5 py-1 rounded-lg focus:outline-none focus:border-indigo-500"
                placeholder="Building Name"
              />
              <span className="text-[11px] text-slate-500 font-mono">
                ({gridSize}×{gridSize})
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Draw walls, place people & exits, calculate A* safe paths, and simulate dynamic fire propagation.
            </p>
          </div>
        </div>

        {/* Building Management Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleSaveBuilding}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition cursor-pointer"
            title="Save Building Layout to SQLite"
          >
            <Save className="w-3.5 h-3.5 text-indigo-400" />
            <span>Save</span>
          </button>

          {buildings.length > 0 && (
            <div className="relative inline-block">
              <select
                onChange={(e) => e.target.value && handleLoadBuilding(e.target.value)}
                value={currentBuildingId || ''}
                className="bg-slate-950 border border-slate-800 text-slate-300 text-xs rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-indigo-500 cursor-pointer"
              >
                <option value="">Load Facility...</option>
                {buildings.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name} ({b.rows}×{b.columns})
                  </option>
                ))}
              </select>
            </div>
          )}

          <button
            onClick={() => {
              setCurrentBuildingId(null);
              setCurrentBuildingName('New Facility');
              initGrid(gridSize);
              showAlert('Started new building layout.', 'info');
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition cursor-pointer"
            title="Create New Blank Building"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New</span>
          </button>
        </div>
      </div>

      {/* Toolbar */}
      <Toolbar
        selectedTool={selectedTool}
        onSelectTool={setSelectedTool}
        gridSize={gridSize}
        onGridSizeChange={handleGridSizeChange}
        onCalculateRoutes={handleCalculateRoutes}
        onLoadDemo={loadDemoScenario}
        onClearGrid={() => initGrid(gridSize)}
        isCalculating={isCalculating}
        disabled={simulationStatus === 'ACTIVE' || isEvacuating}
      />

      {/* Simulation Controls Bar */}
      <SimulationControls
        simulationStatus={simulationStatus}
        onStartSimulation={handleStartSimulation}
        onPauseSimulation={handlePauseSimulation}
        onResetSimulation={handleResetSimulation}
        onStepFire={handleStepFire}
        onStepEvacuation={handleStepEvacuation}
        isEvacuating={isEvacuating}
        onToggleAutoEvacuation={handleToggleAutoEvacuation}
        fireSpreadIntervalSeconds={fireIntervalSeconds}
        onIntervalChange={setFireIntervalSeconds}
        disabled={isCalculating}
      />

      {/* Main Layout: Building Grid in Center, Occupants & Events on Sides */}
      <div className="grid grid-cols-1 xl:grid-cols-4 gap-4">
        {/* Left Column: Occupants & Route Status */}
        <div className="xl:col-span-1 space-y-4">
          <PersonList
            people={people}
            routes={routes}
            selectedPersonId={selectedPersonId}
            onSelectPerson={setSelectedPersonId}
            onRemovePerson={handleRemovePerson}
          />

          {/* Quick Guidance Card */}
          <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-3.5 text-xs text-slate-400 space-y-2">
            <div className="flex items-center gap-1.5 font-semibold text-slate-300">
              <HelpCircle className="w-3.5 h-3.5 text-indigo-400" />
              <span>A* Pathfinding & Constraints</span>
            </div>
            <p className="text-[11px] leading-relaxed">
              Calculates shortest path using Manhattan distance heuristic:
              <br />
              <code className="text-indigo-300 bg-slate-950 px-1 py-0.5 rounded font-mono text-[10px]">
                f(n) = g(n) + |Δr| + |Δc|
              </code>
            </p>
            <p className="text-[11px] leading-relaxed">
              When fire spreads into an active corridor, routes automatically recalculate and redirect occupants to safe alternative exits.
            </p>
          </div>
        </div>

        {/* Center: Building Grid */}
        <div className="xl:col-span-2">
          <BuildingGrid
            grid={grid}
            people={people}
            exits={exits}
            fires={fires}
            routes={routes}
            selectedPersonId={selectedPersonId}
            onSelectPerson={setSelectedPersonId}
            selectedTool={selectedTool}
            onCellClick={handleCellClick}
            onCellDrag={handleCellDrag}
            simulationActive={simulationStatus === 'ACTIVE'}
          />
        </div>

        {/* Right Column: Event Log */}
        <div className="xl:col-span-1">
          <EventLog
            events={events}
            onClearEvents={() => setEvents([])}
            maxHeight="h-[560px]"
          />
        </div>
      </div>
    </div>
  );
};
