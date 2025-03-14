import heapq

from bson import ObjectId
from bson.errors import InvalidId
from fastapi import APIRouter, Depends, HTTPException, Query, status
from motor.motor_asyncio import AsyncIOMotorCollection

from ...db import get_collection
from ..courses.courses import get_course_api
from ..courses.models import Course
from ..rounds.models import Round, RoundScorecard
from ..rounds.rounds import get_rounds
from .models import LoginUser, RegisterUser, User
from .utils import get_password_hash, verify_password

users_router = APIRouter()


@users_router.post(
    "/login",
    response_description="Log a user in",
    response_model=User,
    response_model_by_alias=False,
)
async def login(
    login_user: LoginUser,
    users_collection: AsyncIOMotorCollection = Depends(get_collection("users")),
):

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


@users_router.post(
    "/register",
    response_description="Register a new user",
    response_model=User,
    status_code=status.HTTP_201_CREATED,
    response_model_by_alias=False,
)
async def register(
    register_user: RegisterUser,
    users_collection: AsyncIOMotorCollection = Depends(get_collection("users")),
):

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


@users_router.get(
    "/username-taken/{username}",
    response_description="Determine if a username is taken",
)
async def username_taken(
    username: str,
    users_collection: AsyncIOMotorCollection = Depends(get_collection("users")),
):

    # Search for any user with the username
    user = await users_collection.find_one({"username": username})

    # If a user exists with the username
    if user is not None:
        raise HTTPException(status_code=409, detail="Username is already taken")

    return {"detail": "Username is available"}


@users_router.get(
    "/email-taken/{email}", response_description="Determine if an email is taken"
)
async def email_taken(
    email: str,
    users_collection: AsyncIOMotorCollection = Depends(get_collection("users")),
):

    # Search for any user with the email
    user = await users_collection.find_one({"email": email})

    # If a user exists with the email
    if user is not None:
        raise HTTPException(status_code=409, detail="Email is already taken")

    return {"detail": "Email is available"}


async def get_user(
    user_id: str,
    users_collection: AsyncIOMotorCollection,
) -> User:

    try:
        user_object_id = ObjectId(user_id)
    except InvalidId as exception:
        raise HTTPException(status_code=422, detail="Invalid User ID") from exception

    user = await users_collection.find_one({"_id": user_object_id})

    if user is None:
        raise HTTPException(status_code=404, detail="User not found")

    return User(**user)


@users_router.get("/{user_id}")
async def get_user_api(
    user_id: str,
    users_collection: AsyncIOMotorCollection = Depends(get_collection("users")),
):
    return await get_user(
        ObjectId(user_id),
        users_collection,
    )


HANDICAP_ADJUSTMENTS = {3: -2, 4: -1, 5: 0, 6: -1}

def course_handicap(player_handicap: float, slope_rating: float, course_rating: float, course_par: int ) -> float:
    return player_handicap * (slope_rating / 113 ) + (course_rating) - course_par

def adjust_hole_scores(scorecard: RoundScorecard, player_handicap: float | None, slope_rating: float | None, course_rating: float | None):

    for hole in scorecard.values():
        if not player_handicap:
            hole["score"] = min(hole["score"], hole["par"] + 5)
        else:



def score_differential():

async def calculate_handicap(
    rounds: list[Round], course_data: dict[str, Course]
) -> float:

    heap = []

    for round in rounds:

        if round.course_id not in course_data:
            course_data[round.course_id] = await get_course_api(round.course_id)

        course = course_data[round.course_id]


@users_router.get("/{user_id}/handicap")
async def get_user_handicap_data(
    user_id: str,
    users_collection: AsyncIOMotorCollection = Depends(get_collection("users")),
    rounds_collection: AsyncIOMotorCollection = Depends(get_collection("rounds")),
    courses_collection: AsyncIOMotorCollection = Depends(get_collection("courses")),
    user=Depends(get_user_api),
):

    if len(user.rounds) < 3:
        raise HTTPException(
            status_code=400, detail="Cannot calculate handicap with less than 3 rounds"
        )

    rounds = get_rounds(user.rounds)

    # Reverse rounds array because they are stored in database from present to past
    rounds_chronological = reversed(rounds)

    handicaps = []

    # Compute the handicap after each round played
    for round_number in range(3, len(rounds_chronological)):

        # TODO: Get the required course data beforehand

        handicap = calculate_handicap(rounds_chronological[:round_number])
        handicaps.append([rounds_chronological[round_number].date_posted, handicap])
