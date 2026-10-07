from typing import List, Tuple, Set, Optional

def validate_route_constraints(
    path: List[List[int]],
    start_pos: Tuple[int, int],
    exit_pos: Tuple[int, int],
    grid_rows: int,
    grid_cols: int,
    walls: Set[Tuple[int, int]],
    fires: Set[Tuple[int, int]]
) -> Tuple[bool, List[str]]:
    """
    Validates that a proposed evacuation route satisfies all safety and traversal constraints:
    1. Valid Movement: Every consecutive pair must have Manhattan distance of exactly 1.
    2. No Walls: Path does not cross any wall cells.
    3. No Fire: Path does not cross any active fire cells.
    4. Correct Starting Position: Path starts at person's position.
    5. Correct Exit: Path terminates at the selected exit.
    6. Grid Boundaries: All cells are within bounds.
    7. No Unnecessary Repetition: Path does not contain self-intersecting loops / repeats.
    """
    errors: List[str] = []

    if not path:
        errors.append("Constraint violation: Empty route path provided.")
        return False, errors

    # Constraint 4: Correct Starting Position
    if (path[0][0], path[0][1]) != start_pos:
        errors.append(
            f"Constraint 4 violated: Route start {path[0]} does not match person position {start_pos}."
        )

    # Constraint 5: Correct Exit
    if (path[-1][0], path[-1][1]) != exit_pos:
        errors.append(
            f"Constraint 5 violated: Route end {path[-1]} does not reach destination exit {exit_pos}."
        )

    visited_cells: Set[Tuple[int, int]] = set()

    for i, cell in enumerate(path):
        r, c = cell[0], cell[1]
        coord = (r, c)

        # Constraint 6: Grid Boundaries
        if not (0 <= r < grid_rows and 0 <= c < grid_cols):
            errors.append(
                f"Constraint 6 violated: Cell [{r}, {c}] at step {i} is outside grid boundaries ({grid_rows}x{grid_cols})."
            )

        # Constraint 2: No Walls
        if coord in walls:
            errors.append(
                f"Constraint 2 violated: Cell [{r}, {c}] at step {i} collides with a WALL."
            )

        # Constraint 3: No Fire
        if coord in fires:
            errors.append(
                f"Constraint 3 violated: Cell [{r}, {c}] at step {i} is an active FIRE zone."
            )

        # Constraint 7: No Unnecessary Repetition
        if coord in visited_cells:
            errors.append(
                f"Constraint 7 violated: Duplicate/loop cell [{r}, {c}] detected at step {i}."
            )
        visited_cells.add(coord)

        # Constraint 1: Valid Movement (Consecutive step check)
        if i > 0:
            prev_r, prev_c = path[i - 1][0], path[i - 1][1]
            manhattan = abs(r - prev_r) + abs(c - prev_c)
            if manhattan != 1:
                errors.append(
                    f"Constraint 1 violated: Movement from [{prev_r}, {prev_c}] to [{r}, {c}] has step distance {manhattan} != 1 (diagonal or jump)."
                )

    is_valid = len(errors) == 0
    return is_valid, errors
