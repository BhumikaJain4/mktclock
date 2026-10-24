from fastapi import APIRouter, Depends, HTTPException, status
from bson import ObjectId
from app.database import get_database
from app.utils.security import get_current_student_session
from app.schemas.student import StudentProfileResponse
from app.services.challenge_service import get_student_attempts

router = APIRouter(prefix="/api/students", tags=["Students"])


@router.get("/me", response_model=StudentProfileResponse)
async def get_my_profile(session: dict = Depends(get_current_student_session)):
    """Retrieve personal student profile and all-time best score."""
    student_id = session["sub"]
    db = get_database()
    try:
        student_oid = ObjectId(student_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid student ID")

    student = await db.students.find_one({"_id": student_oid})
    if not student:
        raise HTTPException(status_code=404, detail="Student profile not found")

    return StudentProfileResponse(
        id=str(student["_id"]),
        email=student["email"],
        name=student.get("name", "Student"),
        picture=student.get("picture"),
        best_score_seconds=student.get("best_score_seconds", 0),
        best_attempt_id=student.get("best_attempt_id"),
        best_achieved_at=student.get("best_achieved_at"),
        completed_challenges_count=student.get("completed_challenges_count", 0),
        total_attempts_count=student.get("total_attempts_count", 0),
        created_at=student["created_at"],
        last_active_at=student["last_active_at"],
    )


@router.get("/me/attempts")
async def get_my_attempts(
    limit: int = 50,
    session: dict = Depends(get_current_student_session)
):
    """Retrieve the student's personal challenge attempt history."""
    student_id = session["sub"]
    attempts = await get_student_attempts(student_id=student_id, limit=min(100, max(1, limit)))
    return {"attempts": attempts}
