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


async def verify_and_get_round(
    round_id: PyObjectId,
    rounds_collection: AsyncIOMotorCollection = Depends(get_collection("rounds")),
) -> User:
    return await get_round(round_id, rounds_collection)


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

    else:
        raise HTTPException(
            status_code=422, detail=f"Invalid scorecard mode {scorecard_mode}"
        )


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
        user_id=user.id,
        course_id=course.id,
        tee_box_index=post_round.tee_box_index,
        caption=post_round.caption,
        scorecard_mode=post_round.scorecard_mode,
        scorecard=post_round.scorecard,
        score_differential=score_differential,
        date_posted=date_posted,
    ).model_dump(exclude=["id"])

    # Convert string IDs to ObjectId
    finalized_round["user_id"] = ObjectId(user.id)
    finalized_round["course_id"] = ObjectId(course.id)

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
        rounds = await get_rounds(
            ids=new_round_ids,
            retrieve_course_data=False,
            rounds_collection=rounds_collection,
        )
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


async def get_round(
    round_id: PyObjectId,
    rounds_collection: AsyncIOMotorCollection,
) -> Round:

    try:
        course_object_id = ObjectId(round_id)
    except InvalidId as exception:
        raise HTTPException(status_code=422, detail="Invalid Round ID") from exception

    round = await rounds_collection.find_one({"_id": course_object_id})

    if round is None:
        raise HTTPException(status_code=404, detail="Round not found")

    return Round(**round)


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
    order: str = Query(
        None, regex="^(asc|desc)$", description="Sort order for the rounds"
    ),
    rounds_collection: AsyncIOMotorCollection = Depends(get_collection("rounds")),
    courses_collection: AsyncIOMotorCollection = Depends(get_collection("courses")),
) -> list[GetRound]:

    # Convert string/PyObjectId IDs to ObjectId
    try:
        object_ids = [ObjectId(id) for id in ids]
    except InvalidId as exception:
        raise HTTPException(status_code=422, detail="Invalid Round ID") from exception

    if order == "asc":
        direction = 1
    elif order == "desc":
        direction = -1
    else:
        direction = None

    # Fetch rounds
    rounds = (
        await rounds_collection.find({"_id": {"$in": object_ids}})
        .sort("date_posted", direction)
        .to_list(None)
    )

    # Retrieve course data if requested
    if retrieve_course_data:
        course_object_ids: set[ObjectId] = {
            golf_round["course_id"] for golf_round in rounds
        }

        courses = {}
        for course in await courses_collection.find(
            {"_id": {"$in": list(course_object_ids)}}
        ).to_list():
            courses[course["_id"]] = course

        for golf_round in rounds:
            golf_round["course"] = courses[golf_round["course_id"]]

    return [GetRound(**golf_round) for golf_round in rounds]


@rounds_router.put(
    "/{round_id}",
    response_description="Update a round",
    response_model=Round,
)
async def update_round(
    round_id: str,
    update_round: PostRound,
    users_collection: AsyncIOMotorCollection = Depends(get_collection("users")),
    courses_collection: AsyncIOMotorCollection = Depends(get_collection("courses")),
    rounds_collection: AsyncIOMotorCollection = Depends(get_collection("rounds")),
    user: User = Depends(
        verify_and_get_user
    ),  # Ensure the user ID provided actually exists
    course: Course = Depends(
        verify_and_get_course
    ),  # Ensure the course ID provided actually exists
    round: Round = Depends(
        verify_and_get_round
    ),  # Ensure the round ID provided actually exists
):
    validate_scorecard(
        update_round.scorecard_mode, update_round.scorecard, course.num_holes
    )

    # Get the user's handicap just before the original round was posted
    current_user_handicap = None
    for index, handicap_data in enumerate(user.handicap_data):
        if handicap_data.date == round.date_posted:
            if index - 1 >= 0:
                current_user_handicap = user.handicap_data[index - 1].handicap
            break

    score_differential = calculate_score_differential(
        update_round.scorecard,
        update_round.scorecard_mode,
        update_round.tee_box_index,
        course,
        current_user_handicap,
    )

    updated_round = Round(
        id=round.id,
        user_id=user.id,
        course_id=course.id,
        tee_box_index=update_round.tee_box_index,
        caption=update_round.caption,
        scorecard_mode=update_round.scorecard_mode,
        scorecard=update_round.scorecard,
        score_differential=score_differential,
        date_posted=round.date_posted,
    ).model_dump(by_alias=True)

    updated_round["_id"] = ObjectId(round.id)
    updated_round["user_id"] = ObjectId(user.id)
    updated_round["course_id"] = ObjectId(course.id)

    updated_round_result = await rounds_collection.replace_one(
        {"_id": updated_round["_id"]}, updated_round
    )

    # UPDATE USER AND COURSE DATA


async def update_user_after_update(
    user_id: PyObjectId,
    user_round_ids: list[PyObjectId],
    user_handicap_data: list[HandicapData],
    updated_round_date: datetime,
    rounds_collection: AsyncIOMotorCollection,
):

    rounds = await get_rounds(user_round_ids, True, "asc", rounds_collection)

    for handicap_data in user_handicap_data:
        if handicap_data.date < updated_round_date:
            continue

        rounds_to_include = [r for r in rounds if r.date_posted <= handicap_data.date]
