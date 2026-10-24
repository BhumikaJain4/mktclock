from typing import Optional
from pydantic import BaseModel, Field
from datetime import datetime


class CreateChallengeRequest(BaseModel):
    target_minutes: int = Field(..., ge=1, le=240, description="Target focus duration in minutes (1 to 240)")


class HeartbeatRequest(BaseModel):
    client_elapsed_seconds: Optional[int] = Field(None, ge=0)


class InterruptChallengeRequest(BaseModel):
    client_elapsed_seconds: Optional[int] = Field(None, ge=0)
    reason: Optional[str] = "page_hidden"


class CompleteChallengeRequest(BaseModel):
    client_elapsed_seconds: Optional[int] = Field(None, ge=0)


class EndChallengeRequest(BaseModel):
    client_elapsed_seconds: Optional[int] = Field(None, ge=0)
    reason: Optional[str] = "manual_end"


class ChallengeResponse(BaseModel):
    id: str
    student_id: str
    target_seconds: int
    started_at: datetime
    ended_at: Optional[datetime] = None
    elapsed_seconds: int = 0
    status: str
    end_reason: Optional[str] = None
    is_new_personal_best: bool = False
    previous_best_seconds: int = 0
    current_best_seconds: int = 0
    user_rank: Optional[int] = None
