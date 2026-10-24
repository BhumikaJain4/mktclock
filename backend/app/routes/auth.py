from fastapi import APIRouter, Request, Response, HTTPException, status
from bson import ObjectId
from app.config import settings
from app.database import get_database
from app.schemas.auth import GoogleAuthRequest, AuthMeResponse
from app.services.auth_service import authenticate_google_credential
from app.utils.security import decode_session_token

router = APIRouter(prefix="/api/auth", tags=["Authentication"])


def set_session_cookie(response: Response, token: str):
    response.set_cookie(
        key=settings.SESSION_COOKIE_NAME,
        value=token,
        max_age=settings.SESSION_EXPIRE_HOURS * 3600,
        httponly=True,
        secure=settings.SESSION_COOKIE_SECURE,
        samesite=settings.SESSION_COOKIE_SAMESITE,
        path="/",
    )


def clear_session_cookie(response: Response):
    response.delete_cookie(
        key=settings.SESSION_COOKIE_NAME,
        path="/",
        httponly=True,
        secure=settings.SESSION_COOKIE_SECURE,
        samesite=settings.SESSION_COOKIE_SAMESITE,
    )


@router.get("/me", response_model=AuthMeResponse)
async def get_current_user(request: Request):
    """Retrieve session details for the currently authenticated student."""
    token = request.cookies.get(settings.SESSION_COOKIE_NAME)
    if not token:
        auth_header = request.headers.get("Authorization")
        if auth_header and auth_header.startswith("Bearer "):
            token = auth_header.split(" ", 1)[1]

    if not token:
        return AuthMeResponse(
            authenticated=False,
            allowed_domain=settings.ALLOWED_EMAIL_DOMAIN,
            is_dev_mode=False
        )

    payload = decode_session_token(token)
    if not payload or not payload.get("sub"):
        return AuthMeResponse(
            authenticated=False,
            allowed_domain=settings.ALLOWED_EMAIL_DOMAIN,
            is_dev_mode=False
        )

    student_id = payload["sub"]
    student = None
    try:
        db = get_database()
        student = await db.students.find_one({"_id": ObjectId(student_id)})
    except Exception:
        pass

    email = payload.get("email") or ""
    derived_name = email.split("@")[0] if email and "@" in email else (payload.get("name") or "Student")

    if not student:
        return AuthMeResponse(
            authenticated=True,
            student_id=student_id,
            email=email,
            name=derived_name,
            allowed_domain=settings.ALLOWED_EMAIL_DOMAIN,
            is_dev_mode=False
        )

    student_email = student.get("email", email)
    st_name = student_email.split("@")[0] if student_email and "@" in student_email else (student.get("name") or derived_name)

    return AuthMeResponse(
        authenticated=True,
        student_id=str(student["_id"]),
        email=student_email,
        name=st_name,
        picture=student.get("picture"),
        best_score_seconds=student.get("best_score_seconds", 0),
        best_achieved_at=student.get("best_achieved_at").isoformat() if hasattr(student.get("best_achieved_at"), "isoformat") else (student.get("best_achieved_at") if isinstance(student.get("best_achieved_at"), str) else None),
        completed_challenges_count=student.get("completed_challenges_count", 0),
        allowed_domain=settings.ALLOWED_EMAIL_DOMAIN,
        is_dev_mode=False
    )


@router.post("/google")
async def login_google(auth_req: GoogleAuthRequest, response: Response):
    """Sign in with Google OAuth ID token credential (strictly verified server-side)."""
    if not auth_req.credential:
        raise HTTPException(status_code=400, detail="Missing Google ID token credential.")

    auth_result = await authenticate_google_credential(auth_req.credential)
    set_session_cookie(response, auth_result["token"])

    return {
        "success": True,
        "student": auth_result["student"],
        "token": auth_result["token"]
    }


@router.post("/logout")
async def logout(response: Response):
    """Clear session cookie and invalidate active session."""
    clear_session_cookie(response)
    return {"success": True, "message": "Successfully logged out."}

