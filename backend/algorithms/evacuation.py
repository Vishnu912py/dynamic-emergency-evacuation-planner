from typing import List, Dict, Tuple, Set, Optional
import datetime
from backend.models.schemas import (
    PersonSchema,
    ExitSchema,
    FireZoneSchema,
    EvacuationRoute,
    EvacuationCalculateResponse
)
from backend.algorithms.astar import a_star_search
from backend.validators.constraints import validate_route_constraints

def calculate_evacuation_routes(
    grid: List[List[str]],
    people: List[PersonSchema],
    exits: List[ExitSchema],
    fires: List[FireZoneSchema]
) -> EvacuationCalculateResponse:
    """
    Computes optimal, safe evacuation paths for all individuals using A* pathfinding.
    Validates each path against safety constraints.
    Selects the shortest valid reachable exit for each person.
    Marks trapped individuals when no safe path exists.
    """
    rows = len(grid)
    cols = len(grid[0]) if rows > 0 else 0

    # Collect set of walls and fires for quick lookup
    wall_set: Set[Tuple[int, int]] = set()
    fire_set: Set[Tuple[int, int]] = set()

    for r in range(rows):
        for c in range(cols):
            cell = str(grid[r][c]).lower()
            if cell == "wall":
                wall_set.add((r, c))
            elif cell == "fire":
                fire_set.add((r, c))

    for f in fires:
        if f.active:
            fire_set.add((f.row, f.col))

    routes: List[EvacuationRoute] = []
    trapped_count = 0
    evacuating_count = 0
    safe_exit_ids: Set[str] = set()

    for person in people:
        person_start = (person.row, person.col)
        
        # If person is already standing inside a fire or a wall
        if person_start in fire_set or person_start in wall_set:
            routes.append(
                EvacuationRoute(
                    person_id=person.id,
                    exit_id=None,
                    path=[],
                    distance=None,
                    status="TRAPPED",
                    validation_passed=False,
                    validation_errors=["Person is located in a hazardous or blocked cell (Wall/Fire)."]
                )
            )
            trapped_count += 1
            continue

        best_path: Optional[List[List[int]]] = None
        best_exit_id: Optional[str] = None
        min_length = float('inf')
        last_validation_errors: List[str] = []

        # Evaluate path to each exit
        for exit_item in exits:
            exit_pos = (exit_item.row, exit_item.col)

            # Skip exit if it is blocked by fire or wall
            if exit_pos in fire_set or exit_pos in wall_set:
                continue

            path = a_star_search(
                grid=grid,
                start=person_start,
                goal=exit_pos,
                walls=wall_set,
                fires=fire_set
            )

            if path is not None:
                # Validate constraints
                is_valid, errors = validate_route_constraints(
                    path=path,
                    start_pos=person_start,
                    exit_pos=exit_pos,
                    grid_rows=rows,
                    grid_cols=cols,
                    walls=wall_set,
                    fires=fire_set
                )

                if is_valid:
                    path_len = len(path) - 1
                    if path_len < min_length:
                        min_length = path_len
                        best_path = path
                        best_exit_id = exit_item.id
                        safe_exit_ids.add(exit_item.id)
                else:
                    last_validation_errors.extend(errors)

        if best_path is not None and best_exit_id is not None:
            routes.append(
                EvacuationRoute(
                    person_id=person.id,
                    exit_id=best_exit_id,
                    path=best_path,
                    distance=int(min_length),
                    status="EVACUATING",
                    validation_passed=True,
                    validation_errors=[]
                )
            )
            evacuating_count += 1
        else:
            routes.append(
                EvacuationRoute(
                    person_id=person.id,
                    exit_id=None,
                    path=[],
                    distance=None,
                    status="TRAPPED",
                    validation_passed=True,
                    validation_errors=last_validation_errors if last_validation_errors else ["No safe path to any exit."]
                )
            )
            trapped_count += 1

    return EvacuationCalculateResponse(
        routes=routes,
        trapped_count=trapped_count,
        evacuating_count=evacuating_count,
        safe_exits=sorted(list(safe_exit_ids)),
        timestamp=datetime.datetime.now().strftime("%H:%M:%S")
    )
