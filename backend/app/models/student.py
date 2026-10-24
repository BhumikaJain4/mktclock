from datetime import datetime, timezone
from typing import Optional
from pydantic import BaseModel, Field


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


class StudentModel(BaseModel):
    id: Optional[str] = Field(default=None, alias="_id")
    email: str
    name: str
    picture: Optional[str] = None
    created_at: datetime = Field(default_factory=utc_now)
    updated_at: datetime = Field(default_factory=utc_now)
    best_score_seconds: int = 0
    best_attempt_id: Optional[str] = None
    best_achieved_at: Optional[datetime] = None
    completed_challenges_count: int = 0
    total_attempts_count: int = 0
    last_active_at: datetime = Field(default_factory=utc_now)

    class Config:
        populate_by_name = True
