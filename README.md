# Dynamic Emergency Evacuation Planner

A full-stack web application for planning and simulating emergency evacuations inside a building using manual **A\* pathfinding** with a Manhattan-distance heuristic, safety constraint validation, and dynamic rerouting under spreading fire conditions.

---

## Architecture Overview

```text
React + TypeScript Frontend (Vite, Tailwind CSS, Lucide React)
            |
            | REST API (Axios)
            v
       FastAPI Backend
            |
       +----+----+
       |         |
       v         v
    SQLite     A* Engine (Manhattan Heuristic)
  (SQLAlchemy)   |
                 v
        Evacuation Planner
                 |
                 v
        Route Validation (7 Safety Constraints)
                 |
                 v
        Fire Simulation (Dynamic Rerouting)
```

---

## Key Features

1. **Manual A\* Pathfinding**:
   - $f(n) = g(n) + h(n)$
   - Manhattan distance heuristic: $h(n) = |r_1 - r_2| + |c_1 - c_2|$
   - 4-cardinal direction movement (UP, DOWN, LEFT, RIGHT).
   - Strict avoidance of walls and fire hazards.
   - Computes path to all exits and selects the shortest reachable exit.
   - Detects completely trapped occupants without generating fabricated routes.

2. **Constraint Validation Layer** (`backend/validators/constraints.py`):
   - **Constraint 1 — Valid Movement**: Consecutive path steps must have Manhattan distance $= 1$.
   - **Constraint 2 — No Walls**: Route never steps on wall cells.
   - **Constraint 3 — No Fire**: Route never steps into fire zones.
   - **Constraint 4 — Correct Starting Position**: Route begins at the occupant's coordinate.
   - **Constraint 5 — Correct Exit**: Route terminates at the chosen exit.
   - **Constraint 6 — Grid Boundaries**: All coordinates stay within the grid dimension.
   - **Constraint 7 — No Unnecessary Repetition**: No loops or repeated cells.

3. **Dynamic Rerouting & Fire Spread**:
   - Spreads 4-directionally every 2 seconds (or manual stepping).
   - Fire **cannot** spread through walls.
   - As fire compromises corridors or exits, existing routes are automatically invalidated and recalculated.
   - Event log captures changes such as:
     `Route for Person 2 changed. Reason: Fire blocked previous route. New Exit: Exit B.`

4. **Occupant Movement Animation**:
   - Simulates occupants stepping along calculated paths (400ms per step).
   - Occupants transition to `EVACUATED` upon safely exiting.

5. **Building Persistence**:
   - Saved and loaded via SQLite through FastAPI REST endpoints.
   - Pre-configured realistic demo office scenario with corridors, partitions, 4 occupants, 3 exits, and fire.

---

## Running the Application Locally

### 1. Backend

```bash
cd backend
python -m uvicorn backend.main:app --host 127.0.0.1 --port 8000 --reload
```
API documentation available at [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs).

### 2. Frontend

```bash
cd frontend
npm install
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.

### 3. Running Backend Tests

```bash
python -m pytest backend/ -v
```
All 14 unit and integration test scenarios pass with 100% coverage.
