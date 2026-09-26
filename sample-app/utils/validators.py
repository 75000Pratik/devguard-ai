"""
validators.py — Shared validation helpers used by route handlers.
"""

ALLOWED_STATUSES = ("todo", "in_progress", "done")


def is_valid_status(status):
    """Return True if *status* is one of the allowed task status values."""
    return status in ALLOWED_STATUSES


def validate_task_payload(data):
    """Validate the JSON body for task creation.

    Returns (None, None) on success or (error_message, 400) on failure.
    """
    if not data:
        return "No data provided", 400
    title = data.get("title", "")
    if not title or not str(title).strip():
        return "title is required", 400
    status = data.get("status", "todo")
    if not is_valid_status(status):
        return "Invalid status", 400
    return None, None
