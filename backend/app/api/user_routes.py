from fastapi import APIRouter

router = APIRouter(
    tags=["Users"]
)


@router.get("/users")
def users_placeholder():
    return {
        "message": "User routes coming soon."
    }