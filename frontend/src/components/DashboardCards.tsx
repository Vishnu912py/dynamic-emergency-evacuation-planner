import React from 'react';
import { 
  Users, 
  CheckCircle2, 
  Activity, 
  AlertOctagon, 
  DoorOpen, 
  Flame, 
  ShieldAlert,
  Radio
} from 'lucide-react';
import { SimStatus } from '../types/evacuation';

interface DashboardCardsProps {
  totalPeople: number;
  evacuated: number;
  evacuating: number;
  trapped: number;
  exitsCount: number;
  fireZonesCount: number;
  simulationStatus: SimStatus;
}

export const DashboardCards: React.FC<DashboardCardsProps> = ({
  totalPeople,
  evacuated,
  evacuating,
  trapped,
  exitsCount,
  fireZonesCount,
  simulationStatus,
}) => {
  const getSimStatusBadge = () => {
    switch (simulationStatus) {
      case 'ACTIVE':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-rose-500/20 text-rose-400 border border-rose-500/40 animate-pulse">
            <Radio className="w-3 h-3 animate-ping" />
            ACTIVE
          </span>
        );
      case 'PAUSED':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/20 text-amber-400 border border-amber-500/40">
            PAUSED
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-slate-800 text-slate-300 border border-slate-700">
            STANDBY
          </span>
        );
    }
  };

  const cards = [
    {
      title: 'Total People',
      value: totalPeople,
      icon: <Users className="w-5 h-5 text-sky-400" />,
      bg: 'bg-sky-950/30 border-sky-900/50',
      textColor: 'text-sky-300',
    },
    {
      title: 'Evacuated',
      value: evacuated,
      icon: <CheckCircle2 className="w-5 h-5 text-emerald-400" />,
      bg: 'bg-emerald-950/30 border-emerald-900/50',
      textColor: 'text-emerald-300',
    },
    {
      title: 'Evacuating',
      value: evacuating,
      icon: <Activity className="w-5 h-5 text-indigo-400" />,
      bg: 'bg-indigo-950/30 border-indigo-900/50',
      textColor: 'text-indigo-300',
    },
    {
      title: 'Trapped',
      value: trapped,
      icon: <AlertOctagon className="w-5 h-5 text-rose-400" />,
      bg: trapped > 0 ? 'bg-rose-950/50 border-rose-600/70' : 'bg-slate-900/50 border-slate-800',
      textColor: trapped > 0 ? 'text-rose-400 font-bold' : 'text-slate-400',
    },
    {
      title: 'Safe Exits',
      value: exitsCount,
      icon: <DoorOpen className="w-5 h-5 text-teal-400" />,
      bg: 'bg-teal-950/30 border-teal-900/50',
      textColor: 'text-teal-300',
    },
    {
      title: 'Fire Zones',
      value: fireZonesCount,
      icon: <Flame className="w-5 h-5 text-amber-400" />,
      bg: fireZonesCount > 0 ? 'bg-rose-950/40 border-rose-800/60' : 'bg-slate-900/50 border-slate-800',
      textColor: fireZonesCount > 0 ? 'text-amber-400' : 'text-slate-400',
    },
  ];

  return (
    <div className="space-y-4">
      {/* Simulation status banner */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 flex flex-wrap items-center justify-between shadow-lg">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-indigo-950 border border-indigo-800 text-indigo-400">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-100">Evacuation Monitoring Core</h3>
            <p className="text-xs text-slate-400">Real-time path traversal, safety constraint validation & dynamic rerouting</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs font-medium text-slate-400">Simulation Status:</span>
          {getSimStatusBadge()}
        </div>
      </div>

      {/* Grid of metrics */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {cards.map((card, i) => (
          <div
            key={i}
            className={`border rounded-xl p-3.5 flex flex-col justify-between transition-all duration-200 shadow-md ${card.bg}`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-slate-400">{card.title}</span>
              {card.icon}
            </div>
            <div className="flex items-baseline justify-between">
              <span className={`text-2xl font-bold tracking-tight ${card.textColor}`}>
                {card.value}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
