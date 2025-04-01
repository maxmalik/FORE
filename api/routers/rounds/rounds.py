from datetime import datetime, timezone

from bson import ObjectId
from bson.errors import InvalidId
from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, Query, status
from motor.motor_asyncio import AsyncIOMotorCollection

from ...db import get_collection
from ...utils import PyObjectId
from ..courses.courses import Course, get_course
from ..users.handicap import calculate_handicap, calculate_score_differential
from ..users.models import HandicapData
from ..users.users import User, get_user
from .models import GetRound, PostRound, Round, RoundScorecard, ScorecardModeEnum

rounds_router = APIRouter()


async def verify_and_get_user(
    post_round: PostRound,
    users_collection: AsyncIOMotorCollection = Depends(get_collection("users")),
) -> User:
    return await get_user(post_round.user_id, users_collection)


async def verify_and_get_course(
    post_round: PostRound,
    courses_collection: AsyncIOMotorCollection = Depends(get_collection("courses")),
) -> Course:
    course = await get_course(post_round.course_id, courses_collection)

    tee_box_index = post_round.tee_box_index

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
    post_round: PostRound,
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
        post_round.scorecard_mode, post_round.scorecard, course.num_holes
    )

    current_user_handicap = (
        user.handicap_data[-1].handicap if user.handicap_data else None
    )

    score_differential = calculate_score_differential(
        post_round.scorecard,
        post_round.scorecard_mode,
        post_round.tee_box_index,
        course,
        current_user_handicap,
    )

    date_posted = datetime.now(tz=timezone.utc)

    finalized_round = Round(
        user_id=post_round.user_id,
        course_id=post_round.course_id,
        tee_box_index=post_round.tee_box_index,
        caption=post_round.caption,
        scorecard_mode=post_round.scorecard_mode,
        scorecard=post_round.scorecard,
        score_differential=score_differential,
        date_posted=date_posted,
    ).model_dump(exclude=["id"])

    # Convert string IDs to ObjectId
    finalized_round["user_id"] = ObjectId(finalized_round["user_id"])
    finalized_round["course_id"] = ObjectId(finalized_round["course_id"])

    # Add the round to the rounds collection
    insert_round_result = await rounds_collection.insert_one(finalized_round)

    background_tasks.add_task(
        update_user_after_post,
        user.id,
        user.rounds,
        PyObjectId(insert_round_result.inserted_id),
        date_posted,
        users_collection,
        rounds_collection,
    )

    background_tasks.add_task(
        update_course_after_post,
        course.id,
        PyObjectId(insert_round_result.inserted_id),
        courses_collection,
    )

    return {"detail": "success"}


# Update the user's rounds list and handicap data after they post a round
async def update_user_after_post(
    user_id: PyObjectId,
    user_round_ids: list[PyObjectId],
    inserted_round_id: PyObjectId,
    date_posted: datetime,
    users_collection: AsyncIOMotorCollection,
    rounds_collection: AsyncIOMotorCollection,
) -> None:

    new_round_ids = user_round_ids + [inserted_round_id]

    push_query = {"rounds": {"$each": [ObjectId(inserted_round_id)]}}

    # Calculate the new handicap if there are at least 3 scores (required by USGA)
    if len(new_round_ids) >= 3:
        rounds = await get_rounds(new_round_ids, rounds_collection)
        new_handicap = calculate_handicap(
            [golf_round.score_differential for golf_round in rounds]
        )

        handicap_data = HandicapData(
            handicap=new_handicap, date=date_posted
        ).model_dump()

        push_query["handicap_data"] = {"$each": [handicap_data]}

    await users_collection.update_one(
        {"_id": ObjectId(user_id)},
        {"$push": push_query},
    )


async def update_course_after_post(
    course_id: PyObjectId,
    inserted_round_id: PyObjectId,
    courses_collection: AsyncIOMotorCollection,
) -> None:
    await courses_collection.update_one(
        {"_id": ObjectId(course_id)},
        {"$push": {"rounds": {"$each": [ObjectId(inserted_round_id)]}}},
    )


@rounds_router.get(
    "/",
    description="Get multiple rounds given their IDs",
    response_model=list[GetRound],
    response_model_by_alias=False,
)
async def get_rounds(
    ids: list[PyObjectId] = Query(...),
    retrieve_course_data: bool = Query(
        False, description="Whether to retrieve course data for the rounds' courses"
    ),
    rounds_collection: AsyncIOMotorCollection = Depends(get_collection("rounds")),
    courses_collection: AsyncIOMotorCollection = Depends(get_collection("courses")),
) -> list[GetRound]:

    # Convert string/PyObjectId IDs to ObjectId
    try:
        object_ids = [ObjectId(id) for id in ids]
    except InvalidId as exception:
        raise HTTPException(status_code=422, detail="Invalid Round ID") from exception

    # Fetch rounds
    rounds = await rounds_collection.find({"_id": {"$in": object_ids}}).to_list(None)

    # Retrieve course data if requested
    if retrieve_course_data:
        course_object_ids: set[ObjectId] = {
            golf_round["course_id"] for golf_round in rounds
        }

        print(f"course ids: {course_object_ids}")

        courses = {}
        for course in await courses_collection.find(
            {"_id": {"$in": list(course_object_ids)}}
        ).to_list():
            courses[course["_id"]] = course

        print(f"courses: {courses}")

        for golf_round in rounds:
            golf_round["course"] = courses[golf_round["course_id"]]

    return [GetRound(**golf_round) for golf_round in rounds]
