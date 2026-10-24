import logging
from datetime import datetime, timezone
from typing import Optional, Dict, Any, List
from bson import ObjectId
from fastapi import HTTPException
from app.database import get_database
from app.utils.timing import format_seconds
from app.schemas.leaderboard import LeaderboardEntry, LeaderboardResponse, UserRankResponse

logger = logging.getLogger("sanctum.leaderboard")


def sanitize_display_name(name: Optional[str]) -> str:
    """
    Ensure student display names never expose full university email addresses.
    Strips email domain if present and defaults to 'Student'.
    """
    if not name or not str(name).strip():
        return "Student"
    cleaned = str(name).strip()
    if "@" in cleaned:
        cleaned = cleaned.split("@")[0]
    return cleaned


def get_initials(name: Optional[str]) -> str:
    """Generate 2-letter initials for avatar."""
    cleaned = sanitize_display_name(name)
    parts = cleaned.replace(".", " ").replace("_", " ").strip().split()
    if len(parts) >= 2:
        return f"{parts[0][0]}{parts[1][0]}".upper()
    return cleaned[:2].upper() if len(cleaned) >= 2 else "AU"


async def get_student_rank(student_id: str) -> Optional[int]:
    """
    Calculate exact 1-based rank for a student using deterministic tie-breaking:
    1. best_score_seconds DESC
    2. best_achieved_at ASC
    3. _id ASC
    Students with 0 score are unranked (None).
    """
    db = get_database()
    try:
        student_oid = ObjectId(student_id)
    except Exception:
        return None

    student = await db.students.find_one({"_id": student_oid})
    if not student:
        return None

    best_score = student.get("best_score_seconds", 0)
    if best_score <= 0:
        return None

    achieved_at = student.get("best_achieved_at") or student.get("created_at") or datetime.now(timezone.utc)

    # Count students who rank strictly higher:
    # A) score is higher
    # B) score is equal, but achieved earlier
    # C) score is equal, achieved at same time, but _id is lower
    filter_query = {
        "best_score_seconds": {"$gt": 0},
        "$or": [
            {"best_score_seconds": {"$gt": best_score}},
            {
                "best_score_seconds": best_score,
                "best_achieved_at": {"$lt": achieved_at}
            },
            {
                "best_score_seconds": best_score,
                "best_achieved_at": achieved_at,
                "_id": {"$lt": student_oid}
            }
        ]
    }

    strictly_higher_count = await db.students.count_documents(filter_query)
    return strictly_higher_count + 1


async def get_leaderboard(
    page: int = 1,
    page_size: int = 100,
    current_student_id: Optional[str] = None
) -> LeaderboardResponse:
    """
    Retrieve deterministic global leaderboard based exclusively on single best attempt.
    """
    db = get_database()
    page = max(1, page)
    page_size = max(1, min(1000, page_size))
    skip = (page - 1) * page_size

    # Filter out students with 0 focus seconds
    query = {"best_score_seconds": {"$gt": 0}}
    total_active_students = await db.students.count_documents(query)

    # Deterministic sort: score DESC, achieved_at ASC, _id ASC
    cursor = db.students.find(query).sort([
        ("best_score_seconds", -1),
        ("best_achieved_at", 1),
        ("_id", 1)
    ]).skip(skip).limit(page_size)

    entries: List[LeaderboardEntry] = []
    current_user_entry: Optional[LeaderboardEntry] = None

    idx = skip + 1
    async for doc in cursor:
        doc_id = str(doc["_id"])
        is_me = (doc_id == current_student_id)
        display_name = sanitize_display_name(doc.get("name", "Student"))
        score_seconds = doc.get("best_score_seconds", 0)

        entry = LeaderboardEntry(
            rank=idx,
            student_id=doc_id,
            display_name=display_name,
            avatar_initials=get_initials(display_name),
            picture=doc.get("picture"),
            best_score_seconds=score_seconds,
            formatted_duration=format_seconds(score_seconds),
            best_achieved_at=doc.get("best_achieved_at"),
            is_current_user=is_me
        )
        entries.append(entry)
        if is_me:
            current_user_entry = entry
        idx += 1

    # If current student is not on this page, calculate their rank separately so frontend can highlight
    if current_student_id and not current_user_entry:
        try:
            cur_doc = await db.students.find_one({"_id": ObjectId(current_student_id)})
            if cur_doc and cur_doc.get("best_score_seconds", 0) > 0:
                rank = await get_student_rank(current_student_id)
                display_name = sanitize_display_name(cur_doc.get("name", "Student"))
                score_seconds = cur_doc.get("best_score_seconds", 0)
                current_user_entry = LeaderboardEntry(
                    rank=rank or 0,
                    student_id=current_student_id,
                    display_name=display_name,
                    avatar_initials=get_initials(display_name),
                    picture=cur_doc.get("picture"),
                    best_score_seconds=score_seconds,
                    formatted_duration=format_seconds(score_seconds),
                    best_achieved_at=cur_doc.get("best_achieved_at"),
                    is_current_user=True
                )
        except Exception as e:
            logger.error(f"Error resolving current user rank: {e}")

    total_pages = max(1, (total_active_students + page_size - 1) // page_size)

    return LeaderboardResponse(
        total_students=total_active_students,
        page=page,
        page_size=page_size,
        total_pages=total_pages,
        entries=entries,
        current_user_entry=current_user_entry,
    )


async def get_user_rank_details(student_id: str) -> UserRankResponse:
    """Retrieve personal rank details for the logged-in student."""
    db = get_database()
    try:
        student_oid = ObjectId(student_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid student ID")

    student = await db.students.find_one({"_id": student_oid})
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")

    total_participants = await db.students.count_documents({"best_score_seconds": {"$gt": 0}})
    score_seconds = student.get("best_score_seconds", 0)
    rank = await get_student_rank(student_id) if score_seconds > 0 else None

    return UserRankResponse(
        student_id=student_id,
        display_name=sanitize_display_name(student.get("name", "Student")),
        rank=rank,
        best_score_seconds=score_seconds,
        formatted_duration=format_seconds(score_seconds),
        best_achieved_at=student.get("best_achieved_at"),
        total_participants=total_participants,
    )
