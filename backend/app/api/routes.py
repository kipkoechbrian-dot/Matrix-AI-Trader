from fastapi import APIRouter

router = APIRouter()


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
def vip():
    return {
        "membership": "VIP",
        "price": "Coming Soon",
        "benefits": [
            "Trading Signals",
            "Priority Support",
            "AI Analysis"
        ]
    }


@router.get("/vvip")
def vvip():
    return {
        "membership": "VVIP",
        "price": "Coming Soon",
        "benefits": [
            "Everything in VIP",
            "Private AI Models",
            "Premium Trading Bots",
            "One-on-One Mentorship"
        ]
    }

from app.models.user import UserRegister


@router.post("/register")
def register(user: UserRegister):
    return {
        "message": "Registration successful!",
        "user": {
            "username": user.username,
            "email": user.email
        }
    }