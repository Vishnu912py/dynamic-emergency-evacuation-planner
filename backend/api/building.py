import uuid
import json
import datetime
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from backend.database.database import get_db
from backend.database.models import BuildingModel, PersonModel, ExitModel, FireZoneModel
from backend.models.schemas import (
    BuildingCreate,
    BuildingUpdate,
    BuildingResponse,
    PersonSchema,
    ExitSchema,
    FireZoneSchema
)

router = APIRouter(prefix="/api/buildings", tags=["buildings"])

def model_to_response(b: BuildingModel) -> BuildingResponse:
    people = [
        PersonSchema(id=p.id, label=p.label, row=p.row, col=p.column, status=p.status)
        for p in b.people
    ]
    exits = [
        ExitSchema(id=e.id, label=e.label, name=e.label, row=e.row, col=e.column, capacity=e.capacity)
        for e in b.exits
    ]
    fires = [
        FireZoneSchema(id=f.id, row=f.row, col=f.column, active=f.active, severity=f.severity)
        for f in b.fire_zones
    ]
    return BuildingResponse(
        id=b.id,
        name=b.name,
        rows=b.rows,
        columns=b.columns,
        grid_json=b.grid_json,
        people=people,
        exits=exits,
        fires=fires,
        created_at=b.created_at
    )

@router.get("", response_model=List[BuildingResponse])
def get_all_buildings(db: Session = Depends(get_db)):
    buildings = db.query(BuildingModel).order_by(BuildingModel.created_at.desc()).all()
    return [model_to_response(b) for b in buildings]

@router.post("", response_model=BuildingResponse, status_code=status.HTTP_201_CREATED)
def create_building(payload: BuildingCreate, db: Session = Depends(get_db)):
    b_id = payload.id or str(uuid.uuid4())
    building = BuildingModel(
        id=b_id,
        name=payload.name,
        rows=payload.rows,
        columns=payload.columns,
        grid_json=payload.grid_json,
        created_at=datetime.datetime.utcnow()
    )
    db.add(building)

    for p in (payload.people or []):
        db.add(PersonModel(
            id=p.id or str(uuid.uuid4()),
            building_id=b_id,
            label=p.label or p.id,
            row=p.row,
            column=p.col,
            status=p.status
        ))

    for e in (payload.exits or []):
        db.add(ExitModel(
            id=e.id or str(uuid.uuid4()),
            building_id=b_id,
            label=e.label or e.name or e.id,
            row=e.row,
            column=e.col,
            capacity=e.capacity or 50
        ))

    for f in (payload.fires or []):
        db.add(FireZoneModel(
            id=f.id or str(uuid.uuid4()),
            building_id=b_id,
            row=f.row,
            column=f.col,
            active=f.active,
            severity=f.severity or 1
        ))

    db.commit()
    db.refresh(building)
    return model_to_response(building)

@router.get("/{id}", response_model=BuildingResponse)
def get_building(id: str, db: Session = Depends(get_db)):
    building = db.query(BuildingModel).filter(BuildingModel.id == id).first()
    if not building:
        raise HTTPException(status_code=404, detail=f"Building '{id}' not found.")
    return model_to_response(building)

@router.put("/{id}", response_model=BuildingResponse)
def update_building(id: str, payload: BuildingUpdate, db: Session = Depends(get_db)):
    building = db.query(BuildingModel).filter(BuildingModel.id == id).first()
    if not building:
        raise HTTPException(status_code=404, detail=f"Building '{id}' not found.")

    if payload.name is not None:
        building.name = payload.name
    if payload.rows is not None:
        building.rows = payload.rows
    if payload.columns is not None:
        building.columns = payload.columns
    if payload.grid_json is not None:
        building.grid_json = payload.grid_json

    if payload.people is not None:
        db.query(PersonModel).filter(PersonModel.building_id == id).delete()
        for p in payload.people:
            db.add(PersonModel(
                id=p.id or str(uuid.uuid4()),
                building_id=id,
                label=p.label or p.id,
                row=p.row,
                column=p.col,
                status=p.status
            ))

    if payload.exits is not None:
        db.query(ExitModel).filter(ExitModel.building_id == id).delete()
        for e in payload.exits:
            db.add(ExitModel(
                id=e.id or str(uuid.uuid4()),
                building_id=id,
                label=e.label or e.name or e.id,
                row=e.row,
                column=e.col,
                capacity=e.capacity or 50
            ))

    if payload.fires is not None:
        db.query(FireZoneModel).filter(FireZoneModel.building_id == id).delete()
        for f in payload.fires:
            db.add(FireZoneModel(
                id=f.id or str(uuid.uuid4()),
                building_id=id,
                row=f.row,
                column=f.col,
                active=f.active,
                severity=f.severity or 1
            ))

    db.commit()
    db.refresh(building)
    return model_to_response(building)

