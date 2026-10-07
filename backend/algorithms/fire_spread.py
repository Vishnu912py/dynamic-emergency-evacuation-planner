from typing import List, Tuple, Set
import copy
from backend.models.schemas import FireZoneSchema, FireSpreadResponse

def simulate_fire_step(
    grid: List[List[str]],
    fires: List[FireZoneSchema]
) -> FireSpreadResponse:
    """
    Simulates a step of fire spreading:
    - Spreads 4-directionally: UP, DOWN, LEFT, RIGHT.
    - Fire CANNOT spread through WALL cells.
    - Fire spreads into any non-wall cells (empty, person, exit).
    - Returns updated grid, active fire list, and newly ignited cells.
    """
    rows = len(grid)
    if rows == 0:
        return FireSpreadResponse(grid=[], fires=[], newly_ignited=[])
    cols = len(grid[0])

    new_grid = [row[:] for row in grid]
    directions = [(-1, 0), (1, 0), (0, -1), (0, 1)]

    current_fire_set: Set[Tuple[int, int]] = set()
    for f in fires:
        if f.active:
            current_fire_set.add((f.row, f.col))

    # Also include any fire cells currently in the grid
    for r in range(rows):
        for c in range(cols):
            if str(new_grid[r][c]).lower() == "fire":
                current_fire_set.add((r, c))

    newly_ignited_set: Set[Tuple[int, int]] = set()

    for r, c in current_fire_set:
        for dr, dc in directions:
            nr, nc = r + dr, c + dc
            if 0 <= nr < rows and 0 <= nc < cols:
                cell_val = str(new_grid[nr][nc]).lower()
                # Fire cannot spread to walls or cells already on fire
                if cell_val != "wall" and (nr, nc) not in current_fire_set:
                    newly_ignited_set.add((nr, nc))

    # Apply fire to newly ignited cells
    all_fires: List[FireZoneSchema] = []
    
    # Keep existing fires
    for r, c in current_fire_set:
        all_fires.append(FireZoneSchema(row=r, col=c, severity=1, active=True))
        new_grid[r][c] = "fire"

    # Add newly ignited
    newly_ignited_list = []
    for r, c in newly_ignited_set:
        new_grid[r][c] = "fire"
        all_fires.append(FireZoneSchema(row=r, col=c, severity=1, active=True))
        newly_ignited_list.append([r, c])

    return FireSpreadResponse(
        grid=new_grid,
        fires=all_fires,
        newly_ignited=newly_ignited_list
    )
