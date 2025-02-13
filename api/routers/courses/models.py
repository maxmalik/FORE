from typing import Any, Optional

from pydantic import BaseModel, Field

from ...utils import PyObjectId


class HoleTeeBox(BaseModel):
    color: str
    yards: int


class TeeBox(BaseModel):
    tee: str
    slope: int
    handicap: float
    total_yards: int


class CourseHole(BaseModel):
    hole_number: int
    par: int
    tees: dict[str, HoleTeeBox]
    handicap: int


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
    name: str
    phone: str
    rounds: list[PyObjectId]
    scorecard: list[CourseHole]
    state: str
    tee_boxes: list[TeeBox]
    updated_at: str
    website: str
    zip: str


class SearchCourses(BaseModel):
    name: str
