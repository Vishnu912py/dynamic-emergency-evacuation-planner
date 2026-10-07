import pytest
from backend.algorithms.astar import a_star_search, manhattan_distance
from backend.validators.constraints import validate_route_constraints
from backend.algorithms.evacuation import calculate_evacuation_routes
from backend.algorithms.fire_spread import simulate_fire_step
from backend.models.schemas import PersonSchema, ExitSchema, FireZoneSchema

def test_manhattan_distance():
    assert manhattan_distance((0, 0), (3, 4)) == 7
    assert manhattan_distance((2, 5), (2, 5)) == 0
    assert manhattan_distance((10, 2), (2, 10)) == 16

def test_astar_clear_route():
    # 5x5 empty grid
    grid = [["empty" for _ in range(5)] for _ in range(5)]
    path = a_star_search(grid, start=(0, 0), goal=(0, 4))
    assert path is not None
    assert path[0] == [0, 0]
    assert path[-1] == [0, 4]
    assert len(path) == 5  # (0,0), (0,1), (0,2), (0,3), (0,4)

def test_astar_wall_blocking():
    # Wall blocks direct straight path
    grid = [["empty" for _ in range(5)] for _ in range(5)]
    grid[0][1] = "wall"
    path = a_star_search(grid, start=(0, 0), goal=(0, 2))
    assert path is not None
    assert [0, 1] not in path
    assert path[0] == [0, 0]
    assert path[-1] == [0, 2]

def test_astar_fire_blocking():
    # Fire blocks path
    grid = [["empty" for _ in range(5)] for _ in range(5)]
    grid[0][1] = "fire"
    path = a_star_search(grid, start=(0, 0), goal=(0, 2))
    assert path is not None
    assert [0, 1] not in path

def test_astar_completely_trapped():
    # Boxed in by walls
    grid = [["empty" for _ in range(5)] for _ in range(5)]
    grid[0][1] = "wall"
    grid[1][0] = "wall"
    path = a_star_search(grid, start=(0, 0), goal=(4, 4))
    assert path is None

def test_constraints_validation():
    walls = {(1, 1)}
    fires = {(2, 2)}
    valid_path = [[0, 0], [0, 1], [0, 2]]
    is_valid, errors = validate_route_constraints(
        path=valid_path,
        start_pos=(0, 0),
        exit_pos=(0, 2),
        grid_rows=5,
        grid_cols=5,
        walls=walls,
        fires=fires
    )
    assert is_valid is True
    assert len(errors) == 0

    # Test diagonal jump violation (Constraint 1)
    diagonal_path = [[0, 0], [1, 1]]
    is_valid, errors = validate_route_constraints(
        path=diagonal_path,
        start_pos=(0, 0),
        exit_pos=(1, 1),
        grid_rows=5,
        grid_cols=5,
        walls=walls,
        fires=fires
    )
    assert is_valid is False
    assert any("Constraint 1" in e for e in errors)

    # Test wall violation (Constraint 2)
    wall_path = [[0, 1], [1, 1]]
    is_valid, errors = validate_route_constraints(
        path=wall_path,
        start_pos=(0, 1),
        exit_pos=(1, 1),
        grid_rows=5,
        grid_cols=5,
        walls=walls,
        fires=fires
    )
    assert is_valid is False
    assert any("Constraint 2" in e for e in errors)

def test_fire_cannot_spread_through_walls():
    # Grid where fire is next to a wall
    grid = [
        ["fire", "wall", "empty"],
        ["empty", "wall", "empty"],
        ["empty", "empty", "empty"]
    ]
    fires = [FireZoneSchema(row=0, col=0, active=True)]
    response = simulate_fire_step(grid, fires)
    
    # Wall at (0, 1) and (1, 1) should NEVER be ignited
    assert response.grid[0][1] == "wall"
    assert response.grid[1][1] == "wall"
    # Fire should spread down to (1, 0)
    assert [1, 0] in response.newly_ignited
    # And fire should NOT have jumped wall to (0, 2)
    assert [0, 2] not in response.newly_ignited

def test_calculate_evacuation_shortest_exit_and_trapped():
    grid = [
        ["person", "empty", "empty", "exit"],  # Exit 1 at (0, 3) dist 3
        ["wall",   "wall",  "wall",  "wall"],
        ["person", "empty", "wall",  "exit"]   # Exit 2 at (2, 3), blocked by wall from (2, 0)
    ]
    people = [
        PersonSchema(id="P1", row=0, col=0),
        PersonSchema(id="P2", row=2, col=0)
    ]
    exits = [
        ExitSchema(id="E1", row=0, col=3),
        ExitSchema(id="E2", row=2, col=3)
    ]
    resp = calculate_evacuation_routes(grid, people, exits, [])
    
    p1_route = next(r for r in resp.routes if r.person_id == "P1")
    assert p1_route.status == "EVACUATING"
    assert p1_route.exit_id == "E1"
    assert p1_route.distance == 3

    p2_route = next(r for r in resp.routes if r.person_id == "P2")
    assert p2_route.status == "TRAPPED"
    assert p2_route.exit_id is None
    assert p2_route.path == []
