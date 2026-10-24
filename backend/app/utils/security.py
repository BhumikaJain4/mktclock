import re
from datetime import datetime, timezone, timedelta
from typing import Optional, Dict, Any
import jwt
from fastapi import Request, HTTPException, status
from app.config import settings

ALGORITHM = "HS256"


def normalize_email(email: str) -> str:
    """Lowercase and strip whitespace from email."""
    return email.strip().lower()


def is_valid_university_email(email: str) -> bool:
    """
    Validate that email belongs strictly to the permitted university domain.
    Must not allow substrings like attacker.com or ahduni.edu.in.evil.com.
    """
    normalized = normalize_email(email)
    parts = normalized.split("@")
    if len(parts) != 2:
        return False
    user, domain = parts
    if not user or not domain:
        return False
    # Exact domain comparison
    return domain == settings.ALLOWED_EMAIL_DOMAIN.lower()


def create_session_token(student_id: str, email: str, name: str) -> str:
    """Create signed HMAC-SHA256 JWT session token."""
    expire = datetime.now(timezone.utc) + timedelta(hours=settings.SESSION_EXPIRE_HOURS)
    payload = {
        "sub": student_id,
        "email": email,
        "name": name,
        "exp": expire,
        "iat": datetime.now(timezone.utc),
    }
    return jwt.encode(payload, settings.SESSION_SECRET, algorithm=ALGORITHM)


def decode_session_token(token: str) -> Optional[Dict[str, Any]]:
    """Decode and verify JWT session token."""
    try:
        payload = jwt.decode(token, settings.SESSION_SECRET, algorithms=[ALGORITHM])
        return payload
    except jwt.PyJWTError:
        return None


async def get_current_student_session(request: Request) -> Dict[str, Any]:
    """
    Extract authenticated student session from HttpOnly cookie or Authorization Bearer header.
    Throws 401 if unauthenticated or token is expired/invalid.
    """
    token = request.cookies.get(settings.SESSION_COOKIE_NAME)
    if not token:
        # Also check Authorization header as fallback for mobile/APIs
        auth_header = request.headers.get("Authorization")
        if auth_header and auth_header.startswith("Bearer "):
            token = auth_header.split(" ", 1)[1]

    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Session not found. Please log in with your university account.",
        )

    payload = decode_session_token(token)
    if not payload or not payload.get("sub"):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired session. Please log in again.",
        )

    return payload
