from fastapi import APIRouter, Depends
from motor.motor_asyncio import AsyncIOMotorCollection

from ...db import get_collection
from .models import SearchCourses

router = APIRouter(
    prefix="/courses",
    tags=["Courses"],
    dependencies=[Depends(get_collection("courses"))],
)


@router.post("/search")
async def search_courses(
    course_search: SearchCourses,
    courses_collection: AsyncIOMotorCollection = Depends(get_collection("courses")),
):

    query = {"$text": {"$search": f'"{course_search.name}"'}}

    results = await courses_collection.find(query).to_list(length=20)

    return results
