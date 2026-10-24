from fastapi import APIRouter, Depends, HTTPException, status
from bson import ObjectId
from app.database import get_database
from app.utils.security import get_current_student_session
from app.schemas.challenge import (
    CreateChallengeRequest,
    HeartbeatRequest,
    InterruptChallengeRequest,
    CompleteChallengeRequest,
    EndChallengeRequest,
    ChallengeResponse,
)
from app.services.challenge_service import (
    create_challenge,
    get_active_challenge,
    record_heartbeat,
    finalize_attempt,
)
from app.services.leaderboard_service import get_student_rank

router = APIRouter(prefix="/api/challenges", tags=["Challenges"])


@router.post("", response_model=ChallengeResponse, status_code=status.HTTP_201_CREATED)
async def start_challenge(
    request: CreateChallengeRequest,
    session: dict = Depends(get_current_student_session)
):
    """Start a new focus challenge session with a selected duration."""
    student_id = session["sub"]
    result = await create_challenge(
        student_id=student_id,
        target_minutes=request.target_minutes
    )
    return result


@router.get("/active")
async def get_active(session: dict = Depends(get_current_student_session)):
    """Retrieve the student's current active challenge attempt if in progress."""
    student_id = session["sub"]
    active = await get_active_challenge(student_id=student_id)
    return {"active": active}


@router.post("/{attempt_id}/heartbeat")
async def heartbeat(
    attempt_id: str,
    request: HeartbeatRequest,
    session: dict = Depends(get_current_student_session)
):
    """Periodic persistence for active attempts."""
    student_id = session["sub"]
    result = await record_heartbeat(
        attempt_id=attempt_id,
        student_id=student_id,
        client_elapsed_seconds=request.client_elapsed_seconds
    )
    return result


@router.post("/{attempt_id}/interrupt", response_model=ChallengeResponse)
async def interrupt(
    attempt_id: str,
    request: InterruptChallengeRequest,
    session: dict = Depends(get_current_student_session)
):
    """
    Called when the browser Page Visibility API reports page became hidden
    (e.g., student left the page, locked phone, minimized, or switched apps).
    Immediately ends the attempt and records valid elapsed focus duration.
    """
    student_id = session["sub"]
    result = await finalize_attempt(
        attempt_id=attempt_id,
        student_id=student_id,
        terminal_status="interrupted",
        end_reason=request.reason or "page_hidden",
        client_elapsed_seconds=request.client_elapsed_seconds
    )
    # Include updated rank if available
    rank = await get_student_rank(student_id)
    result["user_rank"] = rank
    return result


@router.post("/{attempt_id}/complete", response_model=ChallengeResponse)
async def complete(
    attempt_id: str,
    request: CompleteChallengeRequest,
    session: dict = Depends(get_current_student_session)
):
    """
    Called when student reaches the full target duration while page remained visible.
    """
    student_id = session["sub"]
    result = await finalize_attempt(
        attempt_id=attempt_id,
        student_id=student_id,
        terminal_status="completed",
        end_reason="duration_completed",
        client_elapsed_seconds=request.client_elapsed_seconds
    )
    rank = await get_student_rank(student_id)
    result["user_rank"] = rank
    return result


@router.post("/{attempt_id}/end", response_model=ChallengeResponse)
async def end_manually(
    attempt_id: str,
    request: EndChallengeRequest,
    session: dict = Depends(get_current_student_session)
):
    """Explicitly end the active challenge before reaching target duration."""
    student_id = session["sub"]
    result = await finalize_attempt(
        attempt_id=attempt_id,
        student_id=student_id,
        terminal_status="interrupted",
        end_reason=request.reason or "manual_end",
        client_elapsed_seconds=request.client_elapsed_seconds
    )
    rank = await get_student_rank(student_id)
    result["user_rank"] = rank
    return result


@router.get("/{attempt_id}", response_model=ChallengeResponse)
async def get_attempt(
    attempt_id: str,
    session: dict = Depends(get_current_student_session)
):
    """Retrieve details for a specific attempt belonging to the authenticated student."""
    student_id = session["sub"]
    db = get_database()
    try:
        attempt_oid = ObjectId(attempt_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid attempt ID format.")

    attempt = await db.focus_attempts.find_one({"_id": attempt_oid})
    if not attempt:
        raise HTTPException(status_code=404, detail="Attempt not found.")

    if attempt["student_id"] != student_id:
        raise HTTPException(status_code=403, detail="Unauthorized access to attempt.")

    student = await db.students.find_one({"_id": ObjectId(student_id)})
    best_sec = student.get("best_score_seconds", 0) if student else 0
    rank = await get_student_rank(student_id)

    return ChallengeResponse(
        id=str(attempt["_id"]),
        student_id=attempt["student_id"],
        target_seconds=attempt["target_seconds"],
        started_at=attempt["started_at"],
        ended_at=attempt.get("ended_at"),
        elapsed_seconds=attempt.get("elapsed_seconds", 0),
        status=attempt["status"],
        end_reason=attempt.get("end_reason"),
        is_new_personal_best=(attempt.get("elapsed_seconds", 0) == best_sec and best_sec > 0),
        previous_best_seconds=best_sec,
        current_best_seconds=best_sec,
        user_rank=rank
    )
