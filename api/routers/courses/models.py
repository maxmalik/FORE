from typing import Any, Optional

from pydantic import BaseModel, Field, model_validator

from ...utils import PyObjectId


class Course(BaseModel):
    id: Optional[PyObjectId] = Field(alias="_id", default=None)
    address: str
    city: str
    coordinates: str
    country: str
    created_at: str
    fairway_grass: str
    green_grass: str
    num_holes: int
    length_format: str
    likes: list
    name: str
    phone: str
    scorecard: list[dict[str, Any]]
    state: str
    tee_boxes: list[dict[str, Any]]
    updated_at: str
    website: str
    zip: str


class SearchCourses(BaseModel):
    name: str
