from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from app.authentication.dependencies import get_current_user
from app.authentication.permissions import require_role
from app.models.wallet import Wallet
from app.models.transaction import Transaction

from app.database.session import get_db
from app.models.user import User
from app.schemas.user import (
    UserRegister,
    UserUpdate,
    ChangePassword,
    UpgradeMembership,
    DepositRequest,
    WithdrawRequest
)
from app.authentication.security import hash_password, verify_password
from app.authentication.auth import create_access_token, verify_token

router = APIRouter()

oauth2_scheme = OAuth2PasswordBearer(
    tokenUrl="login"
)


def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
):
    email = verify_token(token)

    if email is None:
        raise HTTPException(
            status_code=401,
            detail="Invalid or expired token."
        )

    user = db.query(User).filter(
        User.email == email
    ).first()

    if user is None:
        raise HTTPException(
            status_code=401,
            detail="User not found."
        )

    return user


@router.get("/")
def home():
    return {
        "application": "Matrix AI Trader",
        "version": "1.0.0",
        "status": "Running",
        "developer": "Brian"
    }


@router.get("/health")
def health_check():
    return {
        "status": "healthy",
        "server": "online"
    }


@router.get("/about")
def about():
    return {
        "name": "Matrix AI Trader",
        "description": "AI-powered Forex Trading Platform",
        "features": [
            "AI Trading",
            "VIP Membership",
            "VVIP Membership",
            "Market Analysis",
            "Risk Management"
        ]
    }


@router.get("/vip")
def vip(
    current_user: User = Depends(
        require_role(["VIP", "VVIP", "ADMIN"])
    )
):
    return {
        "message": f"Welcome {current_user.username}!",
        "membership": current_user.account_type,
        "benefits": [
            "Trading Signals",
            "Priority Support",
            "AI Analysis"
        ]
    }

@router.get("/vvip")
def vvip(
    current_user: User = Depends(
        require_role(["VVIP", "ADMIN"])
    )
):
    return {
        "message": f"Welcome {current_user.username}!",
        "membership": current_user.account_type,
        "benefits": [
            "Everything in VIP",
            "Private AI Models",
            "Premium Trading Bots",
            "One-on-One Mentorship"
        ]
    }


@router.post("/register")
def register(
    user: UserRegister,
    db: Session = Depends(get_db)
):
    existing_user = db.query(User).filter(
        User.email == user.email
    ).first()

    if existing_user:
        raise HTTPException(
            status_code=400,
            detail="Email already registered."
        )

    hashed_password = hash_password(user.password)

    new_user = User(
        username=user.username,
        email=user.email,
        password=hashed_password
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    wallet = Wallet(
        user_id=new_user.id,
        balance=0.0
    )

    db.add(wallet)
    db.commit()

    return {
        "message": "Registration successful!",
        "user": {
            "id": new_user.id,
            "username": new_user.username,
            "email": new_user.email,
            "account_type": new_user.account_type
        }
    }


@router.post("/login")
def login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db)
):
    db_user = db.query(User).filter(
        User.email == form_data.username
    ).first()

    if not db_user:
        raise HTTPException(
            status_code=401,
            detail="Invalid email or password."
        )

    if not verify_password(
        form_data.password,
        db_user.password
    ):
        raise HTTPException(
            status_code=401,
            detail="Invalid email or password."
        )

    access_token = create_access_token(
        data={
            "sub": db_user.email
        }
    )

    return {
        "access_token": access_token,
        "token_type": "bearer"
    }


@router.get("/profile")
def get_profile(
    current_user: User = Depends(get_current_user)
):
    return {
        "id": current_user.id,
        "username": current_user.username,
        "email": current_user.email,
        "account_type": current_user.account_type
    }


