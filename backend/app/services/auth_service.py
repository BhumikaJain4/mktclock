import logging
from datetime import datetime, timezone
from typing import Dict, Any, Optional
from bson import ObjectId
from fastapi import HTTPException, status
import httpx
from app.config import settings
from app.database import get_database
from app.utils.security import (
    normalize_email,
    is_valid_university_email,
    create_session_token,
)

logger = logging.getLogger("sanctum.auth")


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


async def get_or_create_student(email: str, name: Optional[str] = None, picture: Optional[str] = None) -> Dict[str, Any]:
    """Find existing student by normalized email or create new student record."""
    normalized = normalize_email(email)
    if not is_valid_university_email(normalized):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Access restricted. Only verified university email accounts (@{settings.ALLOWED_EMAIL_DOMAIN}) are permitted.",
        )

    # Derive student name strictly from email prefix (e.g. bhumika.j@ahduni.edu.in -> bhumika.j)
    derived_name = normalized.split("@")[0]

    db = get_database()
    student = await db.students.find_one({"email": normalized})
    now = utc_now()

    if student:
        update_data = {
            "last_active_at": now,
            "name": derived_name,  # Synchronize name strictly from email prefix
        }
        if picture and picture != student.get("picture"):
            update_data["picture"] = picture
        await db.students.update_one({"_id": student["_id"]}, {"$set": update_data})
        student.update(update_data)
        
        # Format and serialize all fields for JSON serialization
        student_id_str = str(student["_id"])
        student["_id"] = student_id_str
        student["id"] = student_id_str
        if student.get("best_attempt_id") is not None:
            student["best_attempt_id"] = str(student["best_attempt_id"])
        if isinstance(student.get("best_achieved_at"), datetime):
            student["best_achieved_at"] = student["best_achieved_at"].isoformat()
        if isinstance(student.get("created_at"), datetime):
            student["created_at"] = student["created_at"].isoformat()
        if isinstance(student.get("updated_at"), datetime):
            student["updated_at"] = student["updated_at"].isoformat()
        if isinstance(student.get("last_active_at"), datetime):
            student["last_active_at"] = student["last_active_at"].isoformat()
        return student
    else:
        new_student = {
            "email": normalized,
            "name": derived_name,
            "picture": picture,
            "best_score_seconds": 0,
            "best_attempt_id": None,
            "best_achieved_at": None,
            "completed_challenges_count": 0,
            "total_attempts_count": 0,
            "created_at": now,
            "updated_at": now,
            "last_active_at": now,
        }
        result = await db.students.insert_one(new_student)
        student_id_str = str(result.inserted_id)
        new_student["_id"] = student_id_str
        new_student["id"] = student_id_str
        new_student["created_at"] = now.isoformat()
        new_student["updated_at"] = now.isoformat()
        new_student["last_active_at"] = now.isoformat()
        return new_student


async def authenticate_google_credential(credential: str) -> Dict[str, Any]:
    """
    Verify Google OAuth Identity token server-side using Google's tokeninfo API.
    Validates audience, expiration, email verification, and university domain.
    """
    if not credential:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Google ID token credential is required.",
        )

    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.get(
                "https://oauth2.googleapis.com/tokeninfo",
                params={"id_token": credential}
            )

        if resp.status_code != 200:
            logger.warning(f"Google tokeninfo rejected token with status {resp.status_code}: {resp.text}")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid or expired Google OAuth credential.",
            )

        id_info = resp.json()

        # If GOOGLE_CLIENT_ID is configured, verify audience
        if settings.GOOGLE_CLIENT_ID:
            aud = str(id_info.get("aud", "")).strip()
            azp = str(id_info.get("azp", "")).strip()
            expected = settings.GOOGLE_CLIENT_ID.strip()
            if aud != expected and azp != expected:
                logger.warning(f"Google audience mismatch: token aud={aud}, azp={azp}, expected={expected}")
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Google credential audience does not match this application.",
                )

        email = id_info.get("email")
        email_verified_raw = id_info.get("email_verified")
        email_verified = email_verified_raw is True or str(email_verified_raw).lower() == "true"
        picture = id_info.get("picture")

        if not email or not email_verified:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Google account email is not verified.",
            )

        # Strict university email domain verification
        if not is_valid_university_email(email):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access restricted. Account email must end with @{settings.ALLOWED_EMAIL_DOMAIN}.",
            )

        normalized = normalize_email(email)
        derived_name = normalized.split("@")[0]

        student = await get_or_create_student(email=normalized, name=derived_name, picture=picture)
        session_token = create_session_token(
            student_id=student["id"],
            email=student["email"],
            name=student["name"]
        )
        return {
            "student": student,
            "token": session_token
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error during Google credential verification: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to communicate with Google authentication services.",
        )

