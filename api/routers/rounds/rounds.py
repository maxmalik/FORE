from datetime import datetime, timezone

from bson import ObjectId
from bson.errors import InvalidId
from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, Query, status
from motor.motor_asyncio import AsyncIOMotorCollection

from ...db import get_collection
from ..courses.courses import Course, get_course
from ..users.handicap import calculate_score_differential, calculate_updated_handicap
from ..users.users import User, get_user
from .models import Round, RoundPost, RoundScorecard, ScorecardModeEnum

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


def validate_scorecard(
    scorecard_mode: ScorecardModeEnum, scorecard: dict[str, int], course: Course
):
    if scorecard_mode == ScorecardModeEnum.all_holes:
        for hole_number in range(1, course.num_holes + 1):
            if str(hole_number) not in scorecard:
                raise HTTPException(
                    status_code=422,
                    detail=f"Hole {hole_number} not provided in scorecard",
                )

    elif scorecard_mode == ScorecardModeEnum.front_and_back:
        if course.num_holes != 18:
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
        if "total" not in scorecard:
            raise HTTPException(
                status_code=422, detail="Total not provided in scorecard"
            )


def get_tee_box_name(tee_box_index: int | None) -> str | None:
    return f"teeBox{tee_box_index+1}" if tee_box_index is not None else None


def calculate_par_and_yards(
    course: Course, hole_range: range, tee_box_name: str | None
) -> tuple[int, int]:
    total_par = (
        sum(course.scorecard[i].par for i in hole_range) if course.scorecard else None
    )
    total_yards = (
        sum(course.scorecard[i].tees[tee_box_name].yards for i in hole_range)
        if course.scorecard and tee_box_name
        else None
    )
    return total_par, total_yards


def sync_info_with_scorecard(
    scorecard: RoundScorecard,
    tee_box_index: int | None,
    course: Course,
    scorecard_mode: ScorecardModeEnum,
) -> RoundScorecard:
    tee_box_name = get_tee_box_name(tee_box_index)

    match scorecard_mode:
        case ScorecardModeEnum.total_score:
            total_par, total_yards = calculate_par_and_yards(
                course, range(course.num_holes), tee_box_name
            )
            return {
                "total": {
                    "score": scorecard["total"],
                    "par": total_par,
                    "yards": total_yards,
                }
            }

        case ScorecardModeEnum.front_and_back:
            front_par, front_yards = calculate_par_and_yards(
                course, range(9), tee_box_name
            )
            back_par, back_yards = calculate_par_and_yards(
                course, range(9, 18), tee_box_name
            )
            return {
                "front": {
                    "score": scorecard["front"],
                    "par": front_par,
                    "yards": front_yards,
                },
                "back": {
                    "score": scorecard["back"],
                    "par": back_par,
                    "yards": back_yards,
                },
            }

        case ScorecardModeEnum.all_holes:
            new_scorecard = {}
            for hole_number in range(1, course.num_holes + 1):
                par = (
                    course.scorecard[hole_number - 1].par if course.scorecard else None
                )
                yards = (
                    course.scorecard[hole_number - 1].tees[tee_box_name].yards
                    if course.scorecard and tee_box_name
                    else None
                )
                handicap = (
                    course.scorecard[hole_number - 1].handicap
                    if course.scorecard
                    else None
                )
                new_scorecard[str(hole_number)] = {
                    "score": scorecard.get(str(hole_number), None),
                    "par": par,
                    "yards": yards,
                    "handicap": handicap,
                }
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
    background_tasks: BackgroundTasks,
    users_collection: AsyncIOMotorCollection = Depends(get_collection("users")),
    courses_collection: AsyncIOMotorCollection = Depends(get_collection("courses")),
    rounds_collection: AsyncIOMotorCollection = Depends(get_collection("rounds")),
    user=Depends(verify_and_get_user),  # Ensure the user ID provided actually exists
    course=Depends(
        verify_and_get_course
    ),  # Ensure the course ID provided actually exists
):

    validate_scorecard(round_post.scorecard_mode, round_post.scorecard, course)

    new_scorecard = sync_info_with_scorecard(
        round_post.scorecard,
        round_post.tee_box_index,
        course,
        round_post.scorecard_mode,
    )

    if user.handicap_data:
        current_user_handicap = user.handicap_data[-1].handicap
    else:
        current_user_handicap = None

    score_differential = calculate_score_differential(
        new_scorecard,
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
        scorecard=new_scorecard,
        score_differential=score_differential,
        date_posted=date_posted,
    ).model_dump(exclude=["id"])

    # Add the round to the rounds collection
    insert_round_result = await rounds_collection.insert_one(finalized_round)

    background_tasks.add_task(
        update_user,
        user.id,
        user.rounds,
        insert_round_result.inserted_id,
        date_posted,
        users_collection,
        rounds_collection,
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


# Update the user's rounds list and handicap data after they post a round
async def update_user(
    user_id: ObjectId,
    round_ids: list[ObjectId],
    inserted_round_id: ObjectId,
    date_posted: datetime,
    users_collection: AsyncIOMotorCollection,
    rounds_collection: AsyncIOMotorCollection,
):

    new_round_ids = round_ids + [inserted_round_id]
    new_round_id_strings = [str(id) for id in new_round_ids]

    push_query = {"rounds": {"$each": [inserted_round_id], "$position": 0}}

    if len(new_round_ids) >= 3:
        rounds = await get_rounds(new_round_id_strings, rounds_collection)
        new_handicap = calculate_updated_handicap(
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
        {"_id": user_id},
        {"$push": push_query},
    )


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
        object_ids = [ObjectId(id) if isinstance(id, str) else id for id in ids]
    except InvalidId as exception:
        raise HTTPException(status_code=422, detail="Invalid Round ID") from exception

    rounds = await rounds_collection.find({"_id": {"$in": object_ids}}).to_list()

    return rounds
