from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .db import lifespan
from .routers.courses import courses
from .routers.rounds import rounds
from .routers.users import users

app = FastAPI(lifespan=lifespan)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(users.router)
app.include_router(courses.router)
app.include_router(rounds.router)


@app.post("/")
def greet():
    return {"message": "Welcome to the FORE! API!"}


# @app.post("/sanitize-courses")
# async def sanitize_courses():

#     cursor = courses_collection.find({})

#     async for course in cursor:

#         course_name = course["name"]
#         print(f"Sanitizing {course_name}")
#         if "holes" in course:
#             course["num_holes"] = int(course["holes"])
#             del course["holes"]
#         if "city" in course and course["city"]:
#             course["city"] = course["city"].title().strip()
#         if "state" in course and course["state"]:
#             course["state"] = course["state"].title().strip()
#         if "country" in course and course["country"]:
#             course["country"] = course["country"].title().strip()
#         if "address" in course and course["address"]:
#             course["address"] = course["address"].title().strip()
#         if "name" in course and course["name"]:
#             course["name"] = course["name"].title().strip()
#         if "fairwayGrass" in course:
#             course["fairway_grass"] = course["fairwayGrass"].strip()
#             del course["fairwayGrass"]
#         if "greenGrass" in course:
#             course["green_grass"] = course["greenGrass"].strip()
#             del course["greenGrass"]
#         if "createdAt" in course:
#             course["created_at"] = course["createdAt"]
#             del course["createdAt"]
#         if "lengthFormat" in course:
#             course["length_format"] = course["lengthFormat"].strip()
#             del course["lengthFormat"]
#         if "teeBoxes" in course:
#             for teebox in course["teeBoxes"]:
#                 if "tee" in teebox:
#                     teebox["tee"] = teebox["tee"].title().strip()

#             course["tee_boxes"] = course["teeBoxes"]
#             del course["teeBoxes"]

#         if "updatedAt" in course:
#             course["updated_at"] = course["updatedAt"]
#             del course["updatedAt"]

#         if "scorecard" in course:
#             for hole in course["scorecard"]:
#                 if "tees" in hole:
#                     for value in hole["tees"].values():
#                         if "color" in value:
#                             value["color"] = value["color"].title().strip()

#         await courses_collection.replace_one({"_id": course["_id"]}, course)

#     return {"detail": "Success"}