@router.delete("/{id}")
def delete_building(id: str, db: Session = Depends(get_db)):
    building = db.query(BuildingModel).filter(BuildingModel.id == id).first()
    if not building:
        raise HTTPException(status_code=404, detail=f"Building '{id}' not found.")
    db.delete(building)
    db.commit()
    return {"message": f"Building {id} deleted successfully"}

@router.post("/demo", response_model=BuildingResponse)
def create_demo_building(db: Session = Depends(get_db)):
    """
    Creates and returns a preconfigured realistic demo scenario:
    - 20x20 grid with interior corridors and walls
    - Multiple people (P1, P2, P3, P4)
    - Multiple exits (Exit A, Exit B, Exit C)
    - Fire zone positioned to test rerouting
    """
    demo_id = "demo-office-01"
    existing = db.query(BuildingModel).filter(BuildingModel.id == demo_id).first()
    if existing:
        db.delete(existing)
        db.commit()

    for child_model in (PersonModel, ExitModel, FireZoneModel):
        db.query(child_model).filter(
            child_model.building_id == demo_id
        ).delete(synchronize_session=False)

    rows, cols = 20, 20
    grid = [["empty" for _ in range(cols)] for _ in range(rows)]

    # Add perimeter walls except for exits
    for r in range(rows):
        grid[r][0] = "wall"
        grid[r][cols - 1] = "wall"
    for c in range(cols):
        grid[0][c] = "wall"
        grid[rows - 1][c] = "wall"

    # Add interior partitioning walls
    # Vertical divider with corridor opening
    for r in range(2, 10):
        grid[r][10] = "wall"
    for r in range(12, 18):
        grid[r][10] = "wall"

    # Horizontal wall in left section
    for c in range(3, 8):
        grid[6][c] = "wall"

    # Horizontal wall in right section
    for c in range(12, 17):
        grid[14][c] = "wall"

    # Exits
    # Exit A (Top Right)
    grid[0][18] = "exit"
    # Exit B (Bottom Right)
    grid[19][18] = "exit"
    # Exit C (Bottom Left)
    grid[19][3] = "exit"

    exits = [
        ExitSchema(id="E1", label="Exit A (North East)", name="Exit A", row=0, col=18, capacity=50),
        ExitSchema(id="E2", label="Exit B (South East)", name="Exit B", row=19, col=18, capacity=50),
        ExitSchema(id="E3", label="Exit C (South West)", name="Exit C", row=19, col=3, capacity=50)
    ]

    # People
    grid[2][2] = "person"
    grid[14][2] = "person"
    grid[4][14] = "person"
    grid[17][7] = "person"

    people = [
        PersonSchema(id="P1", label="Person 1 (Office A)", row=2, col=2, status="WAITING"),
        PersonSchema(id="P2", label="Person 2 (Office B)", row=14, col=2, status="WAITING"),
        PersonSchema(id="P3", label="Person 3 (Conference)", row=4, col=14, status="WAITING"),
        PersonSchema(id="P4", label="Person 4 (Breakroom)", row=17, col=7, status="WAITING")
    ]

    # Fire zone
    grid[10][6] = "fire"
    grid[10][7] = "fire"

    fires = [
        FireZoneSchema(id="F1", row=10, col=6, severity=1, active=True),
        FireZoneSchema(id="F2", row=10, col=7, severity=1, active=True)
    ]

    building = BuildingModel(
        id=demo_id,
        name="Main Office Complex (Demo)",
        rows=rows,
        columns=cols,
        grid_json=json.dumps(grid),
        created_at=datetime.datetime.utcnow()
    )
    db.add(building)

    for p in people:
        db.add(PersonModel(
            id=p.id,
            building_id=demo_id,
            label=p.label,
            row=p.row,
            column=p.col,
            status=p.status
        ))

    for e in exits:
        db.add(ExitModel(
            id=e.id,
            building_id=demo_id,
            label=e.label,
            row=e.row,
            column=e.col,
            capacity=e.capacity
        ))

    for f in fires:
        db.add(FireZoneModel(
            id=f.id,
            building_id=demo_id,
            row=f.row,
            column=f.col,
            active=f.active,
            severity=f.severity
        ))

    db.commit()
    db.refresh(building)
    return model_to_response(building)
