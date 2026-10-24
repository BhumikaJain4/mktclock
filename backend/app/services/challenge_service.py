import logging
from datetime import datetime, timezone
from typing import Optional, Dict, Any, Tuple
from bson import ObjectId
from fastapi import HTTPException, status
from app.database import get_database
from app.utils.timing import utc_now, calculate_valid_elapsed
from app.schemas.challenge import ChallengeResponse

logger = logging.getLogger("sanctum.challenges")


def ensure_utc(dt: Optional[datetime]) -> Optional[datetime]:
    if dt is None:
        return None
    if dt.tzinfo is None:
        return dt.replace(tzinfo=timezone.utc)
    return dt


def safe_object_id(id_str: str) -> ObjectId:
    try:
        return ObjectId(id_str)
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid attempt ID format.",
        )


async def create_challenge(student_id: str, target_minutes: int) -> Dict[str, Any]:
    """Create a new focus challenge attempt for the authenticated student."""
    if target_minutes < 1 or target_minutes > 240:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Target duration must be between 1 and 240 minutes.",
        )

    db = get_database()
    student_oid = safe_object_id(student_id)

    # Check for existing active attempt
    existing_active = await db.focus_attempts.find_one({
        "student_id": str(student_oid),
        "status": "active"
    })

    now = utc_now()

    if existing_active:
        # Check if it was abandoned (started long ago without heartbeat)
        started = ensure_utc(existing_active["started_at"])
        target_sec = existing_active["target_seconds"]
        elapsed = int((now - started).total_seconds())
        if elapsed > target_sec + 600:
            # Auto-abandon hanging attempt so student isn't permanently locked out
            await db.focus_attempts.update_one(
                {"_id": existing_active["_id"]},
                {"$set": {
                    "status": "abandoned",
                    "ended_at": now,
                    "end_reason": "recovered_after_disconnect",
                    "updated_at": now,
                }}
            )
        else:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="You already have an active challenge in progress. Complete or end it before starting a new one.",
            )

    target_seconds = target_minutes * 60
    new_attempt = {
        "student_id": str(student_oid),
        "target_seconds": target_seconds,
        "started_at": now,
        "ended_at": None,
        "last_heartbeat_at": now,
        "elapsed_seconds": 0,
        "status": "active",
        "end_reason": None,
        "created_at": now,
        "updated_at": now,
    }

    result = await db.focus_attempts.insert_one(new_attempt)
    new_attempt["_id"] = str(result.inserted_id)

    # Increment total attempts
    await db.students.update_one(
        {"_id": student_oid},
        {"$inc": {"total_attempts_count": 1}, "$set": {"last_active_at": now}}
    )

    student = await db.students.find_one({"_id": student_oid})
    current_best = student.get("best_score_seconds", 0) if student else 0

    return {
        "id": new_attempt["_id"],
        "student_id": str(student_oid),
        "target_seconds": target_seconds,
        "started_at": now,
        "ended_at": None,
        "elapsed_seconds": 0,
        "status": "active",
        "end_reason": None,
        "is_new_personal_best": False,
        "previous_best_seconds": current_best,
        "current_best_seconds": current_best,
        "user_rank": None,
    }


async def get_active_challenge(student_id: str) -> Optional[Dict[str, Any]]:
    """Retrieve current active attempt for the student, if one exists."""
    db = get_database()
    student_oid = safe_object_id(student_id)

    attempt = await db.focus_attempts.find_one({
        "student_id": str(student_oid),
        "status": "active"
    })
    if not attempt:
        return None

    now = utc_now()
    started_at = ensure_utc(attempt["started_at"])
    target_seconds = attempt["target_seconds"]

    # Calculate real elapsed so far
    current_elapsed = min(int((now - started_at).total_seconds()), target_seconds)

    student = await db.students.find_one({"_id": student_oid})
    current_best = student.get("best_score_seconds", 0) if student else 0

    return {
        "id": str(attempt["_id"]),
        "student_id": str(student_oid),
        "target_seconds": target_seconds,
        "started_at": started_at,
        "ended_at": None,
        "elapsed_seconds": current_elapsed,
        "status": attempt["status"],
        "end_reason": None,
        "is_new_personal_best": current_elapsed > current_best,
        "previous_best_seconds": current_best,
        "current_best_seconds": max(current_best, current_elapsed),
        "user_rank": None,
    }


async def record_heartbeat(attempt_id: str, student_id: str, client_elapsed_seconds: Optional[int] = None) -> Dict[str, Any]:
    """Periodic persistence for active attempt to prevent data loss on crashes."""
    db = get_database()
    attempt_oid = safe_object_id(attempt_id)
    student_oid = safe_object_id(student_id)

    attempt = await db.focus_attempts.find_one({"_id": attempt_oid})
    if not attempt:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Attempt not found.")

    if attempt["student_id"] != str(student_oid):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Unauthorized access to attempt.")

    if attempt["status"] != "active":
        return {
            "id": str(attempt["_id"]),
            "status": attempt["status"],
            "elapsed_seconds": attempt.get("elapsed_seconds", 0),
            "message": "Attempt already finalized."
        }

    now = utc_now()
    server_elapsed = calculate_valid_elapsed(
        started_at=attempt["started_at"],
        ended_at=now,
        target_seconds=attempt["target_seconds"],
        client_hint_seconds=client_elapsed_seconds or 0,
    )

    await db.focus_attempts.update_one(
        {"_id": attempt_oid, "status": "active"},
        {"$set": {
            "last_heartbeat_at": now,
            "elapsed_seconds": server_elapsed,
            "updated_at": now,
        }}
    )

    return {
        "id": str(attempt["_id"]),
        "status": "active",
        "elapsed_seconds": server_elapsed,
    }


