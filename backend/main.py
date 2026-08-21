from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from app.database import init_db
from app.routes import auth, batch, harvest_intelligence, iot

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize database connection on startup
    await init_db()
    yield

app = FastAPI(title="MandiTrace API", lifespan=lifespan)

# Allow CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173", "http://localhost:8080"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/api/auth", tags=["auth"])
app.include_router(batch.router, prefix="/api", tags=["batches"])
app.include_router(harvest_intelligence.router, prefix="/api", tags=["harvest-intelligence"])
app.include_router(iot.router, tags=["iot"])

@app.get("/")
async def root():
    return {"message": "Welcome to MandiTrace API"}
