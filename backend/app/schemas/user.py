from pydantic import BaseModel, EmailStr


class UserRegister(BaseModel):
    username: str
    email: EmailStr
    password: str


class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserUpdate(BaseModel):
    username: str
    email: EmailStr

class ChangePassword(BaseModel):
    current_password: str
    new_password: str

class UpgradeMembership(BaseModel):
    email: EmailStr

class UserResponse(BaseModel):
    id: int
    username: str
    email: EmailStr
    account_type: str

    class Config:
        from_attributes = True

class DepositRequest(BaseModel):
    amount: float

class WithdrawRequest(BaseModel):
    amount: float