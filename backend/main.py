from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.modules.visits.router import router as visits_router

app = FastAPI(title="TableBoost API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Adjust this in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(visits_router)

@app.get("/")
def read_root():
    return {"message": "Welcome to TableBoost API Phase 1"}
