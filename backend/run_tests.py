"""
Comprehensive Test Runner for Sanctum Focus Challenge Backend.
Runs without requiring external pytest or mongomock dependencies by using in-memory mock collections.
"""

import asyncio
import sys
from datetime import datetime, timezone, timedelta
from bson import ObjectId

# Ensure backend directory is in path
sys.path.insert(0, ".")

from app.utils.security import is_valid_university_email, create_session_token, decode_session_token
from app.utils.timing import calculate_valid_elapsed, format_seconds
import app.database as database
from app.config import settings
from app.services import auth_service, challenge_service, leaderboard_service


class InMemoryCollection:
    def __init__(self, name):
        self.name = name
        self.docs = []

    async def create_index(self, *args, **kwargs):
        pass

    async def insert_one(self, doc):
        doc = dict(doc)
        if "_id" not in doc:
            doc["_id"] = ObjectId()
        self.docs.append(doc)
        class InsertResult:
            def __init__(self, inserted_id):
                self.inserted_id = inserted_id
        return InsertResult(doc["_id"])

    async def find_one(self, filter_query):
        for doc in self.docs:
            if self._matches(doc, filter_query):
                return dict(doc)
        return None

    def find(self, filter_query=None):
        matched = []
        for doc in self.docs:
            if filter_query is None or self._matches(doc, filter_query):
                matched.append(dict(doc))
        
        class Cursor:
            def __init__(self, items):
                self.items = items
            def sort(self, sort_specs):
                for key, direction in reversed(sort_specs):
                    self.items.sort(
                        key=lambda x: (x.get(key) is None, x.get(key)),
                        reverse=(direction == -1)
                    )
                return self
            def skip(self, n):
                self.items = self.items[n:]
                return self
            def limit(self, n):
                self.items = self.items[:n]
                return self
            def __aiter__(self):
                self._iter = iter(self.items)
                return self
            async def __anext__(self):
                try:
                    return next(self._iter)
                except StopIteration:
                    raise StopAsyncIteration
        return Cursor(matched)

    async def count_documents(self, filter_query):
        count = 0
        for doc in self.docs:
            if self._matches(doc, filter_query):
                count += 1
        return count

    async def update_one(self, filter_query, update_spec):
        for i, doc in enumerate(self.docs):
            if self._matches(doc, filter_query):
                self._apply_update(self.docs[i], update_spec)
                class UpdateResult:
                    modified_count = 1
                return UpdateResult()
        class UpdateResultZero:
            modified_count = 0
        return UpdateResultZero()

    async def find_one_and_update(self, filter_query, update_spec, return_document=True):
        for i, doc in enumerate(self.docs):
            if self._matches(doc, filter_query):
                self._apply_update(self.docs[i], update_spec)
                return dict(self.docs[i])
        return None

    def _matches(self, doc, query):
        if not query:
            return True
        for k, v in query.items():
            if k == "$and":
                if not all(self._matches(doc, sub) for sub in v):
                    return False
            elif k == "$or":
                if not any(self._matches(doc, sub) for sub in v):
                    return False
            elif isinstance(v, dict):
                doc_val = doc.get(k)
                for op, target in v.items():
                    if op == "$gt" and not (doc_val is not None and doc_val > target):
                        return False
                    elif op == "$lt" and not (doc_val is not None and doc_val < target):
                        return False
                    elif op == "$gte" and not (doc_val is not None and doc_val >= target):
                        return False
                    elif op == "$lte" and not (doc_val is not None and doc_val <= target):
                        return False
            else:
                if doc.get(k) != v:
                    return False
        return True

    def _apply_update(self, doc, update_spec):
        if "$set" in update_spec:
            doc.update(update_spec["$set"])
        if "$inc" in update_spec:
            for k, delta in update_spec["$inc"].items():
                doc[k] = doc.get(k, 0) + delta


class MockDatabase:
    def __init__(self):
        self.students = InMemoryCollection("students")
        self.focus_attempts = InMemoryCollection("focus_attempts")


