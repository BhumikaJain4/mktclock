from typing import List, Optional
from pydantic import BaseModel
from datetime import datetime


class LeaderboardEntry(BaseModel):
    rank: int
    student_id: str
    display_name: str
    avatar_initials: str
    picture: Optional[str] = None
    best_score_seconds: int
    formatted_duration: str
    best_achieved_at: Optional[datetime] = None
    is_current_user: bool = False


class LeaderboardResponse(BaseModel):
    total_students: int
    page: int
    page_size: int
    total_pages: int
    entries: List[LeaderboardEntry]
    current_user_entry: Optional[LeaderboardEntry] = None


class UserRankResponse(BaseModel):
    student_id: str
    display_name: str
    rank: Optional[int] = None
    best_score_seconds: int
    formatted_duration: str
    best_achieved_at: Optional[datetime] = None
    total_participants: int
