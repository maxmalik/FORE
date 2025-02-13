from bson import ObjectId
from bson.errors import InvalidId
from fastapi import APIRouter, Depends, HTTPException, Query
from motor.motor_asyncio import AsyncIOMotorCollection

from ...db import get_collection
from .models import Course, SearchCourses

router = APIRouter(
    prefix="/courses",
    tags=["Courses"],
)


@router.post(
    "/search", response_description="Search for a course", response_model=list[Course]
)
async def search_courses(
    course_search: SearchCourses,
    courses_collection: AsyncIOMotorCollection = Depends(get_collection("courses")),
):

    query = {"$text": {"$search": f'"{course_search.name}"'}}

    results = await courses_collection.find(query).to_list(length=20)

    # Ensure `_id` is converted to a string
    for course in results:
        if "_id" in course:
            course["_id"] = str(course["_id"])

    return results


async def get_course(
    course_id: str,
    courses_collection: AsyncIOMotorCollection,
    fields: str = None,
) -> Course:

    try:
        course_object_id = ObjectId(course_id)
    except InvalidId as exception:
        raise HTTPException(status_code=422, detail="Invalid Course ID") from exception

    if fields:
        projection = {field: 1 for field in fields.split(",")}
        projection["_id"] = 1  # Ensure "_id" is always included
    else:
        projection = None

    course = await courses_collection.find_one({"_id": course_object_id}, projection)

    if course is None:
        raise HTTPException(status_code=404, detail="Course not found")

    return Course(**course)


@router.get("/{course_id}")
async def get_course_api(
    course_id: str,
    fields: str = Query(None, description="Comma-separated list of fields to return"),
    courses_collection: AsyncIOMotorCollection = Depends(get_collection("courses")),
):
    return await get_course(
        ObjectId(course_id),
        courses_collection,
        fields,
    )


@router.post("/rounds")
async def put_rounds_arrays(
    courses_collection: AsyncIOMotorCollection = Depends(get_collection("courses")),
):
    courses_collection.update_many({}, {"$set": {"rounds": []}})  # Update all documents
