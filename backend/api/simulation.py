import uuid
import datetime
from typing import List, Dict, Any, Optional
from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel
from backend.models.schemas import (
    EventLogItem,
    SimulationStateResponse,
    FireSpreadRequest,
    FireSpreadResponse
)
from backend.algorithms.fire_spread import simulate_fire_step

router = APIRouter(prefix="/api", tags=["simulation"])

class SimulationManager:
    def __init__(self):
        self.status: str = "STOPPED"  # STOPPED, ACTIVE, PAUSED
        self.events: List[EventLogItem] = []
        self.total_people: int = 0
        self.evacuated: int = 0
        self.evacuating: int = 0
        self.trapped: int = 0
        self.exits_count: int = 0
        self.fire_zones_count: int = 0
        # Initialize default greeting event
        self.add_event("Evacuation system initialized and ready.", severity="info")

    def add_event(self, message: str, severity: str = "info", details: Optional[dict] = None) -> EventLogItem:
        event = EventLogItem(
            id=str(uuid.uuid4())[:8],
            timestamp=datetime.datetime.now().strftime("%H:%M:%S"),
            message=message,
            severity=severity,
            details=details
        )
        self.events.insert(0, event)
        # Keep maximum 100 recent events
        if len(self.events) > 100:
            self.events = self.events[:100]
        return event

    def reset(self):
        self.status = "STOPPED"
        self.evacuated = 0
        self.evacuating = 0
        self.trapped = 0
        self.add_event("Simulation reset to initial state.", severity="info")

sim_manager = SimulationManager()

class StatusUpdateRequest(BaseModel):
    total_people: Optional[int] = None
    evacuated: Optional[int] = None
    evacuating: Optional[int] = None
    trapped: Optional[int] = None
    exits_count: Optional[int] = None
    fire_zones_count: Optional[int] = None

class AddEventRequest(BaseModel):
    message: str
    severity: Optional[str] = "info"
    details: Optional[dict] = None

@router.post("/simulation/start")
def start_simulation():
    sim_manager.status = "ACTIVE"
    sim_manager.add_event("Emergency evacuation simulation started.", severity="warning")
    return {"status": sim_manager.status, "message": "Simulation started"}

@router.post("/simulation/pause")
def pause_simulation():
    sim_manager.status = "PAUSED"
    sim_manager.add_event("Simulation paused.", severity="info")
    return {"status": sim_manager.status, "message": "Simulation paused"}

@router.post("/simulation/reset")
def reset_simulation():
    sim_manager.reset()
    return {"status": sim_manager.status, "message": "Simulation reset"}

@router.post("/fire/spread", response_model=FireSpreadResponse)
def spread_fire(payload: FireSpreadRequest):
    result = simulate_fire_step(grid=payload.grid, fires=payload.fires)
    
    if result.newly_ignited:
        ignited_coords_str = ", ".join([f"({r},{c})" for r, c in result.newly_ignited[:5]])
        if len(result.newly_ignited) > 5:
            ignited_coords_str += f" (+{len(result.newly_ignited) - 5} more)"
        sim_manager.add_event(
            f"Fire spread to {len(result.newly_ignited)} cell(s): {ignited_coords_str}",
            severity="danger",
            details={"ignited_cells": result.newly_ignited}
        )
        sim_manager.fire_zones_count = len(result.fires)
    else:
        sim_manager.add_event("Fire spread attempted: No accessible adjacent unburnt cells.", severity="info")

    return result

@router.get("/events", response_model=List[EventLogItem])
def get_events():
    return sim_manager.events

@router.post("/events", response_model=EventLogItem)
def log_event(payload: AddEventRequest):
    return sim_manager.add_event(
        message=payload.message,
        severity=payload.severity or "info",
        details=payload.details
    )

@router.get("/status", response_model=SimulationStateResponse)
def get_status():
    return SimulationStateResponse(
        status=sim_manager.status,
        total_people=sim_manager.total_people,
        evacuated=sim_manager.evacuated,
        evacuating=sim_manager.evacuating,
        trapped=sim_manager.trapped,
        exits_count=sim_manager.exits_count,
        fire_zones_count=sim_manager.fire_zones_count,
        recent_events=sim_manager.events[:15]
    )

@router.post("/status", response_model=SimulationStateResponse)
def update_status(payload: StatusUpdateRequest):
    if payload.total_people is not None:
        sim_manager.total_people = payload.total_people
    if payload.evacuated is not None:
        sim_manager.evacuated = payload.evacuated
    if payload.evacuating is not None:
        sim_manager.evacuating = payload.evacuating
    if payload.trapped is not None:
        sim_manager.trapped = payload.trapped
    if payload.exits_count is not None:
        sim_manager.exits_count = payload.exits_count
    if payload.fire_zones_count is not None:
        sim_manager.fire_zones_count = payload.fire_zones_count

    return get_status()
