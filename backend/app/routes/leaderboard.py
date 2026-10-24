from fastapi import APIRouter, Request, Query, Depends
from typing import Optional
from app.schemas.leaderboard import LeaderboardResponse, UserRankResponse
from app.services.leaderboard_service import get_leaderboard, get_user_rank_details
from app.utils.security import decode_session_token, get_current_student_session
from app.config import settings

router = APIRouter(prefix="/api/leaderboard", tags=["Leaderboard"])


@router.get("", response_model=LeaderboardResponse)
async def list_leaderboard(
    request: Request,
    page: int = Query(1, ge=1),
    page_size: int = Query(100, ge=1, le=1000)
):
    """
    Public leaderboard of library focus champions based exclusively on single best attempt.
    If student is logged in, their row is highlighted and included even if not on page 1.
    """
    current_student_id: Optional[str] = None
    token = request.cookies.get(settings.SESSION_COOKIE_NAME)
    if not token:
        auth_header = request.headers.get("Authorization")
        if auth_header and auth_header.startswith("Bearer "):
            token = auth_header.split(" ", 1)[1]

    if token:
        payload = decode_session_token(token)
        if payload:
            current_student_id = payload.get("sub")

    return await get_leaderboard(
        page=page,
        page_size=page_size,
        current_student_id=current_student_id
    )


@router.get("/me", response_model=UserRankResponse)
async def get_my_rank(session: dict = Depends(get_current_student_session)):
    """Retrieve logged-in student's exact all-time rank and best attempt duration."""
    student_id = session["sub"]
    return await get_user_rank_details(student_id=student_id)
