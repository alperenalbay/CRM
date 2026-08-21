from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.deps import get_db, require_permissions
from app.models.user import User
from app.models.workflow import WorkflowState
from app.schemas.ticket import WorkflowStateOut

router = APIRouter(prefix="/workflow", tags=["workflow"])


@router.get("/states", response_model=list[WorkflowStateOut])
def list_states(
    category: str | None = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permissions("dashboard.view")),
) -> list[WorkflowStateOut]:
    stmt = select(WorkflowState).where(WorkflowState.is_active == True)
    if category:
        stmt = stmt.where(WorkflowState.category == category)
    stmt = stmt.order_by(WorkflowState.sort_order)
    return list(db.scalars(stmt))
