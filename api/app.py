import os
import re
from typing import Annotated, Any, Optional, Union

import bcrypt
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import (
    BaseModel,
    BeforeValidator,
    EmailStr,
    Field,
    field_validator,
    model_validator,
)

load_dotenv(dotenv_path="../.env")

client = AsyncIOMotorClient(os.environ["MONGODB_URL"])
db = client.get_database("fore_database")
users_collection = db.get_collection("users")
rounds_collection = db.get_collection("rounds")
courses_collection = db.get_collection("courses")


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


class UserPreview(User):

    class Config:
        fields = {
            "id": ...,
            "name": ...,
            "username": ...,
        }


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
    score: Optional[int] = Field(ge=1)  # Manually entered by user
    par: Optional[int]
    yards: Optional[int]


# TODO: change name
class Course(BaseModel):
    id: Optional[PyObjectId] = Field(alias="_id", default=None)
    address: str
    city: str
    coordinates: str
    country: str
    created_at: str
    fairway_grass: str
    green_grass: str
    holes: int
    length_format: str
    likes: list
    name: str
    phone: str
    scorecard: list[dict[str, Any]]
    state: str
    tee_boxes: list[dict[str, Any]]
    updated_at: str
    website: str
    zip: str


# Contains simple information about a course for quick display on the frontend UI
class CoursePreview(Course):

    class Config:
        fields = {
            "id": ...,
            "name": ...,
            "num_holes": ...,
            "city": ...,
            "state": ...,
            "country": ...,
            "length_format": ...,
        }


class Round(BaseModel):
    id: Optional[PyObjectId] = Field(alias="_id", default=None)
    user: UserPreview
    course: CoursePreview
    tees: Optional[str]
    scorecard: dict[str, Hole]

    # TODO: Make sure this is correct
    @model_validator(mode="before")
    @classmethod
    def sanitize_scorecard(cls, data: dict[str, Any]) -> dict[str, Any]:

        sanitized_scorecard = {}

        num_holes = data["course"]["num_holes"]

        for hole_number in range(1, num_holes + 1):

            if str(hole_number) in data["scorecard"]:
                hole = data["scorecard"][str(hole_number)]
                sanitized_scorecard[str(hole_number)] = hole

        data["scorecard"] = sanitized_scorecard

        return data


@app.post(
    "/rounds",
    response_description="Post a new round",
    response_model=Round,
    status_code=status.HTTP_201_CREATED,
    response_model_by_alias=False,
)
async def post_round(round: Round):

    new_round = await rounds_collection.insert_one(
        round.model_dump(by_alias=True, exclude=["id"])
    )

    created_round = await rounds_collection.find_one({"_id": new_round.inserted_id})

    return created_round


@app.post("/sanitize-courses")
async def sanitize_courses():

    cursor = courses_collection.find({})

    async for course in cursor:

        course_name = course["name"]
        print(f"Sanitizing {course_name}")
        if "holes" in course:
            course["num_holes"] = int(course["holes"])
            del course["holes"]
        if "city" in course and course["city"]:
            course["city"] = course["city"].title().strip()
        if "state" in course and course["state"]:
            course["state"] = course["state"].title().strip()
        if "country" in course and course["country"]:
            course["country"] = course["country"].title().strip()
        if "address" in course and course["address"]:
            course["address"] = course["address"].title().strip()
        if "name" in course and course["name"]:
            course["name"] = course["name"].title().strip()
        if "fairwayGrass" in course:
            course["fairway_grass"] = course["fairwayGrass"].strip()
            del course["fairwayGrass"]
        if "greenGrass" in course:
            course["green_grass"] = course["greenGrass"].strip()
            del course["greenGrass"]
        if "createdAt" in course:
            course["created_at"] = course["createdAt"]
            del course["createdAt"]
        if "lengthFormat" in course:
            course["length_format"] = course["lengthFormat"].strip()
            del course["lengthFormat"]
        if "teeBoxes" in course:
            for teebox in course["teeBoxes"]:
                if "tee" in teebox:
                    teebox["tee"] = teebox["tee"].title().strip()

            course["tee_boxes"] = course["teeBoxes"]
            del course["teeBoxes"]

        if "updatedAt" in course:
            course["updated_at"] = course["updatedAt"]
            del course["updatedAt"]

        if "scorecard" in course:
            for hole in course["scorecard"]:
                if "tees" in hole:
                    for value in hole["tees"].values():
                        if "color" in value:
                            value["color"] = value["color"].title().strip()

        await courses_collection.replace_one({"_id": course["_id"]}, course)

    return {"detail": "Success"}


class SearchCourses(BaseModel):
    name: str


@app.post("/courses/search")
async def search_courses(course_search: SearchCourses):

    query = {"$text": {"$search": f'"{course_search.name}"'}}

    results = await courses_collection.find(query).to_list(length=20)

    return results
