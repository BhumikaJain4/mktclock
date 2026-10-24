from typing import Optional
from pydantic import BaseModel
from datetime import datetime


class StudentProfileResponse(BaseModel):
    id: str
    email: str
    name: str
    picture: Optional[str] = None
    best_score_seconds: int
    best_attempt_id: Optional[str] = None
    best_achieved_at: Optional[datetime] = None
    completed_challenges_count: int
    total_attempts_count: int
    created_at: datetime
    last_active_at: datetime
