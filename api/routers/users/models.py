import re
from datetime import datetime
from typing import Any, Optional

from pydantic import BaseModel, EmailStr, Field, field_validator, model_validator

from ...utils import PyObjectId

USERNAME_PATTERN = re.compile(r"^(?=[a-zA-Z0-9._]{3,20}$)(?!.*[_.]{2})[^_.].*[^_.]$")
PASSWORD_PATTERN = re.compile(
    r"^(?=.*?[A-Z])(?=.*?[a-z])(?=.*?[0-9])(?=.*?[#?!@$%^&*-]).{8,20}$"
)


class HandicapData(BaseModel):
    date: datetime
    handicap: float


class User(BaseModel):
    id: Optional[PyObjectId] = Field(alias="_id", default=None)
    name: str
    username: str
    email: str
    password_hash: str
    rounds: list[PyObjectId] = Field(default=[])
    handicap_data: list[HandicapData] = Field(default=[])


class LoginUser(BaseModel):
    username_or_email: str
    password: str

    @field_validator("username_or_email")
    @classmethod
    def format_username_or_email(cls, value: str) -> str:
        return value.strip().lower()


class RegisterUser(BaseModel):
    name: str = Field(min_length=1, max_length=30)
    username: str = Field(min_length=3, max_length=20, pattern=USERNAME_PATTERN)
    email: EmailStr
    password: str = Field(min_length=8, max_length=20, pattern=PASSWORD_PATTERN)
    password_confirmation: str

    @field_validator("name")
    @classmethod
    def format_name(cls, value: str) -> str:
        value = value.strip()
        value = re.sub(r"\s+", " ", value)
        value = value.title()
        return value

    @field_validator("email")
    @classmethod
    def format_email(cls, value: str) -> str:
        return value.strip().lower()

    @model_validator(mode="before")
    @classmethod
    def check_password_match(cls, data: dict[str, Any]) -> dict[str, Any]:
        if (
            "password" in data
            and "password_confirmation" in data
            and data["password"] != data["password_confirmation"]
        ):
            raise ValueError("Passwords do not match")
        return data
