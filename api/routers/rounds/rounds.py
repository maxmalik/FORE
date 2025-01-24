from fastapi import APIRouter, Depends, status
from motor.motor_asyncio import AsyncIOMotorCollection

from ...db import get_collection
from .models import Round

router = APIRouter(
    prefix="/rounds", tags=["Rounds"], dependencies=[Depends(get_collection("rounds"))]
)


@router.post(
    "/",
    response_description="Post a new round",
    response_model=Round,
    status_code=status.HTTP_201_CREATED,
    response_model_by_alias=False,
)
async def post_round(
    round_to_post: Round,
    rounds_collection: AsyncIOMotorCollection = Depends(get_collection("rounds")),
):

    new_round = await rounds_collection.insert_one(
        round_to_post.model_dump(by_alias=True, exclude=["id"])
    )

    created_round = await rounds_collection.find_one({"_id": new_round.inserted_id})

    return created_round
