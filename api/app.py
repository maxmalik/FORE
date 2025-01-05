import os
import re
from typing import Any, Annotated, Optional, Union

import bcrypt
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import (
    BaseModel,
    EmailStr,
    field_validator,
    model_validator,
    Field,
    BeforeValidator,
)

load_dotenv()

client = AsyncIOMotorClient(os.environ["MONGODB_URL"])
db = client.get_database("fore_database")
users_collection = db.get_collection("users")
rounds_collection = db.get_collection("rounds")

USERNAME_PATTERN = re.compile(r"^(?=[a-zA-Z0-9._]{3,20}$)(?!.*[_.]{2})[^_.].*[^_.]$")
PASSWORD_PATTERN = re.compile(
    r"^(?=.*?[A-Z])(?=.*?[a-z])(?=.*?[0-9])(?=.*?[#?!@$%^&*-]).{8,20}$"
)

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

PyObjectId = Annotated[str, BeforeValidator(str)]


class User(BaseModel):
    id: Optional[PyObjectId] = Field(alias="_id", default=None)
    name: str
    username: str
    email: str
    password_hash: str


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


def get_password_hash(password: str) -> str:
    # Convert password to an array of bytes
    bytes = password.encode("utf-8")

    # Generate the salt
    salt = bcrypt.gensalt()

    # Hash the password
    password_hash = bcrypt.hashpw(bytes, salt)

    return password_hash.decode("utf-8")


def verify_password(stored_hash: str, entered_password: str) -> bool:
    # Convert entered password to an array of bytes
    entered_bytes = entered_password.encode("utf-8")

    # Convert stored password hash to an array of bytes
    stored_bytes = stored_hash.encode("utf-8")

    return bcrypt.checkpw(entered_bytes, stored_bytes)


@app.post(
    "/users/login",
    response_description="Log a user in",
    response_model=User,
    response_model_by_alias=False,
)
async def login(login_user: LoginUser):

    # Look for a match on either email or username
    query = {
        "$or": [
            {"username": login_user.username_or_email},
            {"email": login_user.username_or_email},
        ]
    }

    # Get the record for the user
    user = await users_collection.find_one(query)

    # If no user found
    if user is None:
        raise HTTPException(status_code=404, detail="No user found")

    # Compare the hash of the entered password to the hash of the existing password
    if not verify_password(user["password_hash"], login_user.password):
        raise HTTPException(status_code=401, detail="Incorrect password")

    return user


@app.post(
    "/users/register",
    response_description="Register a new user",
    response_model=User,
    status_code=status.HTTP_201_CREATED,
    response_model_by_alias=False,
)
async def register(register_user: RegisterUser):

    # Check to see if a user already exists with the desired username or email
    existing_user_by_username = await users_collection.find_one(
        {"username": register_user.username}
    )
    existing_user_by_email = await users_collection.find_one(
        {"email": register_user.email}
    )

    # If both the username and email are already taken
    if existing_user_by_username is not None and existing_user_by_email is not None:
        raise HTTPException(
            status_code=409, detail="Username and email are both already taken"
        )

    # If just the username is already taken
    elif existing_user_by_username is not None:
        raise HTTPException(status_code=409, detail="Username is already taken")

    # If just the email is already taken
    elif existing_user_by_email is not None:
        raise HTTPException(status_code=409, detail="Email is already taken")

    user_to_insert = User(
        name=register_user.name,
        username=register_user.username,
        email=register_user.email,
        password_hash=get_password_hash(register_user.password),
    )

    # Insert a new user record. A unique "id" will be created and provided in the response
    new_user = await users_collection.insert_one(
        user_to_insert.model_dump(by_alias=True, exclude=["id"])
    )

    # Use the inserted_id to find the document of the newly created user
    created_user = await users_collection.find_one({"_id": new_user.inserted_id})

    return created_user


@app.get(
    "/users/username-taken/{username}",
    response_description="Determine if a username is taken",
)
async def username_taken(username: str):

    # Search for any user with the username
    user = await users_collection.find_one({"username": username})

    # If a user exists with the username
    if user is not None:
        raise HTTPException(status_code=409, detail="Username is already taken")

    return {"detail": "Username is available"}


@app.get(
    "/users/email-taken/{email}", response_description="Determine if an email is taken"
)
async def email_taken(email: str):

    # Search for any user with the email
    user = await users_collection.find_one({"email": email})

    # If a user exists with the email
    if user is not None:
        raise HTTPException(status_code=409, detail="Email is already taken")

    return {"detail": "Email is available"}


class Hole(BaseModel):
    score: Optional[int] = Field(ge=1)
    par: Optional[int] = Field(ge=1)
    tees: Optional[str]
    yards: Optional[int] = Field(ge=0)


class Course(BaseModel):
    id: str
    name: str
    num_holes: Union[str, int]
    city: Optional[str]
    state: Optional[str]
    country: Optional[str]
    length_format: str

    @field_validator("num_holes")
    @classmethod
    def convert_num_holes_to_int(cls, value: Union[str, int]) -> int:
        if isinstance(value, str):
            try:
                return int(value)
            except ValueError:
                raise ValueError(f"Cannot convert {value} to integer")
        return value


class Round(BaseModel):
    id: Optional[PyObjectId] = Field(alias="_id", default=None)
    user_id: str
    user_name: str
    user_username: str
    course: Course
    scorecard: dict[str, Hole]

    # Do some common sense validation on the scorecard keys (hole numbers)
    @field_validator("scorecard")
    @classmethod
    def validate_scorecard_keys(cls, value: dict[str, Hole]) -> dict[str, Hole]:
        # Convert the string keys to integers, then sort them in ascending order
        hole_number_keys = [int(key) for key in value.keys()]
        sorted_hole_number_keys = sorted(hole_number_keys)

        # Ensure all hole numbers are positive
        hole_numbers_are_positive: bool = all(
            hole_key > 0 for hole_key in sorted_hole_number_keys
        )
        if not hole_numbers_are_positive:
            raise ValueError("Hole numbers are not all positive")

        # Ensure hole numbers have step 1 (i.e. no holes are skipped)
        hole_numbers_have_step_1: bool = all(
            sorted_hole_number_keys[i + 1] == sorted_hole_number_keys[i] + 1
            for i in range(len(sorted_hole_number_keys) - 1)
        )
        if not hole_numbers_have_step_1:
            raise ValueError("Hole numbers do not have step 1")

        # Ensure the first hole is 1
        first_hole_is_1: bool = sorted_hole_number_keys[0] == 1
        if not first_hole_is_1:
            raise ValueError("First hole is not 1")

        return value

    class Config:
        str_strip_whitespace = True


@app.post(
    "/rounds",
    response_description="Add a new round",
    response_model=Round,
    status_code=status.HTTP_201_CREATED,
    response_model_by_alias=False,
)
async def add_round(round: Round):

    new_round = await rounds_collection.insert_one(
        round.model_dump(by_alias=True, exclude=["id"])
    )

    created_round = await rounds_collection.find_one({"_id": new_round.inserted_id})

    return created_round


# @app.delete("/rounds/{round_id}")
# async def delete_round(round_id: str):

#     # delete the round here
