from datetime import datetime, timezone

from bson import ObjectId
from bson.errors import InvalidId
from fastapi import APIRouter, Depends, HTTPException, Query, status
from motor.motor_asyncio import AsyncIOMotorCollection

from ...db import get_collection
from ..courses.courses import Course, get_course
from ..users.users import User, get_user
from .models import Round, RoundHole, RoundPost

rounds_router = APIRouter()


async def verify_and_get_user(
    round_post: RoundPost,
    users_collection: AsyncIOMotorCollection = Depends(get_collection("users")),
) -> User:
    return await get_user(round_post.user_id, users_collection)


async def verify_and_get_course(
    round_post: RoundPost,
    courses_collection: AsyncIOMotorCollection = Depends(get_collection("courses")),
) -> Course:
    course = await get_course(round_post.course_id, courses_collection)

    tee_box_index = round_post.tee_box_index

    if tee_box_index is not None:
        if tee_box_index < 0 or tee_box_index >= len(course.tee_boxes):
            raise HTTPException(
                status_code=400, detail="Provided tee box index is out of range"
            )

    return course


def sync_hole_info_with_scorecard(
    scorecard: dict[str, int], tee_box_index: int | None, course: Course
) -> dict[str, RoundHole]:
    new_scorecard = dict()

    if tee_box_index is not None:
        tee_box_name = f"teeBox{tee_box_index+1}"

    for hole_number_index in range(course.num_holes):

        hole_number_str = str(hole_number_index + 1)
        score = scorecard.get(hole_number_str, None)

        if len(course.scorecard) == 0:
            par = None
            yards = None
            handicap = None

        else:

            par = course.scorecard[hole_number_index].par
            if tee_box_index is not None:
                yards = course.scorecard[hole_number_index].tees[tee_box_name].yards
            else:
                yards = None
            handicap = course.scorecard[hole_number_index].handicap

        new_scorecard[hole_number_str] = RoundHole(
            score=score, par=par, yards=yards, handicap=handicap
        )

    return new_scorecard


@rounds_router.post(
    "/",
    response_description="Post a new round",
    response_model=Round,
    status_code=status.HTTP_201_CREATED,
    response_model_by_alias=False,
)
async def post_round(
    round_post: RoundPost,
    users_collection: AsyncIOMotorCollection = Depends(get_collection("users")),
    courses_collection: AsyncIOMotorCollection = Depends(get_collection("courses")),
    rounds_collection: AsyncIOMotorCollection = Depends(get_collection("rounds")),
    user=Depends(verify_and_get_user),  # Ensure the user ID provided actually exists
    course=Depends(
        verify_and_get_course
    ),  # Ensure the course ID provided actually exists
):

    new_scorecard = sync_hole_info_with_scorecard(
        round_post.scorecard, round_post.tee_box_index, course
    )

    finalized_round = Round(
        user_id=round_post.user_id,
        course_id=round_post.course_id,
        tee_box_index=round_post.tee_box_index,
        scorecard=new_scorecard,
        date_posted=datetime.now(tz=timezone.utc),
    ).model_dump(exclude=["id"])

    # Add the round to the rounds collection
    insert_round_result = await rounds_collection.insert_one(finalized_round)

    # Add the round to the user's rounds list
    await users_collection.update_one(
        {"_id": ObjectId(user.id)},
        {
            "$push": {
                "rounds": {"$each": [insert_round_result.inserted_id], "$position": 0}
            }
        },
    )

    # Add the round to the course's rounds list
    await courses_collection.update_one(
        {"_id": ObjectId(course.id)},
        {
            "$push": {
                "rounds": {"$each": [insert_round_result.inserted_id], "$position": 0}
            }
        },
    )

    # Return the created round
    created_round = await rounds_collection.find_one(
        {"_id": insert_round_result.inserted_id}
    )
    return created_round


@rounds_router.get(
    "/",
    response_model=list[Round],
    description="Get multiple rounds given their IDs",
    response_model_by_alias=False,
)
async def get_rounds(
    ids: list[str] = Query(...),
    rounds_collection: AsyncIOMotorCollection = Depends(get_collection("rounds")),
):
    try:
        object_ids = [ObjectId(id) for id in ids]
    except InvalidId as exception:
        raise HTTPException(status_code=422, detail="Invalid Round ID") from exception

    rounds = await rounds_collection.find({"_id": {"$in": object_ids}}).to_list()

    return rounds
