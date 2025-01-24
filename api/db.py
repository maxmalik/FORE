import os

from dotenv import load_dotenv
from fastapi import FastAPI
from motor.motor_asyncio import (
    AsyncIOMotorClient,
    AsyncIOMotorCollection,
    AsyncIOMotorDatabase,
)

load_dotenv("../.env")
MONGODB_URL = os.environ["MONGODB_URL"]

db: AsyncIOMotorDatabase = None  # Global db instance


# Create and close the MongoDB client on app startup/shutdown
def lifespan(app: FastAPI):
    client = AsyncIOMotorClient(MONGODB_URL)
    global db
    db = client.get_database("fore_database")

    yield

    client.close()


def get_collection(collection_name: str):
    def _get_collection() -> AsyncIOMotorCollection:
        return db.get_collection(collection_name)

    return _get_collection