async def finalize_attempt(
    attempt_id: str,
    student_id: str,
    terminal_status: str,
    end_reason: str,
    client_elapsed_seconds: Optional[int] = None,
) -> Dict[str, Any]:
    """
    Atomically finalize an attempt as 'completed', 'interrupted', or 'manual_end'.
    Strict scoring: Updates student's best score ONLY if this attempt exceeds their previous best.
    Never sums or averages separate attempts.
    Idempotent: if already finalized, returns the saved result.
    """
    db = get_database()
    attempt_oid = safe_object_id(attempt_id)
    student_oid = safe_object_id(student_id)

    attempt = await db.focus_attempts.find_one({"_id": attempt_oid})
    if not attempt:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Attempt not found.")

    if attempt["student_id"] != str(student_oid):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Unauthorized access to attempt.")

    student = await db.students.find_one({"_id": student_oid})
    if not student:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Student not found.")

    previous_best = student.get("best_score_seconds", 0)

    # Check idempotency: If already finalized in terminal state, return existing record
    if attempt["status"] in ("completed", "interrupted", "abandoned"):
        saved_elapsed = attempt.get("elapsed_seconds", 0)
        return {
            "id": str(attempt["_id"]),
            "student_id": str(student_oid),
            "target_seconds": attempt["target_seconds"],
            "started_at": attempt["started_at"],
            "ended_at": attempt.get("ended_at", attempt["updated_at"]),
            "elapsed_seconds": saved_elapsed,
            "status": attempt["status"],
            "end_reason": attempt.get("end_reason"),
            "is_new_personal_best": saved_elapsed > previous_best,
            "previous_best_seconds": previous_best,
            "current_best_seconds": max(previous_best, saved_elapsed),
            "user_rank": None,
        }

    now = utc_now()
    started_at = attempt["started_at"]
    target_seconds = attempt["target_seconds"]

    # Calculate authoritative elapsed seconds
    if terminal_status == "completed":
        # Must have completed duration; server checks that duration elapsed
        raw_server_seconds = int((now - started_at).total_seconds())
        # Tolerance of 3 seconds for clock slight variances
        if raw_server_seconds + 3 < target_seconds:
            # Cannot complete before target duration has passed
            terminal_status = "interrupted"
            end_reason = "early_completion_rejected"
            final_elapsed = calculate_valid_elapsed(started_at, now, target_seconds, client_elapsed_seconds or 0)
        else:
            final_elapsed = target_seconds
    else:
        # Interrupted or manual end
        final_elapsed = calculate_valid_elapsed(started_at, now, target_seconds, client_elapsed_seconds or 0)

    # Atomic conditional update of attempt from 'active' to terminal status
    update_res = await db.focus_attempts.find_one_and_update(
        {"_id": attempt_oid, "status": "active"},
        {"$set": {
            "status": terminal_status,
            "end_reason": end_reason,
            "ended_at": now,
            "elapsed_seconds": final_elapsed,
            "updated_at": now,
        }},
        return_document=True
    )

    if not update_res:
        # Another request won the race; fetch updated attempt
        attempt = await db.focus_attempts.find_one({"_id": attempt_oid})
        final_elapsed = attempt.get("elapsed_seconds", 0)
        terminal_status = attempt["status"]
        end_reason = attempt.get("end_reason")

    # ATOMIC BEST SCORE UPDATE:
    # Rule: Replace student's leaderboard score ONLY if final_elapsed > previous_best.
    # NEVER sum attempts!
    is_new_personal_best = False
    current_best = previous_best

    if final_elapsed > previous_best:
        score_update = await db.students.update_one(
            {
                "_id": student_oid,
                "best_score_seconds": {"$lt": final_elapsed}
            },
            {"$set": {
                "best_score_seconds": final_elapsed,
                "best_attempt_id": str(attempt_oid),
                "best_achieved_at": now,
                "updated_at": now,
                "last_active_at": now,
            }}
        )
        if score_update.modified_count > 0:
            is_new_personal_best = True
            current_best = final_elapsed
    else:
        await db.students.update_one(
            {"_id": student_oid},
            {"$set": {"last_active_at": now}}
        )

    # If completed, increment completed count
    if terminal_status == "completed":
        await db.students.update_one(
            {"_id": student_oid},
            {"$inc": {"completed_challenges_count": 1}}
        )

    return {
        "id": str(attempt_oid),
        "student_id": str(student_oid),
        "target_seconds": target_seconds,
        "started_at": started_at,
        "ended_at": now,
        "elapsed_seconds": final_elapsed,
        "status": terminal_status,
        "end_reason": end_reason,
        "is_new_personal_best": is_new_personal_best,
        "previous_best_seconds": previous_best,
        "current_best_seconds": current_best,
        "user_rank": None,
    }


async def get_student_attempts(student_id: str, limit: int = 50) -> list:
    """Retrieve attempt history for student, newest first."""
    db = get_database()
    student_oid = safe_object_id(student_id)
    cursor = db.focus_attempts.find({"student_id": str(student_oid)}).sort("created_at", -1).limit(limit)
    attempts = []
    async for doc in cursor:
        doc["id"] = str(doc["_id"])
        del doc["_id"]
        attempts.append(doc)
    return attempts
