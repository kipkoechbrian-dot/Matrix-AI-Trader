from sqlalchemy.orm import Session

from app.models.notification import Notification
from app.models.user import User

from app.services.email_service import send_email


def create_notification(
    db: Session,
    user_id: int,
    title: str,
    message: str,
    notification_type: str = "INFO"
):
    notification = Notification(
        user_id=user_id,
        title=title,
        message=message,
        type=notification_type
    )

    db.add(notification)
    db.commit()
    db.refresh(notification)

    user = (
        db.query(User)
        .filter(User.id == user_id)
        .first()
    )

    if user:
        try:
            send_email(
                recipient=user.email,
                subject=title,
                body=message
            )
        except Exception as e:
            print(f"Email Error: {e}")

    return notification