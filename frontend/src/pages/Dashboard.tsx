import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Building2, 
  MapPin, 
  Compass, 
  Sparkles, 
  Flame, 
  ShieldCheck, 
  RefreshCw, 
  ArrowRight
} from 'lucide-react';
import { DashboardCards } from '../components/DashboardCards';
import { EventLog } from '../components/EventLog';
import { evacuationApi } from '../services/api';
import { Building, EventLogItem, SimulationStateResponse } from '../types/evacuation';

export const Dashboard: React.FC = () => {
  const [status, setStatus] = useState<SimulationStateResponse>({
    status: 'STOPPED',
    total_people: 4,
    evacuated: 0,
    evacuating: 4,
    trapped: 0,
    exits_count: 3,
    fire_zones_count: 2,
    recent_events: [],
  });
  const [events, setEvents] = useState<EventLogItem[]>([]);
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchDashboardData = async () => {
    try {
      setIsLoading(true);
      const [statusRes, eventsRes, buildingsRes] = await Promise.all([
        evacuationApi.getStatus(),
        evacuationApi.getEvents(),
        evacuationApi.getBuildings()
      ]);
      setStatus(statusRes);
      setEvents(eventsRes);
      setBuildings(buildingsRes);
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
    const interval = setInterval(fetchDashboardData, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 text-xs font-semibold mb-3">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Autonomous Facility Safety Engine</span>
            </div>
            <h1 className="text-2xl lg:text-3xl font-extrabold text-white tracking-tight">
              Emergency Evacuation Command Center
            </h1>
            <p className="text-sm text-slate-400 max-w-2xl mt-1.5 leading-relaxed">
              Real-time monitoring using A* pathfinding and lightweight safety constraint verification. Dynamically recalculates routes when fire barriers spread.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={fetchDashboardData}
              disabled={isLoading}
              className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition cursor-pointer border border-slate-700"
              title="Refresh Dashboard Stats"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-indigo-400' : ''}`} />
            </button>
            <Link
              to="/planner"
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm shadow-lg shadow-indigo-600/30 transition cursor-pointer"
            >
              <Compass className="w-4 h-4" />
              <span>Open Planner</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>

      {/* Primary KPI Metric Cards */}
      <DashboardCards
        totalPeople={status.total_people}
        evacuated={status.evacuated}
        evacuating={status.evacuating}
        trapped={status.trapped}
        exitsCount={status.exits_count}
        fireZonesCount={status.fire_zones_count}
        simulationStatus={status.status}
      />

      {/* Grid: Saved Buildings & Recent Events */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Buildings summary */}
        <div className="lg:col-span-1 bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Building2 className="w-4 h-4 text-indigo-400" />
                <h3 className="text-sm font-semibold text-slate-100">Configured Facilities</h3>
              </div>
              <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 font-mono">
                {buildings.length}
              </span>
            </div>

            <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
              {buildings.length === 0 ? (
                <div className="text-center py-6 text-xs text-slate-500">
                  No buildings saved yet. Jump to Planner or initialize the Demo Scenario.
                </div>
              ) : (
                buildings.map((b) => (
                  <div
                    key={b.id}
                    className="p-3 rounded-lg border border-slate-800/80 bg-slate-950/60 hover:bg-slate-800/40 transition flex items-center justify-between"
                  >
                    <div>
                      <div className="text-xs font-semibold text-slate-200">{b.name}</div>
                      <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                        {b.rows}×{b.columns} | {b.people.length} People | {b.exits.length} Exits
                      </div>
                    </div>
                    <Link
                      to="/planner"
                      className="text-xs text-indigo-400 hover:text-indigo-300 font-medium"
                    >
                      Load
                    </Link>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="pt-4 border-t border-slate-800/80 mt-4">
            <Link
              to="/planner"
              className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-lg bg-indigo-950/60 hover:bg-indigo-900/60 border border-indigo-800/50 text-indigo-300 text-xs font-medium transition cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Launch Evacuation Planner</span>
            </Link>
          </div>
        </div>

        {/* Live Incident & Event Log */}
        <div className="lg:col-span-2">
          <EventLog events={events} maxHeight="h-80" />
        </div>
      </div>
    </div>
  );
};
