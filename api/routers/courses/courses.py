from bson import ObjectId
from bson.errors import InvalidId
from fastapi import APIRouter, Depends, HTTPException, Query
from motor.motor_asyncio import AsyncIOMotorCollection
from pymongo import UpdateOne

from ...db import get_collection
from ...utils import PyObjectId
from .models import Course, SearchCourses

courses_router = APIRouter()


@courses_router.post(
    "/search",
    response_description="Search for a course",
    response_model=list[Course],
    response_model_by_alias=False,
)
async def search_courses(
    course_search: SearchCourses,
    courses_collection: AsyncIOMotorCollection = Depends(get_collection("courses")),
):

    query = {"$text": {"$search": f'"{course_search.name}"'}}

    # Return first 20 results
    results = await courses_collection.find(query).to_list(length=20)

    return results


async def get_course(
    course_id: PyObjectId,
    courses_collection: AsyncIOMotorCollection,
) -> Course:

    try:
        course_object_id = ObjectId(course_id)
    except InvalidId as exception:
        raise HTTPException(status_code=422, detail="Invalid Course ID") from exception

    course = await courses_collection.find_one({"_id": course_object_id})

    if course is None:
        raise HTTPException(status_code=404, detail="Course not found")

    return Course(**course)


@courses_router.get(
    "/{course_id}",
    response_model=Course,
    description="Get a course by ID",
    response_model_by_alias=False,
)
async def get_course_api(
    course_id: PyObjectId,
    courses_collection: AsyncIOMotorCollection = Depends(get_collection("courses")),
):
    return await get_course(ObjectId(course_id), courses_collection)
