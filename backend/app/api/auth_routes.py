from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.models.user import User
from app.models.wallet import Wallet
from app.schemas.user import UserRegister
from app.authentication.security import hash_password, verify_password
from app.authentication.auth import create_access_token


router = APIRouter()


@router.post("/register")
def register(
    user: UserRegister,
    db: Session = Depends(get_db)
):
    # Check whether the email is already registered
    existing_user = (
        db.query(User)
        .filter(User.email == user.email)
        .first()
    )

    if existing_user:
        raise HTTPException(
            status_code=400,
            detail="Email already registered."
        )

    # Hash the user's password before saving it
    hashed_password = hash_password(user.password)

    # Create the new user
    new_user = User(
        username=user.username,
        email=user.email,
        password=hashed_password
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    # Create a wallet automatically for the new user
    wallet = Wallet(
        user_id=new_user.id,
        balance=0.0
    )

    db.add(wallet)
    db.commit()
    db.refresh(wallet)

    return {
        "message": "Registration successful!",
        "user": {
            "id": new_user.id,
            "username": new_user.username,
            "email": new_user.email,
            "account_type": new_user.account_type
        },
        "wallet": {
            "id": wallet.id,
            "balance": wallet.balance
        }
    }


@router.post("/login")
def login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db)
):
    # Login uses the user's email in the username field
    db_user = (
        db.query(User)
        .filter(User.email == form_data.username)
        .first()
    )

    if not db_user:
        raise HTTPException(
            status_code=401,
            detail="Invalid email or password."
        )

    # Verify the password
    if not verify_password(
        form_data.password,
        db_user.password
    ):
        raise HTTPException(
            status_code=401,
            detail="Invalid email or password."
        )

    # Generate JWT access token
    access_token = create_access_token(
        data={
            "sub": db_user.email
        }
    )

    return {
        "access_token": access_token,
        "token_type": "bearer"
    }