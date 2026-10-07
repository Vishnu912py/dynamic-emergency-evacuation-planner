import axios from 'axios';
import {
  Building,
  EvacuationCalculateResponse,
  Person,
  Exit,
  FireZone,
  EventLogItem,
  SimulationStateResponse
} from '../types/evacuation';

const API_BASE = '/api';

const api = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

export const evacuationApi = {
  // Buildings
  getBuildings: async (): Promise<Building[]> => {
    const res = await api.get<Building[]>('/buildings');
    return res.data;
  },

  getBuilding: async (id: string): Promise<Building> => {
    const res = await api.get<Building>(`/buildings/${id}`);
    return res.data;
  },

  createBuilding: async (building: Partial<Building>): Promise<Building> => {
    const res = await api.post<Building>('/buildings', building);
    return res.data;
  },

  updateBuilding: async (id: string, building: Partial<Building>): Promise<Building> => {
    const res = await api.put<Building>(`/buildings/${id}`, building);
    return res.data;
  },

  deleteBuilding: async (id: string): Promise<void> => {
    await api.delete(`/buildings/${id}`);
  },

  loadDemoBuilding: async (): Promise<Building> => {
    const res = await api.post<Building>('/buildings/demo');
    return res.data;
  },

  // Evacuation calculation
  calculateEvacuation: async (payload: {
    grid: string[][];
    people: Person[];
    exits: Exit[];
    fires: FireZone[];
  }): Promise<EvacuationCalculateResponse> => {
    const res = await api.post<EvacuationCalculateResponse>('/evacuation/calculate', payload);
    return res.data;
  },

  // Fire simulation
  spreadFire: async (payload: {
    grid: string[][];
    fires: FireZone[];
    spread_rate?: number;
  }): Promise<{ grid: string[][]; fires: FireZone[]; newly_ignited: number[][] }> => {
    const res = await api.post('/fire/spread', payload);
    return res.data;
  },

  // Simulation controls
  startSimulation: async (): Promise<{ status: string; message: string }> => {
    const res = await api.post('/simulation/start');
    return res.data;
  },

  pauseSimulation: async (): Promise<{ status: string; message: string }> => {
    const res = await api.post('/simulation/pause');
    return res.data;
  },

  resetSimulation: async (): Promise<{ status: string; message: string }> => {
    const res = await api.post('/simulation/reset');
    return res.data;
  },

  // Events & Status
  getEvents: async (): Promise<EventLogItem[]> => {
    const res = await api.get<EventLogItem[]>('/events');
    return res.data;
  },

  logEvent: async (message: string, severity: 'info' | 'warning' | 'danger' | 'success', details?: any): Promise<EventLogItem> => {
    const res = await api.post<EventLogItem>('/events', { message, severity, details });
    return res.data;
  },

  getStatus: async (): Promise<SimulationStateResponse> => {
    const res = await api.get<SimulationStateResponse>('/status');
    return res.data;
  },

  updateStatus: async (statusData: Partial<SimulationStateResponse>): Promise<SimulationStateResponse> => {
    const res = await api.post<SimulationStateResponse>('/status', statusData);
    return res.data;
  },
};

export default evacuationApi;
