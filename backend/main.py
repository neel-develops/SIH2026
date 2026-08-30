from contextlib import asynccontextmanager
import os
from pathlib import Path

from dotenv import load_dotenv
load_dotenv(Path(__file__).parent / ".env")

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware

from database import engine, SessionLocal, Base
from seed import seed_all
from routers import auth_router, defects_router, plans_router, reports_router, users_router, llm_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        seed_all(db)
    finally:
        db.close()
    yield


app = FastAPI(
    title="AABPS — AI-Powered Automatic Block Planning System",
    description="Backend API for Indian Railways maintenance block scheduling with OR-Tools AI optimization",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(GZipMiddleware, minimum_size=500)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router.router)
app.include_router(defects_router.router)
app.include_router(plans_router.router)
app.include_router(reports_router.router)
app.include_router(users_router.router)
app.include_router(llm_router.router)


@app.get("/api/v1/health")
def health():
    return {"status": "ok", "engine": "OR-Tools CP-SAT + Groq LLM", "version": "1.1.0"}
