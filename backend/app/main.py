import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from app.config import settings
from app.database import connect_to_mongodb, close_mongodb_connection, client
from app.routes.auth import router as auth_router
from app.routes.students import router as students_router
from app.routes.challenges import router as challenges_router
from app.routes.leaderboard import router as leaderboard_router

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger("sanctum.app")


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Connect to MongoDB cluster
    logger.info("Starting Sanctum Library Focus Backend...")
    await connect_to_mongodb()
    yield
    # Shutdown: Close DB connections
    logger.info("Shutting down Sanctum Backend...")
    await close_mongodb_connection()


app = FastAPI(
    title="Sanctum — Ahmedabad University Library Focus API",
    description="Backend API for University Library Focus Challenge with server-authoritative scoring.",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS setup
origins = [settings.FRONTEND_ORIGIN] + settings.ADDITIONAL_ALLOWED_ORIGINS
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global error handler for unhandled exceptions
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled exception on {request.method} {request.url.path}: {exc}", exc_info=True)
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={"detail": "An internal server error occurred. Please try again shortly."}
    )


# Health check
@app.get("/api/health", tags=["Health"])
async def health_check():
    """Health check reporting server, environment, and MongoDB connection status."""
    db_connected = False
    if client:
        try:
            await client.admin.command("ping")
            db_connected = True
        except Exception:
            db_connected = False

    return {
        "status": "healthy",
        "app": "Sanctum Library Focus",
        "environment": settings.ENVIRONMENT,
        "database_connected": db_connected,
        "allowed_email_domain": settings.ALLOWED_EMAIL_DOMAIN,
    }


# Include routers
app.include_router(auth_router)
app.include_router(students_router)
app.include_router(challenges_router)
app.include_router(leaderboard_router)
