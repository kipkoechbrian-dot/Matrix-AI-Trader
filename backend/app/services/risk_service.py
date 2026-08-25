from app.models.trade import Trade


MAX_OPEN_TRADES = 5
MAX_RISK_PERCENT = 0.10       # 10% of wallet
MAX_DAILY_LOSS = -500          # USD


def can_open_trade(user, wallet, db):
    """
    Returns (allowed, message)
    """

    open_trades = (
        db.query(Trade)
        .filter(
            Trade.user_id == user.id,
            Trade.status == "OPEN"
        )
        .count()
    )

    if open_trades >= MAX_OPEN_TRADES:
        return False, "Maximum open trades reached."

    today_profit = (
        db.query(Trade)
        .filter(
            Trade.user_id == user.id,
            Trade.status == "CLOSED"
        )
        .all()
    )

    daily_profit = sum(t.profit for t in today_profit)

    if daily_profit <= MAX_DAILY_LOSS:
        return False, "Daily loss limit reached."

    if wallet.balance <= 0:
        return False, "Insufficient balance."

    return True, "OK"


def calculate_position_size(balance):
    """
    Risk only 10% of wallet.
    """

    return round(balance * MAX_RISK_PERCENT, 2)