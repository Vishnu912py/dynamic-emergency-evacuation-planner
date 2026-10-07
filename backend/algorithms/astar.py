import heapq
from typing import List, Tuple, Optional, Set, Dict

def manhattan_distance(p1: Tuple[int, int], p2: Tuple[int, int]) -> int:
    """Calculate Manhattan distance heuristic between two points."""
    return abs(p1[0] - p2[0]) + abs(p1[1] - p2[1])

def a_star_search(
    grid: List[List[str]],
    start: Tuple[int, int],
    goal: Tuple[int, int],
    walls: Optional[Set[Tuple[int, int]]] = None,
    fires: Optional[Set[Tuple[int, int]]] = None
) -> Optional[List[List[int]]]:
    """
    Manual implementation of the A* pathfinding algorithm with Manhattan distance heuristic.
    Movement is strictly limited to 4 cardinal directions (UP, DOWN, LEFT, RIGHT).
    
    Rejects:
    - Out of bounds cells
    - Wall cells
    - Fire cells
    
    Returns:
    - List of [row, col] coordinates from start to goal inclusive, or None if unreachable.
    """
    rows = len(grid)
    if rows == 0:
        return None
    cols = len(grid[0])
    
    start_r, start_c = start
    goal_r, goal_c = goal

    # Grid boundary check for start and goal
    if not (0 <= start_r < rows and 0 <= start_c < cols):
        return None
    if not (0 <= goal_r < rows and 0 <= goal_c < cols):
        return None

    # Check start and goal validity
    start_cell = grid[start_r][start_c].lower()
    goal_cell = grid[goal_r][goal_c].lower()
    
    # Fast set lookups for blocked cells if provided, or parse grid directly
    wall_set: Set[Tuple[int, int]] = set()
    fire_set: Set[Tuple[int, int]] = set()

    if walls is not None:
        wall_set = walls
    if fires is not None:
        fire_set = fires

    # Also inspect grid cells for wall and fire
    for r in range(rows):
        for c in range(cols):
            val = str(grid[r][c]).lower()
            if val == "wall":
                wall_set.add((r, c))
            elif val == "fire":
                fire_set.add((r, c))

    # If start or goal is blocked
    if start in wall_set or start in fire_set:
        return None
    if goal in wall_set or goal in fire_set:
        return None

    # If already at goal
    if start == goal:
        return [[start_r, start_c]]

    # 4-direction movements: UP, DOWN, LEFT, RIGHT (no diagonal)
    directions = [(-1, 0), (1, 0), (0, -1), (0, 1)]

    # Priority queue min-heap entries: (f_score, counter, current_node)
    # Counter acts as tie-breaker to prevent comparing coordinates directly
    open_heap = []
    counter = 0
    
    # came_from map
    came_from: Dict[Tuple[int, int], Tuple[int, int]] = {}

    # g_score map default infinity
    g_score: Dict[Tuple[int, int], float] = {start: 0.0}

    # f_score map default infinity
    f_score: Dict[Tuple[int, int], float] = {start: float(manhattan_distance(start, goal))}

    heapq.heappush(open_heap, (f_score[start], counter, start))
    open_set_items: Set[Tuple[int, int]] = {start}
    closed_set: Set[Tuple[int, int]] = set()

    while open_heap:
        current_f, _, current = heapq.heappop(open_heap)
        
        if current in closed_set:
            continue
            
        open_set_items.discard(current)

        # Check if reached goal
        if current == goal:
            # Reconstruct path
            path = [list(current)]
            curr = current
            while curr in came_from:
                curr = came_from[curr]
                path.append(list(curr))
            path.reverse()
            return path

        closed_set.add(current)
        curr_g = g_score[current]

        for dr, dc in directions:
            neighbor = (current[0] + dr, current[1] + dc)
            nr, nc = neighbor

            # Boundary check
            if not (0 <= nr < rows and 0 <= nc < cols):
                continue

            # Wall check
            if neighbor in wall_set:
                continue

            # Fire check
            if neighbor in fire_set:
                continue

            if neighbor in closed_set:
                continue

            tentative_g = curr_g + 1

            if tentative_g < g_score.get(neighbor, float('inf')):
                came_from[neighbor] = current
                g_score[neighbor] = tentative_g
                h = manhattan_distance(neighbor, goal)
                f = tentative_g + h
                f_score[neighbor] = f
                
                counter += 1
                heapq.heappush(open_heap, (f, counter, neighbor))
                open_set_items.add(neighbor)

    # Open set is empty and goal was never reached
    return None
