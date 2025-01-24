from fastapi import APIRouter, Depends, HTTPException, status
from motor.motor_asyncio import AsyncIOMotorCollection

from ...db import get_collection
from .models import LoginUser, RegisterUser, User
from .utils import get_password_hash, verify_password

router = APIRouter(
    prefix="/users", tags=["Users"], dependencies=[Depends(get_collection("users"))]
)


@router.post(
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


@router.post(
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


@router.get(
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


@router.get(
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
