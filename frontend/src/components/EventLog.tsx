import React from 'react';
import { 
  History, 
  AlertTriangle, 
  Info, 
  Flame, 
  CheckCircle, 
  Trash2 
} from 'lucide-react';
import { EventLogItem } from '../types/evacuation';

interface EventLogProps {
  events: EventLogItem[];
  onClearEvents?: () => void;
  maxHeight?: string;
}

export const EventLog: React.FC<EventLogProps> = ({
  events,
  onClearEvents,
  maxHeight = 'h-72',
}) => {
  const getSeverityIcon = (severity: EventLogItem['severity']) => {
    switch (severity) {
      case 'danger':
        return <Flame className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />;
      case 'warning':
        return <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />;
      case 'success':
        return <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />;
      default:
        return <Info className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />;
    }
  };

  const getSeverityBadge = (severity: EventLogItem['severity']) => {
    switch (severity) {
      case 'danger':
        return 'border-rose-900/60 bg-rose-950/20 text-rose-200';
      case 'warning':
        return 'border-amber-900/60 bg-amber-950/20 text-amber-200';
      case 'success':
        return 'border-emerald-900/60 bg-emerald-950/20 text-emerald-200';
      default:
        return 'border-slate-800 bg-slate-900/40 text-slate-300';
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-xl flex flex-col">
      <div className="flex items-center justify-between pb-3 mb-2 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <History className="w-4 h-4 text-indigo-400" />
          <h3 className="text-sm font-semibold text-slate-100">Live Incident & Routing Log</h3>
          <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 font-mono">
            {events.length}
          </span>
        </div>
        {onClearEvents && (
          <button
            onClick={onClearEvents}
            className="flex items-center gap-1 text-xs text-slate-400 hover:text-rose-400 transition cursor-pointer"
            title="Clear Event Log"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear</span>
          </button>
        )}
      </div>

      <div className={`overflow-y-auto space-y-2 pr-1 ${maxHeight}`}>
        {events.length === 0 ? (
          <div className="text-center py-8 text-xs text-slate-500">
            No events logged yet. Actions and route adjustments will appear here.
          </div>
        ) : (
          events.map((evt) => (
            <div
              key={evt.id}
              className={`p-2.5 rounded-lg border text-xs flex items-start gap-2.5 transition-all ${getSeverityBadge(
                evt.severity
              )}`}
            >
              {getSeverityIcon(evt.severity)}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono text-[10px] text-slate-400">
                    {evt.timestamp}
                  </span>
                </div>
                <p className="mt-0.5 leading-relaxed break-words">
                  {evt.message}
                </p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
