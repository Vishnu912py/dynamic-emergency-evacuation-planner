from typing import List, Optional, Tuple, Literal
from pydantic import BaseModel, Field
import datetime

class PersonSchema(BaseModel):
    id: str
    label: Optional[str] = None
    row: int
    col: int
    status: Literal["WAITING", "EVACUATING", "EVACUATED", "TRAPPED"] = "WAITING"
    assigned_exit: Optional[str] = None
    route: Optional[List[List[int]]] = None
    route_length: Optional[int] = None

class ExitSchema(BaseModel):
    id: str
    label: Optional[str] = None
    name: Optional[str] = None
    row: int
    col: int
    capacity: Optional[int] = 50

class FireZoneSchema(BaseModel):
    id: Optional[str] = None
    row: int
    col: int
    severity: Optional[int] = 1
    active: bool = True

class EvacuationCalculateRequest(BaseModel):
    grid: List[List[str]] = Field(..., description="2D matrix of cell types: empty, wall, person, exit, fire")
    people: List[PersonSchema]
    exits: List[ExitSchema]
    fires: List[FireZoneSchema] = []

class EvacuationRoute(BaseModel):
    person_id: str
    exit_id: Optional[str] = None
    path: List[List[int]] = []
    distance: Optional[int] = None
    status: Literal["WAITING", "EVACUATING", "EVACUATED", "TRAPPED"]
    validation_passed: bool = True
    validation_errors: List[str] = []

class EvacuationCalculateResponse(BaseModel):
    routes: List[EvacuationRoute]
    trapped_count: int = 0
    evacuating_count: int = 0
    safe_exits: List[str] = []
    timestamp: str

class FireSpreadRequest(BaseModel):
    grid: List[List[str]]
    fires: List[FireZoneSchema]
    spread_rate: Optional[float] = 1.0  # probability or deterministic expansion

class FireSpreadResponse(BaseModel):
    grid: List[List[str]]
    fires: List[FireZoneSchema]
    newly_ignited: List[List[int]]

class BuildingCreate(BaseModel):
    id: Optional[str] = None
    name: str
    rows: int = 20
    columns: int = 20
    grid_json: Optional[str] = None
    people: Optional[List[PersonSchema]] = []
    exits: Optional[List[ExitSchema]] = []
    fires: Optional[List[FireZoneSchema]] = []

class BuildingUpdate(BaseModel):
    name: Optional[str] = None
    rows: Optional[int] = None
    columns: Optional[int] = None
    grid_json: Optional[str] = None
    people: Optional[List[PersonSchema]] = None
    exits: Optional[List[ExitSchema]] = None
    fires: Optional[List[FireZoneSchema]] = None

class BuildingResponse(BaseModel):
    id: str
    name: str
    rows: int
    columns: int
    grid_json: Optional[str] = None
    people: List[PersonSchema] = []
    exits: List[ExitSchema] = []
    fires: List[FireZoneSchema] = []
    created_at: Optional[datetime.datetime] = None

class EventLogItem(BaseModel):
    id: str
    timestamp: str
    message: str
    severity: Literal["info", "warning", "danger", "success"] = "info"
    details: Optional[dict] = None

class SimulationStateResponse(BaseModel):
    status: Literal["STOPPED", "ACTIVE", "PAUSED"]
    total_people: int
    evacuated: int
    evacuating: int
    trapped: int
    exits_count: int
    fire_zones_count: int
    recent_events: List[EventLogItem]
