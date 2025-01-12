import logging
import os

import requests
from dotenv import load_dotenv
from pymongo import MongoClient

load_dotenv()

X_RAPIDAPI_KEY = os.environ["X_RAPIDAPI_KEY"]
MONGODB_URL = os.environ["MONGODB_URL"]

logger = logging.getLogger()
logger.setLevel(logging.INFO)
logging.basicConfig(level=logging.INFO)

if not X_RAPIDAPI_KEY or not MONGODB_URL:
    raise ValueError(
        "Missing required environment variables: X_RAPIDAPI_KEY or MONGODB_URL"
    )

client = MongoClient(MONGODB_URL)
db = client["fore_database"]
course_names_collection = db["course_names"]
courses_collection = db["courses"]


def get_n_course_names_from_mongodb(n: int) -> list[str]:

    logger.info("Getting %d course names from MongoDB", n)

    cursor = course_names_collection.find(limit=n)
    documents = list(cursor)

    logger.info("Found %d course name documents\n", len(documents))

    return [doc["_id"] for doc in documents]


def query_golf_course_api(course_name: str) -> list[dict]:

    url = "https://golf-course-api.p.rapidapi.com/search"

    query = {"name": course_name}

    headers = {
        "x-rapidapi-key": X_RAPIDAPI_KEY,
        "x-rapidapi-host": "golf-course-api.p.rapidapi.com",
    }

    # logger.info("Querying golf course API for %s", course_name)

    try:
        response = requests.get(url, headers=headers, params=query)
        response.raise_for_status()
    except requests.exceptions.RequestException as e:
        logger.error("Error querying golf course API: %s", e)
        return []

    response_json = response.json()

    courses = []

    # Found results
    if "message" not in response_json:
        courses = response_json

    # logger.info("Found %d courses for course name %s\n", len(courses), course_name)

    return courses


def get_courses_for_course_names(course_names: list[str]) -> list[dict]:

    logger.info(
        "Getting courses from golf course API for %d course names", len(course_names)
    )

    all_courses = []
    for course_name in course_names:
        # Get the courses for the current course name
        courses = query_golf_course_api(course_name)

        # Add the courses to the list of all courses
        all_courses.extend(courses)

    logger.info(
        "Found %d courses for the %d course names\n",
        len(all_courses),
        len(course_names),
    )

    return all_courses


def upload_courses_to_mongodb(courses: list[dict]):

    logger.info("Uploading %d courses to MongoDB", len(courses))

    for course in courses:
        # Add the current course to the courses collection,
        #   overriding the existing document if it already exists
        courses_collection.update_one(
            {"_id": course["_id"]},
            {"$set": course},
            upsert=True,
        )

    logger.info("%d courses uploaded to MongoDB\n", len(courses))


def delete_course_names_from_mongodb(course_names: list[str]):

    logger.info("Deleting %d course names from MongoDB\n", len(course_names))

    course_names_collection.delete_many({"_id": {"$in": course_names}})


N = 200


def lambda_handler(event, context):

    course_names = get_n_course_names_from_mongodb(N)

    all_courses = get_courses_for_course_names(course_names)

    upload_courses_to_mongodb(all_courses)

    delete_course_names_from_mongodb(course_names)

    return


# if __name__ == "__main__":
#     lambda_handler(None, None)
