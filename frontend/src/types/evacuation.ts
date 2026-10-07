export type CellType = 'empty' | 'wall' | 'person' | 'exit' | 'fire';

export type ToolType = 'select' | 'wall' | 'person' | 'exit' | 'fire' | 'erase';

export type PersonStatus = 'WAITING' | 'EVACUATING' | 'EVACUATED' | 'TRAPPED';

export type SimStatus = 'STOPPED' | 'ACTIVE' | 'PAUSED';

export interface Person {
  id: string;
  label?: string;
  row: number;
  col: number;
  status: PersonStatus;
  assigned_exit?: string | null;
  route?: number[][] | null;
  route_length?: number | null;
}

export interface Exit {
  id: string;
  label?: string;
  name?: string;
  row: number;
  col: number;
  capacity?: number;
}

export interface FireZone {
  id?: string;
  row: number;
  col: number;
  severity?: number;
  active: boolean;
}

export interface EvacuationRoute {
  person_id: string;
  exit_id: string | null;
  path: number[][];
  distance: number | null;
  status: PersonStatus;
  validation_passed: boolean;
  validation_errors: string[];
}

export interface EvacuationCalculateResponse {
  routes: EvacuationRoute[];
  trapped_count: number;
  evacuating_count: number;
  safe_exits: string[];
  timestamp: string;
}

export interface EventLogItem {
  id: string;
  timestamp: string;
  message: string;
  severity: 'info' | 'warning' | 'danger' | 'success';
  details?: Record<string, any>;
}

export interface SimulationStateResponse {
  status: SimStatus;
  total_people: number;
  evacuated: number;
  evacuating: number;
  trapped: number;
  exits_count: number;
  fire_zones_count: number;
  recent_events: EventLogItem[];
}

export interface Building {
  id: string;
  name: string;
  rows: number;
  columns: number;
  grid_json?: string;
  people: Person[];
  exits: Exit[];
  fires: FireZone[];
  created_at?: string;
}
