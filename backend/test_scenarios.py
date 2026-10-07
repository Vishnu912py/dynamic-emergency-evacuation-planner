import pytest
from backend.algorithms.astar import a_star_search
from backend.algorithms.evacuation import calculate_evacuation_routes
from backend.algorithms.fire_spread import simulate_fire_step
from backend.models.schemas import PersonSchema, ExitSchema, FireZoneSchema

def test_scenario_1_clear_route():
    """Test 1: Clear Route - A person has a clear route to an exit."""
    grid = [
        ["person", "empty", "empty", "empty", "exit"],
        ["empty",  "empty", "empty", "empty", "empty"],
    ]
    people = [PersonSchema(id="P1", row=0, col=0)]
    exits = [ExitSchema(id="E1", row=0, col=4)]
    resp = calculate_evacuation_routes(grid, people, exits, [])
    
    assert len(resp.routes) == 1
    route = resp.routes[0]
    assert route.person_id == "P1"
    assert route.exit_id == "E1"
    assert route.status == "EVACUATING"
    assert route.path == [[0, 0], [0, 1], [0, 2], [0, 3], [0, 4]]
    assert route.distance == 4
    assert route.validation_passed is True

def test_scenario_2_wall_blocking_route():
    """Test 2: Wall Blocking Route - A wall blocks direct route; A* finds alternative route around wall."""
    grid = [
        ["person", "wall", "exit"],
        ["empty",  "empty", "empty"]
    ]
    people = [PersonSchema(id="P1", row=0, col=0)]
    exits = [ExitSchema(id="E1", row=0, col=2)]
    resp = calculate_evacuation_routes(grid, people, exits, [])
    
    assert len(resp.routes) == 1
    route = resp.routes[0]
    assert route.status == "EVACUATING"
    assert route.exit_id == "E1"
    assert [0, 1] not in route.path  # Did not go through wall
    assert route.path == [[0, 0], [1, 0], [1, 1], [1, 2], [0, 2]]
    assert route.distance == 4

def test_scenario_3_fire_blocking_route():
    """Test 3: Fire Blocking Route - Fire blocks shortest route; A* finds another safe route."""
    grid = [
        ["person", "fire",  "exit"],
        ["empty",  "empty", "empty"]
    ]
    people = [PersonSchema(id="P1", row=0, col=0)]
    exits = [ExitSchema(id="E1", row=0, col=2)]
    fires = [FireZoneSchema(row=0, col=1, active=True)]
    resp = calculate_evacuation_routes(grid, people, exits, fires)
    
    assert len(resp.routes) == 1
    route = resp.routes[0]
    assert route.status == "EVACUATING"
    assert [0, 1] not in route.path  # Did not go through fire
    assert route.path == [[0, 0], [1, 0], [1, 1], [1, 2], [0, 2]]
    assert route.distance == 4

def test_scenario_4_exit_blocked_by_fire():
    """Test 4: Exit Blocked by Fire - Nearest exit becomes unreachable; assigned another reachable exit."""
    # E1 at (0, 2) is nearest but blocked by fire. E2 at (2, 0) is reachable.
    grid = [
        ["person", "fire",  "exit"],   # Exit E1 at (0, 2)
        ["empty",  "wall",  "wall"],
        ["exit",   "empty", "empty"]   # Exit E2 at (2, 0)
    ]
    people = [PersonSchema(id="P1", row=0, col=0)]
    exits = [
        ExitSchema(id="E1", row=0, col=2),
        ExitSchema(id="E2", row=2, col=0)
    ]
    fires = [FireZoneSchema(row=0, col=1, active=True)]
    resp = calculate_evacuation_routes(grid, people, exits, fires)
    
    assert len(resp.routes) == 1
    route = resp.routes[0]
    assert route.status == "EVACUATING"
    assert route.exit_id == "E2"
    assert route.path == [[0, 0], [1, 0], [2, 0]]
    assert route.distance == 2

def test_scenario_5_completely_trapped():
    """Test 5: Completely Trapped - No exit can be reached; marked TRAPPED, no fabricated route."""
    grid = [
        ["person", "wall"],
        ["wall",   "exit"]
    ]
    people = [PersonSchema(id="P1", row=0, col=0)]
    exits = [ExitSchema(id="E1", row=1, col=1)]
    resp = calculate_evacuation_routes(grid, people, exits, [])
    
    assert len(resp.routes) == 1
    route = resp.routes[0]
    assert route.status == "TRAPPED"
    assert route.exit_id is None
    assert route.path == []
    assert route.distance is None
    assert resp.trapped_count == 1

def test_scenario_6_fire_spreads_and_recalculates():
    """Test 6: Fire Spreads - Fire reaches existing evacuation route; recalculates and gives new safe route."""
    grid_initial = [
        ["person", "empty", "empty", "exit"],  # Upper corridor to Exit E1 (length 3)
        ["empty",  "wall",  "wall",  "wall"],
        ["empty",  "empty", "empty", "exit"]   # Lower corridor to Exit E2 (length 5)
    ]
    people = [PersonSchema(id="P1", row=0, col=0)]
    exits = [
        ExitSchema(id="E1", row=0, col=3),
        ExitSchema(id="E2", row=2, col=3)
    ]
    # Initially, fire is at (0, 1) adjacent but not yet on path, or starts elsewhere
    # Initial state: no fire on upper path
    resp1 = calculate_evacuation_routes(grid_initial, people, exits, [])
    assert resp1.routes[0].exit_id == "E1"
    assert resp1.routes[0].distance == 3

    # Now fire spreads into (0, 2)
    fires_active = [FireZoneSchema(row=0, col=2, active=True)]
    grid_with_fire = [row[:] for row in grid_initial]
    grid_with_fire[0][2] = "fire"
    
    # Recalculate routes after fire spread
    resp2 = calculate_evacuation_routes(grid_with_fire, people, exits, fires_active)
    assert resp2.routes[0].exit_id == "E2"
    assert resp2.routes[0].status == "EVACUATING"
    # Route now goes through row 1 and row 2 down to E2
    assert [0, 2] not in resp2.routes[0].path
    assert resp2.routes[0].path[-1] == [2, 3]
