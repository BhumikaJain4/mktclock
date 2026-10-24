import pytest
from datetime import datetime, timezone, timedelta
from bson import ObjectId


@pytest.mark.asyncio
async def test_leaderboard_ordering_and_privacy(async_client, setup_test_db, authenticated_student):
    """
    Test leaderboard:
    1. Highest single attempt ranks #1.
    2. Student emails are not exposed.
    3. Tie-breaking prioritizes earlier achievement.
    """
    db = setup_test_db
    now = datetime.now(timezone.utc)

    # Insert 3 students with distinct scores and timestamps
    # Student A: 3600 seconds (1 hour)
    # Student B: 1800 seconds achieved earlier
    # Student C: 1800 seconds achieved later
    t_earlier = now - timedelta(hours=2)
    t_later = now - timedelta(hours=1)

    s_a = {
        "email": "alpha.patel@ahduni.edu.in",
        "name": "Alpha Patel",
        "best_score_seconds": 3600,
        "best_achieved_at": now,
        "created_at": now,
        "last_active_at": now,
    }
    s_b = {
        "email": "beta.shah@ahduni.edu.in",
        "name": "Beta Shah",
        "best_score_seconds": 1800,
        "best_achieved_at": t_earlier,
        "created_at": now,
        "last_active_at": now,
    }
    s_c = {
        "email": "charlie.desai@ahduni.edu.in",
        "name": "Charlie Desai",
        "best_score_seconds": 1800,
        "best_achieved_at": t_later,
        "created_at": now,
        "last_active_at": now,
    }

    res_a = await db.students.insert_one(s_a)
    res_b = await db.students.insert_one(s_b)
    res_c = await db.students.insert_one(s_c)

    res = await async_client.get("/api/leaderboard", cookies=authenticated_student["cookies"])
    assert res.status_code == 200
    data = res.json()
    assert data["total_students"] >= 3

    entries = data["entries"]
    # Check #1 is Alpha Patel (3600s)
    assert entries[0]["display_name"] == "Alpha Patel"
    assert entries[0]["best_score_seconds"] == 3600

    # Check tie-breaker between Beta and Charlie (both 1800s):
    # Beta achieved earlier, so Beta should rank ahead of Charlie
    names_ranked = [e["display_name"] for e in entries if e["best_score_seconds"] == 1800]
    assert names_ranked[0] == "Beta Shah"
    assert names_ranked[1] == "Charlie Desai"

    # PRIVACY CHECK: Ensure email address is NEVER present in any leaderboard entry
    for entry in entries:
        assert "email" not in entry
        assert "@" not in entry["display_name"]


@pytest.mark.asyncio
async def test_leaderboard_pagination(async_client, setup_test_db):
    """Verify pagination returns correct subset and total_pages."""
    db = setup_test_db
    now = datetime.now(timezone.utc)

    # Insert 5 test students
    for i in range(5):
        await db.students.insert_one({
            "email": f"student{i}@ahduni.edu.in",
            "name": f"Student {i}",
            "best_score_seconds": (i + 1) * 300,
            "best_achieved_at": now,
            "created_at": now,
            "last_active_at": now,
        })

    # Page 1 with page_size=2
    res_p1 = await async_client.get("/api/leaderboard?page=1&page_size=2")
    assert res_p1.status_code == 200
    data_p1 = res_p1.json()
    assert len(data_p1["entries"]) == 2
    assert data_p1["page"] == 1
    assert data_p1["total_students"] == 5
    assert data_p1["total_pages"] == 3

    # Page 2 with page_size=2
    res_p2 = await async_client.get("/api/leaderboard?page=2&page_size=2")
    assert res_p2.status_code == 200
    data_p2 = res_p2.json()
    assert len(data_p2["entries"]) == 2
    assert data_p2["page"] == 2
    # Ensure distinct entries from page 1
    assert data_p1["entries"][0]["student_id"] != data_p2["entries"][0]["student_id"]


@pytest.mark.asyncio
async def test_user_scenario_single_highest_attempt_ranking(async_client, setup_test_db, authenticated_student):
    """
    Test exact prompt requirement:
    Student A: attempts 30 min, 20 min, 1 hour -> best: 60 min (3600s)
    Student B: attempts 45 min, 25 min, 35 min -> best: 45 min (2700s)
    Student C: attempts 20 min, 28 min, 15 min -> best: 28 min (1680s)
    Student D: attempts 1 hour, 30 min, 2 hours -> best: 120 min (7200s)

    Expected Rankings:
    1st: Student D (120 min)
    2nd: Student A (60 min)
    3rd: Student B (45 min)
    4th: Student C (28 min)
    """
    db = setup_test_db
    now = datetime.now(timezone.utc)

    students_data = [
        # Student A: Best attempt 60 min
        {"email": "student.a@ahduni.edu.in", "name": "Student A", "best_score_seconds": 60 * 60, "best_achieved_at": now - timedelta(hours=3)},
        # Student B: Best attempt 45 min
        {"email": "student.b@ahduni.edu.in", "name": "Student B", "best_score_seconds": 45 * 60, "best_achieved_at": now - timedelta(hours=2)},
        # Student C: Best attempt 28 min
        {"email": "student.c@ahduni.edu.in", "name": "Student C", "best_score_seconds": 28 * 60, "best_achieved_at": now - timedelta(hours=1)},
        # Student D: Best attempt 120 min
        {"email": "student.d@ahduni.edu.in", "name": "Student D", "best_score_seconds": 120 * 60, "best_achieved_at": now},
    ]

    for s in students_data:
        s["created_at"] = now
        s["last_active_at"] = now
        await db.students.insert_one(s)

    res = await async_client.get("/api/leaderboard", cookies=authenticated_student["cookies"])
    assert res.status_code == 200
    data = res.json()

    # Filter to our four students
    our_entries = [e for e in data["entries"] if e["display_name"] in ["Student A", "Student B", "Student C", "Student D"]]
    assert len(our_entries) == 4

    # Check order: D, A, B, C
    assert our_entries[0]["display_name"] == "Student D"
    assert our_entries[0]["best_score_seconds"] == 7200

    assert our_entries[1]["display_name"] == "Student A"
    assert our_entries[1]["best_score_seconds"] == 3600

    assert our_entries[2]["display_name"] == "Student B"
    assert our_entries[2]["best_score_seconds"] == 2700

    assert our_entries[3]["display_name"] == "Student C"
    assert our_entries[3]["best_score_seconds"] == 1680

    # Ensure no email exposed
    for e in our_entries:
        assert "@" not in e["display_name"]
        assert "email" not in e
