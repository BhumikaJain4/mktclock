from typing import Optional
from pydantic import BaseModel


class GoogleAuthRequest(BaseModel):
    credential: Optional[str] = None  # Google ID token (from Google One Tap or Sign In button)
    code: Optional[str] = None        # Authorization code if using server redirect flow



class AuthMeResponse(BaseModel):
    authenticated: bool
    student_id: Optional[str] = None
    email: Optional[str] = None
    name: Optional[str] = None
    picture: Optional[str] = None
    best_score_seconds: int = 0
    best_achieved_at: Optional[str] = None
    completed_challenges_count: int = 0
    allowed_domain: str = "ahduni.edu.in"
    is_dev_mode: bool = False
