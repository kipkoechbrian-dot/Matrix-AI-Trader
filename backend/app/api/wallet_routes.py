from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database.session import get_db

from app.authentication.dependencies import get_current_user

from app.models.user import User

from app.services.wallet_service import WalletService

from app.models.transaction import Transaction

router = APIRouter(tags=["Wallet"])


@router.get("/wallet")
def get_wallet(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):

    wallet = WalletService.get_wallet(
        db,
        current_user.id
    )

    if wallet is None:

        raise HTTPException(
            status_code=404,
            detail="Wallet not found."
        )

    return wallet


@router.post("/wallet/deposit/{amount}")
def deposit(
    amount: float,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):

    if amount <= 0:

        raise HTTPException(
            status_code=400,
            detail="Amount must be greater than zero."
        )

    result = WalletService.deposit(
        db,
        current_user.id,
        amount
    )

    if result is None:

        raise HTTPException(
            status_code=404,
            detail="Wallet not found."
        )

    return {
        "message": "Deposit completed successfully.",
        "wallet_balance": result["wallet"].balance,
        "transaction": result["transaction"].id
    }


@router.post("/wallet/withdraw/{amount}")
def withdraw(
    amount: float,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):

    if amount <= 0:

        raise HTTPException(
            status_code=400,
            detail="Amount must be greater than zero."
        )

    result = WalletService.withdraw(
        db,
        current_user.id,
        amount
    )

    if result is None:

        raise HTTPException(
            status_code=404,
            detail="Wallet not found."
        )

    if result is False:

        raise HTTPException(
            status_code=400,
            detail="Insufficient funds."
        )

    return {
        "message": "Withdrawal completed successfully.",
        "wallet_balance": result["wallet"].balance,
        "transaction": result["transaction"].id
    }


@router.get("/wallet/history")
def wallet_history(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):

    return (
        db.query(Transaction)
        .filter(Transaction.user_id == current_user.id)
        .order_by(Transaction.created_at.desc())
        .all()
    )