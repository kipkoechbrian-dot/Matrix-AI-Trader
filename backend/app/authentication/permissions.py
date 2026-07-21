from fastapi import Depends, HTTPException

from app.models.user import User
from app.authentication.dependencies import get_current_user


def require_role(allowed_roles: list):
    def role_checker(
        current_user: User = Depends(get_current_user)
    ):
        if current_user.account_type not in allowed_roles:
            raise HTTPException(
                status_code=403,
                detail="Access denied."
            )

        return current_user

    return role_checker