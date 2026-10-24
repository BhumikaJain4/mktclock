import pytest
from datetime import datetime, timezone, timedelta
from app.utils.timing import calculate_valid_elapsed


def test_calculate_valid_elapsed_bounds():
    """Verify timing boundaries and client-hint protection."""
    now = datetime.now(timezone.utc)
    started = now - timedelta(seconds=120)
    target_seconds = 1800  # 30 mins

    # Server elapsed is 120 seconds
    elapsed = calculate_valid_elapsed(started, now, target_seconds)
    assert elapsed == 120

    # If client claims 5000 seconds, server caps it to real server elapsed
    sneaky_client_elapsed = 5000
    elapsed_capped = calculate_valid_elapsed(started, now, target_seconds, client_hint_seconds=sneaky_client_elapsed)
    assert elapsed_capped <= 122  # Within 2s network grace period

    # Never exceeds target_seconds
    way_past = now + timedelta(seconds=4000)
    elapsed_max = calculate_valid_elapsed(started, way_past, target_seconds)
    assert elapsed_max == target_seconds


@pytest.mark.asyncio
async def test_start_challenge_success(async_client, authenticated_student):
    """Student can start a valid challenge with preset or custom duration."""
    response = await async_client.post(
        "/api/challenges",
        json={"target_minutes": 30},
        cookies=authenticated_student["cookies"]
    )
    assert response.status_code == 201
    data = response.json()
    assert data["target_seconds"] == 1800
    assert data["status"] == "active"
    assert "id" in data


@pytest.mark.asyncio
async def test_start_challenge_invalid_duration(async_client, authenticated_student):
    """Duration outside 1-240 minutes is rejected with 400."""
    # Under 1 min
    res_low = await async_client.post(
        "/api/challenges",
        json={"target_minutes": 0},
        cookies=authenticated_student["cookies"]
    )
    assert res_low.status_code == 422 or res_low.status_code == 400

    # Over 240 mins (4 hours)
    res_high = await async_client.post(
        "/api/challenges",
        json={"target_minutes": 250},
        cookies=authenticated_student["cookies"]
    )
    assert res_high.status_code == 422 or res_high.status_code == 400


@pytest.mark.asyncio
async def test_duplicate_active_challenge_rejected(async_client, authenticated_student):
    """Starting a second challenge while one is active returns 409 Conflict."""
    res1 = await async_client.post(
        "/api/challenges",
        json={"target_minutes": 30},
        cookies=authenticated_student["cookies"]
    )
    assert res1.status_code == 201

    res2 = await async_client.post(
        "/api/challenges",
        json={"target_minutes": 60},
        cookies=authenticated_student["cookies"]
    )
    assert res2.status_code == 409
    assert "already have an active challenge" in res2.json()["detail"]


@pytest.mark.asyncio
async def test_interrupted_attempt_and_single_best_scoring(async_client, authenticated_student, setup_test_db):
    """
    STRICT RULE TEST:
    1. Student starts 60m challenge.
    2. Interrupted after 25 minutes (1500s). Score becomes 1500s.
    3. Student starts another challenge, interrupted after 10 minutes (600s).
    4. Score MUST REMAIN 1500s (NEVER summed to 2100s!).
    """
    db = setup_test_db

    # 1. Start 60m challenge
    res1 = await async_client.post(
        "/api/challenges",
        json={"target_minutes": 60},
        cookies=authenticated_student["cookies"]
    )
    attempt1_id = res1.json()["id"]

    # Fast forward start time by 25 mins (1500s)
    from bson import ObjectId
    past_25m = datetime.now(timezone.utc) - timedelta(seconds=1500)
    await db.focus_attempts.update_one(
        {"_id": ObjectId(attempt1_id)},
        {"$set": {"started_at": past_25m}}
    )

    # Interrupt attempt 1
    int_res1 = await async_client.post(
        f"/api/challenges/{attempt1_id}/interrupt",
        json={"reason": "page_hidden", "client_elapsed_seconds": 1500},
        cookies=authenticated_student["cookies"]
    )
    assert int_res1.status_code == 200
    data1 = int_res1.json()
    assert data1["status"] == "interrupted"
    assert data1["elapsed_seconds"] >= 1500
    assert data1["is_new_personal_best"] is True
    assert data1["current_best_seconds"] >= 1500

    # Verify student record has best_score_seconds == 1500
    st_res1 = await async_client.get("/api/students/me", cookies=authenticated_student["cookies"])
    assert st_res1.json()["best_score_seconds"] >= 1500
    first_best = st_res1.json()["best_score_seconds"]

    # 2. Start second challenge for 30m
    res2 = await async_client.post(
        "/api/challenges",
        json={"target_minutes": 30},
        cookies=authenticated_student["cookies"]
    )
    attempt2_id = res2.json()["id"]

    # Fast forward start time by 10 mins (600s)
    past_10m = datetime.now(timezone.utc) - timedelta(seconds=600)
    await db.focus_attempts.update_one(
        {"_id": ObjectId(attempt2_id)},
        {"$set": {"started_at": past_10m}}
    )

    # Interrupt attempt 2
    int_res2 = await async_client.post(
        f"/api/challenges/{attempt2_id}/interrupt",
        json={"reason": "page_hidden", "client_elapsed_seconds": 600},
        cookies=authenticated_student["cookies"]
    )
    assert int_res2.status_code == 200
    data2 = int_res2.json()
    assert data2["is_new_personal_best"] is False

    # Check student profile: BEST SCORE MUST REMAIN 1500! Separate attempts are NEVER summed!
    st_res2 = await async_client.get("/api/students/me", cookies=authenticated_student["cookies"])
    assert st_res2.json()["best_score_seconds"] == first_best
    assert st_res2.json()["best_score_seconds"] != first_best + 600


@pytest.mark.asyncio
async def test_attempt_ownership_protection(async_client, authenticated_student, second_student):
    """Students cannot modify or interrupt each other's attempts."""
    # Student 1 creates challenge
    res = await async_client.post(
        "/api/challenges",
        json={"target_minutes": 30},
        cookies=authenticated_student["cookies"]
    )
    attempt_id = res.json()["id"]

    # Student 2 attempts to interrupt student 1's challenge
    attack_res = await async_client.post(
        f"/api/challenges/{attempt_id}/interrupt",
        json={"reason": "malicious"},
        cookies=second_student["cookies"]
    )
    assert attack_res.status_code == 403


@pytest.mark.asyncio
async def test_idempotent_interruption(async_client, authenticated_student):
    """Calling interrupt multiple times returns the same saved result without error."""
    res = await async_client.post(
        "/api/challenges",
        json={"target_minutes": 30},
        cookies=authenticated_student["cookies"]
    )
    attempt_id = res.json()["id"]

    int1 = await async_client.post(
        f"/api/challenges/{attempt_id}/interrupt",
        json={"reason": "page_hidden"},
        cookies=authenticated_student["cookies"]
    )
    assert int1.status_code == 200

    int2 = await async_client.post(
        f"/api/challenges/{attempt_id}/interrupt",
        json={"reason": "page_hidden"},
        cookies=authenticated_student["cookies"]
    )
    assert int2.status_code == 200
    assert int2.json()["id"] == int1.json()["id"]
    assert int2.json()["status"] == "interrupted"
