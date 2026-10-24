from datetime import datetime, timezone
from typing import Optional
from pydantic import BaseModel, Field


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


class FocusAttemptModel(BaseModel):
    id: Optional[str] = Field(default=None, alias="_id")
    student_id: str
    target_seconds: int
    started_at: datetime = Field(default_factory=utc_now)
    ended_at: Optional[datetime] = None
    last_heartbeat_at: Optional[datetime] = None
    elapsed_seconds: int = 0
    status: str = "active"  # "active" | "completed" | "interrupted" | "abandoned"
    end_reason: Optional[str] = None  # "duration_completed" | "page_hidden" | "page_exit" | "manual_end" | "recovered_after_disconnect"
    created_at: datetime = Field(default_factory=utc_now)
    updated_at: datetime = Field(default_factory=utc_now)

    class Config:
        populate_by_name = True
