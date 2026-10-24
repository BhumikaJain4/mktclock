from datetime import datetime, timezone
from typing import Tuple


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


def calculate_valid_elapsed(
    started_at: datetime,
    ended_at: datetime,
    target_seconds: int,
    client_hint_seconds: int = 0
) -> int:
    """
    Authoritatively calculate focus elapsed seconds.
    The server timestamp interval is the supreme upper bound.
    """
    # Ensure timezone aware
    if started_at.tzinfo is None:
        started_at = started_at.replace(tzinfo=timezone.utc)
    if ended_at.tzinfo is None:
        ended_at = ended_at.replace(tzinfo=timezone.utc)

    # Server elapsed based on real clock
    raw_server_seconds = max(0, int((ended_at - started_at).total_seconds()))

    # If client reported a lower elapsed time (e.g. due to rapid exit), use min(client, server)
    if client_hint_seconds > 0:
        # Give 2s tolerance for network transit
        effective_elapsed = min(client_hint_seconds, raw_server_seconds + 2)
    else:
        effective_elapsed = raw_server_seconds

    # Never exceed target duration
    clamped_elapsed = max(0, min(effective_elapsed, target_seconds))
    return clamped_elapsed


def format_seconds(seconds: int) -> str:
    """Format seconds into HH:MM:SS or MM:SS."""
    hours = seconds // 3600
    minutes = (seconds % 3600) // 60
    secs = seconds % 60
    if hours > 0:
        return f"{hours:02d}:{minutes:02d}:{secs:02d}"
    return f"{minutes:02d}:{secs:02d}"
