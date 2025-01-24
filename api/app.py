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
