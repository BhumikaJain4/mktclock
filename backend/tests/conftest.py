import pytest
import pytest_asyncio
from mongomock_motor import AsyncMongoMockClient
from httpx import AsyncClient, ASGITransport
import app.database as database
from app.main import app
from app.config import settings
from app.utils.security import create_session_token

# Set testing environment
settings.ENVIRONMENT = "testing"
settings.DEV_AUTH_ENABLED = True


@pytest_asyncio.fixture(autouse=True)
async def setup_test_db(monkeypatch):
    """Provide isolated in-memory AsyncMongoMockClient database for each test."""
    mock_client = AsyncMongoMockClient()
    mock_db = mock_client[settings.MONGODB_DB_NAME]
    monkeypatch.setattr(database, "client", mock_client)
    monkeypatch.setattr(database, "db", mock_db)
    yield mock_db
    mock_client.close()


@pytest_asyncio.fixture
async def async_client():
    """Async HTTP test client for FastAPI."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://testserver") as client:
        yield client


@pytest_asyncio.fixture
async def authenticated_student(setup_test_db):
    """Seed test student and provide session token and cookie."""
    db = setup_test_db
    student = {
        "email": "aarav.patel@ahduni.edu.in",
        "name": "Aarav Patel",
        "picture": "https://lh3.googleusercontent.com/test-pic",
        "best_score_seconds": 0,
        "best_attempt_id": None,
        "best_achieved_at": None,
        "completed_challenges_count": 0,
        "total_attempts_count": 0,
        "created_at": database.utc_now() if hasattr(database, "utc_now") else None,
        "last_active_at": database.utc_now() if hasattr(database, "utc_now") else None,
    }
    from datetime import datetime, timezone
    now = datetime.now(timezone.utc)
    student["created_at"] = now
    student["last_active_at"] = now
    res = await db.students.insert_one(student)
    student_id = str(res.inserted_id)

    token = create_session_token(
        student_id=student_id,
        email="aarav.patel@ahduni.edu.in",
        name="Aarav Patel"
    )
    return {
        "id": student_id,
        "email": "aarav.patel@ahduni.edu.in",
        "name": "Aarav Patel",
        "token": token,
        "cookies": {settings.SESSION_COOKIE_NAME: token},
        "headers": {"Authorization": f"Bearer {token}"}
    }


@pytest_asyncio.fixture
async def second_student(setup_test_db):
    """Seed second student for permission and leaderboard tests."""
    db = setup_test_db
    from datetime import datetime, timezone
    now = datetime.now(timezone.utc)
    student = {
        "email": "diya.shah@ahduni.edu.in",
        "name": "Diya Shah",
        "picture": None,
        "best_score_seconds": 1800,
        "best_attempt_id": "mock_id",
        "best_achieved_at": now,
        "completed_challenges_count": 1,
        "total_attempts_count": 1,
        "created_at": now,
        "last_active_at": now,
    }
    res = await db.students.insert_one(student)
    student_id = str(res.inserted_id)
    token = create_session_token(
        student_id=student_id,
        email="diya.shah@ahduni.edu.in",
        name="Diya Shah"
    )
    return {
        "id": student_id,
        "email": "diya.shah@ahduni.edu.in",
        "name": "Diya Shah",
        "token": token,
        "cookies": {settings.SESSION_COOKIE_NAME: token},
    }
