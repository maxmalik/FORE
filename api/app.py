from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .db import lifespan
from .routers.autofill_scores.autofill_scores import autofill_scores_router
from .routers.courses.courses import courses_router
from .routers.rounds.rounds import rounds_router
from .routers.users.users import users_router

app = FastAPI(lifespan=lifespan)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(users_router, prefix="/users", tags=["Users"])
app.include_router(
    courses_router,
    prefix="/courses",
    tags=["Courses"],
)
app.include_router(rounds_router, prefix="/rounds", tags=["Rounds"])
app.include_router(autofill_scores_router)


@app.post("/")
def healthcheck():
    return {"status": "Good to go! Welcome to FORE!"}