@router.put("/profile")
def update_profile(
    user_data: UserUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    existing_email = db.query(User).filter(
        User.email == user_data.email,
        User.id != current_user.id
    ).first()

    if existing_email:
        raise HTTPException(
            status_code=400,
            detail="Email already in use."
        )

    current_user.username = user_data.username
    current_user.email = user_data.email

    db.commit()
    db.refresh(current_user)

    return {
        "message": "Profile updated successfully.",
        "user": {
            "id": current_user.id,
            "username": current_user.username,
            "email": current_user.email,
            "account_type": current_user.account_type
        }
    }

@router.get("/wallet")
def get_wallet(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    wallet = db.query(Wallet).filter(
        Wallet.user_id == current_user.id
    ).first()

    if wallet is None:
        raise HTTPException(
            status_code=404,
            detail="Wallet not found."
        )

    return {
        "username": current_user.username,
        "balance": wallet.balance,
        "currency": "USD"
    }
@router.post("/wallet/deposit")
def deposit_money(
    deposit: DepositRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    wallet = db.query(Wallet).filter(
        Wallet.user_id == current_user.id
    ).first()

    if wallet is None:
        raise HTTPException(
            status_code=404,
            detail="Wallet not found."
        )

    if deposit.amount <= 0:
        raise HTTPException(
            status_code=400,
            detail="Amount must be greater than zero."
        )

    wallet.balance += deposit.amount

    transaction = Transaction(
        user_id=current_user.id,
        transaction_type="DEPOSIT",
        amount=deposit.amount
    )

    db.add(transaction)

    db.commit()

    db.refresh(wallet)

    return {
        "message": "Deposit successful.",
        "new_balance": wallet.balance
    }

@router.post("/wallet/withdraw")
def withdraw_money(
    withdraw: WithdrawRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    wallet = db.query(Wallet).filter(
        Wallet.user_id == current_user.id
    ).first()

    if wallet is None:
        raise HTTPException(
            status_code=404,
            detail="Wallet not found."
        )

    if withdraw.amount <= 0:
        raise HTTPException(
            status_code=400,
            detail="Amount must be greater than zero."
        )

    if wallet.balance < withdraw.amount:
        raise HTTPException(
            status_code=400,
            detail="Insufficient balance."
        )

    wallet.balance -= withdraw.amount

    transaction = Transaction(
        user_id=current_user.id,
        transaction_type="WITHDRAWAL",
        amount=withdraw.amount
    )

    db.add(transaction)

    db.commit()

    db.refresh(wallet)

    return {
        "message": "Withdrawal successful.",
        "new_balance": wallet.balance
    }

@router.get("/wallet/history")
def wallet_history(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    transactions = (
        db.query(Transaction)
        .filter(Transaction.user_id == current_user.id)
        .order_by(Transaction.created_at.desc())
        .all()
    )

    return [
        {
            "id": transaction.id,
            "type": transaction.transaction_type,
            "amount": transaction.amount,
            "date": transaction.created_at
        }
        for transaction in transactions
    ]

@router.put("/change-password")
def change_password(
    passwords: ChangePassword,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):

    # Verify the current password
    if not verify_password(
        passwords.current_password,
        current_user.password
    ):
        raise HTTPException(
            status_code=400,
            detail="Current password is incorrect."
        )

    # Prevent reusing the same password
    if passwords.current_password == passwords.new_password:
        raise HTTPException(
            status_code=400,
            detail="New password must be different."
        )

    # Hash the new password
    current_user.password = hash_password(
        passwords.new_password
    )

    db.commit()

    return {
        "message": "Password changed successfully."
    }
@router.post("/admin/upgrade/vip")
def upgrade_to_vip(
    data: UpgradeMembership,
    current_user: User = Depends(
        require_role(["ADMIN"])
    ),
    db: Session = Depends(get_db)
):
    user = db.query(User).filter(
        User.email == data.email
    ).first()

    if not user:
        raise HTTPException(
            status_code=404,
            detail="User not found."
        )

    user.account_type = "VIP"

    db.commit()
    db.refresh(user)

    return {
        "message": f"{user.username} has been upgraded to VIP.",
        "user": {
            "id": user.id,
            "username": user.username,
            "email": user.email,
            "account_type": user.account_type
        }
    }
@router.post("/admin/upgrade/vvip")
def upgrade_to_vvip(
    data: UpgradeMembership,
    current_user: User = Depends(
        require_role(["ADMIN"])
    ),
    db: Session = Depends(get_db)
):
    user = db.query(User).filter(
        User.email == data.email
    ).first()

    if not user:
        raise HTTPException(
            status_code=404,
            detail="User not found."
        )

    user.account_type = "VVIP"

    db.commit()
    db.refresh(user)

    return {
        "message": f"{user.username} has been upgraded to VVIP.",
        "user": {
            "id": user.id,
            "username": user.username,
            "email": user.email,
            "account_type": user.account_type
        }
    }

@router.post("/admin/make-admin")
def make_admin(
    data: UpgradeMembership,
    current_user: User = Depends(
        require_role(["ADMIN"])
    ),
    db: Session = Depends(get_db)
):
    user = db.query(User).filter(
        User.email == data.email
    ).first()

    if not user:
        raise HTTPException(
            status_code=404,
            detail="User not found."
        )

    user.account_type = "ADMIN"

    db.commit()
    db.refresh(user)

    return {
        "message": f"{user.username} is now an ADMIN.",
        "user": {
            "id": user.id,
            "username": user.username,
            "email": user.email,
            "account_type": user.account_type
        }
    }