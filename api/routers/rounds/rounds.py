from datetime import datetime, timezone

from bson import ObjectId
from bson.errors import InvalidId
from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, Query, status
from motor.motor_asyncio import AsyncIOMotorCollection

from ...db import get_collection
from ..courses.courses import Course, get_course
from ..users.handicap import calculate_handicap, calculate_score_differential
from ..users.users import User, get_user
from .models import Round, RoundGet, RoundPost, RoundScorecard, ScorecardModeEnum

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


# Raises an error if there is an issue with the scorecard
def validate_scorecard(
    scorecard_mode: ScorecardModeEnum, scorecard: dict[str, int], course_num_holes: int
) -> None:
    if scorecard_mode == ScorecardModeEnum.all_holes:
        # Ensure scores for all holes are provided in the scorecard
        for hole_number in range(1, course_num_holes + 1):
            if str(hole_number) not in scorecard:
                raise HTTPException(
                    status_code=422,
                    detail=f"Hole {hole_number} not provided in scorecard",
                )

    elif scorecard_mode == ScorecardModeEnum.front_and_back:
        # Ensure course is 18 holes and both front and back 9 scores are provided
        if course_num_holes != 18:
            raise HTTPException(
                status_code=422,
                detail="Cannot use front and back mode if course is not 18 holes",
            )
        if "front" not in scorecard:
            raise HTTPException(
                status_code=422, detail="Front 9 not provided in scorecard"
            )
        if "back" not in scorecard:
            raise HTTPException(
                status_code=422, detail="Back 9 not provided in scorecard"
            )

    elif scorecard_mode == ScorecardModeEnum.total_score:
        # Ensure the total score is provided
        if "total" not in scorecard:
            raise HTTPException(
                status_code=422, detail="Total not provided in scorecard"
            )


def get_tee_box_name(tee_box_index: int | None) -> str | None:
    return f"teeBox{tee_box_index+1}" if tee_box_index is not None else None


@rounds_router.post(
    "/",
    response_description="Post a new round",
    status_code=status.HTTP_201_CREATED,
)
async def post_round(
    round_post: RoundPost,
    background_tasks: BackgroundTasks,
    users_collection: AsyncIOMotorCollection = Depends(get_collection("users")),
    courses_collection: AsyncIOMotorCollection = Depends(get_collection("courses")),
    rounds_collection: AsyncIOMotorCollection = Depends(get_collection("rounds")),
    user: User = Depends(
        verify_and_get_user
    ),  # Ensure the user ID provided actually exists
    course: Course = Depends(
        verify_and_get_course
    ),  # Ensure the course ID provided actually exists
) -> dict:

    validate_scorecard(
        round_post.scorecard_mode, round_post.scorecard, course.num_holes
    )

    if user.handicap_data:
        current_user_handicap = user.handicap_data[-1].handicap
    else:
        current_user_handicap = None

    score_differential = calculate_score_differential(
        round_post.scorecard,
        round_post.scorecard_mode,
        round_post.tee_box_index,
        course,
        current_user_handicap,
    )

    date_posted = datetime.now(tz=timezone.utc)

    finalized_round = Round(
        user_id=round_post.user_id,
        course_id=round_post.course_id,
        tee_box_index=round_post.tee_box_index,
        caption=round_post.caption,
        scorecard_mode=round_post.scorecard_mode,
        scorecard=round_post.scorecard,
        score_differential=score_differential,
        date_posted=date_posted,
    ).model_dump(exclude=["id"])

    # Add the round to the rounds collection
    insert_round_result = await rounds_collection.insert_one(finalized_round)

    background_tasks.add_task(
        update_user_after_post,
        user.id,
        user.rounds,
        str(insert_round_result.inserted_id),
        date_posted,
        users_collection,
        rounds_collection,
    )

    background_tasks.add_task(
        update_course_after_post,
        course.id,
        str(insert_round_result.inserted_id),
        courses_collection,
    )

    return {"detail": "success"}


# Update the user's rounds list and handicap data after they post a round
async def update_user_after_post(
    user_id: str,
    user_round_ids: list[str],
    inserted_round_id: str,
    date_posted: datetime,
    users_collection: AsyncIOMotorCollection,
    rounds_collection: AsyncIOMotorCollection,
) -> None:

    new_round_ids = user_round_ids + [inserted_round_id]

    push_query = {"rounds": {"$each": [inserted_round_id]}}

    if len(new_round_ids) >= 3:
        rounds = await get_rounds(new_round_ids, rounds_collection)
        new_handicap = calculate_handicap(
            [round.score_differential for round in rounds]
        )

        push_query["handicap_data"] = {
            "$each": [
                {
                    "handicap": new_handicap,
                    "date": date_posted,
                }
            ]
        }

    await users_collection.update_one(
        {"_id": ObjectId(user_id)},
        {"$push": push_query},
    )


async def update_course_after_post(
    course_id: str,
    inserted_round_id: str,
    courses_collection: AsyncIOMotorCollection,
) -> None:
    await courses_collection.update_one(
        {"_id": ObjectId(course_id)},
        {"$push": {"rounds": {"$each": [inserted_round_id]}}},
    )


@rounds_router.get(
    "/",
    description="Get multiple rounds given their IDs",
    response_model=list[RoundGet],
    response_model_by_alias=False,
)
async def get_rounds(
    ids: list[str] = Query(...),
    retrieve_course_data: bool = Query(
        False, description="Whether to retrieve course data for the rounds's courses"
    ),
    rounds_collection: AsyncIOMotorCollection = Depends(get_collection("rounds")),
    courses_collection: AsyncIOMotorCollection = Depends(get_collection("courses")),
) -> list[RoundGet]:

    try:
        object_ids = [ObjectId(id) if isinstance(id, str) else id for id in ids]
    except InvalidId as exception:
        raise HTTPException(status_code=422, detail="Invalid Round ID") from exception

    rounds = await rounds_collection.find({"_id": {"$in": object_ids}}).to_list()

    if retrieve_course_data:
        for round in rounds:
            course = await courses_collection.find_one(
                {"_id": ObjectId(round["course_id"])}
            )
            if course:
                round["course"] = course

    return [RoundGet(**round) for round in rounds]
