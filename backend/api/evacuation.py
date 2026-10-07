from fastapi import APIRouter, HTTPException, status
from backend.models.schemas import (
    EvacuationCalculateRequest,
    EvacuationCalculateResponse
)
from backend.algorithms.evacuation import calculate_evacuation_routes

router = APIRouter(prefix="/api/evacuation", tags=["evacuation"])

@router.post("/calculate", response_model=EvacuationCalculateResponse)
def calculate_routes(payload: EvacuationCalculateRequest):
    grid = payload.grid
    if not grid or len(grid) == 0 or len(grid[0]) == 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid grid dimensions: Grid cannot be empty."
        )

    rows = len(grid)
    cols = len(grid[0])

    # Validate that grid is rectangular
    for r_idx, row in enumerate(grid):
        if len(row) != cols:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid grid dimensions: Row {r_idx} length {len(row)} does not match grid width {cols}."
            )

    if not payload.exits:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No exits configured. At least one exit is required for evacuation planning."
        )

    # Validate coordinates for people and exits
    for person in payload.people:
        if not (0 <= person.row < rows and 0 <= person.col < cols):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Person {person.id} position [{person.row}, {person.col}] is outside grid boundaries ({rows}x{cols})."
            )

    for exit_item in payload.exits:
        if not (0 <= exit_item.row < rows and 0 <= exit_item.col < cols):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Exit {exit_item.id} position [{exit_item.row}, {exit_item.col}] is outside grid boundaries ({rows}x{cols})."
            )

    # Run evacuation calculations
    result = calculate_evacuation_routes(
        grid=payload.grid,
        people=payload.people,
        exits=payload.exits,
        fires=payload.fires
    )

    return result
