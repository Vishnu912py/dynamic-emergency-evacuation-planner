import React from 'react';
import { 
  Users, 
  User, 
  AlertTriangle, 
  CheckCircle2, 
  ArrowRight, 
  Navigation,
  Trash2
} from 'lucide-react';
import { Person, EvacuationRoute } from '../types/evacuation';

interface PersonListProps {
  people: Person[];
  routes: EvacuationRoute[];
  selectedPersonId: string | null;
  onSelectPerson: (id: string | null) => void;
  onRemovePerson: (id: string) => void;
}

export const PersonList: React.FC<PersonListProps> = ({
  people,
  routes,
  selectedPersonId,
  onSelectPerson,
  onRemovePerson,
}) => {
  const routeMap = new Map<string, EvacuationRoute>();
  routes.forEach((r) => {
    routeMap.set(r.person_id, r);
  });

  const getStatusBadge = (status: Person['status']) => {
    switch (status) {
      case 'EVACUATED':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-950/80 text-emerald-400 border border-emerald-800">
            <CheckCircle2 className="w-3 h-3" /> EVACUATED
          </span>
        );
      case 'EVACUATING':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-indigo-950/80 text-indigo-400 border border-indigo-800">
            <Navigation className="w-3 h-3" /> EVACUATING
          </span>
        );
      case 'TRAPPED':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-rose-950/80 text-rose-400 border border-rose-800 animate-pulse">
            <AlertTriangle className="w-3 h-3" /> TRAPPED
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium bg-slate-800 text-slate-400 border border-slate-700">
            WAITING
          </span>
        );
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-xl flex flex-col">
      <div className="flex items-center justify-between pb-3 mb-2 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4 text-sky-400" />
          <h3 className="text-sm font-semibold text-slate-100">Occupants & Route Status</h3>
          <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 font-mono">
            {people.length}
          </span>
        </div>
      </div>

      <div className="overflow-y-auto space-y-2 pr-1 max-h-[380px]">
        {people.length === 0 ? (
          <div className="text-center py-6 text-xs text-slate-500">
            No occupants on grid. Place people using the Person tool or load the Demo Scenario.
          </div>
        ) : (
          people.map((person) => {
            const route = routeMap.get(person.id);
            const isSelected = selectedPersonId === person.id;
            const isTrapped = person.status === 'TRAPPED' || (route && route.status === 'TRAPPED');
            const exitId = route?.exit_id || person.assigned_exit;
            const distance = route?.distance ?? person.route_length;

            return (
              <div
                key={person.id}
                onClick={() => onSelectPerson(isSelected ? null : person.id)}
                className={`p-3 rounded-xl border text-xs cursor-pointer transition-all duration-150 ${
                  isSelected
                    ? 'border-amber-400/80 bg-amber-950/30 ring-1 ring-amber-400/50 shadow-md'
                    : isTrapped
                    ? 'border-rose-900/60 bg-rose-950/20 hover:bg-rose-950/30'
                    : 'border-slate-800 bg-slate-950/60 hover:bg-slate-800/60'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`p-1.5 rounded-md ${isTrapped ? 'bg-rose-950 text-rose-400' : 'bg-slate-800 text-sky-400'}`}>
                      <User className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <div className="font-semibold text-slate-200">
                        {person.label || person.id}
                      </div>
                      <div className="text-[10px] text-slate-500 font-mono">
                        Pos: [{person.row}, {person.col}]
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {getStatusBadge(route ? route.status : person.status)}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onRemovePerson(person.id);
                      }}
                      className="p-1 text-slate-500 hover:text-rose-400 transition cursor-pointer"
                      title="Remove person"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Route Information */}
                <div className="mt-2.5 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px]">
                  {isTrapped ? (
                    <div className="text-rose-400 flex items-center gap-1.5">
                      <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                      <span>No safe exit is currently reachable!</span>
                    </div>
                  ) : route && route.path.length > 0 ? (
                    <div className="flex items-center justify-between w-full text-slate-300">
                      <div className="flex items-center gap-1.5 text-emerald-400">
                        <span>Assigned Exit:</span>
                        <span className="font-semibold px-1.5 py-0.5 rounded bg-emerald-950/80 border border-emerald-800/80 text-emerald-300">
                          {exitId || 'Exit'}
                        </span>
                      </div>
                      <div className="text-slate-400 flex items-center gap-1 font-mono">
                        <ArrowRight className="w-3 h-3 text-slate-500" />
                        <span>{distance} steps</span>
                      </div>
                    </div>
                  ) : (
                    <span className="text-slate-500">Route not yet calculated</span>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
