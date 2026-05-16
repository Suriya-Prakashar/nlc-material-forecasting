from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from app.api.upload import router as upload_router
import os

app = FastAPI(title="Material Demand Forecasting API")

# CORS: `allow_credentials=True` with `allow_origins=["*"]` is invalid for browsers — avoid that combo.
_default_origins = "http://localhost:5173,http://127.0.0.1:5173,http://localhost:3000,http://127.0.0.1:3000"
frontend_origin = os.getenv("FRONTEND_ORIGIN", _default_origins)
allowed_origins = [o.strip() for o in frontend_origin.split(",") if o.strip()]
if not allowed_origins:
    allowed_origins = ["http://localhost:5173"]
use_wildcard = len(allowed_origins) == 1 and allowed_origins[0] == "*"

# Configure CORS for frontend access
app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins if not use_wildcard else ["*"],
    allow_credentials=False if use_wildcard else True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Ensure upload directory exists
UPLOAD_DIR = "/tmp/uploads" if os.environ.get("VERCEL") else "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

# Include API routers
app.include_router(upload_router, prefix="/api")

@app.get("/health")
async def health():
    return {"status": "ok"}

# Mount frontend only if local build output exists.
frontend_dist = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "frontend", "dist"))
if os.path.isdir(frontend_dist):
    app.mount("/", StaticFiles(directory=frontend_dist, html=True), name="static")
