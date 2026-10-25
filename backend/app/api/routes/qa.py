from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import and_, or_
from sqlalchemy.orm import Session

from app.core.auth import get_current_user
from app.core.database import get_db
from app.models.qa_history import QAHistory
from app.models.user import User
from app.schemas.api import APIResponse
from app.schemas.qa import QAHistoryPage, QAItem

router = APIRouter()


def _to_item(row: QAHistory) -> QAItem:
    return QAItem(
        id=row.id,
        question=row.question,
        answer=row.answer,
        sources=row.sources or [],
        created_at=row.created_at,
    )


@router.get("/qa/latest", response_model=APIResponse[QAItem | None])
def latest_qa(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    row = (
        db.query(QAHistory)
        .filter(QAHistory.user_id == current_user.id)
        .order_by(QAHistory.created_at.desc(), QAHistory.id.desc())
        .first()
    )
    return APIResponse(message="OK", data=_to_item(row) if row else None)


@router.get("/qa/history", response_model=APIResponse[QAHistoryPage])
def history(
    limit: int = Query(5, ge=1, le=50),
    before: str | None = Query(
        None,
        description="Cursor: '<iso_created_at>|<id>' of the OLDEST currently-loaded record.",
    ),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    q = db.query(QAHistory).filter(QAHistory.user_id == current_user.id)

    if before:
        try:
            ts_str, id_str = before.split("|")
            ts = datetime.fromisoformat(ts_str)
            last_id = int(id_str)
        except (ValueError, TypeError):
            raise HTTPException(status_code=400, detail="Invalid cursor.")

        q = q.filter(
            or_(
                QAHistory.created_at < ts,
                and_(QAHistory.created_at == ts, QAHistory.id < last_id),
            )
        )

    # Fetch limit + 1 to know if there are more
    rows = (
        q.order_by(QAHistory.created_at.desc(), QAHistory.id.desc())
        .limit(limit + 1)
        .all()
    )
    has_more = len(rows) > limit
    rows = rows[:limit]

    # Reverse → oldest at top, newest at bottom for the timeline
    rows.reverse()

    next_cursor = (
        f"{rows[0].created_at.isoformat()}|{rows[0].id}"
        if rows and has_more
        else None
    )

    return APIResponse(
        message="OK",
        data=QAHistoryPage(
            items=[_to_item(r) for r in rows],
            has_more=has_more,
            next_cursor=next_cursor,
        ),
    )