from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
import os

from .database import engine, Base
from .config import UPLOAD_DIR
from .routers import auth, projects, tasks, files, messages, users, quotes, appointments, leads

# When share.sh starts the backend it sets ALLOW_ALL_ORIGINS=1 so the ngrok URL is accepted.
_ALLOW_ALL = os.getenv("ALLOW_ALL_ORIGINS", "") == "1"
_CORS_ORIGINS = ["*"] if _ALLOW_ALL else [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]

# Path to the frontend production build — used when running in single-port share mode.
_FRONTEND_DIST = os.path.abspath(
    os.path.join(os.path.dirname(__file__), "../../frontend/dist")
)


@asynccontextmanager
async def lifespan(app: FastAPI):
    Base.metadata.create_all(bind=engine)
    os.makedirs(UPLOAD_DIR, exist_ok=True)
    yield


app = FastAPI(
    title="INTERIOSYNC API",
    description="Backend for INTERIOSYNC — Indian interior design project management platform",
    version="2.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=_CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/auth", tags=["auth"])
app.include_router(projects.router, prefix="/projects", tags=["projects"])
app.include_router(tasks.router, prefix="/tasks", tags=["tasks"])
app.include_router(files.router, prefix="/files", tags=["files"])
app.include_router(messages.router, prefix="/messages", tags=["messages"])
app.include_router(users.router, prefix="/users", tags=["users"])
app.include_router(quotes.router, prefix="/quotes", tags=["quotes"])
app.include_router(appointments.router, prefix="/appointments", tags=["appointments"])
app.include_router(leads.router, prefix="/leads", tags=["leads"])

if os.path.isdir(UPLOAD_DIR):
    app.mount("/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")


@app.get("/health")
def health():
    return {"status": "ok"}


# ── Single-port SPA serving ────────────────────────────────────────────────────
# When the frontend has been built (npm run build) FastAPI serves it directly so
# only one port (8000) needs to be exposed via ngrok.

if os.path.isdir(_FRONTEND_DIST):
    _ASSETS_DIR = os.path.join(_FRONTEND_DIST, "assets")
    if os.path.isdir(_ASSETS_DIR):
        app.mount("/assets", StaticFiles(directory=_ASSETS_DIR), name="spa-assets")

    @app.get("/{full_path:path}", include_in_schema=False)
    async def serve_spa(full_path: str):
        # Serve real files (favicon, manifest, etc.) if they exist
        candidate = os.path.join(_FRONTEND_DIST, full_path)
        if os.path.isfile(candidate):
            return FileResponse(candidate)
        # Fall back to index.html for all SPA routes
        return FileResponse(os.path.join(_FRONTEND_DIST, "index.html"))