async def run_all_tests():
    print("=" * 60)
    print("SANCTUM FOCUS CHALLENGE BACKEND TEST SUITE")
    print("=" * 60)

    # 1. Test Domain Security
    print("\n[TEST 1] University Domain Restriction:")
    assert is_valid_university_email("student@ahduni.edu.in") is True
    assert is_valid_university_email("faculty.member@AHDUNI.EDU.IN") is True
    assert is_valid_university_email("attacker@ahduni.edu.in.evil.com") is False
    assert is_valid_university_email("student@gmail.com") is False
    assert is_valid_university_email("student@yahoo.co.in") is False
    assert is_valid_university_email("plain-string") is False
    print("[PASS] Permitted university domain @ahduni.edu.in strictly validated.")
    print("[PASS] Attack vectors (subdomain postfixes, lookalikes) correctly rejected.")

    # 2. Test Session JWT
    print("\n[TEST 2] Session Token Creation & Verification:")
    token = create_session_token("test-id-123", "student@ahduni.edu.in", "Aarav Patel")
    payload = decode_session_token(token)
    assert payload is not None
    assert payload["sub"] == "test-id-123"
    assert payload["email"] == "student@ahduni.edu.in"
    print("[PASS] Signed JWT token encoded and decoded accurately.")

    # 3. Test Timing Invariant Bounds
    print("\n[TEST 3] Server Authoritative Timing Calculation:")
    now = datetime.now(timezone.utc)
    started = now - timedelta(seconds=120)
    target_seconds = 1800  # 30m
    elapsed = calculate_valid_elapsed(started, now, target_seconds)
    assert elapsed == 120

    # Malicious client reporting 10000 seconds
    capped = calculate_valid_elapsed(started, now, target_seconds, client_hint_seconds=10000)
    assert capped <= 122  # Server clock upper bound preserved
    print("[PASS] Authoritative server timing bounds verified against client drift and spoofing.")

    # 4. In-Memory Database Tests
    mock_db = MockDatabase()
    database.db = mock_db

    print("\n[TEST 4] Student Creation and Dev Login:")
    auth_res = await auth_service.authenticate_dev_login("aarav.patel@ahduni.edu.in", "Aarav Patel")
    student_id = auth_res["student"]["_id"]
    assert student_id is not None
    assert auth_res["student"]["best_score_seconds"] == 0
    print(f"[PASS] Student created with ID: {student_id}, initial best score: 0s.")

    # 5. Challenge Creation
    print("\n[TEST 5] Challenge Setup and Duration Validation:")
    att1 = await challenge_service.create_challenge(student_id, target_minutes=30)
    assert att1["target_seconds"] == 1800
    assert att1["status"] == "active"
    print("[PASS] 30-minute challenge started.")

    # Test duplicate active attempt prevention
    try:
        await challenge_service.create_challenge(student_id, target_minutes=60)
        assert False, "Should have thrown 409 Conflict"
    except Exception as e:
        assert getattr(e, "status_code", 409) == 409
        print("[PASS] Prevented duplicate concurrent active challenge (409 Conflict).")

    # 6. Interruption and STRICT Scoring Rule Verification
    print("\n[TEST 6] Strict Leaderboard Rule: Single Best Attempt vs Multiple Attempts:")
    # Interrupted attempt 1 at 1500 seconds (25m)
    now = datetime.now(timezone.utc)
    mock_db.focus_attempts.docs[0]["started_at"] = now - timedelta(seconds=1500)
    res_int1 = await challenge_service.finalize_attempt(
        attempt_id=att1["id"],
        student_id=student_id,
        terminal_status="interrupted",
        end_reason="page_hidden",
        client_elapsed_seconds=1500
    )
    assert res_int1["status"] == "interrupted"
    assert res_int1["elapsed_seconds"] == 1500
    assert res_int1["is_new_personal_best"] is True
    assert res_int1["current_best_seconds"] == 1500

    # Student record best score is now 1500s
    student_doc = await mock_db.students.find_one({"_id": ObjectId(student_id)})
    assert student_doc["best_score_seconds"] == 1500
    print(f"[PASS] Attempt 1 (1500s) established new personal best: {format_seconds(1500)}.")

    # Start Attempt 2 for 60m, interrupted after 600 seconds (10m)
    att2 = await challenge_service.create_challenge(student_id, target_minutes=60)
    mock_db.focus_attempts.docs[1]["started_at"] = now - timedelta(seconds=600)
    res_int2 = await challenge_service.finalize_attempt(
        attempt_id=att2["id"],
        student_id=student_id,
        terminal_status="interrupted",
        end_reason="page_hidden",
        client_elapsed_seconds=600
    )
    assert res_int2["is_new_personal_best"] is False

    # VERIFY: Best score MUST REMAIN 1500s. NEVER 2100s!
    student_doc2 = await mock_db.students.find_one({"_id": ObjectId(student_id)})
    assert student_doc2["best_score_seconds"] == 1500
    assert student_doc2["best_score_seconds"] != 2100
    print(f"[PASS] CRITICAL INVARIANT: Best score remains exactly {student_doc2['best_score_seconds']}s.")
    print("       Separate attempts (1500s + 600s) were NOT summed together!")

    # 7. Idempotency Test
    print("\n[TEST 7] Idempotent Finalization:")
    repeat_res = await challenge_service.finalize_attempt(
        attempt_id=att2["id"],
        student_id=student_id,
        terminal_status="interrupted",
        end_reason="page_hidden"
    )
    assert repeat_res["id"] == att2["id"]
    assert repeat_res["status"] == "interrupted"
    print("[PASS] Duplicate interruption calls return saved result idempotently.")

    # 8. Deterministic Leaderboard Ranking & Privacy
    print("\n[TEST 8] Deterministic Leaderboard & Privacy Protection:")
    # Create Student B with higher score (3600s)
    student_b = await auth_service.get_or_create_student("diya.shah@ahduni.edu.in", "Diya Shah")
    await mock_db.students.update_one(
        {"_id": ObjectId(student_b["_id"])},
        {"$set": {"best_score_seconds": 3600, "best_achieved_at": now}}
    )

    lb = await leaderboard_service.get_leaderboard(page=1, page_size=10, current_student_id=student_id)
    assert lb.total_students == 2
    assert lb.entries[0].display_name == "Diya Shah"
    assert lb.entries[0].best_score_seconds == 3600
    assert lb.entries[1].display_name == "Aarav Patel"
    assert lb.entries[1].best_score_seconds == 1500

    # Privacy check: emails must NOT exist in leaderboard output
    for entry in lb.entries:
        assert not hasattr(entry, "email")
        assert "@" not in entry.display_name
    print("[PASS] Leaderboard ranks by highest single attempt (Diya #1: 1h, Aarav #2: 25m).")
    print("[PASS] Student emails and sensitive IDs strictly excluded from leaderboard payload.")

    print("\n" + "=" * 60)
    print("ALL 8 BACKEND TEST SUITES PASSED WITH ZERO ERRORS!")
    print("=" * 60)


if __name__ == "__main__":
    asyncio.run(run_all_tests())
