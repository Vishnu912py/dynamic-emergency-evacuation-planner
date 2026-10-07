import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from backend.database.database import engine, Base
from backend.api.building import router as building_router
from backend.api.evacuation import router as evacuation_router
from backend.api.simulation import router as simulation_router

# Initialize SQLite database tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Dynamic Emergency Evacuation Planner API",
    description="Backend API for emergency evacuation route planning, A* pathfinding, constraint validation, and fire simulation.",
    version="1.0.0"
)

# Configure CORS for local React Vite frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register API routers
app.include_router(building_router)
app.include_router(evacuation_router)
app.include_router(simulation_router)

@app.get("/")
def root():
    return {
        "service": "Dynamic Emergency Evacuation Planner API",
        "status": "online",
        "endpoints": [
            "/api/buildings",
            "/api/buildings/demo",
            "/api/evacuation/calculate",
            "/api/simulation/start",
            "/api/simulation/pause",
            "/api/simulation/reset",
            "/api/fire/spread",
            "/api/events",
            "/api/status"
        ]
    }

if __name__ == "__main__":
    uvicorn.run("backend.main:app", host="127.0.0.1", port=8000, reload=True)
