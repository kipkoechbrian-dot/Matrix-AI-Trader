from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database.session import get_db

from app.authentication.dependencies import get_current_user

from app.models.user import User

from app.services.analytics_service import AnalyticsService

router = APIRouter(
    tags=["Analytics"]
)


@router.get("/analytics/dashboard")
def analytics_dashboard(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):

    return AnalyticsService.get_dashboard(
        db,
        current_user.id
    )