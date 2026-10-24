import pytest
from app.utils.security import is_valid_university_email, normalize_email


def test_university_domain_validation():
    """Verify exact domain matching and rejection of subdomain or postfix attack vectors."""
    assert is_valid_university_email("student@ahduni.edu.in") is True
    assert is_valid_university_email("FIRSTNAME.LASTNAME@AHDUNI.EDU.IN") is True
    assert is_valid_university_email("dean.office@ahduni.edu.in") is True

    # Attackers / outside domains must fail
    assert is_valid_university_email("student@gmail.com") is False
    assert is_valid_university_email("student@ahduni.edu.in.attacker.com") is False
    assert is_valid_university_email("student@sub.ahduni.edu.in") is False
    assert is_valid_university_email("student@ahduni.edu.in.org") is False
    assert is_valid_university_email("student@not-ahduni.edu.in") is False
    assert is_valid_university_email("plain-text") is False
    assert is_valid_university_email("@ahduni.edu.in") is False


@pytest.mark.asyncio
async def test_health_endpoint(async_client):
    """Test health check route."""
    response = await async_client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert data["allowed_email_domain"] == "ahduni.edu.in"


@pytest.mark.asyncio
async def test_auth_me_unauthenticated(async_client):
    """Unauthenticated users should return authenticated: False without 500 error."""
    response = await async_client.get("/api/auth/me")
    assert response.status_code == 200
    data = response.json()
    assert data["authenticated"] is False


@pytest.mark.asyncio
async def test_derived_name_from_email_prefix(async_client, authenticated_student):
    """Ensure student name is derived strictly from email prefix."""
    response = await async_client.get(
        "/api/auth/me",
        headers=authenticated_student["headers"]
    )
    assert response.status_code == 200
    data = response.json()
    assert data["authenticated"] is True
    # Email is aarav.patel@ahduni.edu.in -> derived name is aarav.patel
    assert data["name"] == "aarav.patel"


@pytest.mark.asyncio
async def test_auth_me_authenticated(async_client, authenticated_student):
    """Authenticated student /api/auth/me returns their verified profile."""
    response = await async_client.get(
        "/api/auth/me",
        cookies=authenticated_student["cookies"]
    )
    assert response.status_code == 200
    data = response.json()
    assert data["authenticated"] is True
    assert data["email"] == authenticated_student["email"]
    assert data["name"] == "aarav.patel"


@pytest.mark.asyncio
async def test_logout_clears_session(async_client, authenticated_student):
    """Logout invalidates cookie."""
    response = await async_client.post(
        "/api/auth/logout",
        cookies=authenticated_student["cookies"]
    )
    assert response.status_code == 200
    assert response.json()["success"] is True
